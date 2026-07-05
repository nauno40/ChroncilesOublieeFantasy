# Fonctionnalités et Roadmap

Suite à l'analyse approfondie du code source frontend et backend (juin 2026), voici l'état actuel des fonctionnalités de l'application Chroniques Oubliées Fantasy.

> **Cadrage produit** : le site est une **aide de table pour le MJ** — on n'y joue pas en direct. Pas de temps réel, pas de partie multijoueur en ligne. Les seuls échanges avec les joueurs sont **asynchrones** : le MJ diffuse les résumés de campagne, et les joueurs créent leurs personnages pour les partager au MJ.

## 1. Ce qui est implémenté et qui fonctionne ✅

### Encyclopédie / Compendium (Connecté à l'API)
- **Bestiaire** : Visualisation complète des monstres avec filtrage avancé (famille, catégorie, environnement, taille, NC) et détails de fiche
- **Profils/Classes & Races** : Listes explicatives complètes avec dés de vie, bonus, voies associées, lore
- **Voies & Capacités** : Catalogue détaillé avec filtres (rang, profil, voie), rendu dynamique des détails
- **Équipement** : Armes, armures, matériel, nourriture, logement, montures
- **Règles** : Module complet avec 10 sections (Introduction, Bases, Combat, Magie, Environnement, Aventure, Objets Magiques, Opposition, Devenir MJ, Conversion COF1→COF2)

### Fiche de Personnage
- Outil extrêmement complet — `CharacterSheet.tsx` refactorisé (2109 → ~176 lignes), découpé en composants + hook `useCharacterSheet`
- Calcul automatisé des modificateurs de caractéristiques
- Intégration des bonus liés aux capacités (système `CAPABILITY_MODIFIERS`)
- Lancer de dés intégré directement depuis la fiche
- Gestion de l'inventaire, équipement, monnaie, protection
- Sauvegarde en base de données via API

### Outils de Table (Virtual Table)
- **Suivi de Combat** (CombatTracker) : ordre d'initiative COF2 avec départage à égalité (PJ > PNJ, puis PER, puis 1d20 stocké), tours et rounds, PV avec dégâts/soins en saisie libre (+ ±1), import du bestiaire (quantité + auto-numérotation « Gobelin 1/2 ») et des PJ (INIT/DEF/PV réels), états préjudiciables en badges, persistance localStorage (`co_combat_tracker`). Logique pure testée (`combatTracker.test.ts`). Outil **volontairement mono-écran** (aide MJ) : pas de diffusion temps réel vers les joueurs — c'est un choix de design, pas une limitation
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
- CRUD administrateur via EasyAdmin (10 contrôleurs)
- Modèles de données pour le système de jeu (21 entités)
- Fixtures complètes (14 profils, 8 races, centaines de créatures et capacités)

## 2. Ce qui fonctionne partiellement ou avec des limitations ⚠️

### Tests
- **Backend** : suite fonctionnelle PHPUnit dans `backend/tests/Api/` — **40 tests** couvrant les règles de sécurité (User / Campaign / Character / Quest), le durcissement des autorisations (écritures compendium réservées à ROLE_ADMIN, sous-ressources campagne non listables sans auth), l'inscription + login JWT avec hachage du mot de passe, et le timestamp `updatedAt`. Le reste du backend n'est pas encore couvert.
- **Frontend** : suite E2E Playwright (`app/e2e/`) couvrant les parcours critiques — authentification (inscription/connexion/déconnexion), régression du fix 401 (JWT périmé auto-purgé), compendium chargé depuis la BDD (races/classes/bestiaire), rendu de la fiche personnage. Lancée via `bash scripts/e2e.sh` (image Playwright officielle en `network_mode: host`, cf. `frontend.md` §10). Tests unitaires purs via Vitest (`cofRules.test.ts` pour les règles COF2, `combatTracker.test.ts` pour l'ordre d'initiative et le départage du Suivi de Combat).

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

### Phase 3 : Nouvelles Features
- [ ] **Import/Export PDF** : Générer une fiche de personnage imprimable
- [ ] **Mapping / Grille de combat** : Canvas avec upload d'image (map) et pions déplaçables
- [ ] **Créateur de monstre custom** : Interface pour créer un monstre hors SRD et le sauvegarder dans la campagne
- [x] **Tests automatisés** : première suite E2E Playwright (`app/e2e/`) + tests unitaires règles (Vitest) et sécurité (PHPUnit). À étendre.

### Améliorations techniques
- [x] **Refactoring CharacterSheet** : fait (PR #1) — fichier divisé (2109 → ~176 lignes) en composants (`CharacterToolbar`, `AttributesPanel`, `MainStatsPanel`, `IdentityBlock`, `VoiesTree`, `CapabilityNode`, sections Roleplay/Protection/Weapons/Inventory) + hook `useCharacterSheet`
- [x] **Clefs JWT** : présentes dans `config/jwt/` (regénérables via `lexik:jwt:generate-keypair`)
- [x] **Sécurisation fine de l'API** : User, Campaign et Character restreints par utilisateur / rôle
- [x] **Tests automatisés des règles de sécurité** : suite PHPUnit dans `backend/tests/Api/`
- [ ] **Étendre la couverture de tests** : reste du backend (PHPUnit) + élargir la suite E2E frontend (Playwright configurée, cf. `app/e2e/`)

---
*Ce document propose un état des lieux orienté fonctionnalités et produit pour l'application Chroniques Oubliées Fantasy.*
