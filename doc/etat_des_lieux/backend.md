# État des lieux : Backend (API)

Le backend, situé dans `./backend`, a pour rôle de stocker, structurer et distribuer la donnée via une API REST.

## 1. Stack Technique

| Composant | Version |
|---|---|
| **PHP** | 8.3 (Docker) / 8.2+ (requis) |
| **Symfony** | 7.4.* (framework-bundle v7.4.1) |
| **API Platform** | 4.2.11 (core + doctrine-orm) |
| **Doctrine ORM** | 3.6.0 |
| **DoctrineMigrations** | ^3.7 |
| **DoctrineFixtures** | 4.3.1 (dev) |
| **EasyAdmin** | ^4.27.5 |
| **LexikJWTAuthenticationBundle** | 3.2.0 |
| **NelmioCorsBundle** | 2.6.0 |
| **Base de données** | PostgreSQL 15 (Docker) |
| **Serveur web** | Nginx + PHP-FPM (Docker) |
| **Tests** | PHPUnit ^12.5 |
| **Messenger** | Doctrine transport (async) |

## 2. Architecture du Code (src/)

```
src/
├── Command/
│   └── CreateTestUserCommand.php  # `app:create-test-user` (idempotent, dev)
├── Controller/Admin/        # CRUD EasyAdmin (10 contrôleurs)
│   ├── DashboardController.php
│   ├── UserCrudController.php
│   ├── RaceCrudController.php
│   ├── FamilyCrudController.php
│   ├── ProfileCrudController.php
│   ├── VoieCrudController.php
│   ├── CapabilityCrudController.php
│   ├── CreatureFamilyCrudController.php
│   ├── CreatureCrudController.php
│   └── EquipmentCrudController.php
├── DataFixtures/
│   └── AppFixtures.php      # 645 lignes, charge toutes les données
├── Doctrine/
│   └── CurrentUserExtension.php  # Filtre les requêtes par utilisateur
├── Entity/                  # 21 entités (voir section 3)
├── Repository/              # 18 repositories Doctrine
├── State/
│   ├── CampaignStateProcessor.php   # Assigne le owner à la création
│   ├── CharacterStateProcessor.php  # Assigne le owner à la création
│   └── UserPasswordHasher.php       # Hash le mot de passe
└── Kernel.php
```

## 3. Modèles de Données (21 Entités)

### 3.1 Système de Jeu (Core)

- **Race** — Peuple du personnage (nom, description, modificateurs, taille, vitesse, capacités, voies raciales)
- **Family** — Famille de profil (Aventuriers, Combattants, Mages, Mystiques) avec baseHp, recoveryDie, luckPoints, manaStat
- **Profile** — Classe du personnage (14 profils : Barbare, Barde, Chevalier, Druide, Guerrier, Magicien, etc.) avec dés de vie, armures autorisées, compétences, statistiques, équipement de départ
- **Voie** — Arbre de talents lié à un profil (nom, description, catégorie, rang max, détails JSON)
- **Capability** — Capacité / Sort (rang, voie, isSpell, actionType, limited, effet JSON)
- **CreatureFamily** — Famille de créature (nom, description, image)
- **Creature** — Monstre du bestiaire (NC, PV, DEF, INIT, stats, capacités spéciales, attaques, catégorie, environnement)
- **CreatureVoie** — Lien créature ↔ voie avec rang
- **Equipment** — Armes et armures (type, prix, poids, rareté, matériau, qualité, dégâts, portée, bonus CA)
- **Material** — Matériau d'artisanat
- **HarmfulState** — État préjudiciable (API shortName: "State")
- **Food** — Nourriture (URI personnalisée : `/foods/{id}`)
- **Lodging** — Logement
- **Mount** — Monture

### 3.2 Campagne et Utilisateurs

- **User** — Compte utilisateur (email, rôles JSON, mot de passe hashé)
- **Campaign** — Campagne de jeu (propriétaire, nom, description, notes, timestamps)
- **Quest** — Quête (campagne, titre, description, type "main", statut "active")
- **Clue** — Indice / rumeur (campagne, contenu, date trouvée, statut)
- **Session** — Session de jeu (campagne, titre, date, durée, niveau, résumé)
- **Character** — Personnage joueur (race, profil, propriétaire, campagne, niveau, données JSON)

## 4. API Platform

- **Route prefix** : `/api`
- **Titre** : "Chroniques Oubliees API" v1.0.0
- **Formats** : JSON-LD, JSON
- **Documentation** : Swagger UI + ReDoc activés
- **Pagination** : 30 items/page (max 1000, configurable par le client)
- **Entités exposées** : Toutes les 21 entités sont des `#[ApiResource]`

### Sécurité des endpoints

- **Compendium** : Race, Family, Profile, Voie, Capability, Creature, CreatureFamily, CreatureVoie, Equipment, Material, HarmfulState, Food, Lodging, Mount — **lecture publique**, mais **écritures (POST/PUT/PATCH/DELETE) réservées à ROLE_ADMIN** (règle `access_control` par chemin+méthode dans `security.yaml`)
- **Authentifié** : Campaign, Quest, Clue, Session, Character (ROLE_USER)
- **Sécurisation par propriétaire** (ROLE_USER + contrôle du owner sur les opérations item) : **Campaign** et **Character** (`object.getOwner() == user`) ; **Quest / Clue / Session** (`object.getCampaign().getOwner() == user`, via `securityPostDenormalize` sur les écritures) + collection en `ROLE_USER`
- **User** :
  - `Post` (inscription) reste **public** — nécessaire pour créer un compte
  - `GetCollection` réservé à **ROLE_ADMIN** (ne plus exposer la liste des emails)
  - `Get` / `Put` / `Patch` / `Delete` : `ROLE_ADMIN or object == user` (un utilisateur ne gère que son propre compte)
  - Le champ `roles` est en lecture seule (groupe `user:read`) → pas d'escalade de privilèges via l'API
- **State processors** : `UserPasswordHasher` (hash du mot de passe), `CampaignStateProcessor` et `CharacterStateProcessor` (assignent le owner courant + timestamps)
- **Doctrine Extension** : `CurrentUserExtension` filtre Campaign/Character (relation `owner` directe) et Quest/Clue/Session (via `campaign.owner`) par utilisateur courant

## 5. Authentification (JWT)

- **Bundle** : LexikJWTAuthenticationBundle 3.2
- **Firewalls** :
  - `login` → `/api/login` (stateless, json_login)
  - `api` → `/api` (stateless, JWT)
- **Accès** : `/api/login` en PUBLIC_ACCESS, `/api` en PUBLIC_ACCESS (lecture compendium) ; une règle `access_control` intermédiaire réserve les **écritures compendium** à ROLE_ADMIN. La protection fine du domaine campagne est appliquée par opération `#[ApiResource]` (expressions `security`) + `CurrentUserExtension`
- **Clefs** : private.pem / public.pem présentes dans `config/jwt/` (regénérables via `lexik:jwt:generate-keypair`)
- **Passphrase** : stockée dans `.env`
- **Compte admin de seed** : `admin@example.com` / `admin` (mot de passe défini dans les fixtures — à changer hors développement)
- **Utilisateur de test (dev)** : recréé/actualisé à chaque `docker compose up` par l'entrypoint dev (`backend/docker/dev-entrypoint.sh` → `bin/console app:create-test-user`) — `test@test.com` / `password` / `ROLE_ADMIN`. Commande idempotente (options `--email/--password/--role`).

## 6. EasyAdmin (Back Office)

- **Route** : `/admin`
- **10 CRUD controllers** couvrant : User, Race, Family, Profile, Voie, Capability, CreatureFamily, Creature, Equipment
- **Menu** : Dashboard → section Users → section Game Data
- **Dashboard** : redirection par défaut vers CreatureCrudController

## 7. DataFixtures

- **Fichier unique** : `AppFixtures.php` (645 lignes)
- **Ordre de chargement** : Familles → Races (8 fichiers) → Équipement (armes, armures, matériaux, montures, nourriture, logement) → États → Familles de profils → Profils (14 fichiers avec voies et capacités) → Créatures → Admin user
- **Données** : 14 profils de classe, 8 races, centaines de créatures et capacités
- **Admin user** : créé avec un mot de passe réellement hashé via `UserPasswordHasherInterface` (`admin@example.com` / `admin`)

## 8. Migrations (3 fichiers, appliquées)

1. **Version20260301150846** — Schéma initial (21 tables)
2. **Version20260301172414** — Ajustements (Clue, Quest, Session)
3. **Version20260301194224** — Ajout `campaign_id` sur Character

## 9. Points d'attention

- **Sécurité des entités** : User, Campaign, Character **et** Quest/Clue/Session sont protégés (par propriétaire / rôle) ; le compendium reste public **en lecture** mais ses écritures sont réservées à ROLE_ADMIN
- **Tests** : suite fonctionnelle dans `tests/Api/` (**40 tests**, basée sur `ApiTestCase`) — règles de sécurité (User/Campaign/Character/Quest, écritures compendium admin-only, sous-ressources campagne non listables sans auth), inscription+login JWT et hachage du mot de passe, timestamp `updatedAt`. Lancement : `php bin/phpunit` (DB de test à créer une fois via `php bin/console doctrine:database:create --env=test`). Le reste de l'application n'est pas encore couvert.
- **Messenger** : Transport Doctrine configuré (async + failed), routage pour SendEmailMessage, ChatMessage, SmsMessage
- **Pas de Services/EventSubscriber/Voter** dédiés pour le moment

---
*Ce document fait partie de l'état des lieux global généré pour le projet Chroniques Oubliées Fantasy.*
