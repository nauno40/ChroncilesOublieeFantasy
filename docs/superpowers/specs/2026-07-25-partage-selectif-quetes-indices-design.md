# Partage sélectif des quêtes / indices — Design

**Date :** 2026-07-25
**Objectif :** permettre au MJ de marquer explicitement une quête ou un indice comme « partagé aux joueurs », afin qu'il apparaisse dans la vue joueur (`SharedCampaign`) — en complément des résumés de séances déjà partagés. Complète le principe « les joueurs ne voient que ce que le MJ partage ».

## Décisions (actées)
- Le partage est **par élément** (chaque quête / indice a son propre flag).
- Les quêtes partagées exposent **titre + description + type** (principale/secondaire) — **PAS le statut** (active/terminée reste privé au MJ).
- Les indices partagés exposent leur **contenu**.
- Défaut : **non partagé**. Rien ne change pour l'existant.

## Backend
1. Champ **`shared: bool`** (défaut `false`) sur `Quest` et `Clue` — colonne + groupes `campaign:read` / `campaign:write` (le MJ lit/écrit via le PATCH campagne existant). Migration.
2. DTOs vue joueur : `SharedQuest` (`title`, `description`, `type`) et `SharedClue` (`content`), groupe `shared_campaign:read`.
3. `SharedCampaign` DTO : ajout de `quests: SharedQuest[]` et `clues: SharedClue[]`.
4. `SharedCampaignFactory` : mappe les quêtes/indices `shared === true` de la campagne (requête repository directe, comme pour les sessions). Aucune donnée non partagée n'est mappée.

## Frontend MJ (`CampaignQuests`, `CampaignClues`)
5. Interrupteur **« Partager aux joueurs »** (icône œil) par quête et par indice, avec badge « partagé » visible. Toggle → met à jour l'état `shared` de l'élément et sauvegarde via le mapping campagne existant (`campaignService`, ajout de `shared` dans Raw/Backend Quest/Clue + types `types/campaign`).

## Frontend joueur (`PlayMode` onglet Campagne + `Campaign.tsx` campagnes rejointes)
6. Sous l'historique des séances, deux sections en **lecture seule** :
   - **Quêtes partagées** : titre + description, groupées Principale / Secondaire.
   - **Indices partagés** : contenu.
   Masquées si vides. `SharingService` types `SharedCampaign` étendus (`quests`, `clues`).

## Sécurité / fidélité
La vue joueur (`SharedCampaign` via `SharedCampaignProvider` + `SharedCampaignFactory`) n'expose QUE les éléments `shared === true`, champs restreints (titre/description/type/contenu). Jamais le statut, les notes, les non-partagés. Cohérent avec [[vision-produit-aide-mj]].

## Découpage (2 PR)
- **PR 1** — backend (`shared` sur Quest/Clue + migration, DTOs, factory) + interrupteur MJ (front).
- **PR 2** — affichage côté joueur (sections quêtes/indices partagés dans /play et campagnes rejointes).

## DoD
- Le MJ peut basculer « partagé » sur une quête/un indice ; l'état persiste.
- Un joueur (ou le MJ dans /play) voit les quêtes/indices partagés (titre+description / contenu), et **rien** des non-partagés.
- `tsc` 0, `vitest` vert, lint 0 nouvelle erreur, `phpunit` partage vert. Vérifié à l'écran (Playwright).

## Hors périmètre
- Partage du statut des quêtes ; partage d'autres entités (séances déjà partagées ; notes/rencontres restent privées).
- Notifications de partage.
