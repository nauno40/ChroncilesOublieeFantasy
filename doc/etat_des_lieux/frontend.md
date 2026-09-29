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
│   ├── character/                # 25 composants de la fiche personnage (cf. §9)
│   ├── common/                   # 26 composants partagés
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
├── pages/                        # 41 pages (voir section 3)
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

## 3. Routes et Pages (41 pages)

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
| `/characters/new` | `CharacterCreationWizard` | Création de personnage — assistant pas-à-pas (2026-09) |
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

## 4. Composants Communs (26)

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
  `cofRules.test.ts` (Vitest, 147 tests). Outre les basiques (modificateurs, PV/PV hybrides,
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
- **Composants présentationnels** — `src/components/character/` (25 composants). Structure
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

### 9.1 Assistant de création pas-à-pas (`CharacterCreationWizard.tsx`, 2026-09)

Inspiré d'un créateur de personnage tiers jugé « stylé » par l'utilisateur (parcours guidé en
chapitres, fiche en direct sur le côté, portraits par choix). `characters/new` charge désormais
`src/pages/CharacterCreationWizard.tsx` (édition d'un personnage existant, `characters/:id`,
inchangée — toujours `CharacterSheet.tsx`).

Appelle `useCharacterSheet`/`useCharacterData` **une seule fois**, exactement comme
`CharacterSheet.tsx`, et répartit leur retour entre 8 étapes (`src/components/character/wizard/
steps/`) qui **réutilisent verbatim** les panneaux existants (`VoiesTree`, `AttributesPanel`,
`ProtectionSection`…) — aucun changement dans `useCharacterSheet.ts` ni dans les panneaux
eux-mêmes. Étape courante portée par `?step=` (`useWizardStep`, retour navigateur/rafraîchissement
gérés), verrouillage des étapes non atteintes (`WizardStepBar`), mini-fiche en direct
(`WizardSummaryDrawer`).

Seul changement de fond : la cascade d'équipement de départ déclenchée au choix du profil
(reset armes/protection, résolution `startingEquipment`, bourse 2d6, sac d'aventurier) était
écrite en ligne dans `IdentityBlock.tsx` — extraite en fonction pure partagée,
`src/domain/characterCreation.ts::applyProfileSelection`, appelée par `IdentityBlock.tsx`
(fiche classique) et `StepProfile.tsx` (assistant), pour ne pas dupliquer ~50 lignes de règle
entre les deux. Comportement inchangé, couvert par `characterCreation.test.ts`.

Non-régression vérifiée manuellement (le hook a un historique de bug sur ce point précis, cf.
son commentaire lignes 316-328) : race A → profil → race B → profil → race A de nouveau, à
l'étape Voies l'héritage racial et les 5 voies de profil s'échafaudent correctement sans
doublon ni entrée obsolète — confirmé en base (`character_voie`) après sauvegarde.

**Habillage « parchemin » (2026-09, phase 2)** — scopé à cette seule page (pas de mode
clair global, pas d'interrupteur) : classe `.parchment` posée sur le conteneur racine de
`CharacterCreationWizard.tsx` (`index.css`). Plutôt que de modifier les ~70 classes Tailwind
écrites en dur dans les panneaux réutilisés (`bg-stone-900/40`, `text-stone-400`,
`border-white/10`, `glass-panel`…), la classe **redéfinit les variables CSS** dont ces
utilitaires dépendent (`--color-stone-50…950`, `--color-white`, les variables de
`.glass-panel`) — vérifié dans le CSS généré : Tailwind v4 compile chaque teinte en
`color-mix(in oklab, var(--color-stone-900) …)`, une variable et non une valeur figée. Tout
composant sous `.parchment`, réutilisé ou non, se reskinne donc automatiquement, sans
qu'aucun fichier de panneau n'ait été touché. `--font-body` bascule sur EB Garamond (Google
Font ajoutée) ; `--font-display` (Cinzel) et la teinte d'accent `primary` (ambre/or)
inchangés. Seul ajustement ponctuel : `text-primary-50/100/200` (texte très pâle, illisible
sur fond clair — ex. `EquipmentChoiceModal`) recoloré en encre ambrée sombre, sous
`.parchment` uniquement. Le reste de l'appli (dashboard, compendium, fiche classique
`/characters/:id`) reste au thème sombre, vérifié inchangé.

**Refonte structurelle (2026-09, phase 3)** — retour utilisateur après la phase 2 : « moche
et pas pratique », le site de référence restant nettement plus proche de l'objectif. La
comparaison directe (capture à sa largeur réelle, ~392px, colonne unique même en grand
écran) a montré que l'écart n'était pas la couleur mais la structure : mise en page large à
deux colonnes avec fiche récapitulative toujours visible, panneaux de la fiche classique
réutilisés tels quels (arbre de 5 rangs × 6 voies, tableau d'armes façon tableur) — une
interface de référence recolorée, pas une expérience guidée redessinée. Deux changements :

- **Colonne unique resserrée** (`max-w-2xl`, était `max-w-6xl`) : `WizardShellLayout`
  empile désormais portrait/narratif au-dessus du contenu de l'étape (était côte à côte,
  grille 5/7 colonnes) ; la fiche récapitulative n'est plus une colonne permanente mais un
  panneau coulissant (`WizardCharacterSheetOverlay`, nouveau) ouvert par une icône dans
  l'en-tête — `WizardSummaryDrawer` a perdu son repli mobile interne, devenu inutile.
- **Étapes Voies et Équipement reconstruites** pour l'assistant, seules étapes où la fiche
  classique était vraiment dense :
  - `WizardVoiesPicker.tsx` (nouveau) remplace `VoiesTree` à cette étape. À la création
    (niveau 0), seul le rang 1 des voies de profil est en jeu — le rang 2 exige le niveau 2
    (niveau 1 pour un mage), les rangs 3-5 un niveau que la création n'atteint jamais
    (COF2 Progression) ; afficher les 5 rangs × 6 voies (fiche classique) n'y montre donc
    que du bruit. Le nouveau composant n'affiche que ce qui est jouable — rang 1 par voie de
    profil, rang 2 seulement pour les mages (bonus gratuit) — en réutilisant directement
    `canAcquireRank`/`rankUnlockLevel` (`domain/rules`), sans reprendre le JSX de `VoiesTree`.
  - `WizardEquipmentSummary.tsx` (nouveau) remplace, à cette étape, `WeaponsSection` (tableau
    éditable 12 colonnes) + `MasteriesBlock` + `InventorySection` par une liste en lecture
    seule de ce que la cascade de départ (`applyProfileSelection`) a déjà posé. `ProtectionSection`
    (déjà compact, vraie décision) et `ArmorImpactPanel` (conséquences de cette décision,
    déjà auto-masqué si rien à signaler) restent inchangés à cette étape.
- **Zéro changement** dans `useCharacterSheet.ts` ni dans les panneaux partagés avec la
  fiche classique (`VoiesTree.tsx`, `WeaponsSection.tsx`, `ArmorImpactPanel.tsx`,
  `MasteriesBlock.tsx`, `InventorySection.tsx`, `AttributesPanel.tsx`…) : `CharacterSheet.tsx`
  continue de les utiliser tels quels.

**Bug trouvé en vérifiant dans un vrai navigateur** (pas visible en test, ni sur l'ancien
`EquipmentChoiceModal`, centré donc indifférent au symptôme) : `WizardCharacterSheetOverlay`,
rendu en place, se retrouvait descendant du `<main>` scrollable du layout applicatif
(`overflow-y-auto`) — ce moteur de rendu rogne un descendant `position: fixed` à la boîte de
cet ancêtre au lieu du viewport, alors même qu'aucun ancêtre ne crée de contexte
d'empilement au sens strict de la spec CSS (aucun `transform`/`filter`/`opacity<1` sur la
chaîne, vérifié élément par élément). Un panneau ancré en haut (titre + bouton fermer) s'en
trouvait invisible, caché sous la barre d'appli mobile. Corrigé en portant l'overlay vers
`document.body` (`createPortal`, comme tout modal React robuste), avec `.parchment` reposé
sur la racine portée puisque les variables CSS qu'elle redéfinit ne descendent pas jusqu'à
`document.body`.

Vérifié : build + suite Vitest (664 tests) + `tsc -b` sans erreur + **vrai navigateur sur la
vraie pile Docker** (`dockerd` relancé manuellement dans WSL2 — installation documentée dans
le kanban du projet, pas persistante après un redémarrage). Parcours complet Nain/Guerrier
avec choix d'équipement,
un rang de voie acquis via `WizardVoiesPicker` (« Points restants » 2→1 confirmé), sauvegarde
réussie, relecture sur `CharacterSheet.tsx` (`/characters/26`) : rang de voie et armes/armure
identiques à ce que l'assistant avait posé — non-régression sur le point historiquement
fragile de `useCharacterSheet.ts` confirmée une fois de plus.

**Habillage visuel (2026-09, phase 4)** — la phase 3 corrigeait la structure (colonne unique,
fiche en overlay, étapes simplifiées) mais retour utilisateur après comparaison directe avec
la référence, capture à capture : « moche, le site que tu m'as montré est bcp mieux fini ».
Le vrai écart cette fois : pas la structure, la **finition visuelle**. Concrètement, contre
Lands of Evershade à sa vraie largeur :
- Chrome applicatif (en-tête, barre de nav basse, bouton outils flottant) visible en
  permanence autour de l'assistant → cassait l'illusion « page de livre » que la référence
  n'a pas du tout (site à page unique, sans habillage).
- Typographie « jeu vidéo » (titres en dégradé or brillant `text-gradient-gold`, tout en
  majuscules grasses très espacées) contre la sobriété quasi-littéraire de la référence
  (petites capitales discrètes, encre sombre plate, pas de lueur).
- Barre d'étapes en pastilles encadrées contre une simple ligne de chiffres romains
  soulignés.
- Bouton d'action en pilule ambre brillante contre une petite pilule encre sombre discrète.
- Portraits encadrés (rectangle à bordure + anneau) contre une illustration qui se fond
  directement dans la page, sans cadre visible.
- Sélecteur de peuple/profil en grille de cartes contre un bandeau de médaillons ronds.

Corrections, dans l'ordre d'impact :
1. **Chrome masqué sur l'assistant** — `Layout.tsx` calcule `immersive = pathname ===
   '/characters/new'` et n'affiche l'en-tête/la sidebar/la nav basse/le FAB que si `false` ;
   `<main>` perd son padding réservé à ce chrome sur cette route. Le reste de l'appli
   (vérifié : `/characters`, `/characters/:id`) est inchangé.
2. **`.parchment` plein cadre** — n'est plus une carte flottante (`rounded-3xl` + ombre) mais
   couvre tout le viewport comme une vraie page ; l'ancien traitement « carte » est conservé
   sous `.parchment-panel` pour `WizardCharacterSheetOverlay`, qui en a encore besoin (panneau
   posé par-dessus le reste). Un grain de papier (filtre SVG `feTurbulence` encodé en donnée,
   pas un fichier image) casse l'à-plat de couleur.
3. **Typographie et boutons restreints** — `text-gradient-gold` retiré des titres d'étape
   (`StepWelcome`, `StepReview`) au profit d'un encre sobre ; `WizardStepBar` réécrit en
   ligne de chiffres romains soulignés (plus de pastilles) ; boutons Précédent/Suivant de
   `WizardShellLayout` réduits à un lien texte et une petite pilule encre sombre. Piège
   trouvé en vérifiant en navigateur : la rampe `--color-stone-*` de `.parchment` est
   **inversée** (950 = crème clair, 50 = encre la plus sombre, cf. phase 2) — utiliser
   `text-stone-800` pour du texte « sombre » donne en fait un texte quasi illisible, trop
   clair ; toutes les nouvelles classes de cette passe utilisent `stone-100/200/300` pour le
   texte principal et `stone-500` pour les libellés discrets, jamais l'inverse.
4. **Portraits fondus** — nouvelle classe utilitaire `.portrait-feather` (`mask-image` radial
   dégradé vers transparent) posée sur les images de `StepRace`/`StepProfile` : aucun nouvel
   asset, seul le canal alpha de rendu de l'image existante est modulé.
5. **Bandeau de médaillons** — nouveau `WizardAvatarStrip.tsx` (médaillons ronds, anneau +
   coche sur la sélection) remplace la grille de cartes rectangulaires dans `StepRace.tsx`/
   `StepProfile.tsx`.

Vérifié : build + `tsc -b` + suite Vitest (664 tests) sans erreur + vrai navigateur sur la
vraie pile Docker, parcours complet (Bienvenue → Race → Profil avec choix d'équipement →
Voies → Caractéristiques → Équipement), desktop et mobile (375px). Reste de l'appli
(`/characters`, fiche classique `/characters/:id`) vérifié inchangé — chrome applicatif et
thème sombre intacts.

**Contraste jaune/orange sur crème (même jour, retour immédiat)** — l'argent (po/pa/pc) de
`ProtectionSection`, le panneau « Sous l'armure » d'`ArmorImpactPanel` et le libellé « Rang N »
actif de `CapabilityNode` utilisent des teintes Tailwind directes (`text-yellow-500`,
`text-amber-200/300`) ou `primary-300/400` — conçues pour ressortir sur fond sombre, quasi
illisibles sur crème (un jaune/orange vif sur beige, comme n'importe où ailleurs). Même
technique que pour `stone`/`white` (phase 2) : ces utilitaires compilent aussi en
`color-mix(in oklab, var(--color-xxx) …)` (vérifié dans le CSS généré), donc `.parchment`
redéfinit `--color-primary-50..400`, `--color-amber-200/300` et `--color-yellow-500` vers des
encres sombres — `primary-500` et au-delà restaient déjà assez sombres, non touchés. Remplace
l'ancien correctif ponctuel de la phase 2 (`.parchment .text-primary-50/100/200 { color: … }`),
qui ne couvrait ni les bordures/fonds ni les variantes d'opacité (`/70`, `/80`…) — redéfinir la
variable couvre tout d'un coup, sans toucher aux composants partagés (`CapabilityNode`,
`ArmorImpactPanel`, `ProtectionSection`), inchangés hors `.parchment` (vérifié sur la fiche
classique, toujours en jaune/ambre vif sur fond sombre). Vérifié : build + suite Vitest (664
tests) + vrai navigateur (étapes Voies et Équipement, fiche classique en comparaison).

## 10. Points d'attention

- **Écart types ↔ API** : `node scripts/audit-types-api.mjs [url]` confronte
  `types/normalized.ts` aux charges utiles réellement servies. Un champ **déclaré mais
  jamais servi** autorise une lecture qui ne peut pas aboutir — c'est ainsi que le
  bestiaire avait disparu de la recherche globale (`name[0].value`, forme d'export
  abandonnée) et que l'armure affichait un `defense` qui n'existe que sur une forme
  dérivée. Au dernier passage : **32 champs** dans ce cas. Avant de conclure au code mort,
  vérifier la donnée : une base de développement périmée produit le même symptôme (les
  déclarations d'états des capacités n'étaient absentes que parce que les fixtures
  n'avaient jamais été rechargées).

- **Tests** :
  - *Unitaires* — Vitest : **576 tests, 42 fichiers**, lancés par `npm run test:run` (config
    `src/**/*.test.ts`). Le gros porte sur `src/domain/` — les 25 modules de `rules/` (test COF2 et
    dés bonus/malus, combat, dommages et RD, encombrement, tir à distance, options tactiques,
    magie et brûlure de mana, poisons, dangers, voyage, types de créature…) plus `combatTracker`,
    `encounters`, `magicItems`, `compendium`, `lexique` et les adaptateurs de feuilles.
  - *E2E* — suite Playwright dans `app/e2e/` : `auth.spec.ts` (inscription/connexion/déconnexion),
    `stale-token.spec.ts` (régression du fix 401 : un JWT périmé est purgé + redirige vers `/login`),
    `compendium.spec.ts` (races/classes/bestiaire chargés depuis la BDD, sans erreur API),
    `character-sheet.spec.ts` (rendu de la fiche + alimentation du sélecteur de race),
    `character-voies.spec.ts` / `character-mechanics.spec.ts` (voies, dérivations), `campaign-*.spec.ts`
    (rattachement d'un PJ, rencontres, renommage), `custom-monsters.spec.ts`, `password-reset.spec.ts`,
    `bibliotheque.spec.ts` (voie communautaire et ses capacités imbriquées, déclaration d'état cliquable,
    retour contextuel), `printable-sheet.spec.ts` (sections de la fiche imprimable, coût des sorts sous
    l'armure) et `global-search.spec.ts` (les huit familles de contenu restent indexées — le bestiaire
    en était sorti sans bruit pendant des mois), `tracker-etats.spec.ts` et `dice-test.spec.ts`
    (états cumulés, dommages avec RD, rendement décroissant, jet de résistance et dé bonus),
    `creature-sheet.spec.ts`, `iso-listes.spec.ts`, `play-mode.spec.ts`, `accessibilite.spec.ts`.
    **20 fichiers, 76 tests.** Helpers partagés dans `e2e/fixtures.ts`, config
    `playwright.config.ts` (`baseURL` via `PW_BASE_URL`).
  - *Règles apprises à leurs dépens* : ne jamais écrire en dur un nom de donnée de démonstration
    (les fixtures changent — un test doit lire les siennes depuis l'API) ; ne jamais viser `.first()`
    dans une liste où le test vient d'ajouter un élément (il désignait une entrée préexistante) ;
    et **ne jamais viser un élément par sa position dans le DOM**. « Le premier `<select>` de la
    page est celui de la race » était vrai sur un poste et faux sur un runner, où un autre
    sélecteur se glissait devant selon l'ordre d'arrivée des données. Viser par libellé
    (`getByLabel`) — ce qui suppose que les champs en aient un, d'où `accessibilite.spec.ts`.
  - *Rendre un échec lisible* : les journaux et artefacts d'un runner ne sont pas consultables
    sans droits d'administration. Une assertion E2E doit donc **emporter son diagnostic** dans son
    message (ce que l'élément portait, pas seulement « attendu : pas vide »), et le job publie les
    échecs en annotations `::error::`, seul canal lisible sans jeton.
  - *Toujours vérifier par `npm run build`*, jamais par `vite build` seul : Vite transpile **sans
    type-vérifier**, et trois erreurs de typage ont ainsi atteint `master`.
  - *Lancer les E2E* — `bash scripts/e2e.sh` depuis la racine (stack `docker compose up -d` requis + base
    seedée). Le conteneur `frontend` étant Alpine (musl) ne peut pas exécuter les navigateurs ; le script
    utilise l'image officielle `mcr.microsoft.com/playwright:vX-jammy` en `network_mode: host` pour que le
    XHR du navigateur vers l'API atteigne nginx. Cibler un fichier :
    `bash scripts/e2e.sh e2e/stale-token.spec.ts`. L'URL d'API des appels de préparation vient de
    `API_URL` (`e2e/fixtures.ts`), surchargeable par `PW_API_URL` quand nginx n'est pas publié sur 8000 :
    `PW_API_URL=http://localhost:8001/api bash scripts/e2e.sh`.
- **Fiche personnage** : `CharacterSheet.tsx` a été refactorisé (god component → orchestrateur +
  `cofRules` + hooks + `components/character/`, cf. §9)
- **Campagne** : `campaignService.ts` est désormais branché sur l'API backend (`ApiService`, persistance en base) avec mapping bidirectionnel frontend/backend — plus de `localStorage`
- **TypeScript** : Mode strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`

---
*Ce document fait partie de l'état des lieux global généré pour le projet Chroniques Oubliées Fantasy.*
