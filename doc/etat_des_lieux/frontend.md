# État des lieux : Frontend (Application Web)

Le répertoire `./app` héberge une application monopage (SPA) moderne et réactive servant de "Compagnon Joueur et Meneur de Jeu".

## 1. Stack Technique

| Technologie | Version | Usage |
|---|---|---|
| **React** | ^19.2.0 | Framework UI |
| **TypeScript** | ~5.9.3 | Langage |
| **Vite** | ^7.2.4 | Bundler / dev server |
| **Tailwind CSS** | ^4.1.17 | Styling (via `@tailwindcss/postcss`) |
| **React Router DOM** | ^7.10.1 | Routing SPA |
| **Lucide React** | ^0.556.0 | Icônes vectorielles |
| **react-rnd** | ^10.5.2 | Fenêtres redimensionnables/déplaçables |
| **clsx** | ^2.1.1 | Classes CSS conditionnelles |
| **tailwind-merge** | ^3.4.0 | Fusion intelligente de classes Tailwind |
| **tailwindcss-animate** | ^1.0.7 | Animations |
| **ESLint** | v9 (flat config) | Linting |
| **Playwright** | ^1.58.2 | Tests E2E (`app/e2e/`, cf. §10) |
| **Vitest** | ^3.2.6 | Tests unitaires (règles COF2 pures) |

## 2. Architecture des Dossiers

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx    # Garde de route (redirection si non-auth)
│   ├── character/                # 24 composants de la fiche personnage (cf. §9)
│   ├── common/                   # 16 composants partagés
│   ├── layout/
│   │   ├── Layout.tsx            # Layout principal (sidebar + mobile nav)
│   │   └── NavItem.tsx           # Élément de navigation (sous-menus)
│   └── EquipmentChoiceModal.tsx  # Modal de choix d'équipement
├── context/
│   └── AuthContext.tsx           # Contexte d'authentification React
├── constants/
│   └── rules.ts                  # Index des règles (47 entrées)
├── data/
│   └── magicItemTables.ts        # Tables d'objets magiques (aide de saisie)
├── hooks/
│   ├── useSearch.ts              # Hook de filtrage générique
│   └── useToggle.ts              # Hook toggle booléen
├── pages/                        # 27 pages (voir section 3)
├── services/
│   ├── api.ts                    # Service API REST (CRUD générique)
│   ├── AuthService.ts            # Auth JWT (login/register/logout)
│   ├── dataService.ts            # Couche d'accès centralisée aux données
│   └── utils/campaignService.ts  # Service campagnes (mapping API)
├── types/
│   ├── normalized.ts             # Types normalisés (279 lignes)
│   ├── character.ts              # Types pour la fiche personnage
│   └── campaign.ts               # Types pour les campagnes
├── App.tsx                       # Routes + AuthProvider
├── index.css                     # Thème Tailwind v4 + styles globaux
└── main.tsx                      # Point d'entrée React
```

## 3. Routes et Pages (27 pages)

### Pages publiques (sans authentification)

| Route | Page | Description |
|---|---|---|
| `/` | `LandingPage` | Page d'accueil publique (hero, features, stats, CTA) |
| `/login` | `LoginPage` | Connexion (email/password) |
| `/register` | `RegisterPage` | Inscription (auto-login après) |

### Pages protégées (authentification requise)

#### Dashboard & Personnages
| Route | Page | Description |
|---|---|---|
| `/dashboard` | `Home` | Tableau de bord (stats, dernières campagnes, quick actions) |
| `/characters` | `CharacterList` | Liste des personnages du joueur |
| `/characters/new` | `CharacterSheet` | Création de personnage |
| `/characters/:id` | `CharacterSheet` | Édition de personnage (orchestrateur ~230 lignes) |

#### Encyclopédie / Compendium
| Route | Page | Description |
|---|---|---|
| `/bestiary` | `Bestiary` | Bestiaire (grille, filtres : famille, catégorie, environnement, taille, NC) |
| `/bestiary/:id` | `CreatureDetail` | Détail d'une créature |
| `/races` | `Races` | Liste des races |
| `/races/:id` | `RaceDetail` | Détail d'une race (lore, stats, voies, capacités) |
| `/classes` | `Classes` | Liste des classes/profils |
| `/classes/:id` | `ClassDetail` | Détail d'une classe (573 lignes) |
| `/voies` | `Voies` | Liste des voies |
| `/voies/:id` | `VoieDetail` | Détail d'une voie |
| `/capacites` | `Capacites` | Liste des capacités |
| `/capacites/:id` | `CapaciteDetail` | Détail d'une capacité |
| `/equipment` | `Equipment` | Équipement (onglets Armes/Armures/Matériel) |
| `/mounts` | `Mounts` | Montures |
| `/provisions` | `Provisions` | Provisions (onglets Nourriture/Logement) |
| `/states` | `States` | États préjudiciables |
| `/rules` | `Rules` | Règles (sidebar + 10 sections : Intro, Bases, Combat, Magie, etc.) |

#### Outils MJ (Virtual Table)
| Route | Page | Description |
|---|---|---|
| `/tools` | `Tools` | Index des outils MJ |
| `/tools/tracker` | `CombatTracker` | Suivi de Combat : ordre d'initiative COF2 (départage PJ>PNJ / PER / 1d20), tours & rounds, PV (dégâts/soins en saisie libre + ±1), import bestiaire (quantité + auto-numérotation) et PJ, états préjudiciables, persistance localStorage. Logique pure testée (`utils/combatTracker.ts`) |
| `/tools/soundboard` | `SoundboardPage` | Pistes audio personnalisables |
| `/tools/dice` | `Dice` | Lanceur de dés (mode plein écran) |
| `/campaign` | `Campaign` | Liste des campagnes (CRUD) |
| `/campaign/:id` | `CampaignDetail` | Détail campagne (quêtes, indices, sessions, notes) |

## 4. Composants Communs (17)

| Composant | Fonctionnalité |
|---|---|
| **Badge** | Badge avec variants (primary/secondary/success/warning/danger/outline) et tailles (sm/md/lg) |
| **Card** | Carte cliquable/lien avec image, hover effects, fallback SVG |
| **DiceRoller** | Lanceur de dés avec historique, formules XdY+Z, critique (20/1), popup/inline |
| **DraggableWindow** | Fenêtre déplaçable/redimensionnable (react-rnd), persistance localStorage |
| **DynamicDetailsRenderer** | Rendu de données JSON structurées (statistiques, mécaniques, options) |
| **EmptyState** | État vide avec icône, titre, message, action |
| **FilterPanel** | Panneau de filtres repliable avec compteur |
| **GlobalNotes** | Éditeur de notes persistantes (localStorage), auto-save différé |
| **GlobalSearch** | Recherche globale (Cmd+K) : créatures, capacités, profils, races, voies, règles, états, équipement |
| **ItemTable** | Tableau nom/prix |
| **PageContainer** | Conteneur max-w-6xl centré |
| **PageHeader** | Titre + icône + sous-titre + recherche + actions |
| **SearchBar** | Barre de recherche avec icône loupe |
| **Soundboard** | Pistes audio personnalisables (YouTube/URL), localStorage |
| **TabGroup** | Onglets avec rendu conditionnel |
| **Tooltip** | Infobulle au survol (portal React, themes primary/amber) |
| **EquipmentChoiceModal** | Modal de choix d'équipement de départ |

## 5. Services

- **`api.ts`** : Service REST générique (get/getAll/getOne/post/put/delete), support pagination API Platform (`hydra:member`), headers JWT
- **`AuthService.ts`** : Login (POST `/login_check`), Register (POST `/users`), logout, gestion token JWT dans localStorage
- **`dataService.ts`** : Couche d'accès centralisée (`getWeapons`, `getArmors`, `getCreatures`, `getRaces`, `getProfiles`, `getVoies`, `getCapabilities`, `getStates`, etc.)
- **`campaignService.ts`** : Mapping bidirectionnel frontend/backend pour les campagnes

## 6. State Management

L'application n'utilise **pas** Redux ou Zustand. La gestion d'état repose sur :

- **React Context** : `AuthContext` pour l'authentification (utilisateur, token, login/logout)
- **localStorage** : Token JWT (`co_auth_token`), utilisateur (`co_auth_user`), notes (`co_global_notes`), pistes audio (`co_soundboard_tracks`), suivi de combat (`co_combat_tracker`), positions fenêtres (`window_state_*`)
- **Hooks locaux** : `useState`, `useEffect`, `useMemo`, `useRef`, `useCallback` dans chaque page
- **Hooks customs** : `useSearch<T>` (filtrage), `useToggle` (toggle booléen)

## 7. Styling et Thème

- **Tailwind CSS v4** : Configuration via `@theme` dans `index.css` (pas de fichier `tailwind.config.js`)
- **Couleur primaire** : Ambre/or (hsl(35, 90%, ...)) du 50 au 900
- **Polices** : Cinzel (serif, titres) + Inter (sans-serif, corps)
- **Design system** : Glassmorphism (fond semi-transparent, blur, bordures ambre), background image `bg.png`
- **Animations** : `float`, `pulse-glow`, `fade-in`

## 8. Authentification

- **Contexte** : `AuthContext` avec `AuthProvider` englobant l'application
- **Stockage** : `localStorage` (token + utilisateur)
- **Guard** : `ProtectedRoute` redirige vers `/login` si non authentifié
- **Auto-redirect** : `LandingPage` → `/dashboard` si déjà authentifié
- **Backend** : LexikJWTAuthenticationBundle (Symfony)

## 9. Fiche Personnage (CharacterSheet.tsx)

Anciennement un god component de ~2100 lignes, désormais **refactorisé** en
orchestrateur léger + règles pures + hooks + composants présentationnels. La fiche suit le
**modèle refondu** : `character.caracs` (7 caracs = modificateurs), `character.playState`
(état de jeu opaque, piloté joueur), `character.characterVoies` (voies par IRI + rang + source).
**Aucune valeur dérivée n'est stockée** — tout est recalculé à l'affichage.

- **Règles COF2 pures** — `src/domain/rules/` (moteur COF2 découpé en modules + barrel) : ~50 fonctions sans React, couvertes par
  `cofRules.test.ts` (Vitest, ~150 tests). Outre les basiques (modificateurs, PV/PV hybrides,
  dé de récupération, chance, mana, init/déf, attaque, langues), elles incluent l'**interpréteur
  d'effets** — `resolveCapabilityEffect` + `aggregateResolvedBonuses` (résout `effect.bonuses`
  au niveau/rang : `fixed`/`rank`/`carac`/`threshold`, non-cumul §6.2) — et les dérivations
  data-driven qui itèrent `characterVoies` : `computeCombatStats` (Init/DEF depuis `effect.bonuses`),
  `resolveArmorCap` (plafond d'armure relevé par capacités), `computeDamageReduction`,
  `resolveCaracTestBonuses` (bonus aux tests, ex. tatouage), `racialGrantInfo`/`isTraitGrantValid`
  (octroi de capacité de peuple), `baseLanguages` (langues de peuple), plus les helpers d'état de
  jeu (objets magiques, états, usages, compagnons, formes, repos, substitutions).
- **Hooks** — `src/hooks/useCharacterData.ts` (chargement compendium) et
  `src/hooks/useCharacterSheet.ts` (état de formulaire, **toutes les valeurs dérivées** via
  `cofRules`, effets de synchronisation dont la préservation/purge de l'octroi `trait`).
- **Composants présentationnels** — `src/components/character/` (24 composants). Structure
  colonne gauche (`AttributesPanel`, `MainStatsPanel`, `HpByLevelEditor`) + sections repliables
  (`Section`) à droite : **Identité** (`IdentityBlock`, `PhysicalBlock`), **Rôleplay & langues**
  (`RoleplaySection`, `LanguagesTalentsPanel`), **Équipement** (`ProtectionSection`,
  `WeaponsSection`, `MasteriesBlock`, `InventorySection`, `MagicItemsPanel`), **Voies & Progression**
  (`VoiesTree` + `CapabilityNode`, `ChoicesPanel`, `RacialGrantPanel`), **En jeu** (`RestPanel`,
  `UsagesPanel`, `ActiveStatesPanel`, `CompanionsPanel`, `TransformationPanel`,
  `CaracSubstitutionsPanel`). `CharacterToolbar` en tête. Types de props partagés dans
  `character/types.ts`.

Fonctionnalités clés :

- Création et édition complète de personnage ; sélection race/profil avec familles
- Caractéristiques (valeurs = modificateurs COF), PV cumulés par niveau (hybrides fidèles),
  mana, chance, récupération, attaque/défense/initiative — **toutes dérivées**
- Voies (peuple, profil/hybride, prestige, **trait** = octroi de peuple) avec budget de points
  et plafond de 6 voies ; capacités à choix résolues (bonus aux tests, effet de combat)
- Protection avec plafond d'armure data-driven & conscient des capacités
- Bonus de combat / RD / dé évolutif dérivés depuis `Capability.effect`
- Mécaniques d'aide de table pilotées joueur (objets magiques, usages, compagnons,
  transformations, états activables, substitutions de carac, repos court/long)
- Langues de peuple, bornes physiques et maîtrises affichées en guide ; modal d'équipement de
  départ ; persistance via API

## 10. Points d'attention

- **Tests** :
  - *Unitaires* — Vitest sur les règles pures COF2 (`src/domain/rules/cofRules.test.ts`), lancés via
    `npm run test:run` (config `src/**/*.test.ts`).
  - *E2E* — suite Playwright dans `app/e2e/` : `auth.spec.ts` (inscription/connexion/déconnexion),
    `stale-token.spec.ts` (régression du fix 401 : un JWT périmé est purgé + redirige vers `/login`),
    `compendium.spec.ts` (races/classes/bestiaire chargés depuis la BDD, sans erreur API),
    `character-sheet.spec.ts` (rendu de la fiche + alimentation du sélecteur de race). Helpers partagés
    dans `e2e/fixtures.ts`, config `playwright.config.ts` (`baseURL` via `PW_BASE_URL`).
  - *Lancer les E2E* — `bash scripts/e2e.sh` depuis la racine (stack `docker compose up -d` requis + base
    seedée). Le conteneur `frontend` étant Alpine (musl) ne peut pas exécuter les navigateurs ; le script
    utilise l'image officielle `mcr.microsoft.com/playwright:vX-jammy` en `network_mode: host` pour que le
    XHR du navigateur vers l'API en dur (`http://localhost:8000/api`) atteigne nginx. Cibler un fichier :
    `bash scripts/e2e.sh e2e/stale-token.spec.ts`.
- **Fiche personnage** : `CharacterSheet.tsx` a été refactorisé (god component → orchestrateur +
  `cofRules` + hooks + `components/character/`, cf. §9)
- **Campagne** : `campaignService.ts` est désormais branché sur l'API backend (`ApiService`, persistance en base) avec mapping bidirectionnel frontend/backend — plus de `localStorage`
- **TypeScript** : Mode strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`

---
*Ce document fait partie de l'état des lieux global généré pour le projet Chroniques Oubliées Fantasy.*
