# Architecture Globale et Infrastructure

Cet état des lieux concerne l'application **Chroniques Oubliées Fantasy**, un outil d'accompagnement numérique (compagnon RPG) pour le jeu de rôle du même nom, basé sur les règles sous licence libre (ORC).

## 1. Vue d'ensemble du Projet

L'application est découpée en deux grandes parties totalement séparées :
- **Backend** : Une API REST Symfony propulsant la logique serveur et la base de données.
- **Frontend** : Une application web monopage (SPA) React très riche gérant les entités côté client (fiche de personnage, bestiaire, etc.).

Le tout est orchestré via Docker Compose pour le développement.

## 2. Déploiement et Infrastructure (Docker)

Le projet repose sur **Docker Compose** pour l'orchestration des conteneurs. Le fichier `docker-compose.yml` définit 4 services clés :

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

> [!NOTE]
> Le Dockerfile frontend est multi-stage : build avec node:22-alpine → production avec nginx:alpine. Actuellement seul le stage de développement est utilisé.

## 3. Structure du Projet

```
.
├── app/                          # Frontend React
│   ├── src/
│   │   ├── domain/               # MÉTIER : règles COF2 pures — rules/ (cofRules découpé + barrel),
│   │   │                         #   combatTracker, encounters, magicItems, creature (+ tests)
│   │   ├── components/           # PRÉSENTATION (character/ 24, common, layout, auth)
│   │   ├── pages/                # 27 pages + module Rules/ (10 sections)
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
│   │   ├── Entity/               # 21 entités Doctrine
│   │   ├── Repository/           # 18 repositories
│   │   ├── Controller/Admin/     # 10 CRUD controllers EasyAdmin
│   │   ├── DataFixtures/         # AppFixtures.php (645 lignes)
│   │   ├── State/                # 2 state processors (UserPasswordHasher, CampaignStateProcessor)
│   │   └── Doctrine/             # CurrentUserExtension
│   ├── config/
│   │   ├── packages/             # 23 fichiers de config
│   │   └── routes/               # 5 fichiers de routes
│   ├── data/                     # Données JSON (Profils/, Races/, armors, creatures, etc.)
│   ├── migrations/               # 3 migrations
│   ├── Dockerfile                # php:8.3-fpm-alpine
│   └── nginx.conf
│
├── doc/                          # Documentation
│   ├── etat_des_lieux/           # Ce dossier
│   ├── datas/                    # Données de jeu historiques (JSON)
│   ├── mcd.md                    # Modèle Conceptuel de Données
│   ├── regles_orc.md             # Règles du jeu (complet)
│   └── walkthrough.md            # Résumé du travail MCD
│
└── docker-compose.yml            # Orchestration des 4 conteneurs
```

## 4. Données Statiques et Scripts

Le projet contient plusieurs sources de données :

- **`backend/data/`** : Fichiers JSON normalisés chargés par les DataFixtures Doctrine
  - `armors.json`, `weapons.json`, `creatures.json`, `creatures_v2.json`
  - `food.json`, `lodging.json`, `materials.json`, `mounts.json`
  - `families.json`, `profile_families.json`, `states.json`
  - `Profils/` (14 fichiers JSON, un par classe)
  - `Races/` (8 fichiers JSON : DemiElfe, DemiOrc, ElfeHaut, ElfeSylvain, Gnome, Halfelin, Humain, Nain)

- **`doc/datas/`** : Données historiques (versions antérieures des fichiers)
  - `capabilities.json`, `creatures.json`, `equipment.json`, `profiles.json`, `races.json`, `voies.json`, `tables.json`

- **Scripts de refactoring** (`app/scripts/`) :
  - `refactor_data.cjs` : Normalisation des structures JSON
  - `refine_capacities_v4.js` : Raffinage des capacités avec détection d'action types
  - `refine_materials.js` : Nettoyage des données de matériaux

## 5. Configurations Transverses

- **CORS** (NelmioCorsBundle) : Autorise les origines `localhost` et `127.0.0.1` sur tous les ports
- **Variables d'environnement** : `.env` backend (DB, JWT, CORS, Messenger), `VITE_API_URL` frontend
- **Git** : `.gitignore` ignore `Ressources/*`

---
*Ce document fait partie de l'état des lieux global généré pour le projet Chroniques Oubliées Fantasy.*
