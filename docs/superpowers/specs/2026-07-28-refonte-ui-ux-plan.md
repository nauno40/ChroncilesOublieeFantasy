# Refonte UI/UX — plan détaillé

**But** : des interfaces propres, cohérentes et **renouvelées pour affirmer le côté « compendium communautaire »**. L'app a un bon thème (sombre + or + texture runique) mais chaque écran réinvente ses composants → effet patchwork ; l'identité et les affordances communautaires sont faibles.

## Principes directeurs

1. **Communauté d'abord** : le contenu partagé, les auteurs et la découverte sont visibles et valorisés, pas juste tolérés.
2. **Un seul langage** : mêmes en-têtes, mêmes cartes, mêmes filtres, mêmes états (vide/chargement/erreur) partout.
3. **Propre & aéré** : hiérarchie typographique nette, espace maîtrisé, moins de « bric-à-brac ».
4. **Zéro régression** : refonte visuelle, on ne casse pas les flux existants (compendium unifié, campagnes, fiches).

## Partie A — Design system (fondations réutilisables)

Composants partagés dans `app/src/components/ui/` (ou `common/`), remplaçant les variantes ad hoc :

1. **`PageShell` / en-tête de page unifié** : titre + sous-titre + zone d'actions + (optionnel) barre de filtres source + recherche. Remplace : `PageHeader`, l'en-tête géant du Bestiaire, la barre d'onglets nue de `CompendiumType`. Règle : **une seule tête de page** par écran (fin du « onglets source au-dessus d'un 2e titre »).
2. **`ContentCard`** : langage de carte unique (miniature/icône, titre, méta, badges, actions). Décliné : carte compendium (image), carte homebrew, carte perso, carte campagne — mêmes rayons, ombres, hovers, densité.
3. **`SourceTabs`** : Officiel / Communauté / Mes créations — style segmenté cohérent, intégré à `PageShell`.
4. **`AuthorTag`** : avatar (initiale colorée déterministe) + pseudo + badge visibilité. Utilisé sur toute carte/fiche communautaire.
5. **`Badge` / `Chip`** : catégories, rareté, NC, statut — palette et tailles normalisées.
6. **`EmptyState`, `LoadingState`, `ErrorState`** : uniformes (icône + message + action).
7. **Tokens** : espacements, rayons, tailles de titre — documentés dans `index.css` (`@theme`) et respectés.

## Partie B — Écran par écran

### B1. Entrée / identité
- **Landing** (`LandingPage`) : ré-axer le discours sur **le compendium communautaire** (« créez, partagez et piochez races/classes/sorts/monstres de toute une communauté ») + gestion de table. Remplacer le **placeholder dégradé** par un vrai visuel (capture stylisée d'une fiche/compendium, ou une composition thématique). Stats : ajouter « X créations partagées ». CTA clairs.
- **Login / Register / mot de passe** : harmoniser sur `PageShell` léger + le fond compressé ; cohérence des champs/erreurs.

### B2. Dashboard (`Home`) — refonte forte
Passer de « compteurs officiels statiques » à un **tableau de bord perso + communauté** :
- **Reprendre** : dernière campagne / dernier perso joué.
- **Mon contenu** : mes campagnes, mes personnages (aperçus cliquables), mes créations (compte + accès).
- **Communauté** : dernières créations partagées (avec `AuthorTag`), accès « découvrir ».
- **Actions rapides** : Nouveau perso / Nouvelle campagne / Créer du contenu / Lancer un combat.
- Corriger les **labels périmés** (Bestiaire→Créatures ; « 1000+ » → chiffres réels ou tournure « des centaines »).

### B3. Compendium (toutes les pages de type)
- Appliquer `PageShell` + `SourceTabs` : **une seule tête de page** (le titre du type + les onglets source), la page officielle perd son `PageHeader` en double.
- **Uniformiser les cartes** officielles vs custom via `ContentCard` (même gabarit ; l'image quand elle existe, une illustration/initiale sinon).
- **Onglet Communauté enrichi** : `AuthorTag` visibles, tri (récent/populaire), et mise en avant « découverte ».
- Fiches de détail (officielles + `HomebrewDetail`) : harmoniser l'en-tête (retour, titre, méta, onglets) sur un même gabarit.

### B4. Ma table (perso)
- **Liste de campagnes / personnages** : `ContentCard` unifiées, méta claires (niveau, peuple/profil, membres), états vides soignés.
- **Détail de campagne** : déjà riche ; passage à `PageShell` + normalisation des sous-sections (Quêtes/Indices/Séances/Personnages/Rencontres) sur un même style de panneau.
- **Fiche de personnage** : déjà propre ; alignement fin sur les tokens (titres, espacements) + cohérence des champs.

### B5. Table de jeu (outils)
- **Combat Tracker / Dés / Ambiances** : `PageShell` + cohérence visuelle des contrôles ; le tracker garde sa densité mais harmonise cartes de combattants.

### B6. Formulaires
- **Création homebrew** (modale) : conserver la modale pour l'édition rapide, mais fiabiliser la hiérarchie (sections, `HomebrewFields` groupés Lore/Règles comme la fiche), et un style de champ commun (labels, focus, aide).
- Champs partout : un style d'input/select/textarea unique (déjà proche, à normaliser).

## Partie C — Phasage (chaque phase = livrable vérifiable)

1. **Phase 1 — Design system** : créer `PageShell`, `ContentCard`, `SourceTabs`, `AuthorTag`, états. Migrer **2 écrans pilotes** (une page compendium + la liste de personnages) pour prouver le système. Gates + captures desktop/mobile.
2. **Phase 2 — Dashboard** perso+communauté (+ correction des labels périmés).
3. **Phase 3 — Compendium** : migrer toutes les pages de type sur `PageShell`/`SourceTabs`/`ContentCard` ; onglet Communauté enrichi ; en-têtes de fiches harmonisés.
4. **Phase 4 — Ma table & Outils** : campagnes, détail campagne, fiche perso, tracker/dés/ambiances.
5. **Phase 5 — Landing & auth** : vitrine communautaire + visuel + pages d'auth.
6. **Phase 6 — Passes de finition** : états vides/erreurs, micro-cohérences, accessibilité (focus), mobile.

## Invariants / garde-fous
- Pas de nouvelle dépendance UI lourde ; on reste Tailwind v4 CSS-first (thème dans `index.css`).
- Vérif systématique **desktop + mobile** (viewport 390) + `overflow-x` 0 + 0 erreur console à chaque phase ; `tsc`/`lint`/`vitest` verts.
- On documente les composants du design system (props) en tête de fichier.
