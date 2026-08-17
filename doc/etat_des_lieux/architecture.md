# Architecture Globale et Infrastructure

Cet état des lieux concerne l'application **Chroniques Oubliées Fantasy**, un outil d'accompagnement numérique (compagnon RPG) pour le jeu de rôle du même nom, basé sur les règles sous licence libre (ORC).

## 1. Vue d'ensemble du Projet

L'application est découpée en deux grandes parties totalement séparées :
- **Backend** : Une API REST Symfony propulsant la logique serveur et la base de données.
- **Frontend** : Une application web monopage (SPA) React très riche gérant les entités côté client (fiche de personnage, bestiaire, etc.).

Le tout est orchestré via Docker Compose pour le développement.

## 2. Déploiement et Infrastructure (Docker)

Le projet repose sur **Docker Compose** pour l'orchestration des conteneurs. Le fichier `docker-compose.yml` définit 5 services :

1. **`database` (PostgreSQL 15 Alpine)** :
   - Image : `postgres:15-alpine`
   - Volume persistant : `db-data`
   - Port : 5432
   - Base : `app`, user : `app`, mot de passe : `!ChangeMe!`

2. **`backend` (PHP 8.3 FPM / Symfony)** :
   - Construit à partir du `backend/Dockerfile` (base `php:8.3-fpm-alpine`)
   - Extensions PHP : intl, pdo_pgsql, zip, opcache
   - Volumes : `./backend:/app` (code) + `./backend/data:/app/data` (données de jeu)
   - Variables : `DATABASE_URL`, `APP_ENV=dev`
   - **Entrypoint dev** (`backend/docker/dev-entrypoint.sh`, câblé via `docker-compose.yml`) : attend la base, applique les migrations, puis crée/actualise un utilisateur de test (`bin/console app:create-test-user`) avant de lancer `php-fpm` — la création n'a lieu que si `APP_ENV=dev` (le `Dockerfile` de prod reste inchangé)
   - Dépend de : `database`

3. **`nginx` (Serveur Web API)** :
   - Image : `nginx:alpine`
   - Port : **8000** (point d'accès public pour l'API)
   - Sert le dossier `public/` de Symfony en proxy inverse vers `backend:9000`
   - Configuration : `backend/nginx.conf`

4. **`frontend` (Vite Dev Server)** :
   - Construit à partir du `app/Dockerfile` (target `build`, base `node:22-alpine`)
   - Port : **5173** (HMR actif)
   - Variables : `VITE_API_URL=http://localhost:8000/api`
   - Dépend de : `backend`

5. **`mailpit` (SMTP de développement)** :
   - Image : `axllent/mailpit`
   - Ports : **8025** (interface web) et **1025** (SMTP)
   - Capte les courriels sortants (lien de réinitialisation de mot de passe) — rien ne part vers l'extérieur en développement

> [!NOTE]
> Le Dockerfile frontend est multi-stage : build avec node:22-alpine → production avec nginx:alpine. Actuellement seul le stage de développement est utilisé.

## 3. Structure du Projet

```
.
├── app/                          # Frontend React
│   ├── src/
│   │   ├── domain/               # MÉTIER : règles COF2 pures — rules/ (25 modules : test, combat,
│   │   │                         #   dommages, encombrement, spellcasting, poisons, dangers,
│   │   │                         #   voyage, typesCreature…), combatTracker, encounters,
│   │   │                         #   magicItems, creature, compendium, lexique (+ tests)
│   │   ├── components/           # PRÉSENTATION (character/ 25, common, layout, auth, campaign,
│   │   │                         #   compendium, creature, homebrew, sheets/ — feuilles partagées
│   │   │                         #   entre contenu officiel et communautaire)
│   │   ├── pages/                # 41 pages + module Rules/ (10 sections)
│   │   ├── services/             # TECHNIQUE : api, AuthService, dataService, campaignService, …
│   │   ├── hooks/                # APPLICATION : useCharacterData, useCharacterSheet, useSearch…
│   │   ├── types/                # normalized.ts, campaign.ts, character.ts (caracs/playState/characterVoies)
│   │   ├── context/              # AuthContext (React Context)
│   │   ├── data/                 # magicItemTables.ts
│   │   └── constants/            # rules.ts (index des règles)
│   ├── scripts/                  # Scripts de refactoring de données (JS/CJS)
│   ├── public/assets/            # Images (créatures, profils, races, états)
│   ├── Dockerfile                # Multi-stage (node:22 → nginx)
│   └── nginx.conf                # SPA fallback
│
├── backend/                      # Backend Symfony
│   ├── src/
│   │   ├── Entity/               # 28 entités Doctrine (+ Trait/CreatureProfileTrait partagé
│   │   │                         #   par Creature et CustomCreature)
│   │   ├── Repository/           # 24 repositories
│   │   ├── Controller/Admin/     # 27 CRUD controllers EasyAdmin (28 entités moins PasswordResetToken) + DashboardController
│   │   ├── DataFixtures/         # AppFixtures.php (~1360 lignes)
│   │   ├── State/                # 8 state processors (mot de passe, propriétaire, invitations…)
│   │   ├── Service/              # CapabilityEffectBuilder, InviteCodeGenerator…
│   │   └── Doctrine/             # CurrentUserExtension
│   ├── config/
│   │   ├── packages/             # 23 fichiers de config
│   │   └── routes/               # 5 fichiers de routes
│   ├── data/                     # Données JSON (Profils/, Races/, armors, creatures, etc.)
│   ├── migrations/               # 27 migrations
│   ├── Dockerfile                # php:8.3-fpm-alpine
│   └── nginx.conf
│
├── scripts/                      # Outillage du dépôt, lancé à la main depuis la racine
│   ├── e2e.sh                    # Suite Playwright contre le stack docker compose
│   ├── audit-bestiaire.mjs       # Confronte le bestiaire servi au chapitre Opposition
│   ├── audit-types-api.mjs       # Confronte les types du front aux charges utiles servies
│   └── declarer-etats.mjs        # Amorçage des déclarations d'états (jamais automatique)
│
├── .github/workflows/ci.yml      # 4 jobs : front, back, fidélité, e2e (cf. §6)
│
├── doc/                          # Documentation
│   ├── etat_des_lieux/           # Ce dossier
│   ├── datas/                    # Données de jeu historiques (JSON)
│   ├── mcd.md                    # Modèle Conceptuel de Données
│   ├── regles_orc.md             # Règles du jeu (complet)
│   └── walkthrough.md            # Résumé du travail MCD
│
└── docker-compose.yml            # Orchestration des 5 conteneurs
```

## 4. Données Statiques et Scripts

Le projet contient plusieurs sources de données :

- **`backend/data/`** : Fichiers JSON normalisés chargés par les DataFixtures Doctrine
  - `armors.json`, `weapons.json`, `creatures.json`, `creature_families.json`
  - `food.json`, `lodging.json`, `materials.json`, `mounts.json`
  - `profile_families.json`, `states.json`, `poisons.json`, `traps.json`
  - `prestige_voies.json`, `rulesIndex.json`
  - `Profils/` (14 fichiers JSON, un par classe)
  - `Races/` (8 fichiers JSON : DemiElfe, DemiOrc, ElfeHaut, ElfeSylvain, Gnome, Halfelin, Humain, Nain)

- **`doc/datas/`** : Données historiques (versions antérieures des fichiers)
  - `capabilities.json`, `creatures.json`, `equipment.json`, `profiles.json`, `races.json`, `voies.json`, `tables.json`

- **Scripts de refactoring** (`app/scripts/`) :
  - `refactor_data.cjs` : Normalisation des structures JSON
  - `refine_capacities_v4.js` : Raffinage des capacités avec détection d'action types
  - `refine_materials.js` : Nettoyage des données de matériaux

## 5. Intégration continue

`.github/workflows/ci.yml` joue quatre jobs sur chaque PR et sur `master`. Chacun exécute une
commande que le projet définit déjà — la CI ne redéfinit pas les portes, elle les rejoue :

| Job | Ce qu'il vérifie |
|---|---|
| **front** | `npm run lint`, `npm run test:run`, `npm run build` (= `tsc -b && vite build`) |
| **back** | suite PHPUnit sur un PostgreSQL de service |
| **fidélité** | `scripts/audit-bestiaire.mjs` — sortie non nulle si une créature diverge du livre |
| **e2e** | stack docker compose complet, fixtures chargées, suite Playwright |

Trois pièges découverts en la mettant en place, et qui valent pour toute machine neuve :

- `docker compose` monte `./backend` sur `/app` et **masque le `vendor/` de l'image**. Comme
  `backend/vendor` est ignoré par git, un poste neuf n'en a pas : l'entrypoint boucle sur
  `bin/console` et rien ne démarre. D'où un `composer install` avant `docker compose up`.
- En environnement de test, Doctrine **suffixe le nom de la base** (`dbname_suffix: '_test…'`) :
  les tests visent `app_test`, pas `app`. Sans elle, PHPUnit sort en erreur avant le premier test.
- `phpunit.dist.xml` pose `failOnDeprecation` : **une seule dépréciation fait sortir 1** alors
  que le texte affiché dit « OK, but there were issues! ». Lire le code de retour, pas le texte.

## 6. Configurations Transverses

- **CORS** (NelmioCorsBundle) : Autorise les origines `localhost` et `127.0.0.1` sur tous les ports
- **Variables d'environnement** : `.env` backend (DB, JWT, CORS, Messenger), `VITE_API_URL` frontend
- **Git** : `.gitignore` ignore `Ressources/*`

---
*Ce document fait partie de l'état des lieux global généré pour le projet Chroniques Oubliées Fantasy.*
