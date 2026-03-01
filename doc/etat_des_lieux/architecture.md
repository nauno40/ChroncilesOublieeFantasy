# Architecture Globale et Infrastructure

Cet état des lieux concerne l'application **Chroniques Oubliées**, un outil d'accompagnement numérique (compagnon RPG) pour le jeu de rôle du même nom, basé potentiellement sur les règles sous licence libre (ORC).

## 1. Vue d'ensemble du Projet

L'application est découpée en deux grandes parties totalement séparées :
- **Backend** : Une API RESTful propulsant la logique serveur et la base de données.
- **Frontend** : Une application web monopage (SPA) très riche gérant les entités côté client (fiche de personnage, bestiaire, etc.).

## 2. Déploiement et Infrastructure (Docker)

Le projet repose sur **Docker Compose** pour l'orchestration des conteneurs en développement (et potentiellement en production). Le fichier `docker-compose.yml` définit 4 services clés :

1. **`database` (PostgreSQL 15)** : 
   - Image : `postgres:15-alpine`
   - Volume persistant : `db-data`
   - Expose le port standard 5432.
2. **`backend` (Symfony / PHP 8.2+)** :
   - Construit à partir du répertoire `./backend`.
   - Inclut des volumes pour la synchronisation du code et un dossier `./backend/data`.
   - Se connecte directement au conteneur `database`.
3. **`nginx` (Serveur Web API)** :
   - Image : `nginx:alpine`
   - Expose le port **8000**.
   - Sert de proxy inverse (reverse proxy) pour le conteneur `backend` (lit le dossier `public` de Symfony).
4. **`frontend` (Node/Vite)** :
   - Construit à partir du répertoire `./app`.
   - Expose le port **5173** (port par défaut de Vite).
   - Utilise HMR (Hot Module Replacement) pour le développement (`npm run dev`).
   - Configure automatiquement l'URL de l'API via la variable d'environnement `VITE_API_URL=http://localhost:8000/api`.

> [!NOTE] 
> Cette architecture micro-services permet un développement fluide où l'API backend et l'interface React peuvent évoluer indépendamment.

## 3. Données Statiques et Documentation

Le dossier `doc/` et la racine du projet contiennent plusieurs ressources importantes :
- **Documents de Game Design** : `mcd.md`, `regles_orc.md` (règles de base).
- **Données JSON (`doc/datas/`)** : Des extractions ou données de référence (`capabilities.json`, `creatures.json`, `equipment.json`, `profiles.json`, `races.json`, `voies.json`, etc.). 
- **Scripts Python/JS** : `extract_monstres.py`, `compare_names.py`, `count_tags.js` servent probablement à nettoyer, parser et importer les données brutes des règles vers ces fichiers JSON exploitables par l'application (et possiblement l'API/Base de données via des fixtures Doctrine).

---
*Ce document fait partie de l'état des lieux global généré pour le projet Chroniques Oubliées.*
