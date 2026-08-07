# design-sync — notes de dépôt

## Ce que ce dépôt est (et n'est pas)

Ce n'est **pas** une bibliothèque de composants : c'est une application (`app/`, `private`,
sans `main`/`exports`). Le design system est exposé par un point d'entrée créé pour ça,
`app/src/design-system/index.ts`, qui réexporte `components/common` + le fournisseur.
Ajouter une brique transverse au système = l'exporter depuis `components/common/index.ts`,
puis relancer la synchronisation.

## Chaîne de construction (cfg.buildCmd)

Deux étapes, depuis `app/` :

1. `node scripts/build-ds-css.mjs` — compile Tailwind. **Indispensable** : `src/index.css`
   n'est qu'un `@import "tailwindcss"` que rien ne résout hors de Vite. Sans cette étape,
   `[CSS_IMPORT_MISSING]` et des aperçus sans style. Le script y ajoute l'appel aux polices
   Google (Cinzel, Inter), servies à l'exécution comme dans l'application — d'où
   `[FONT_REMOTE]` au lieu de `[FONT_MISSING]`.
2. `npx tsc -p tsconfig.ds.json` — émet les déclarations dans `app/dist-types/`.
   **Indispensable aussi** : sans elles, l'extraction de props renvoie
   `[key: string]: unknown` pour les 22 composants, et l'agent de design n'a aucun contrat.

Les deux sorties sont générées, non versionnées (cf. `.gitignore`).

## Découverte des composants

Le paquet n'ayant pas de `dist` de bibliothèque, la détection automatique ne trouve rien
(`[ZERO_MATCH]`). `cfg.componentSrcMap` épingle les 22 chemins source à la main. **Un
composant ajouté à `components/common/` doit y être ajouté aussi**, sans quoi il est
absent du système sans erreur.

## Fournisseur

`cfg.provider = DesignSystemProvider` : routeur en mémoire (sans lui, tout composant
rendant un lien lève une erreur) **et** assise sombre. Le fond réel de l'application est une
image (`body { background-image: url(./assets/bg.webp) }`) que le paquet n'embarque pas ;
le fournisseur pose une couleur pleine à la place, ce qui est le bon compromis pour une
maquette.

## Known render warns

- `[FONT_REMOTE] "Inter", "Cinzel", "Cambria"` — attendu : les polices viennent de Google
  Fonts à l'exécution, comme dans l'application. « Cambria » est une valeur de repli du
  thème, jamais chargée.
- `Tooltip` — une seule cellule, et son contenu n'apparaît qu'au survol : non capturable
  statiquement. L'aperçu montre les déclencheurs, ce qui est l'état honnête.

## Aperçus non rédigés (carte plancher)

`DiceRoller`, `GlobalNotes`, `Soundboard`, `DraggableWindow`, `GlobalSearch`,
`DynamicDetailsRenderer`, `DesignSystemProvider`. Ce sont des fenêtres d'outil et des
rendus pilotés par la donnée applicative : leur composition réaliste demande un état que le
design system ne porte pas. Rédigeables à n'importe quelle re-synchronisation.

## Re-sync risks

- **Le lexique évolue** : `LEXIQUE` (`app/src/domain/lexique.ts`) est réexporté par le point
  d'entrée et cité dans `conventions.md`. Un renommage doit être répercuté dans le fichier
  de conventions, sinon l'agent de design écrit des libellés périmés.
- **`componentSrcMap` est une énumération** — par nécessité (pas de `dist`), mais elle rote :
  vérifier à chaque synchronisation que le nombre de composants annoncé correspond à
  `components/common/index.ts`.
- **Le fond de l'application n'est pas dans le paquet** (image locale). Si l'assise sombre
  du fournisseur change côté application, les aperçus divergeront sans qu'aucun contrôle ne
  le signale.
- **Node 18 en local** alors que l'application vise plus récent : la compilation Tailwind et
  `tsc` passent par le conteneur `frontend` quand c'est nécessaire.
- Version de `playwright` alignée sur le chromium déjà en cache (`chromium-1208` →
  `playwright@1.58.2`). Un cache différent impose de réaligner.
