# Résolution de choix — effet de combat (tranche #6b) — Design

**Date :** 2026-07-19
**Branche :** `feat/choice-combat-effect`
**Contexte parent :** Résolution des capacités à choix (#6). Tranche #6a (bonus aux tests, PR #52) a posé `effect.choiceOptions`. Cette tranche = **effet de combat** : une option choisie peut accorder un bonus de combat (`bonuses`) ou relever le plafond d'armure (`armorCap`). Résout le report du Guerrier « Armure lourde » (PR #51).

## Problème

Le Guerrier rang 3 « Armure lourde » : *« Au choix le guerrier gagne +1 en DEF ou il apprend à porter l'armure de plaque (DEF +6). »* C'est un choix à **effet de combat** :
- option A « +1 DEF » → bonus DEF fixe ;
- option B « armure de plaque » → relève le plafond d'armure du Guerrier (5 → 6).

Aujourd'hui : le choix n'est pas résolu (différé en PR #51), et pire, « Armure lourde » n'a **pas** de clé `details.options_*`/`choix_*`, donc `ChoicesPanel` ne l'affiche même pas (note Minor de la PR #52).

## Architecture

Réutilise les mécanismes existants (`choiceOptions`, `effect.bonuses`, `armorCap`), avec deux généralisations.

### 1. Payload d'option enrichi (front, `cofRules.ts`)

Étendre le type d'option de `choiceOptions` :

```ts
choiceOptions?: {
  label: string;
  caracTestBonus?: { carac: CaracKey; value: number };   // #6a
  bonuses?: CapabilityBonus[];                             // #6b — bonus de combat de l'option
  armorCap?: number;                                       // #6b — plafond d'armure ouvert par l'option
}[];
```

### 2. Dérivation « choice-aware » (front, `cofRules.ts`)

**Aucun changement de signature** : `computeCombatStats` et `resolveArmorCap` itèrent déjà sur `entry` (qui porte `choices`) et sur la capacité `c`. L'option choisie se trouve par `c.effect.choiceOptions?.find(o => o.label === entry.choices?.[String(c.rank)])`.

- **`computeCombatStats`** : après avoir résolu `c.effect` (base), si une option est choisie et porte `bonuses`, pousser aussi `resolveCapabilityEffect({ bonuses: chosen.bonuses }, ctx)` dans l'agrégat. Réutilise l'interpréteur existant ; init/def de l'option s'ajoutent aux bases.
- **`resolveArmorCap`** : en plus de `c.effect.armorCap`, prendre `Math.max` avec l'`armorCap` de l'option choisie si présent.

Le rang d'évaluation reste le rang courant de la voie (`entry.rank`), cohérent avec l'existant. La clé de choix est `String(c.rank)` (comme #6a).

### 3. Déclencheur `ChoicesPanel` généralisé (front)

`ChoicesPanel` crée aujourd'hui une ligne uniquement si `capabilityChoiceKey(details)` trouve une clé `options_*`/`choix_*`. Le corriger : afficher une ligne si **`capabilityChoiceKey(details)` OU `cap.effect?.choiceOptions` (non vide)**. Les libellés du menu déroulant proviennent de `effect.choiceOptions[].label` (déjà en place depuis #6a) ; l'aide (`capabilityChoiceHelp`) reste facultative (absente si pas de clé legacy). C'est requis car « Armure lourde » n'a pas de clé legacy.

### 4. Données (backend, `AppFixtures.php`)

Ajouter au `CHOICE_OPTIONS_BY_CAPABILITY` l'entrée Guerrier :

```php
'Armure lourde' => [
    ['label' => '+1 DEF', 'bonuses' => [['target' => 'def', 'scalesWith' => 'fixed', 'value' => 1]]],
    ['label' => 'Armure de plaque (DEF +6)', 'armorCap' => 6],
],
```

## Flux de données

`AppFixtures` → `effect.choiceOptions` (option porte `bonuses`/`armorCap`) → API → le joueur choisit (`ChoicesPanel` → `characterVoies[].choices["3"]`) → `computeCombatStats`/`resolveArmorCap` lisent l'option choisie → DEF affichée / armures sélectionnables.

## Définition de « fini » (DoD)

- `computeCombatStats` : capacité à `choiceOptions`, option « +1 DEF » choisie → DEF base +1 ; option non choisie ou autre → pas de bonus DEF de ce choix ; capacité non acquise (rang de voie < rang capacité) → rien.
- `resolveArmorCap` : option « armure de plaque » choisie → plafond relevé à 6 ; sinon plafond de base.
- `ChoicesPanel` affiche « Armure lourde » (menu déroulant à 2 options) bien qu'elle n'ait pas de clé legacy.
- Guerrier rang 3 : « +1 DEF » → DEF +1 ; « Armure de plaque » → cotte de plaques (def 6) sélectionnable ; les deux exclusifs.
- Non-régression : les capacités à `choiceOptions` de type `caracTestBonus` (tatouage) inchangées ; aucune capacité sans choix affectée.
- `tsc -b` = 0, `vitest run` vert, `npm run lint` = 0 nouvelle erreur, e2e existants verts. Fixtures rechargeables.

## Hors périmètre

- La **note hybride** du Guerrier (« apprendre l'armure d'une catégorie au-dessus du profil principal ») — nécessite la résolution hybride, reportée.
- Les 3 autres types de choix #6 (octroi de capacité, maîtrise d'arme, saveur).

## Découpage prévu

- **(a)** Payload d'option (`bonuses`/`armorCap`) + dérivation choice-aware (`computeCombatStats`, `resolveArmorCap`) + déclencheur `ChoicesPanel` (front, TDD).
- **(b)** Données backend (`Armure lourde`).
