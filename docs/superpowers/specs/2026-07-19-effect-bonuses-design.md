# Dérivation Init/DEF pilotée par les données (`effect.bonuses`) — Design

**Date :** 2026-07-19
**Branche :** `feat/effect-bonuses`
**Contexte parent :** Refonte du modèle de données — chantiers de fidélité (post-Phase 5). Voir le design maître `2026-07-12-fidelite-modele-donnees-design.md` (§6.2 effets structurés).

## Problème

Les bonus d'Initiative et de Défense apportés par certaines capacités sont aujourd'hui codés **en dur** dans `app/src/data/capabilityModifiers.ts` (`CAPABILITY_MODIFIERS`), un `Record<nom, (rank) => {init?, def?}>` que `computeCombatStats` applique par nom de capacité. C'est le dernier îlot de dérivation non piloté par les données : les objets magiques, les états, la RD et le dé évolutif passent déjà par l'interpréteur `resolveCapabilityEffect` / `effect.bonuses`. Ces 5 capacités devraient faire pareil.

En prime, le code actuel a un **bug latent** : il évalue le modificateur au **rang propre de la capacité** (`cap.rank`, figé) et non au **rang courant de la voie** (`entry.rank`). Comme les 5 capacités siègent toutes à un rang bas (1 ou 2), aucun de leurs paliers (« +2 au rang 5 ») ne se déclenche jamais. `computeDamageReduction` (même fichier), lui, évalue déjà correctement à `entry.rank`.

## Décision : fidélité, pas parité stricte

On corrige le bug latent en évaluant au **rang courant de la voie**, cohérent avec `computeDamageReduction`. Les paliers montent alors réellement avec la progression. Ça change les nombres affichés pour les personnages à haut rang de voie — il n'y a **aucune donnée réelle** à régresser (décision projet actée). Ce choix justifie l'ajout d'un schéma `threshold` (sinon inutile).

**Hors périmètre (restent en prose, non dérivés)** — parties conditionnelles qui dépendent d'un contexte non modélisé :
- *Armure de vent* : le +2/+3 DEF « s'il ne porte aucune armure » (on ne garde que le +1 DEF garanti).
- *Peau de pierre* : le remplacement AGI→CON pour la DEF.
- *Réflexes éclair* : le « rang + 2 aux tests d'AGI d'esquive » (pas de cible init/def/DM/PVmax/RD).

Ces exclusions sont volontaires et documentées ; elles pourront faire l'objet d'un chantier ultérieur (modélisation des conditions).

## Architecture

Trois couches, dans l'ordre :

### 1. Schéma — `scalesWith: 'threshold'` (front, `cofRules.ts`)

Étendre `CapabilityBonus` :

```ts
export interface CapabilityBonus {
  target: BonusTarget;                       // 'DM' | 'init' | 'def' | 'PVmax' | 'RD'
  scalesWith: 'fixed' | 'rank' | 'carac' | 'threshold';
  value?: number;        // 'fixed'
  perRank?: number;      // 'rank'
  carac?: keyof Stats;   // 'carac'
  thresholds?: { minRank: number; value: number }[];  // 'threshold'
}
```

Sémantique `threshold` dans `resolveCapabilityEffect` : la valeur retenue est celle du `threshold` de plus grand `minRank` **inférieur ou égal** à `ctx.rank`. Aucun palier atteint → 0. **Non cumulatif** (valeur de remplacement, pas somme des paliers). Exemple Divination `[{1:1},{3:2},{5:3}]` : rang 1→1, rang 2→1, rang 3→2, rang 4→2, rang 5+→3.

L'ordre du tableau ne doit pas être supposé trié : l'implémentation prend le `max` sur les `minRank` éligibles.

### 2. Rebranchement `computeCombatStats` (front, `cofRules.ts`)

Réécrire `computeCombatStats` sur le modèle exact de `computeDamageReduction` :
- supprimer le paramètre `capabilityModifiers`, ajouter `caracs: Stats` et `level: number` (requis par la signature de `resolveCapabilityEffect`, même si init/def n'utilisent pas `level`) ;
- pour chaque voie du perso, pour chaque capacité acquise (`c.rank` entre 1 et `entry.rank`, avec `c.effect`), appeler `resolveCapabilityEffect(c.effect, { level, rank: entry.rank, caracs })`, agréger via `aggregateResolvedBonuses`, et ajouter `.init ?? 0` / `.def ?? 0` aux bases `10 + perMod` / `10 + agiMod + armure + bouclier`.

Base inchangée. Seule la provenance des bonus capacitaires change (données, plus code).

Supprimer `app/src/data/capabilityModifiers.ts` et toutes ses importations/usages (hook `useCharacterSheet.ts`, tout appelant de `computeCombatStats`).

### 3. Données — peupler `effect.bonuses` (backend, `AppFixtures.php`)

`effect` est **dérivé** par les fixtures (pas stocké dans les JSON) : `applyEvolutiveDie` détecte `Nd4°` par regex et fait `setEffect(['evolutiveDie' => …])`. `setEffect` **remplace** tout le tableau.

Refactorer `applyEvolutiveDie` en `applyCapabilityEffect(Capability $c)` qui construit **un seul** tableau `effect` fusionnant :
- `evolutiveDie` (regex existante, inchangée) ;
- `bonuses` : lus depuis une table statique privée `COMBAT_BONUSES` (constante de classe), clé = nom exact de la capacité.

Mettre à jour les 4 sites d'appel (`applyEvolutiveDie` → `applyCapabilityEffect`).

Table `COMBAT_BONUSES` (5 entrées, valeurs = intention des règles) :

| Capacité | bonuses |
|---|---|
| Réflexes éclair | `init` fixed 3 ; `def` threshold `[{1:1},{5:2}]` |
| Murmures dans le vent | `init` fixed 1 ; `def` fixed 1 |
| Divination | `init` threshold `[{1:1},{3:2},{5:3}]` ; `def` threshold `[{1:1},{3:2},{5:3}]` |
| Peau de pierre | `def` threshold `[{1:1},{4:2}]` |
| Armure de vent | `def` fixed 1 |

Forme PHP d'un bonus threshold : `['target' => 'def', 'scalesWith' => 'threshold', 'thresholds' => [['minRank' => 1, 'value' => 1], ['minRank' => 5, 'value' => 2]]]`. Forme fixed : `['target' => 'init', 'scalesWith' => 'fixed', 'value' => 3]`.

Ces `effect.bonuses` sont exposés par l'API (déjà dans les groupes de lecture des voies via `Capability.effect`) et consommés par le front. Rien de persisté côté perso.

## Flux de données

`AppFixtures` (seed) → `Capability.effect` (JSONB) → API `*/voies` (groupes read) → front `CompendiumVoie.capabilities[].effect` → `resolveCapabilityEffect` (au rang de voie) → `computeCombatStats` → `combatStats.{init,def}` affichés dans `MainStatsPanel`.

## Définition de « fini » (DoD)

- `scalesWith: 'threshold'` résolu correctement par `resolveCapabilityEffect` (tests unitaires : sous le 1er palier→0, à chaque palier, entre paliers, ordre non trié).
- `computeCombatStats` lit les bonus depuis `effect.bonuses` ; `CAPABILITY_MODIFIERS` / `capabilityModifiers.ts` supprimé ; plus aucune référence.
- Les 5 capacités produisent, **au rang de voie 1**, exactement les valeurs historiques (Réflexes éclair init+3/def+1 ; Murmures init+1/def+1 ; Divination init+1/def+1 ; Peau de pierre def+1 ; Armure de vent def+1) — parité au rang bas.
- Aux rangs supérieurs, les paliers montent (ex. Réflexes éclair def+2 au rang 5, Peau de pierre def+2 au rang 4, Divination monte à 2 puis 3).
- `tsc -b` = 0, `vitest run` vert, `npm run lint` = 0 nouvelle erreur, e2e existants verts.
- Fixtures rechargeables sans erreur ; `Capability.effect` des 5 capacités contient bien `bonuses`.

## Découpage prévu

Deux tranches :
- **(a) Schéma + `resolveCapabilityEffect`** (front, TDD pur) — extension du type + logique `threshold` + tests.
- **(b) Rebranchement + données** (front + backend) — `computeCombatStats`, suppression `CAPABILITY_MODIFIERS`, `AppFixtures.COMBAT_BONUSES`, tests d'intégration/parité.

Le plan détaillé découpera ces tranches en tâches TDD.
