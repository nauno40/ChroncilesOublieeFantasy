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
├── Controller/Admin/        # CRUD EasyAdmin (27 contrôleurs + DashboardController, voir §6)
│   ├── DashboardController.php
│   ├── AbstractWritableCrudController.php     # famille A : CRUD complet (17 sections)
│   ├── AbstractReadDeleteCrudController.php   # familles B/C : consultation + suppression (10 sections)
│   └── <Entité>CrudController.php × 27        # un squelette par entité, sauf PasswordResetToken
├── DataFixtures/
│   └── AppFixtures.php      # 645 lignes, charge toutes les données
├── Doctrine/
│   └── CurrentUserExtension.php  # Filtre les requêtes par utilisateur
├── Entity/                  # 28 entités (voir section 3)
├── Repository/              # 24 repositories Doctrine
├── State/
│   ├── CampaignStateProcessor.php   # Assigne le owner à la création
│   ├── CharacterStateProcessor.php  # Assigne le owner à la création
│   └── UserPasswordHasher.php       # Hash le mot de passe
└── Kernel.php
```

## 3. Modèles de Données (28 Entités)

### 3.1 Système de Jeu (Core)

- **Race** — Peuple du personnage (nom, description, modificateurs, taille, vitesse, capacités, voies raciales)
- **Family** — Famille de profil (Aventuriers, Combattants, Mages, Mystiques) avec baseHp, recoveryDie, luckPoints, manaStat
- **Profile** — Classe du personnage (14 profils : Barbare, Barde, Chevalier, Druide, Guerrier, Magicien, etc.). Champs structurés issus de la refonte fidélité : `armorMaxDef` (seuil de DEF max d'armure autorisée ; `-1` = aucune), `magicStat` (carac de magie du profil), `weaponsAuth` (JSON, réservé), `masteries` (maîtrises armes/armures en prose), `stats` (dont `hpPerLevel`), équipement de départ. **Les champs morts `hitDie`/`skillPoints` ont été retirés** (les PV viennent de la famille, le budget de capacité est une constante de règle).
- **Voie** — Arbre de talents lié à un profil (nom, description, catégorie, rang max, détails JSON)
- **Capability** — Capacité / Sort (rang, voie, isSpell, actionType, limited). Le champ **`effect` (JSON)** porte les données de dérivation exploitées par le front : `evolutiveDie` (dé « Nd4° »), `bonuses` (bonus de combat : `{target, scalesWith: fixed|rank|carac|threshold, …}`), `armorCap` (relèvement du plafond d'armure), `choiceOptions` (options structurées d'une capacité à choix, avec payload `caracTestBonus`/`bonuses`/`armorCap`). Peuplé par `AppFixtures` (tables `COMBAT_BONUSES`, `ARMOR_CAP_BY_CAPABILITY`, `CHOICE_OPTIONS_BY_CAPABILITY` + détection regex du dé évolutif).
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
- **Character** — Personnage joueur (race, profil FK, propriétaire, campagne, niveau). **Modèle refondu (fin de l'ancien fourre-tout `data`)** : `caracs` (JSON — les 7 caractéristiques COF, valeurs = modificateurs, ‑2..+5) et `playState` (JSON opaque — état de jeu mutable piloté joueur : PV/PM/PC courants, protection, objets magiques, usages, compagnons, formes, états actifs, substitutions, langues/talents, physique, PV par niveau…). Les valeurs dérivées ne sont **jamais** stockées (calculées côté front, cf. `cofRules.ts`).
- **CharacterVoie** — Voie choisie par un personnage (entité, **pas** une ressource API : écrite via `Character.characterVoies` en cascade). Champs : `voie` (FK), `rank` (0..5), `source` (`profil` | `peuple` | `prestige` | `hybride` | `trait`), `choices` (JSON — choix enregistrés par rang). La source `trait` porte les **capacités octroyées par le peuple** (gratuites, hors budget/plafond).

## 4. API Platform

- **Route prefix** : `/api`
- **Titre** : "Chroniques Oubliees API" v1.0.0
- **Formats** : JSON-LD, JSON
- **Documentation** : Swagger UI + ReDoc activés
- **Pagination** : 30 items/page (max 1000, configurable par le client)
- **Entités exposées** : 23 entités sont des `#[ApiResource]` (dont `CampaignMembership`, `SharedCampaign`, `CustomCreature`, `Encounter`). `CharacterVoie` est une entité **non exposée** directement (écrite en cascade via `Character`).

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
  - `main` → le reste, c'est-à-dire le back-office : **http_basic** + lien de déconnexion `/admin/logout` (exigé par le gabarit EasyAdmin)
- **Accès** : `/api/login` en PUBLIC_ACCESS, `/api` en PUBLIC_ACCESS (lecture compendium) ; une règle `access_control` intermédiaire réserve les **écritures compendium** à ROLE_ADMIN ; `^/admin` est réservé à ROLE_ADMIN. La protection fine du domaine campagne est appliquée par opération `#[ApiResource]` (expressions `security`) + `CurrentUserExtension`
- **Clefs** : private.pem / public.pem présentes dans `config/jwt/` (regénérables via `lexik:jwt:generate-keypair`)
- **Passphrase** : stockée dans `.env`
- **Compte admin de seed** : `admin@example.com` / `admin` (mot de passe défini dans les fixtures — à changer hors développement)
- **Utilisateur de test (dev)** : recréé/actualisé à chaque `docker compose up` par l'entrypoint dev (`backend/docker/dev-entrypoint.sh` → `bin/console app:create-test-user`) — `test@test.com` / `password` / `ROLE_ADMIN`. Commande idempotente (options `--email/--password/--role`).

## 6. EasyAdmin (Back Office)

- **Route** : `/admin` — **réservée à ROLE_ADMIN** (voir §5). Ce n'était pas le cas jusqu'en août 2026 : le pare-feu `main` ne déclarait aucun authentificateur, donc personne n'était jamais connecté, donc aucune vérification ne s'appliquait — `/admin/user` (les adresses e-mail de tous les comptes) et l'édition ou la suppression de tout le compendium répondaient 200 à un visiteur anonyme
- **27 contrôleurs CRUD** (+ `DashboardController`), soit les 28 entités moins `PasswordResetToken` — exclu délibérément : un jeton de réinitialisation est un secret à durée de vie courte, l'afficher dans une interface est un risque, pas une fonctionnalité. Jusqu'en août 2026, 9 entités seulement avaient un contrôleur (User, Race, Family, Profile, Voie, Capability, CreatureFamily, Creature, Equipment) ; les 19 autres n'avaient aucune interface — corriger le prix d'une monture, relire l'effet d'un poison ou retirer une création communautaire abusive exigeait une requête SQL à la main
- **Deux comportements, portés par deux classes de base nommées d'après le comportement et non le domaine** — le jour où une entité de référence deviendrait consultable seulement, elle change de base sans changer de sens :
  - `AbstractWritableCrudController` — **CRUD complet, 17 sections** : les 9 historiques plus Food, Lodging, Material, Mount, HarmfulState, Poison, Trap, CreatureVoie. Données de référence, seedées par les fixtures et déjà lisibles publiquement par l'API ; les corriger dans le back-office est la vocation même de l'outil.
  - `AbstractReadDeleteCrudController` (étend `AbstractWritableCrudController`) — **consultation et suppression seulement, 10 sections** : Campaign, CampaignMembership, Quest, Clue, Session, Encounter, Character, CharacterVoie (domaine campagne) + HomebrewEntry, CustomCreature (contenu communautaire). `configureActions()` retire `Action::NEW`/`Action::EDIT`, et EasyAdmin ferme alors **les routes elles-mêmes**, pas seulement les boutons — mesuré : `GET /admin/<section>/new` et `.../edit` répondent **403**, pas un formulaire caché. Ces données appartiennent à un utilisateur et sont écrites par le front, qui applique des règles (propriétaire, appartenance à la campagne, dérivations de la fiche) qu'un formulaire EasyAdmin ignore — écrire `Character.caracs` à la main produirait une fiche que le front refuserait d'ouvrir.
- **Choix assumé, à dire ici et pas seulement dans la spec** : ouvrir la section « Données des utilisateurs » donne à **tout** `ROLE_ADMIN` la lecture des notes privées d'un MJ, des indices de ses quêtes et des fiches de tous les joueurs. C'est assumé — l'administrateur est aujourd'hui l'exploitant du service, qui a de toute façon accès à la base. À reconsidérer le jour où `ROLE_ADMIN` serait accordé à un modérateur qui n'est pas l'exploitant.
- **Les champs sont déduits des métadonnées Doctrine, plus énumérés à la main** (`AbstractWritableCrudController::configureFields()`, en parcourant `ClassMetadata`) : une liste écrite dans le contrôleur redit le schéma, vieillit en silence, et laisse invisible toute colonne ajoutée ensuite — c'est ainsi que `RaceCrudController` a longtemps cité `title`, un champ que l'entité n'a jamais eu, en réponse à un 500. Concrètement :
  - les champs scalaires par défaut d'EasyAdmin (`FieldProvider::getDefaultFields()`) ;
  - les associations à cardinalité simple partout, celles à cardinalité multiple en page de détail seulement (sur un formulaire, une collection chargerait toute la table liée pour remplir une liste déroulante) ;
  - les colonnes `float` en `NumberField` à une décimale — COF2 emploie le demi-niveau (NC ½) pour ses adversaires les plus faibles, qu'un champ entier tronquerait à la saisie ;
  - les colonnes `json` via `App\Admin\Field\JsonField` — un `CodeEditorField` en langage `js` (`json` ne figure pas dans les langages autorisés par EasyAdmin) plus un transformateur `array` ↔ chaîne (`JsonToStringTransformer`). Le repérage par `getTypeOfField()` attrape les deux écritures qui coexistent dans le projet (`#[ORM\Column(type: Types::JSON)]` et le `?array` dont Doctrine déduit le type) sans qu'il faille les lister.

  Effet de bord voulu : plusieurs colonnes jusque-là invisibles apparaissent, et `Capability.effect` redevient visible **en lecture seule** — c'est un JSON dérivé par `CapabilityEffectBuilder` au chargement des fixtures, une saisie serait écrasée au chargement suivant. `AbstractWritableCrudController::derivedJsonFields()` (surchargé par `CapabilityCrudController`) marque ces champs `disabled` sans les cacher.
- **Menu à cinq sections françaises repliées** : Comptes (User) · Compendium (Race, Family, Profile, Voie, Capability, Equipment, Material, Food, Lodging, Mount, HarmfulState, Poison, Trap) · Bestiaire (CreatureFamily, Creature, CreatureVoie) · Contenu communautaire (HomebrewEntry, CustomCreature) · Données des utilisateurs (Campaign, CampaignMembership, Quest, Clue, Session, Encounter, Character, CharacterVoie). Fini « Users » / « Game Data » — le menu était le dernier endroit du produit qui parlait encore anglais
- **Dashboard** : redirection par défaut vers CreatureCrudController
- **`__toString()` obligatoire sur toute entité citée par un `AssociationField`** : EasyAdmin construit les libellés d'une liste déroulante en convertissant l'entité liée en chaîne. `Voie`, `Profile`, `Race`, `Family` et `CreatureFamily` en portent un ; sans lui, les pages d'édition **et** de création répondent 500 (`Object of class … could not be converted to string`). `Creature` en porte un désormais aussi — cité par `CreatureVoie`, dont le formulaire est une jointure créature ↔ voie à deux listes déroulantes
- **Écritures vérifiées de bout en bout** (création, modification, suppression d'une race). Deux protections différentes s'appliquent et se remarquent dès qu'on sort du navigateur : les formulaires utilisent le CSRF **sans état** (jeton posé par JavaScript, ou requête acceptée si `Origin`/`Sec-Fetch-Site` prouvent la même origine — sinon **422**), tandis que le bouton « Supprimer » porte un jeton **de session** (sans cookie renvoyé, la réponse est une redirection 302 **sans effet**, pas une erreur)
- **Suppressions, mesurées et non supposées** (`tests/Admin/BackOfficeSecurityTest.php::testAdminDeletesUserData`) : les 10 sections en consultation/suppression se suppriment toutes, **à condition de supprimer les feuilles avant les racines** — `Campaign` porte `orphanRemoval: true` sur ses quêtes, indices, séances, rencontres et adhésions, et `Character` la même chose sur ses voies de personnage ; Doctrine efface donc ces lignes en cascade dès que la racine disparaît. Mais purger une campagne à laquelle un **personnage** est réellement rattaché — l'état normal du produit, pas un cas de laboratoire — est **refusé (409)** : `character.campaign_id` (migration `Version20260301194224`) est posé sans clause `ON DELETE`, donc `RESTRICT` chez Postgres, et côté ORM `Campaign::$characters` ne porte qu'un `cascade: ['persist']`, sans `orphanRemoval`. EasyAdmin attrape la `ForeignKeyConstraintViolationException` de Doctrine et la retraduit en `EntityRemoveException` (409), pas une erreur 500 brute. **Aucune cascade n'a été modifiée pour arranger l'outil d'administration** — changer le produit pour son back-office aurait été le mauvais sens.

## 7. DataFixtures

- **Fichier unique** : `AppFixtures.php` (645 lignes)
- **Ordre de chargement** : Familles → Races (8 fichiers) → Équipement (armes, armures, matériaux, montures, nourriture, logement) → États → Familles de profils → Profils (14 fichiers avec voies et capacités) → Créatures → Admin user
- **Données** : 14 profils de classe, 8 races, centaines de créatures et capacités
- **Admin user** : créé avec un mot de passe réellement hashé via `UserPasswordHasherInterface` (`admin@example.com` / `admin`)

## 8. Migrations (27 fichiers, appliquées)

Schéma initial + ajustements (mars 2026 : `campaign_id` sur Character, Clue/Quest/Session),
puis les migrations du partage MJ ⇄ joueurs (CampaignMembership, CustomCreature, Encounter)
et de la **refonte du modèle de données** (juillet 2026, jusqu'à `Version20260712204811`) :
entité `CharacterVoie`, colonnes `Character.caracs`/`playState` (fin de `Character.data`),
champs morts de `Profile` retirés (`hitDie`/`skillPoints`), `Profile.armorMaxDef`/`weaponsAuth`,
armures numériques, dé évolutif dans `Capability.effect`.

### Migrations de données (et pourquoi pas les fixtures)

Plusieurs migrations récentes ne touchent pas au schéma mais **corrigent la donnée servie** :
plafond d'armure de capacités de barbare, description d'un état, caractéristiques négatives du
bestiaire, NC ½, caractéristiques supérieures, type d'action des capacités.

La raison est constante : `doctrine:fixtures:load` **purge les tables** et emporterait le
contenu des utilisateurs. Une correction de données passe donc par une migration *et* par les
fixtures — la migration répare l'existant, les fixtures empêchent la régression au prochain
chargement.

Corollaire découvert en mettant en place l'intégration continue : **une donnée qui n'existe que
dans la base d'un poste, sans passer par les fixtures, est une donnée perdue.** `AppFixtures`
lisait le type d'action des capacités pour en déduire `limited`/`isSpell` puis le jetait ;
la colonne `action_type` restait nulle après tout rechargement, et la concentration accrue ne
s'appliquait à aucun sort officiel. Rejouer les fixtures est le seul moyen de s'en apercevoir.

## 9. Points d'attention

- **Sécurité des entités** : User, Campaign, Character **et** Quest/Clue/Session sont protégés (par propriétaire / rôle) ; le compendium reste public **en lecture** mais ses écritures sont réservées à ROLE_ADMIN
- **Tests** : **143 tests / 1408 assertions**, mesurés répertoire par répertoire (la suite complète dépasse dix minutes et la base `app_test` est partagée — deux exécutions concurrentes font échouer les deux) :

  | Répertoire | Tests | Assertions |
  |---|---|---|
  | `tests/Api/` | 106 | 186 |
  | `tests/Admin/` | 11 | 156 |
  | `tests/DataFixtures/` | 10 | 187 |
  | `tests/Service/` | 10 | 869 |
  | `tests/Form/` | 6 | 10 |
  | **Total** | **143** | **1408** |

  Suite fonctionnelle dans `tests/Api/` (**21 fichiers**, basée sur `ApiTestCase` ; `ApiSecurityTestCase` réinitialise le schéma Postgres à chaque test — pas de fixtures) — règles de sécurité (User/Campaign/Character/Quest, écritures compendium admin-only, sous-ressources non listables sans auth, CustomCreature/Encounter owner-scopés), inscription+login JWT et hachage du mot de passe, timestamp `updatedAt`, et le **contrat de sérialisation du compendium** (`CompendiumContractTest` : `Capability.effect` structuré exposé via `voie:read`, `Profile.armorMaxDef`, round-trip `CharacterVoie.source = 'trait'`). À côté, des suites **pures** (ni DB ni fixtures, quelques millisecondes) : `tests/Service/` (`CapabilityEffectBuilder`, `InviteCodeGenerator`), `tests/Form/` (`JsonToStringTransformerTest` — le transformateur array ↔ chaîne du `JsonField` du back-office) et `tests/DataFixtures/` (`ProfileDataTest` vérifie les **données source** de `data/Profils/` — chaque profil a une limite d'armure, une clé mal orthographiée dans `AppFixtures::ARMOR_MAX_DEF_BY_PROFILE` la laisserait à null en silence et le front retomberait sur une valeur permissive —, la table suit le livre, chaque profil a 5 voies de rangs 1 à 5, seuls les 7 profils lanceurs portent des sorts ; `StateDataTest` fait de même pour les états préjudiciables). Enfin `tests/Admin/` garde le back-office : `BackOfficeSecurityTest` — 401 anonyme, 403 joueur connecté, 200 administrateur, rendu des 17 formulaires de création/modification de la famille A, index + détail rendus et `new`/`edit` refusés (403) sur les 10 sections B/C, une suppression par section (feuilles avant racines) et le refus mesuré (409) d'une campagne dont un personnage dépend — et `BackOfficeFixtureTest`, qui vérifie que `BackOfficeFixture::seed()` peuple bien ses 26 entités. Le jeu d'essai **sème une ligne par entité citée en association** — sur une base vide, aucune entité n'est convertie en chaîne et les pannes que ces tests surveillent disparaîtraient. Lancement : `php bin/phpunit` (DB de test à créer une fois via `php bin/console doctrine:database:create --env=test` ; la suite fonctionnelle est lente → lancer répertoire par répertoire en dev, les suites pures sont quasi instantanées).

> **Lire le code de retour, pas le texte.** `phpunit.dist.xml` pose `failOnDeprecation` : une
> seule dépréciation fait sortir **1** alors que la sortie affiche « OK, but there were issues! ».
> Une suite « verte » à l'œil peut donc être rouge pour l'intégration continue — c'est
> exactement ce qui s'est produit, une dépréciation d'API Platform 4.1 ayant survécu plusieurs
> semaines derrière ce message.
- **Intégration continue** : la suite complète (143 tests, ~12 min) s'exécute sur chaque PR et poussée vers master — aucune régression n'atteint l'historique.
- **Messenger** : Transport Doctrine configuré (async + failed), routage pour SendEmailMessage, ChatMessage, SmsMessage
- **Pas de Services/EventSubscriber/Voter** dédiés pour le moment

---
*Ce document fait partie de l'état des lieux global généré pour le projet Chroniques Oubliées Fantasy.*
