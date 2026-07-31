# Iso officiel ↔ communautaire — design

> Chantier 1 sur 3 issus du retour du 31/07/2026. Chantiers suivants : **formulaires**
> (grand format, mobile, image, validation par catégorie) puis **création imbriquée**
> (voie → capacités → invocations/états).

## Problème

Le contenu communautaire n'a pas la même tête que l'officiel, alors qu'il vit dans les
mêmes pages de compendium. Constats vérifiés dans le code :

| Point | Officiel | Communautaire |
|---|---|---|
| Barre de recherche | composant partagé `SearchBar` (icône 20, `py-3`, bordure ambre, `rounded-xl`) | `<input>` maison dans `HomebrewBrowser` (`py-2.5`, `pl-9`, `text-sm`, bordure blanche) |
| Compteur de résultats | sous-titre « 8 races trouvées » | absent |
| Fiche de détail | `RaceDetail` 368 lignes : héros avec image de fond masquée, grille 12 colonnes, panneau « Statistiques vitales », onglets lore/règles, sections voies & capacités | `HomebrewDetail` 156 lignes, rendu générique commun à toutes les catégories |

Les listes ont déjà été alignées (PR #138 tableaux, #139 images, #140 style de cartes,
#141 états/objets). Restent l'en-tête de liste et **les fiches de détail**.

## Périmètre

**Dans le périmètre**

- Barre de recherche et compteur des onglets Communauté / Mes créations.
- Fiches de détail **iso** pour les 5 catégories qui ont une fiche officielle riche :
  `race`, `classe`, `voie`, `capacite`/`sort`, `creature`.
- Un seul delta visuel autorisé côté communautaire : bandeau propriétaire
  (auteur, visibilité) et actions de possession (Dupliquer / Modifier / Supprimer).

**Hors périmètre** (décisions prises)

- Les 6 catégories sans fiche officielle (`poison`, `piege`, `etat`, `equipement`,
  `objet-magique`, `autre`) **gardent la fiche générique actuelle** : elle apporte
  l'auteur, la duplication et les champs structurés, que les tableaux officiels n'ont pas.
  On ne crée pas de fiche officielle pour elles dans ce chantier.
- Les filtres propres à certaines pages officielles (dé de vie / magie sur Classes,
  type / classe sur Voies) ne sont **pas** répliqués dans les onglets communautaires :
  peu d'entrées, champs `data` optionnels, gain nul aujourd'hui. Recherche + compteur suffisent.
- Ergonomie des formulaires et création imbriquée : chantiers 2 et 3.

## Architecture

### Principe

Chaque page officielle riche est scindée en deux :

1. un **composant de présentation pur** (« feuille ») dans `app/src/components/sheets/`,
   sans fetch ni routeur, alimenté par un view-model normalisé ;
2. la **page**, réduite à : charger les données → mapper vers le view-model → rendre la feuille.

`HomebrewDetail` fait exactement la même chose depuis `entry.data`, et pose en plus le
bandeau propriétaire. Une retouche visuelle profite donc aux deux sources par construction.

```
components/sheets/
  RaceSheet.tsx        ← rendu d'une race     (VM: RaceSheetVM)
  ProfileSheet.tsx     ← rendu d'une classe   (VM: ProfileSheetVM)
  VoieSheet.tsx        ← rendu d'une voie     (VM: VoieSheetVM)
  CapaciteSheet.tsx    ← rendu d'une capacité (VM: CapaciteSheetVM)
  OwnerBar.tsx         ← delta communautaire
  adapters/
    fromRace.ts / fromProfile.ts / fromVoie.ts / fromCapacity.ts   ← entité API → VM
    fromHomebrew.ts                                                 ← entry.data → VM
```

### View-models

Tous les champs sont **optionnels sauf `name`** : une entrée communautaire est
partiellement remplie, et la feuille doit se dégrader proprement (section masquée si vide,
jamais de « — » ni de bloc vide). Les clés reprennent celles des schémas homebrew
(`services/homebrewSchemas.ts`) pour que l'adaptateur homebrew soit une simple projection.

```ts
interface RaceSheetVM {
    name: string;
    description?: string;
    image?: string;                       // sinon placeholder générique (initiale)
    modifiers?: Record<string, number>;   // AGI/CON/FOR/PER/CHA/INT/VOL
    speed?: string;
    minHeight?: number; maxHeight?: number;
    minWeight?: number; maxWeight?: number;
    startingAge?: number; lifeExpectancy?: number;
    abilities?: string;                   // onglet Règles
    physicalTraits?: string; publicPerception?: string;
    roleplay?: string; typicalNames?: string; detailedDescription?: string;  // onglet Lore
    voies?: { id?: string; name: string }[];   // liens si entité officielle, texte sinon
}

interface ProfileSheetVM {
    name: string; description?: string; image?: string;
    family?: string; hitDie?: string; magicStat?: string; armorMaxDef?: number;
    stats?: Record<string, number>;
    weaponsAuth?: string[]; armorAuth?: string[];
    startingEquipment?: string[]; masteries?: string[];
    note?: string; lore?: string[];
    voies?: { id?: string; name: string }[];
}

interface VoieSheetVM {
    name: string; description?: string;
    category?: string;                    // profil / peuple / prestige / créature
    maxRank?: number;
    profileName?: string;
    capabilities?: { rank?: number; name: string; description?: string; isSpell?: boolean }[];
}

interface CapaciteSheetVM {
    name: string; description?: string;
    rank?: number; actionType?: string; isSpell?: boolean; limited?: boolean;
    effect?: string[]; details?: string[];
    voieName?: string;
}
```

Les créatures sont déjà servies par un couple page/formulaire dédié
(`CreatureDetail` / `CustomMonsters`) partageant le même rendu : elles sont **vérifiées**
dans ce chantier, pas réécrites, sauf écart constaté.

### Delta communautaire

`OwnerBar` — unique composant portant la différence :

- avatar auteur + pseudo (`AuthorTag` existant) et badge de visibilité ;
- actions selon la possession : *Dupliquer chez moi* (contenu d'autrui) ou
  *Modifier* / *Supprimer* (mes créations).

Rendu au-dessus de la feuille, jamais à l'intérieur. Aucune autre divergence n'est admise.

## Découpage en PR

| PR | Contenu | Vérification |
|---|---|---|
| 1 | `HomebrewBrowser` : `SearchBar` partagé + sous-titre-compteur, au même emplacement que l'officiel | Mesures Playwright : mêmes hauteur, rayon, bordure et police d'input entre les 3 onglets |
| 2 | `RaceSheet` + `ProfileSheet` + adaptateurs ; `RaceDetail` et `ClassDetail` réduites à charger/mapper/rendre ; `HomebrewDetail` les utilise pour `race` et `classe` | Captures officiel vs communautaire pour une race et une classe ; sections vides bien masquées |
| 3 | `VoieSheet` + `CapaciteSheet` + adaptateurs, même bascule pour `VoieDetail`, `CapaciteDetail` et `HomebrewDetail` | Idem sur une voie et une capacité ; vérification du cas « voie sans capacité » |
| 4 | `OwnerBar` extrait et posé sur toutes les fiches communautaires ; contrôle du couple créature | Le delta se limite au bandeau ; audit visuel des 5 catégories |

Chaque PR passe les portes habituelles : `tsc -b` 0, `eslint` sans nouvelle erreur,
`vitest` vert, vérification desktop **et** mobile (0 débordement, 0 erreur console).

## Tests

- **Unitaires (Vitest)** sur les adaptateurs : une entité officielle et une entrée
  homebrew partiellement remplie produisent un VM conforme ; les champs absents restent
  `undefined` (jamais `null`, `""` ni `0` par défaut, qui afficheraient des sections vides).
- **Rendu** : pour chaque feuille, un test montant le composant avec un VM complet puis
  un VM minimal (`{ name }`) — le second ne doit produire aucune section vide ni crash.
  C'est le garde-fou anti-régression de l'iso.
- **Visuel** : captures Playwright officiel vs communautaire à chaque PR.

## Risques

- **Régression visuelle sur les pages officielles** : elles sont réécrites autour des
  feuilles. Mitigation — extraction sans retouche de style (déplacement du JSX tel quel),
  capture avant/après sur chaque page officielle touchée.
- **VM trop pauvre pour l'officiel** : une entité officielle porte des champs que le
  homebrew n'a pas (relations, IRI). Mitigation — le VM est le sur-ensemble ; l'adaptateur
  homebrew laisse simplement les champs manquants à `undefined`.
- **Tentation de diverger** : la prochaine demande spécifique au communautaire poussera à
  ajouter une condition dans la feuille. Règle — tout delta passe par `OwnerBar`.
