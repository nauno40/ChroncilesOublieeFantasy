# Design — Fiche : UI légères (langues & talents, RP étendu, physique, monnaie, dérivés)

- **Date :** 2026-07-17
- **Statut :** design validé, prêt pour le plan d'implémentation
- **Auteur :** nauno + Claude
- **Règles de référence :** `doc/getRulesFullToMD/partie1-personnage/01-creation-du-personnage.md` (font foi)

## 1. Contexte & objectif

La refonte (Phases 1-3 + PV hybrides, mergées) a doté le modèle de champs et de
dérivations que la fiche **n'expose pas encore**. Ce sous-projet livre les **UI légères**
manquantes, sans nouvelle règle de calcul lourde : langues & talents secondaires (le
compteur d'emplacements dérivé de l'INT existe déjà, `computeLanguageSlots`), RP étendu,
caractéristiques physiques, monnaie complète, et un affichage cohérent des valeurs
dérivées déjà calculées.

**Règle COF2 pertinente (01-creation, §Talent secondaire) :** un talent secondaire
**remplace une langue** (même budget d'emplacements), n'apporte aucun bonus de combat,
donne +3 aux tests concernés (cumul « voie de peuple »), sur autorisation du MJ. Langues
et talents **partagent donc le budget d'emplacements** dérivé de l'INT.

## 2. Périmètre & non-objectifs

**Dans le périmètre :** champs `playState` manquants (`talents`, `physical`) ; helper
pur `computeLanguageUsage` (emplacements utilisés/disponibles/illettrisme) ; UI « Langues &
Talents », RP étendu (`secret`/`notes`), bloc « Physique », monnaie po/pc, cohérence
d'affichage des dérivés. **Frontend uniquement** (`playState` = JSON opaque backend).

**Hors périmètre :** bornes âge/taille/poids par peuple (compendium non structuré → saisie
libre, à reporter) ; structuration des langues de peuple côté données (base = « Commun »
en dur pour l'instant) ; blocage strict du budget d'emplacements (enforcement **souple**,
au MJ selon les règles) ; le bonus +3 du talent sur les tests (pas de moteur de tests dans
l'appli) ; mécaniques spéciales (Phase 5).

## 3. Décisions actées

| Décision | Choix | Raison |
|---|---|---|
| Budget langues/talents | **Souple** : compteur indicatif, pas de blocage | Les règles laissent l'autorisation au MJ (« si votre MJ vous y autorise »). |
| Langue de base | **« Commun » en dur** (base = 1) | Le compendium n'a pas les langues de peuple structurées ; à faire plus tard. |
| Talents secondaires | Liste `talents[]` séparée, **partageant le budget** des langues | Fidèle (« remplace une langue ») sans confondre les deux listes à l'affichage. |
| Physique | Saisie **libre** (chaînes) | Bornes par peuple non structurées ; YAGNI pour l'instant. |
| Localisation | **Frontend seul** | `playState` = JSONB opaque, aucune migration. |

## 4. Modèle (`playState`)

Ajouts dans `app/src/types/character.ts` (`PlayState`) :

```ts
talents?: string[];                             // talents secondaires (partagent le budget des langues)
physical?: { age?: string; height?: string; weight?: string }; // saisie libre
```

Champs déjà présents et simplement à exposer : `rp.secret`, `rp.notes`, `money.po`,
`money.pc`, `languages`.

## 5. Dérivation (`cofRules.ts`)

`computeLanguageSlots(intMod)` (déjà livré Phase 3) reste la source du nombre
d'emplacements. Ajout d'un helper pur **testable** pour le compteur :

```ts
export const computeLanguageUsage = (
  languages: string[] | undefined,
  talents: string[] | undefined,
  intMod: number,
): { used: number; available: number; illiterate: boolean } => ({
  // « Commun » est gratuit (base 1) ; toute langue supplémentaire + chaque talent
  // consomme un emplacement (budget partagé, COF2 §Talent secondaire).
  used: Math.max(0, (languages?.length ?? 0) - 1) + (talents?.length ?? 0),
  available: computeLanguageSlots(intMod).slots,
  illiterate: computeLanguageSlots(intMod).illiterate,
});
```

Aucune valeur dérivée n'est persistée. Le dépassement (`used > available`) est **signalé**
à l'affichage (couleur), jamais bloqué.

## 6. UI (fiche)

- **`LanguagesTalentsPanel`** (nouveau) : deux listes éditables (langues, talents) avec
  ajout/suppression ; un compteur « emplacements : utilisés / disponibles » (rouge si
  dépassement) et un badge « Illettré » si `illiterate`. Écrit `playState.languages` /
  `playState.talents`.
- **`RoleplaySection`** (existant) : ajouter deux champs — `secret` (comme `ideal`/`flaw`)
  et `notes` (zone de texte libre) sur `playState.rp.secret` / `playState.rp.notes`.
- **`PhysicalBlock`** (nouveau, ou intégré à `IdentityBlock`) : trois champs libres âge /
  taille / poids sur `playState.physical`.
- **Monnaie** (`ProtectionSection`, existant) : ajouter po et pc à côté de pa
  (`playState.money.po` / `pa` / `pc`).
- **Cohérence dérivés** : le compteur de langues rejoint les autres valeurs dérivées déjà
  affichées (RD, dé résolu) — pas de nouveau calcul, juste l'exposition.

Placement : les nouveaux panneaux s'insèrent dans la colonne identité/RP de
`CharacterSheet`, à côté des sections existantes ; discrets, cohérents avec le style
`glass-panel`.

## 7. Tests

- **Unitaires (`cofRules.test.ts`)** : `computeLanguageUsage` — base « Commun » gratuite,
  langues + talents consommant le budget partagé, `available` = `computeLanguageSlots`,
  `illiterate` pour INT < 0, cas vide.
- **Type-check / lint** : `tsc -b` 0 erreur ; lint sans nouvelle erreur (baseline ~133).
- **E2E** : non-régression fiche (`character-sheet`) ; les nouveaux panneaux rendent sans
  casser la fiche.

## 8. Migration & compatibilité

- Ajouts purement additifs à `PlayState` (`talents`, `physical` optionnels) ; les champs
  déjà présents (`rp.secret/notes`, `money.po/pc`) n'ont jamais eu d'UI → aucune fiche à
  convertir. Aucune migration backend (JSONB opaque).

## 9. Critères de succès

- Le joueur peut saisir/éditer langues, talents secondaires, secret, notes, physique,
  monnaie po/pa/pc ; tout persiste dans `playState`.
- Le compteur d'emplacements (langues + talents, base Commun gratuite) et l'état illettré
  s'affichent, dérivés de l'INT, sans blocage ni valeur persistée.
- `tsc`, `vitest` et l'e2e de non-régression passent.

## 10. Suite

**Phase 5** — mécaniques spéciales (companions, transformations, états activables, usages
limités, substitutions de carac, capacités à choix) : schéma déjà réservé (design initial
§7), calcul incrémental. Suivis incrémentaux : structurer `effect.bonuses` capacité par
capacité, coût de sort PM, plafond 6 voies, DEF capacité-consciente, langues de peuple
structurées + bornes physiques par peuple, `magicStat`/`manaStat`, `weaponsAuth`.
