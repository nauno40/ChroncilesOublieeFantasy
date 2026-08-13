# Fonctionnalités et Roadmap

Suite à l'analyse approfondie du code source frontend et backend (mise à jour août 2026), voici l'état actuel des fonctionnalités de l'application Chroniques Oubliées Fantasy.

> **Cadrage produit** : le site est une **aide de table pour le MJ** — on n'y joue pas en direct. Pas de temps réel, pas de partie multijoueur en ligne. Les seuls échanges avec les joueurs sont **asynchrones** : le MJ diffuse les résumés de campagne, et les joueurs créent leurs personnages pour les partager au MJ.

## 1. Ce qui est implémenté et qui fonctionne ✅

### Encyclopédie / Compendium (Connecté à l'API)
- **Compendium unifié** : chaque type de contenu (race, classe, voie, capacité, équipement,
  objet magique, état, poison, piège, créature) a une page unique à trois onglets — Officiel,
  Communauté, Mes créations — avec **le même vocabulaire, les mêmes filtres, les mêmes cartes et
  la même feuille** des deux côtés. Le contenu communautaire n'est pas un second-rôle : il passe
  par les composants partagés (`components/sheets/`, `ContentCard`, `CompendiumTable`,
  `SearchToolbar`) via des adaptateurs (`adapters/fromOfficial.ts`, `fromHomebrew.ts`,
  `fromCustomCreature.ts`).
- **Bestiaire** : Visualisation complète des monstres avec filtrage avancé (famille, catégorie, environnement, taille, NC) et détails de fiche
- **Profils/Classes & Races** : Listes explicatives complètes avec dés de vie, bonus, voies associées, lore
- **Voies & Capacités** : Catalogue détaillé avec filtres (rang, profil, voie), rendu dynamique des détails
- **Équipement** : Armes, armures, matériel, nourriture, logement, montures
- **Règles** : Module complet avec 10 sections (Introduction, Bases, Combat, Magie, Environnement, Aventure, Objets Magiques, Opposition, Devenir MJ, Conversion COF1→COF2)

### Fiche de Personnage
- Outil extrêmement complet — `CharacterSheet.tsx` orchestrateur léger + moteur de règles pur `domain/rules/` + hooks + 25 composants
- **Modèle refondu pour la fidélité aux règles COF2** : `caracs` (valeurs = modificateurs) + `playState` (état de jeu opaque) + `characterVoies` (voies par IRI/rang/source) ; **aucune valeur dérivée stockée**
- **Dérivation pilotée par les données** : bonus Init/DEF/RD, plafond d'armure, bonus aux tests, etc. lus depuis `Capability.effect` (`bonuses`/`armorCap`/`choiceOptions`/`evolutiveDie`) via l'interpréteur `resolveCapabilityEffect` — fin du `CAPABILITY_MODIFIERS` codé en dur
- PV cumulés par niveau (hybrides fidèles), mana, chance, récupération, attaque/défense/initiative — tout dérivé
- Capacités à choix résolues (bonus aux tests, effet de combat) ; **octroi de capacité de peuple** (source `trait`, gratuite) ; langues de peuple, bornes physiques et maîtrises en guide
- Mécaniques d'aide de table pilotées joueur : objets magiques, usages limités, compagnons, transformations, états activables, substitutions de carac, repos court/long
- Lancer de dés intégré, inventaire/équipement/monnaie/protection, sauvegarde via API

### Outils de Table (Virtual Table)
- **Suivi de Combat** (CombatTracker) : ordre d'initiative COF2 avec départage à égalité (PJ > PNJ, puis PER, puis 1d20 stocké), tours et rounds, PV avec dégâts/soins en saisie libre (+ ±1), import du bestiaire (quantité + auto-numérotation « Gobelin 1/2 ») et des PJ (INIT/DEF/PV réels), états préjudiciables en badges, persistance localStorage (`co_combat_tracker`). Logique pure testée (`combatTracker.test.ts`). Outil **volontairement mono-écran** (aide MJ) : pas de diffusion temps réel vers les joueurs — c'est un choix de design, pas une limitation
  - **Le combat se joue depuis le suivi** : attaquer une cible depuis sa ligne (DEF effective,
    états cumulés), infliger les dommages du jet (RD déduite, minimum d'un point), poser un état
    déclaré par une capacité, invoquer une créature déclarée. Le **jet de résistance** se joue là
    où l'état s'applique : le panneau lit la caractéristique de la cible dans son profil, lance
    le **dé bonus** si elle est supérieure, et compte les répétitions d'une même capacité pour
    appliquer le **rendement décroissant**.
- **Lanceur de dés** (DiceRoller) : formules XdY+Z, historique, détection critique, popup flottant
- **Panneau de Sons** (Soundboard) : pistes personnalisables (YouTube/URL), persistance localStorage
- **Fenêtres flottantes** (DraggableWindow) : redimensionnables, déplaçables, position persistée
- **Notes globales** : éditeur avec auto-save, localStorage
- **Recherche globale** (Cmd+K) : parcourt créatures, capacités, profils, races, voies, règles, états, équipement
- **États préjudiciables** : référence rapide avec images

### Authentification et Comptes
- Système JWT complet (login/register)
- Routes protégées côté frontend (ProtectedRoute)
- Backend : entité User, password hasher, JWT tokens
- Compte admin de seed fonctionnel (`admin@example.com` / `admin`, mot de passe réellement hashé)
- **Sécurité fine de l'API** : User (par rôle / propre compte, inscription publique), Campaign et Character sécurisés par propriétaire ; compendium public en lecture

### Gestion de Campagne
- **Backend + Frontend connectés à l'API** : quêtes, indices, sessions et notes persistés en base via `campaignService.ts` (mapping bidirectionnel), sécurisés par propriétaire — plus de `localStorage`

### Backend / API
- API REST complète pour toutes les entités (API Platform + Swagger/ReDoc)
- CRUD administrateur via EasyAdmin (9 contrôleurs + tableau de bord), **réservé à ROLE_ADMIN** depuis août 2026 — il répondait jusque-là 200 à un visiteur anonyme, et ses formulaires d'édition et de création répondaient 500 (voir `backend.md` §6)
- Modèles de données pour le système de jeu (28 entités)
- Fixtures complètes (14 profils, 8 races, 219 créatures, 650 capacités)

### Fidélité aux règles (chantier continu)
Les règles vivent dans `app/src/domain/rules/` (25 modules purs), et le livre — transcrit dans
`doc/getRulesFullToMD/` — fait foi. Couvert : le test COF2 (dé bonus/malus, difficultés,
critique), l'attaque et les options tactiques, les dommages (RD, résistance, minimum d'un point),
l'encombrement, le tir à distance, la magie (coût, brûlure de mana, concentration accrue, surcoût
sous l'armure), les poisons, les dangers, le voyage, le rendement décroissant, les types de
créature et leurs immunités.

**Le bestiaire servi a été confronté au livre profil par profil** (`scripts/audit-bestiaire.mjs`,
rejoué par la CI). Trois écarts corrigés : 46 caractéristiques **négatives** perdues à l'import
sur 30 créatures, les NC **½** servis comme des NC 1, et **101 caractéristiques supérieures**
(l'astérisque du livre = un dé bonus) qu'aucun champ ne pouvait exprimer. Les 147 créatures
absentes du livre ne sont pas touchées : elles ne sont pas vérifiables, et les corriger au jugé
serait inventer.

## 2. Ce qui fonctionne partiellement ou avec des limitations ⚠️

### Tests
- **Backend** : **131 tests / 1254 assertions** (PHPUnit) — sécurité par propriétaire, durcissement
  des autorisations, JWT, contrat de sérialisation du compendium, et deux suites pures sur les
  services et les données source des profils.
- **Frontend** : **576 tests unitaires** (Vitest, 42 fichiers) et **76 tests E2E** (Playwright,
  20 fichiers), lancés par `bash scripts/e2e.sh` contre le stack docker compose.
- **Intégration continue** (`.github/workflows/ci.yml`) : quatre jobs sur chaque PR — front,
  back, fidélité du bestiaire, e2e. Elle rejoue les commandes que le projet définit déjà.

## 3. Roadmap suggérée 🚀

### Phase 1 : Persistance et Backend (Terminée)
- [x] Modèles backend pour la campagne (Campaign, Quest, Clue, Session)
- [x] Système de comptes (JWT) — inscription, connexion
- [x] Lier Character et Campaign à un User

### Phase 2 : Partage asynchrone MJ ⇄ Joueurs (fait)
- [x] **Persistance des campagnes via l'API** (remplacement du localStorage)
- [x] **Notion de membres de campagne / partage inter-utilisateurs** : entité `CampaignMembership` + code d'invitation (`Campaign.inviteCode`, régénérable). Un joueur rejoint par code (`POST /api/shared_campaigns/join`) ; scoping via `CurrentUserExtension` (le membre voit ses adhésions, le MJ voit les membres de ses campagnes)
- [x] **Partage des résumés de campagne aux joueurs** : ressource read-only dédiée `SharedCampaign` (`GET /api/shared_campaigns`) qui n'expose que le nom + les résumés de séances (aucune fuite de `notes`/quêtes/indices ; la ressource `Campaign` reste owner-scopée)
- [x] **Personnages créés par les joueurs, partagés au MJ** : le joueur rattache sa fiche via le champ `campaignId` (validé par l'appartenance) ; le MJ lit **et** édite les fiches de ses membres (`Character` sécurité élargie à `owner` ou MJ ; `Delete` reste propriétaire)

### Refonte du modèle de données pour la fidélité aux règles (livrée)
- [x] **Phase 1 — schéma backend** : entité `CharacterVoie`, `Character` = `caracs`+`playState`+`characterVoies` (fin de `data`), champs morts `Profile` retirés, armures numériques, `Profile.armorMaxDef`/`weaponsAuth`, dé évolutif dans `Capability.effect`
- [x] **Phases 2-5 — front** : migration du modèle (voies par IRI), moteur de dérivation `cofRules.ts` (interpréteur d'effets, PV hybrides, RD, langues…), 7 mécaniques d'aide de table + système de repos, UI réorganisée en sections repliables
- [x] **Long-tail fidélité** : dérivation Init/DEF data-driven, plafond d'armure conscient des capacités, résolution des capacités à choix (bonus aux tests, effet de combat), octroi de capacité de peuple (source `trait`), langues de peuple, bornes physiques, maîtrises sur la fiche, tests de contrat backend
- **Tranché** : COF2 ne définit **aucune** pénalité mécanique pour une arme non maîtrisée → « weaponsAuth » reste descriptif (affiché, non dérivé).
- [x] **Armure et capacités (chap. 9)** : une capacité garde la restriction d'armure du profil dont elle est issue, même chez un hybride. La fiche propose désormais **toutes** les armures (porter n'est pas interdit — c'est l'usage des capacités qui tombe), signale celles hors limite, et un panneau « Sous l'armure » liste par profil les capacités bridées et le **surcoût de PM** des sorts (`domain/rules/spellcasting.ts`). Sorts de prêtre exemptés ; forgesort/druide/barde ne paient que la différence.

### Ce qui restera ouvert par construction
- **147 créatures servies absentes du livre** : non vérifiables par `audit-bestiaire.mjs`. Leur
  silence n'est pas un satisfecit, mais les corriger au jugé serait inventer.
- **Invocations officielles** : seules deux capacités du livre désignent une créature du
  bestiaire (« Animation des morts » → Zombi humain, « Panthère »). Les autres portent le profil
  de l'invoquée **dans le texte du sort** (élémentaire, démon, serviteur invisible — souvent
  dérivé du niveau du lanceur), laissent le **choix** au joueur (monture géante « de son
  choix », monture fantastique, grand félin, petit compagnon), ou ne sont pas des créatures
  (Ténèbres, Mur de pierre, Armée des morts = dégâts de zone). Vérifié aussi côté bestiaire :
  **aucune** capacité de créature n'invoque une autre créature du bestiaire.

### Phase 3 : Nouvelles Features
- [x] **Export PDF / fiche imprimable** : route dédiée `/characters/:id/print` (`PrintableCharacterSheet`, hors `Layout` — pas de sidebar sur le papier), rendue par le **PDF natif du navigateur** (`window.print()` + `@media print` dans `index.css`) — aucune dépendance de génération PDF. La fiche réutilise `useCharacterSheet` : les valeurs imprimées sont celles de l'écran **par construction**. Contenu : caractéristiques, combat (attaques + armes), ressources avec cases à cocher, voies & capacités avec descriptions intégrales et **coût réel des sorts sous l'armure portée**, équipement, aide de table (états, usages, compagnons), roleplay, lignes de notes vierges. *Pas d'import : rien à importer d'un PDF que la fiche ne sache déjà saisir.*
- [~] **Mapping / Grille de combat** — **écarté (hors vision)** : une grille tactique avec pions ferait basculer l'app vers un VTT / un jeu en soi. L'app est une **aide de jeu** (fiche + trackers + compendium), pas le jeu. Le Suivi de Combat (init/PV/états) reste l'aide de combat, sans plateau.
- [x] **Créateur de monstre custom** : entité `CustomCreature` **owner-scopée** (globale au compte du MJ, pas liée à une campagne) — sécurité par-opération `object.getOwner() == user` + `CurrentUserExtension` + `CustomCreatureStateProcessor`. Page dédiée `/tools/monsters` (fiche complète : stats, attaques, capacités, capacités spéciales, classification, image) et import dans le Suivi de Combat via l'optgroup « Mes monstres ». Couvert par PHPUnit (`CustomCreatureSecurityTest`) et un parcours E2E Playwright (`e2e/custom-monsters.spec.ts`)
- [x] **Rencontres préparées** : entité `Encounter` (enfant de `Campaign`, owner-scopée comme `Quest`) — le MJ compose un roster nommé de créatures (bestiaire SRD **et** monstres custom, avec quantité) depuis la fiche de campagne, puis le **lance en un clic dans le Suivi de Combat** (développement auto-numéroté du roster dans `co_combat_tracker`, redirection `/tools/tracker`). Le bouton « Ajouter un PJ » de la campagne propose aussi désormais *créer une fiche pré-liée* ou *rattacher un perso existant*. Couvert par PHPUnit (`EncounterSecurityTest`) et E2E (`e2e/campaign-encounters.spec.ts`, `e2e/campaign-characters.spec.ts`)
- [x] **Tests automatisés** : première suite E2E Playwright (`app/e2e/`) + tests unitaires règles (Vitest) et sécurité (PHPUnit). À étendre.

### Intégration continue (livrée)
- [x] **Quatre jobs sur chaque PR** : front (`lint`/`test:run`/`build`), back (PHPUnit sur un
  PostgreSQL de service), fidélité (`audit-bestiaire.mjs`), e2e (stack complet + Playwright).
  Elle a immédiatement révélé trois dépendances invisibles qui rendaient toute vérification
  locale non concluante : le `vendor/` de l'image masqué par le montage `./backend:/app`, la base
  `app_test` créée à la main sur un poste et nulle part ailleurs, et `failOnDeprecation` qui fait
  sortir 1 derrière un message « OK, but there were issues! ». Elle a aussi mis au jour un défaut
  produit : `AppFixtures` jetait le type d'action des capacités, donc la concentration accrue ne
  s'appliquait à **aucun** sort officiel.

### Améliorations techniques
- [x] **Refactoring CharacterSheet** : fait (PR #1) — fichier divisé (2109 → ~176 lignes) en composants (`CharacterToolbar`, `AttributesPanel`, `MainStatsPanel`, `IdentityBlock`, `VoiesTree`, `CapabilityNode`, sections Roleplay/Protection/Weapons/Inventory) + hook `useCharacterSheet`
- [x] **Clefs JWT** : présentes dans `config/jwt/` (regénérables via `lexik:jwt:generate-keypair`)
- [x] **Sécurisation fine de l'API** : User, Campaign et Character restreints par utilisateur / rôle
- [x] **Tests automatisés des règles de sécurité** : suite PHPUnit dans `backend/tests/Api/`
- [x] **Étendre la couverture de tests** : suite E2E portée à **76 tests verts** (20 fichiers) — ajout de `bibliotheque.spec.ts` (voie communautaire et ses capacités imbriquées, déclaration d'état cliquable, retour contextuel) et `printable-sheet.spec.ts` (sections de la fiche imprimable, coût des sorts sous l'armure). Backend : suppression en cascade d'une voie communautaire couverte (`HomebrewEntryTest`).
  **Suite remise en marche au passage** : 5 tests échouaient en silence — sélecteur `a[href^="/campaign/"]` mort depuis le passage aux cartes cliquables (refonte UI/UX), nom de monstre de démonstration disparu des fixtures, et `.first()` qui lançait une rencontre préexistante au lieu de celle créée par le test. L'URL d'API est désormais surchargeable (`PW_API_URL`) au lieu d'être écrite en dur dans chaque spec.
- [x] **Couvrir le backend hors sécurité en PHPUnit** : suite portée à **119 tests / 1169 assertions**. Ajouts : contrat des **données de profil** (`tests/DataFixtures/ProfileDataTest.php` — chaque profil a une limite d'armure, la table suit le livre, 5 voies × 5 rangs, et seuls les 7 profils lanceurs portent des sorts) et `InviteCodeGenerator` (longueur, alphabet sans caractères ambigus). La table `ARMOR_MAX_DEF_BY_PROFILE` est sortie du corps de `AppFixtures` en constante publique pour être vérifiable : une clé mal orthographiée y laissait `armorMaxDef` à null en silence.

---
*Ce document propose un état des lieux orienté fonctionnalités et produit pour l'application Chroniques Oubliées Fantasy.*
