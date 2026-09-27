# État des lieux : vers un site communautaire

*Photographie au 2026-09-22, tirée du code (`master` @ 515719b), des quatre documents de cet état des lieux et des plans `docs/superpowers/`. Les points marqués « à vérifier » n'ont pas été mesurés.*

## 1. Verdict en une phrase

Le produit est une **très bonne aide de table pour un MJ isolé** (compendium fidèle, fiche, outils de combat, campagnes, partage asynchrone MJ ⇄ joueurs). Le **socle communautaire existe mais reste embryonnaire** : on sait *créer et publier* du contenu, pas encore *le découvrir, l'attribuer, le modérer ni en discuter*. Entre « outil » et « site communautaire », il manque la couche sociale et l'exploitation en production.

## 2. Ce qui est déjà communautaire

| Brique | État |
|---|---|
| Comptes (inscription, JWT, réinitialisation de mot de passe par e-mail) | Fait |
| **Bibliothèque communautaire** (`HomebrewEntry`) : sorts, races, classes, voies, capacités imbriquées, objets magiques, poisons, pièges, créatures ; visibilité `private` / `public` | Fait |
| Compendium à trois onglets (Officiel / Communauté / Mes créations), mêmes cartes, filtres et feuilles des deux côtés | Fait |
| Monstres personnalisés (`CustomCreature`, `visibility`) importables dans le suivi de combat | Fait |
| Déclarations d'états par les capacités communautaires, cliquables | Fait |
| Partage de campagne par code d'invitation ; résumés diffusés aux joueurs ; fiches rattachées à la campagne, lues et éditées par le MJ | Fait |
| Fiche imprimable (PDF navigateur) | Fait |
| Back-office EasyAdmin : 27 sections, réservé à `ROLE_ADMIN`, y compris **suppression** du contenu communautaire abusif | Fait |
| CI sur chaque PR (front, back, fidélité du bestiaire, e2e) ; 143 tests back, 576 unitaires, 76 e2e | Fait |

## 3. Ce qui manque pour un vrai site communautaire

### Bloquants (avant d'ouvrir à des inconnus)
1. **Contenu public lisible uniquement connecté** : `Get`/`GetCollection` de `HomebrewEntry` exigent `ROLE_USER`. Aucune page publique partageable, donc aucune indexation ni découverte par un visiteur. La landing est publique, pas la bibliothèque.
2. **Aucune attribution** : `owner` n'est dans aucun groupe de lecture. Un contenu public n'affiche pas son auteur ; pas de profil public, pas de « mes contenus publiés » vus de l'extérieur.
3. **Aucune modération** : pas de signalement, pas de statut (en attente / approuvé / retiré), pas de rôle modérateur. Seule issue : suppression par un admin. Et `ROLE_ADMIN` donne aujourd'hui lecture des notes privées des MJ (choix assumé tant que l'admin est l'exploitant, cf. `backend.md` §6) : **à revoir avant d'introduire des modérateurs**.
4. **Aucune protection anti-abus** : aucun `rate_limiter` configuré, pas de vérification d'e-mail à l'inscription, pas de CAPTCHA. L'inscription est publique et l'API d'écriture communautaire l'est de fait.
5. **Cadre légal non repéré** : pas de CGU, mentions légales, politique de confidentialité/RGPD ; pas de mention de licence pour le contenu déposé par les membres (à vérifier dans le front). ~~Ni de suppression de compte ou d'export de données~~ — fait le 2026-09-27 : la suppression de compte, censée déjà exister, échouait en réalité en 500 pour tout compte possédant du contenu (FK sans `ON DELETE`, corrigé) ; export ajouté (`GET /api/me/export`).
6. ~~Pas de chemin de production documenté~~ — `doc/deploiement-prod.md` (2026-09-22) : variables d'env à changer, HTTPS, sauvegardes, checklist. Les comptes de seed (`admin@example.com`, mot de passe de Nauno en clair dans le dépôt) sont neutralisés : `AppFixtures`/`app:create-test-user` refusent `APP_ENV=prod`, mots de passe sortis en variables d'env.

### Importants (ce qui fait « vivre » la communauté)
7. **Découverte** : pas de tri par popularité/nouveauté (un signal existe désormais — les favoris —, mais aucun tri/UI ne l'exploite), pas de tags, pas de recherche communautaire dédiée au-delà des filtres du compendium.
8. ~~**Interactions** : pas de favoris/likes, pas de commentaires, pas de « dupliquer / adapter » le contenu d'autrui (fork)~~ — jalon C fait (2026-09-27) : favoris, commentaires (visibilité alignée sur celle de la cible), duplication déjà couverte par « Dupliquer chez moi ». Pas de notes de version.
9. ~~**Notifications** : seul e-mail existant = réinitialisation de mot de passe~~ — jalon C fait (2026-09-27) : nouveau commentaire/favori sur son contenu, signalement traité, notifient désormais par e-mail (`NotificationMailer`). Pas de préférence de désabonnement (aucune infrastructure de préférences sur `User`).
10. ~~**Performance à l'échelle**~~ — **fait (2026-09-27).** `itemsPerPage=500` était un leurre : la requête portait aussi `pagination=false`, qui désactivait toute limite côté API Platform — `HomebrewService.getAll()` chargeait **la table entière** à chaque visite de la Bibliothèque. Mesuré (3 000 entrées synthétiques) : ~1,7–2,1 s, 866 Ko. Corrigé : onglet/catégorie/recherche filtrent désormais côté serveur, paginés par 24 (`HomebrewSearchFilter`/`HomebrewScopeFilter`, nouveaux). Restent côté client (page déjà chargée seulement, périmètre tranché avec l'utilisateur) : sous-type d'équipement, grille de filtres par catégorie et pastilles — ils lisent le JSON libre `data`, différent par catégorie, que déplacer aussi côté serveur demanderait des requêtes SQL natives par catégorie. `getAll()` reste utilisé tel quel par les 8 consommateurs qui en ont besoin comme table de correspondance complète (résolution parent/enfant, compteurs), jamais pour peupler une liste affichée.

### Choix produit à trancher (sinon le périmètre dérive)
- Le cadrage actuel est « **aide de table MJ, pas de temps réel** ». Un site communautaire est compatible s'il reste **asynchrone** (bibliothèque, partage de campagnes, fiches). Forum/chat/VTT seraient hors cadrage — à confirmer.
- **Qui modère ?** L'exploitant seul, ou des bénévoles ? Conditionne le rôle `ROLE_MODERATOR`.
- **Contenu public : anonyme lisible ou réservé aux membres ?** (impacte SEO et charge.)

## 4. Dette et risques techniques utiles à connaître

- ~~147 créatures du bestiaire absentes du livre~~ — **traité le 2026-09-27** (`Version20260927140000`) : supprimées après vérification stat par stat (aucune ne correspondait numériquement au livre, même les noms proches comme « Ogre »/« Orque »), et les 9 profils réellement manquants ajoutés en extrayant leurs stats du texte. Bestiaire officiel : 81 créatures, 80 vérifiées contre le livre par `scripts/audit-bestiaire.mjs` (0 divergence). **Décision produit généralisée à tout le compendium officiel** (sorts, classes, races, voies, objets…) : on ne garde que ce qui est dans les données de règles fournies, jamais complété au jugé — reste à auditer catégorie par catégorie avant toute suppression ailleurs, la même rigueur (vérifier les stats, pas juste les noms) s'appliquant partout.
- 32 champs de `types/normalized.ts` déclarés mais jamais servis par l'API (`scripts/audit-types-api.mjs`).
- ~~`Campaign` ↔ `Character` : supprimer une campagne avec des personnages rattachés est refusé (409)~~ — corrigé le 2026-09-25 : `ON DELETE SET NULL`, la campagne supprimée détache les fiches de ses joueurs au lieu de les bloquer (cf. `backend.md` §6).
- ~~Suite backend lente (~12 min)~~ — ~2 min 30 depuis le 2026-09-25 (remise à zéro de la base par `DELETE` au lieu de recréer le schéma à chaque test, cf. `backend.md`). La base de test reste partagée : deux exécutions concurrentes se gênent.
- État local : Docker n'est pas installé sur ce poste ; le projet n'a donc pas été lancé lors de cet état des lieux.

## 5. Proposition de feuille de route communautaire

**Jalon A — « Ouvrable à des inconnus »** (sécurité et légal)
- Rate limiting + vérification d'e-mail ; changer identifiants de seed hors dev
- CGU / mentions / confidentialité (texte à écrire/valider par un humain) ; ~~suppression et export de compte~~ faits (2026-09-27)
- Signalement + statut de modération + `ROLE_MODERATOR` distinct de l'admin
- Guide de déploiement : hébergement, HTTPS, sauvegardes, secrets

**Jalon B — « Attribuer et découvrir »**
- Exposer l'auteur (pseudo public) ; page profil
- Pages publiques de contenu (lecture anonyme, URL partageables, méta pour partage)
- Tri (récent / populaire), tags, recherche communautaire

**Jalon C — « Faire vivre »** — fait (2026-09-27) : favoris, commentaires, notifications par e-mail (fork/adaptation déjà couvert par « Dupliquer chez moi », antérieur à ce jalon).
- Reste ouvert : collections / packs de contenu, import-export d'une campagne

**Jalon D — « Ouverture »** (à décider)
- Licence explicite du contenu membre, API publique documentée, éventuels contributions au compendium officiel par PR de données
