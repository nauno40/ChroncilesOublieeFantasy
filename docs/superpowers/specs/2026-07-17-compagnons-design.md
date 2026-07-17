# Design — Compagnons / invocations / montures

- **Date :** 2026-07-17
- **Statut :** design validé, prêt pour le plan d'implémentation
- **Auteur :** nauno + Claude
- **Règles de référence :** design initial `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md` §7 #1

## 1. Contexte & objectif

Troisième sous-projet de la **Phase 5**. De nombreuses capacités COF2 dotent le personnage
d'un **compagnon** au stat-block propre : monture & écuyer (chevalier), invocations (mage),
golem (forgesort), compagnon animal (druide), zombies (sorcier), familier (prestige). Ce
sous-projet fournit un **roster de compagnons** sur la fiche (aide de table), piloté par le
joueur, réutilisant le **bestiaire existant** (`Creature`, lu via `DataService.getCreatures`).

**Aligné sur la vision produit** (aide de table, suivi en séance) : le joueur suit les PV
de ses compagnons en jeu.

## 2. Périmètre & non-objectifs

**Dans le périmètre :** modèle `playState.companions` ; helper pur `companionFromCreature`
(pré-remplissage depuis une créature du bestiaire) ; UI `CompanionsPanel` (roster + suivi
PV + ajout depuis bestiaire ou custom). **Frontend uniquement** (réutilise la lecture du
bestiaire ; aucune migration).

**Hors périmètre :** le **gabarit dérivé du niveau/rang** (`scale` : « PV = 10 + niveau×6 »,
zombies du sorcier « 1 + 1 par rang 5 de voie », plafond dérivé) — demande `effect.summon`
structuré par capacité (long tail) → suivi ultérieur ; les **transformations** (#2, le PJ
*devient* la créature) = mécanique distincte ; aucun effet sur les valeurs dérivées de la
fiche du personnage (le compagnon est un stat-block séparé).

## 3. Décisions actées

| Décision | Choix | Raison |
|---|---|---|
| Source | **Piloté joueur** + pré-remplissage depuis le bestiaire (ou custom vierge) | `effect.summon` non peuplé ; self-contained, réutilise le bestiaire. |
| Gabarit dérivé | **Reporté** | Parsing de formule + `effect.summon` par capacité = long tail. |
| Effet sur la fiche | **Aucun** (roster séparé) | Un compagnon a son propre stat-block ; pas d'agrégation dans le perso. |
| Localisation | **Frontend seul** | `playState` = JSONB opaque ; lecture bestiaire déjà en place. |

## 4. Modèle (`playState`)

Ajout dans `app/src/types/character.ts` :

```ts
export interface Companion {
    name: string;
    ref?: string;                          // IRI créature bestiaire (si issu du compendium)
    hp: { current: number; max: number };
    def: number;
    init: number;
    notes?: string;
}
```

et dans `interface PlayState`, après `usages?`:

```ts
    companions?: Companion[];              // roster de compagnons / invocations / montures
```

## 5. Helper pur (`cofRules.ts`)

```ts
// Pré-remplit un compagnon depuis une créature du bestiaire (nom, PV, DEF, Init, IRI).
export const companionFromCreature = (
  c: { id?: number; name?: string; hp?: number; def?: number; init?: number },
): Companion => ({
  name: c.name ?? '',
  ref: c.id != null ? `/api/creatures/${c.id}` : undefined,
  hp: { current: c.hp ?? 0, max: c.hp ?? 0 },
  def: c.def ?? 0,
  init: c.init ?? 0,
});
```

Aucune autre dérivation : le roster n'influence aucune valeur de la fiche.

## 6. UI (`CompanionsPanel`, nouveau)

- Récupère les créatures via `DataService.getCreatures()` (même source que le Combat
  Tracker ; `useEffect` + `catch` → `[]`).
- **Ajout** : un select bestiaire (« + depuis le bestiaire » → `companionFromCreature`) et
  un bouton « + custom » (compagnon vierge).
- Chaque compagnon : **nom**, **PV `current / max`** avec boutons **−/+** (bornés
  `0..max`, `max` éditable), **DEF**, **Init**, **notes**, suppression. Indicateur visuel si
  `current <= 0` (hors combat).
- Écrit `playState.companions`. Placement : colonne équipement/jeu, style `glass-panel`.

## 7. Tests

- **Unitaires (`cofRules.test.ts`)** : `companionFromCreature` — mappe nom/PV(current=max)/
  DEF/Init, construit l'IRI depuis `id`, valeurs par défaut si champs absents.
- **Type-check / lint** : `tsc -b` 0 erreur ; lint sans nouvelle erreur (~133) ; aucun `any`.
- **E2E** : non-régression fiche (`character-sheet`) ; le panneau rend sans casser la fiche.

## 8. Migration & compatibilité

- Ajout purement additif (`companions?` optionnel) ; aucune fiche à convertir ; aucune
  migration backend (JSONB opaque).

## 9. Critères de succès

- Le joueur ajoute un compagnon (depuis le bestiaire → stats pré-remplies, ou custom),
  suit ses PV en jeu (−/+ bornés), édite DEF/Init/notes ; tout persiste dans
  `playState.companions`.
- Aucun effet sur les valeurs dérivées de la fiche ; aucune valeur dérivée persistée
  (le roster est de l'état de jeu).
- `tsc`, `vitest` et l'e2e de non-régression passent.

## 10. Suite

Autres mécaniques Phase 5 (sous-projets dédiés) : états activables (#3), substitution de
carac (#5), capacités à choix (#6), transformations (#2). Puis, en incrémental : gabarit
dérivé des compagnons (`effect.summon`) et système de repos COF2 complet.
