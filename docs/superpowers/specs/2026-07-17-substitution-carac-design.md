# Design — Substitution de caractéristique (attaques)

- **Date :** 2026-07-17
- **Statut :** design validé, prêt pour le plan d'implémentation
- **Auteur :** nauno + Claude
- **Règles de référence :** design initial `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md` §7 #5

## 1. Contexte & objectif

Quatrième sous-projet de la **Phase 5**. Certaines capacités COF2 **substituent une
caractéristique** dans un calcul : moine (VOL au lieu de FOR aux attaques/DM au contact),
druide (magie basée sur PER), parade en AGI, etc. Ce sous-projet permet au joueur de
choisir quelle caractéristique alimente ses **valeurs d'attaque contact / distance**,
rebranchant la dérivation existante sans dépendance au compendium (`effect.caracSubstitution`
non peuplé — long tail).

## 2. Périmètre & non-objectifs

**Dans le périmètre :** modèle `playState.caracSubstitutions` (contact/distance) ; helper
pur `attackCarac` ; branchement dans `MainStatsPanel` (les deux attaques affichées) ; UI
`CaracSubstitutionsPanel`. **Frontend uniquement**.

**Hors périmètre :** substitution de l'**attaque magique** (non affichée sur la fiche
aujourd'hui) et des **DM** (saisie libre par arme) — à traiter quand ces affichages
existeront ; la **parade en AGI** (la DEF utilise déjà AGI, §5 dérivation) ; l'auto-
dérivation depuis `Capability.effect.caracSubstitution` (structuration incrémentale) ;
aucune autre valeur dérivée touchée.

## 3. Décisions actées

| Décision | Choix | Raison |
|---|---|---|
| Source | **Piloté joueur** (le joueur choisit la carac par attaque) | `effect.caracSubstitution` non peuplé ; self-contained. |
| Cibles | **Attaque contact + distance** | Seules attaques affichées (`MainStatsPanel`) ; magie/DM reportés. |
| Câblage | **Résolution dans `MainStatsPanel`** via un helper pur | Les fonctions pures (`attackValue`) restent inchangées ; un seul point de résolution. |
| Défauts | contact = FOR, distance = AGI (COF2) | Comportement actuel préservé quand aucune substitution. |
| Localisation | **Frontend seul** | `playState` = JSONB opaque, aucune migration. |

## 4. Modèle (`playState`)

Ajout dans `app/src/types/character.ts` (`PlayState`), après `companions?` :

```ts
    // Substitution de caractéristique par attaque (COF2 §7 #5). Absent ⇒ défauts FOR/AGI.
    caracSubstitutions?: { contact?: CaracKey; distance?: CaracKey };
```

(`CaracKey` existe déjà : `'AGI'|'CON'|'FOR'|'PER'|'CHA'|'INT'|'VOL'`.)

## 5. Helper pur (`cofRules.ts`)

```ts
// Résout la caractéristique d'une attaque : substitution du joueur, sinon défaut COF2.
export const attackCarac = (
  target: 'contact' | 'distance',
  subs: { contact?: CaracKey; distance?: CaracKey } | undefined,
  defaultCarac: CaracKey,
): CaracKey => subs?.[target] ?? defaultCarac;
```

## 6. Dérivation (`MainStatsPanel`)

`MainStatsPanel` calcule déjà `attackValue(mods.FOR, niveau) + attackBonus` (contact) et
`attackValue(mods.AGI, niveau) + attackBonus` (distance). Il résout désormais la carac :

```ts
const subs = character.playState?.caracSubstitutions;
const contactCarac = attackCarac('contact', subs, 'FOR');
const distanceCarac = attackCarac('distance', subs, 'AGI');
// … attackValue(mods[contactCarac], level) + attackBonus  (Atk CàC)
// … attackValue(mods[distanceCarac], level) + attackBonus  (Atk Tir)
```

`mods` est de type `Stats` (7 caracs) ; l'indexation `mods[carac]` est sûre. Aucune valeur
dérivée persistée ; les fonctions pures restent inchangées.

## 7. UI (`CaracSubstitutionsPanel`, nouveau)

- Deux sélecteurs de caractéristique : **« Attaque contact »** (défaut FOR) et **« Attaque
  distance »** (défaut AGI), listant les 7 caracs.
- Une valeur = défaut → grisée et l'entrée est **retirée** de `caracSubstitutions` (playState
  minimal) ; une valeur ≠ défaut → écrite.
- Placement : colonne équipement/jeu, style `glass-panel`.

## 8. Tests

- **Unitaires (`cofRules.test.ts`)** : `attackCarac` — renvoie la substitution si présente,
  le défaut sinon ; `subs` absent → défaut ; cible sans substitution → défaut.
- **Type-check / lint** : `tsc -b` 0 erreur ; lint sans nouvelle erreur (~133) ; aucun `any`.
- **E2E** : non-régression fiche (`character-sheet`) ; le panneau rend sans casser la fiche.

## 9. Migration & compatibilité

- Ajout purement additif (`caracSubstitutions?` optionnel) ; aucune fiche à convertir ;
  aucune migration backend (JSONB opaque). Sans substitution, les attaques sont identiques
  à aujourd'hui (défauts FOR/AGI).

## 10. Critères de succès

- Le joueur peut choisir la carac d'attaque contact/distance (ex. moine → VOL au contact) ;
  la valeur d'attaque affichée se met à jour ; revenir au défaut retire l'entrée.
- Aucune régression sans substitution ; aucune valeur dérivée persistée ; fonctions pures
  inchangées.
- `tsc`, `vitest` et l'e2e de non-régression passent.

## 11. Suite

Autres mécaniques Phase 5 : états activables (#3), capacités à choix (#6), transformations
(#2). Incrémental : substitution magie/DM (quand ces attaques seront affichées),
auto-dérivation depuis `effect.caracSubstitution`, système de repos complet.
