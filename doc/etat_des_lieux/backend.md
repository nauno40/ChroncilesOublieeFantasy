# État des lieux : Backend (API)

Le backend, situé dans le répertoire `./backend`, a pour rôle de stocker, structurer et distribuer la donnée via une API REST.

## 1. Technologies Utilisées

- **Framework principal** : Symfony 7.4.*
- **Langage** : PHP 8.2 ou supérieur
- **Base de données / ORM** : Doctrine ORM & DBAL (PostgreSQL 15)
- **API** : API Platform 4.2 (Génération automatique des endpoints REST/GraphQL et Swagger)
- **Backoffice** : EasyAdmin 4 (Interface d'administration pour gérer les entités)
- **Tests** : PHPUnit 12.5

## 2. Architecture du code (src/)

L'architecture suit les standards stricts de Symfony MVC / API Platform :
- **`Entity/`** : Contient tous les modèles de données (Tables SQL via les attributs `#[ORM\...]`) qui sont également décorés avec l'attribut `#[ApiResource]` pour les exposer directement via l'API.
- **`Repository/`** : Classes Doctrine pour interagir avec la base de données.
- **`Controller/Admin/`** : Contrôleurs propulsant le Dashboard de l'interface EasyAdmin, gérant le CRUD manuel (Create, Read, Update, Delete) pour les administrateurs.
- **`DataFixtures/`** : Fichiers (probablement alimentés par les JSON situés dans `doc/datas/`) permettant de peupler la base de données de base de l'application RPG.

## 3. Modèles de Données (Entities)

Le domaine de l'application dicte clairement qu'il s'agit d'un jeu de rôle. On y trouve 16 grandes entités qui s'entrecroisent :

### A. Les Personnages / Monstres
- **`Character`** : Les héros / joueurs.
- **`Creature` / `CreatureFamily` / `CreatureVoie`** : Gestion poussée du bestiaire, incluant la séparation entre le monstre, sa famille et ses capacités spécifiques.

### B. Progression & Capacités
- **`Profile`** : L'archétype (profil) d'un joueur ou PNJ (ses points de vie, ses statistiques magiques, son lore).
- **`Race`** : Race du personnage avec ses caractéristiques intrinsèques.
- **`Voie` / `Capability`** : Arbres de talents (Voies) divisés en Capacités (niveaux de 1 à 5 en général).

### C. Inventaire & Modificateurs
- **`Equipment`** : Armes, armures et objets de base.
- **`Food` / `Lodging` / `Material` / `Mount`** : Éléments de rôleplay, commerce ou d'inventaire spécifiques.
- **`HarmfulState`** : États préjudiciables appliqués durant les combats.

> [!TIP]
> Grâce à **API Platform**, toute cette structure est automatiquement servie à l'url `http://localhost:8000/api` avec des endpoints standardisés (GET/POST/PUT/DELETE) listables très souvent via `/api/docs` (Swagger UI).

---
*Ce document fait partie de l'état des lieux global généré pour le projet Chroniques Oubliées.*
