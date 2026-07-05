# Design — Partage asynchrone MJ ⇄ Joueurs

**Date** : 2026-07-05
**Statut** : validé (brainstorming), prêt pour plan d'implémentation

## Contexte & objectif

Le site est une aide de table pour le MJ (cf. `doc/etat_des_lieux/roadmap.md`, Phase 2 « Partage asynchrone MJ ⇄ Joueurs »). On veut deux échanges **asynchrones** entre comptes, sans temps réel :

1. **MJ → joueurs** : diffuser les résumés de séances en lecture seule.
2. **Joueurs → MJ** : un joueur crée sa fiche et la rattache à la campagne du MJ, qui peut la lire **et** l'éditer.

Un même utilisateur peut être MJ (il crée des campagnes) **et** joueur (il en rejoint d'autres). Pas de nouveau rôle : la relation est portée par l'appartenance à une campagne.

## Non-goals

- Pas de temps réel (WebSockets/Mercure), pas de jeu en direct sur le site.
- Le joueur **ne voit pas** les quêtes, indices ni notes du MJ (secrets/spoilers) — uniquement le nom de la campagne et les résumés de séances.
- Pas de partage de campagne entre plusieurs MJ.

## Décisions arbitrées

- **Appartenance** : entité de jonction dédiée `CampaignMembership` (extensible), pas un ManyToMany nu.
- **Surface de lecture joueur** : ressource read-only dédiée `SharedCampaign` (DTO + State Provider), **jamais** la ressource `Campaign` — isolation forte contre les fuites de champs secrets.
- **Rejoindre** : code d'invitation généré à la création, révocable par régénération.
- **Fiches** : le MJ lit **et** édite les fiches de ses membres ; dernier-écrit-gagne (pas de temps réel, conflits acceptés).
- **Multi-fiches** : un joueur peut rattacher plusieurs fiches à une même campagne (aucune contrainte ajoutée).
- **Identité affichée** : `User.pseudo` (nouveau champ), pas l'email.

## Modèle de données

### `CampaignMembership` (nouvelle entité)

| Champ | Type | Notes |
|---|---|---|
| `id` | int | PK |
| `campaign` | ManyToOne `Campaign` (inversedBy `memberships`) | not null |
| `player` | ManyToOne `User` (inversedBy `memberships`) | not null |
| `joinedAt` | datetime_immutable | posé à la création |

Contrainte d'unicité `(campaign, player)`.

### `Campaign` — ajouts

- `inviteCode` : string, unique. **Généré à la création** dans `CampaignStateProcessor` (ex. 8 caractères base32 lisibles). Exposé **uniquement** dans le groupe `campaign:read` (donc au propriétaire seul).
- `memberships` : OneToMany `CampaignMembership` (`cascade: [persist]`, `orphanRemoval: true`).

### `User` — ajout

- `pseudo` : string, **non-unique** (l'email reste l'identifiant de connexion). Exposé en `user:read`, requis en `user:create`, modifiable en `user:update`.
- Migration : colonne **nullable**, rétro-remplie depuis le préfixe de l'email (`substring avant @`) pour les comptes existants ; le frontend d'inscription la rend obligatoire.

## Surface API

| Méthode & route | Ressource | Sécurité | Rôle |
|---|---|---|---|
| `POST /api/campaigns/{id}/regenerate_invite` | Campaign (op custom) | `object.getOwner() == user` | MJ régénère/révoque le code |
| `POST /api/shared_campaigns/join` `{ code }` | SharedCampaign (op custom) | `is_granted('ROLE_USER')` | Joueur rejoint par code |
| `GET /api/shared_campaigns` | SharedCampaign | `ROLE_USER` (provider scope membre) | Joueur liste ses campagnes rejointes |
| `GET /api/shared_campaigns/{id}` | SharedCampaign | membre requis (403 sinon) | Joueur lit une campagne rejointe |
| `GET/GetCollection /api/campaign_memberships` | CampaignMembership | `ROLE_USER` (scopé) | Voir membres / mes adhésions |
| `DELETE /api/campaign_memberships/{id}` | CampaignMembership | `player == user` **ou** `campaign.owner == user` | Quitter / exclure |

**`SharedCampaign`** (DTO read-model, pas d'entité Doctrine). Payload strict :
```json
{ "id": 12, "name": "...", "gameMaster": "<pseudo MJ>",
  "sessions": [ { "id": 3, "title": "...", "date": "2026-06-01", "summary": "..." } ] }
```
- State Provider : résout les campagnes où `current_user` a un `CampaignMembership`, lit `Session` **directement au repository** (contourne `CurrentUserExtension`), ne mappe **que** nom + résumés. Aucun `notes`/`clues`/`quests` n'existe dans le DTO → fuite impossible par construction.

**Join** (`JoinCampaignProcessor` sur `POST /api/shared_campaigns/join`) :
1. cherche `Campaign` par `inviteCode` → **404** si aucune ;
2. si appelant = propriétaire → **400** (on ne rejoint pas sa propre campagne) ;
3. si `CampaignMembership` existe déjà → idempotent (renvoie l'existant) ;
4. sinon crée le membership (`joinedAt = now`) ;
5. renvoie le `SharedCampaign` correspondant.

## Modèle de sécurité

### `Character` (modifs)

- `Get` / `Put` / `Patch` : `is_granted('ROLE_USER') and (object.getOwner() == user or (object.getCampaign() != null and object.getCampaign().getOwner() == user))`.
- `Delete` : **inchangé** — propriétaire seul (le MJ ne supprime pas la fiche d'un joueur).
- `Post` : inchangé (`ROLE_USER`, owner posé par `CharacterStateProcessor`).
- **Rattachement** : dans `CharacterStateProcessor`, si `campaign` est renseignée et que l'appelant n'est ni propriétaire de la campagne ni **membre** (`CampaignMembership`), rejeter (`AccessDenied`/422). Empêche un joueur de s'accrocher à une campagne au hasard.

### `CurrentUserExtension` (modifs)

- **`Character`** : remplacer le `owner = :current_user` par un `leftJoin` sur `campaign` puis `WHERE char.owner = :cu OR camp.owner = :cu`. Ainsi le MJ voit les fiches de ses membres, chaque joueur voit les siennes.
- **`Campaign`** : **inchangé** (strictement propriétaire) — les membres ne touchent jamais la ressource `Campaign`, ils passent par `SharedCampaign`.
- **`Quest`/`Clue`/`Session`** : **inchangés** (propriétaire) — les joueurs n'y accèdent pas directement ; les résumés transitent par le provider `SharedCampaign`.
- **`CampaignMembership`** (nouveau cas) : `player = :cu OR campaign.owner = :cu`.

### `security.yaml`

Aucun changement : les nouveaux paths (`shared_campaigns`, `campaign_memberships`, `regenerate_invite`) ne tombent pas dans la règle admin d'écriture compendium ; chaque opération porte son propre `security`. `^/api` reste `PUBLIC_ACCESS` (garde par opération).

## Frontend

- **Nouveau service** `app/src/services/sharingService.ts` (sur `ApiService`) : `joinCampaign(code)`, `regenerateInvite(campaignId)`, `getMemberships(campaignId)`, `getSharedCampaigns()`, `deleteMembership(id)`.
- **MJ — `pages/CampaignDetail.tsx`** : bloc « Inviter » (code + copier + régénérer) ; liste des membres (pseudos) et de leurs fiches, ouvrables/éditables via `CharacterSheet` existant (autorisé car MJ) ; action « exclure ».
- **Joueur** :
  - « Rejoindre une campagne » (saisie du code) — depuis `Campaign.tsx` ou un point d'entrée dédié.
  - Vue « Campagnes rejointes » (résumés en lecture seule) alimentée par `getSharedCampaigns()`.
  - Rattacher une de ses fiches à la campagne (poser `campaign` sur le `Character` via l'édition existante).
- **`RegisterPage.tsx`** : champ `pseudo` obligatoire, envoyé au `POST users`.

## Migration

Migration Doctrine unique :
- table `campaign_membership` (+ index unique `(campaign_id, player_id)`) ;
- colonne `campaign.invite_code` (unique) — backfill d'un code aléatoire pour les campagnes existantes ;
- colonne `user.pseudo` (nullable) — backfill `split_part(email, '@', 1)`.

## Tests (PHPUnit, `backend/tests/Api/`)

- **Join** : code valide → membership créé + `SharedCampaign` renvoyé ; code invalide → 404 ; propre campagne → 400 ; second join → idempotent.
- **Lecture joueur** : membre lit `GET /shared_campaigns` (nom + résumés uniquement) ; membre **ne peut pas** `GET /campaigns/{id}` (403) ni les quêtes/indices ; non-membre sur `GET /shared_campaigns/{id}` → 403.
- **Fiches** : joueur rattache sa fiche à une campagne dont il est membre → 200 ; à une campagne dont il n'est pas membre → refus ; MJ lit **et** édite la fiche d'un membre → 200 ; MJ **ne peut pas** supprimer la fiche d'un membre (403) ; MJ d'une autre campagne → 403.
- **Membership** : joueur quitte (`DELETE`) → 204 ; MJ exclut un membre → 204 ; un tiers → 403.

Suite E2E Playwright : parcours join + lecture résumé à ajouter en suivi (non bloquant pour ce lot).

## Fichiers principaux touchés

- `backend/src/Entity/CampaignMembership.php` (nouveau), `Campaign.php`, `Character.php`, `User.php`
- `backend/src/ApiResource/SharedCampaign.php` (DTO, nouveau) + `backend/src/State/SharedCampaignProvider.php`, `JoinCampaignProcessor.php`, `RegenerateInviteProcessor.php` (nouveaux)
- `backend/src/State/CampaignStateProcessor.php` (génère `inviteCode`), `CharacterStateProcessor.php` (valide le rattachement)
- `backend/src/Doctrine/CurrentUserExtension.php`
- `backend/migrations/VersionXXXX.php` (nouveau)
- `app/src/services/sharingService.ts` (nouveau), `pages/CampaignDetail.tsx`, `pages/Campaign.tsx`, `pages/RegisterPage.tsx`
- `backend/tests/Api/…` (nouveaux tests)
