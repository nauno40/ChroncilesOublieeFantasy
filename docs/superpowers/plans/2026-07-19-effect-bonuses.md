# Dérivation Init/DEF pilotée par les données (`effect.bonuses`) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire lire les bonus Init/DEF des capacités depuis `effect.bonuses` (données) au lieu du `CAPABILITY_MODIFIERS` codé en dur, en évaluant au rang courant de la voie (fidélité).

**Architecture:** Trois couches indépendantes : (1) extension du schéma `scalesWith: 'threshold'` + résolution dans `resolveCapabilityEffect` (front, TDD pur) ; (2) rebranchement de `computeCombatStats` sur l'interpréteur + suppression du module codé en dur (front) ; (3) peuplement des `effect.bonuses` des 5 capacités dans les fixtures (backend).

**Tech Stack:** React 19 + TypeScript (Vitest), Symfony 7.4 / PHP 8.3 (fixtures Doctrine), Docker Compose.

## Global Constraints

- Spec de référence : `docs/superpowers/specs/2026-07-19-effect-bonuses-design.md`. Valeurs des bonus = celles de la table de la spec, verbatim.
- Évaluer les effets au **rang courant de la voie** (`entry.rank`), jamais au rang propre de la capacité — cohérent avec `computeDamageReduction` (`app/src/utils/cofRules.ts`), qui sert de modèle.
- Sémantique `threshold` : valeur du palier de plus grand `minRank ≤ rank` ; aucun éligible → 0 ; **non cumulatif** ; ne pas supposer le tableau trié.
- Commentaires en français.
- Gates (tous verts) : `docker compose exec -T frontend npx tsc -b` (0 erreur) ; `docker compose exec -T frontend npx vitest run` ; `docker compose exec -T frontend npm run lint` (0 **nouvelle** erreur, aucun nouveau `any`).
- Ne rien persister côté personnage ; les bonus vivent uniquement dans le compendium (`Capability.effect`).

---

### Task 1 : Schéma `threshold` + résolution dans `resolveCapabilityEffect`

**Files:**
- Modify: `app/src/utils/cofRules.ts` (interface `CapabilityBonus` ~236-242 ; corps de `resolveCapabilityEffect` ~266-275)
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `resolveCapabilityEffect(effect, { level, rank, caracs })` existant.
- Produces: `CapabilityBonus.scalesWith` accepte `'threshold'` avec un champ `thresholds?: { minRank: number; value: number }[]`. La valeur résolue d'un bonus threshold = `value` du plus grand `minRank ≤ ctx.rank`, sinon 0.

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter dans `app/src/utils/cofRules.test.ts`, dans un nouveau `describe` :

```ts
describe('resolveCapabilityEffect — scalesWith threshold', () => {
  const caracs = { FOR: 0, AGI: 0, CON: 0, INT: 0, PER: 0, CHA: 0, VOL: 0 };
  const eff = (thresholds: { minRank: number; value: number }[]) => ({
    bonuses: [{ target: 'def' as const, scalesWith: 'threshold' as const, thresholds }],
  });

  it('rend 0 sous le premier palier', () => {
    const r = resolveCapabilityEffect(eff([{ minRank: 4, value: 2 }]), { level: 1, rank: 3, caracs });
    expect(r.bonuses.def ?? 0).toBe(0);
  });
  it('rend la valeur du palier atteint', () => {
    const r = resolveCapabilityEffect(eff([{ minRank: 1, value: 1 }, { minRank: 5, value: 2 }]), { level: 1, rank: 5, caracs });
    expect(r.bonuses.def).toBe(2);
  });
  it('rend le palier inférieur entre deux paliers', () => {
    const r = resolveCapabilityEffect(eff([{ minRank: 1, value: 1 }, { minRank: 5, value: 2 }]), { level: 1, rank: 4, caracs });
    expect(r.bonuses.def).toBe(1);
  });
  it('non cumulatif et insensible à l\'ordre du tableau', () => {
    const r = resolveCapabilityEffect(eff([{ minRank: 5, value: 3 }, { minRank: 1, value: 1 }, { minRank: 3, value: 2 }]), { level: 1, rank: 3, caracs });
    expect(r.bonuses.def).toBe(2);
  });
});
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts -t "threshold"`
Expected: FAIL (les bonus threshold ne sont pas résolus → `def` vaut 0 / undefined).

- [ ] **Step 3 : Étendre le type**

Dans `app/src/utils/cofRules.ts`, remplacer l'interface `CapabilityBonus` :

```ts
export interface CapabilityBonus {
  target: BonusTarget;
  scalesWith: 'fixed' | 'rank' | 'carac' | 'threshold';
  value?: number;        // scalesWith 'fixed'
  perRank?: number;      // scalesWith 'rank'
  carac?: keyof Stats;   // scalesWith 'carac'
  thresholds?: { minRank: number; value: number }[];  // scalesWith 'threshold' : palier de plus grand minRank ≤ rang
}
```

- [ ] **Step 4 : Résoudre le palier**

Dans `resolveCapabilityEffect`, dans le `forEach((b) => { … })`, ajouter la branche `threshold` après la branche `carac` :

```ts
    else if (b.scalesWith === 'threshold') {
      let best = 0, bestRank = -1;
      for (const t of b.thresholds ?? []) {
        if (ctx.rank >= t.minRank && t.minRank > bestRank) { bestRank = t.minRank; best = t.value; }
      }
      val = best;
    }
```

- [ ] **Step 5 : Lancer les tests, vérifier le succès**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS (tous, y compris les tests threshold).

- [ ] **Step 6 : Type-check**

Run: `docker compose exec -T frontend npx tsc -b`
Expected: 0 erreur.

- [ ] **Step 7 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(rules): scalesWith threshold dans resolveCapabilityEffect"
```

---

### Task 2 : Rebrancher `computeCombatStats` sur `effect.bonuses` + supprimer `CAPABILITY_MODIFIERS`

**Files:**
- Modify: `app/src/utils/cofRules.ts` (`computeCombatStats` ~431-461)
- Modify: `app/src/hooks/useCharacterSheet.ts` (import ligne 6 ; appel ~426-434)
- Delete: `app/src/data/capabilityModifiers.ts`
- Test: `app/src/utils/cofRules.test.ts` (deux appelants existants + nouveau test de parité/paliers)

**Interfaces:**
- Consumes: `resolveCapabilityEffect`, `aggregateResolvedBonuses`, `Task 1` (threshold).
- Produces: nouvelle signature
  `computeCombatStats({ voies, protection, races, profiles, allVoies, perMod, agiMod, caracs, level }): { init, def }`.
  Plus de paramètre `capabilityModifiers`.

- [ ] **Step 1 : Écrire le test qui échoue (parité + paliers)**

Remplacer le `describe('computeCombatStats', …)` existant (~358-368) par :

```ts
describe('computeCombatStats', () => {
  const zero = { FOR: 0, AGI: 0, CON: 0, INT: 0, PER: 0, CHA: 0, VOL: 0 };

  it('is base 10 + mods + protection with no capability bonuses', () => {
    const r = computeCombatStats({
      voies: [], protection: { armor: { def: 3 }, shield: { def: 1 } },
      races: [], profiles: [], allVoies: [], perMod: 2, agiMod: 1, caracs: zero, level: 1,
    });
    expect(r.init).toBe(12); // 10 + 2
    expect(r.def).toBe(15);  // 10 + 1 + 3 + 1
  });

  it('lit les bonus init/def depuis effect.bonuses au rang de la voie (Réflexes éclair)', () => {
    // Voie de compendium portant une capacité « Réflexes éclair » (init +3 fixe, def palier 1→1 / 5→2).
    const voie = {
      '@id': '/api/voies/rx', name: 'Voie du test',
      capabilities: [{ rank: 1, name: 'Réflexes éclair', effect: { bonuses: [
        { target: 'init', scalesWith: 'fixed', value: 3 },
        { target: 'def', scalesWith: 'threshold', thresholds: [{ minRank: 1, value: 1 }, { minRank: 5, value: 2 }] },
      ] } }],
    };
    const profiles = [{ voies: [voie] }] as unknown as Parameters<typeof computeCombatStats>[0]['profiles'];

    const atRank1 = computeCombatStats({
      voies: [{ voie: '/api/voies/rx', rank: 1, source: 'profil' }],
      protection: undefined, races: [], profiles, allVoies: [], perMod: 0, agiMod: 0, caracs: zero, level: 1,
    });
    expect(atRank1.init).toBe(13); // 10 + 3
    expect(atRank1.def).toBe(11);  // 10 + 1

    const atRank5 = computeCombatStats({
      voies: [{ voie: '/api/voies/rx', rank: 5, source: 'profil' }],
      protection: undefined, races: [], profiles, allVoies: [], perMod: 0, agiMod: 0, caracs: zero, level: 9,
    });
    expect(atRank5.def).toBe(12);  // 10 + 2 (palier rang 5)
  });
});
```

Mettre aussi à jour l'appelant du test « intégration » (~106-110) : remplacer `perMod: mods.PER, agiMod: mods.AGI, capabilityModifiers: {},` par `allVoies: [], perMod: mods.PER, agiMod: mods.AGI, caracs: mods, level: 1,`.

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts -t "computeCombatStats"`
Expected: FAIL de compilation/exécution (signature `capabilityModifiers` encore requise, `effect.bonuses` non lu).

- [ ] **Step 3 : Réécrire `computeCombatStats`**

Remplacer entièrement `computeCombatStats` dans `app/src/utils/cofRules.ts` (calquer `computeDamageReduction` pour la table IRI) :

```ts
export const computeCombatStats = (args: {
  voies: CharacterVoieRef[] | undefined;
  protection: Protection | undefined;
  races: CompendiumRace[];
  profiles: CompendiumProfile[];
  allVoies: CompendiumVoie[];
  perMod: number;
  agiMod: number;
  caracs: Stats;
  level: number;
}): { init: number; def: number } => {
  const { voies, protection, races, profiles, allVoies, perMod, agiMod, caracs, level } = args;
  const baseInit = 10 + perMod;
  const baseDef = 10 + agiMod + (protection?.armor?.def || 0) + (protection?.shield?.def || 0);

  // Résolution des voies du perso par IRI (peuple + profil + prestige), comme computeDamageReduction.
  const byIri = new Map<string, CompendiumVoie>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);

  const resolved: ResolvedEffect[] = [];
  (voies ?? []).forEach((entry) => {
    const v = byIri.get(entry.voie);
    (v?.capabilities ?? []).forEach((c) => {
      if ((c.rank ?? 0) >= 1 && (c.rank ?? 0) <= entry.rank && c.effect) {
        resolved.push(resolveCapabilityEffect(c.effect, { level, rank: entry.rank, caracs }));
      }
    });
  });
  const agg = aggregateResolvedBonuses(resolved);
  return { init: baseInit + (agg.init ?? 0), def: baseDef + (agg.def ?? 0) };
};
```

Note : si `CompendiumVoie` (types `availableVoies`/`voies`) ne compile pas à l'identique, reprendre exactement la même construction `byIri` que `computeDamageReduction` (même fichier, ~503-506) — elle compile déjà.

- [ ] **Step 4 : Rebrancher le hook**

Dans `app/src/hooks/useCharacterSheet.ts` :
- supprimer la ligne 6 `import { CAPABILITY_MODIFIERS } from '../data/capabilityModifiers';` ;
- remplacer l'appel (~426-434) par :

```ts
    const combatStats = useMemo(() => computeCombatStats({
        voies: characterVoies,
        protection: playState.protection,
        races,
        profiles,
        allVoies,
        perMod: mods.PER,
        agiMod: mods.AGI,
        caracs: mods,
        level: character.level || 1,
    }), [characterVoies, playState.protection, races, profiles, allVoies, mods.PER, mods.AGI, mods, character.level]);
```

- [ ] **Step 5 : Supprimer le module codé en dur**

```bash
git rm app/src/data/capabilityModifiers.ts
```

Vérifier qu'il ne reste aucune référence :
Run: `grep -rn "capabilityModifiers\|CAPABILITY_MODIFIERS" app/src`
Expected: aucune sortie.

- [ ] **Step 6 : Type-check + tests + lint**

Run: `docker compose exec -T frontend npx tsc -b && docker compose exec -T frontend npx vitest run && docker compose exec -T frontend npm run lint`
Expected: tsc 0 ; vitest vert ; lint 0 nouvelle erreur.

- [ ] **Step 7 : Commit**

```bash
git add -A
git commit -m "feat(rules): computeCombatStats lit effect.bonuses, supprime CAPABILITY_MODIFIERS"
```

---

### Task 3 : Peupler `effect.bonuses` des 5 capacités dans les fixtures

**Files:**
- Modify: `backend/src/DataFixtures/AppFixtures.php` (`applyEvolutiveDie` ~544-553 + ses 4 sites d'appel : ~283, ~434, ~488, ~527)

**Interfaces:**
- Consumes: entité `Capability` (`getName()`, `getDescription()`, `setEffect(array)`).
- Produces: `Capability.effect` des 5 capacités contient `bonuses` (schéma spec) en plus de l'éventuel `evolutiveDie`.

- [ ] **Step 1 : Remplacer `applyEvolutiveDie` par `applyCapabilityEffect`**

Dans `backend/src/DataFixtures/AppFixtures.php`, remplacer la méthode `applyEvolutiveDie` (~544-553) par une constante de classe + une méthode qui fusionne `evolutiveDie` et `bonuses` en un seul `effect` :

```php
    /**
     * Bonus de combat structurés par nom de capacité (spec effect.bonuses, fidélité).
     * Évalués côté front au rang courant de la voie.
     */
    private const COMBAT_BONUSES = [
        'Réflexes éclair' => [
            ['target' => 'init', 'scalesWith' => 'fixed', 'value' => 3],
            ['target' => 'def', 'scalesWith' => 'threshold', 'thresholds' => [
                ['minRank' => 1, 'value' => 1], ['minRank' => 5, 'value' => 2],
            ]],
        ],
        'Murmures dans le vent' => [
            ['target' => 'init', 'scalesWith' => 'fixed', 'value' => 1],
            ['target' => 'def', 'scalesWith' => 'fixed', 'value' => 1],
        ],
        'Divination' => [
            ['target' => 'init', 'scalesWith' => 'threshold', 'thresholds' => [
                ['minRank' => 1, 'value' => 1], ['minRank' => 3, 'value' => 2], ['minRank' => 5, 'value' => 3],
            ]],
            ['target' => 'def', 'scalesWith' => 'threshold', 'thresholds' => [
                ['minRank' => 1, 'value' => 1], ['minRank' => 3, 'value' => 2], ['minRank' => 5, 'value' => 3],
            ]],
        ],
        'Peau de pierre' => [
            ['target' => 'def', 'scalesWith' => 'threshold', 'thresholds' => [
                ['minRank' => 1, 'value' => 1], ['minRank' => 4, 'value' => 2],
            ]],
        ],
        'Armure de vent' => [
            ['target' => 'def', 'scalesWith' => 'fixed', 'value' => 1],
        ],
    ];

    /**
     * Construit effect : dé évolutif « Nd4° » détecté dans la description (spec §6.4)
     * + bonus de combat structurés (COMBAT_BONUSES). Ne pose effect que s'il est non vide.
     */
    private function applyCapabilityEffect(Capability $c): void
    {
        $effect = [];
        if (preg_match('/(\d*)d4°/u', (string) $c->getDescription(), $m)) {
            $effect['evolutiveDie'] = ['count' => $m[1] === '' ? 1 : (int) $m[1]];
        }
        if (isset(self::COMBAT_BONUSES[$c->getName()])) {
            $effect['bonuses'] = self::COMBAT_BONUSES[$c->getName()];
        }
        if ($effect !== []) {
            $c->setEffect($effect);
        }
    }
```

- [ ] **Step 2 : Mettre à jour les 4 sites d'appel**

Remplacer chaque `$this->applyEvolutiveDie($c);` / `$this->applyEvolutiveDie($cap);` / `$this->applyEvolutiveDie($e);` (lignes ~283, ~434, ~488, ~527) par `$this->applyCapabilityEffect(...)` avec la même variable.

Run: `grep -n "applyEvolutiveDie\|applyCapabilityEffect" backend/src/DataFixtures/AppFixtures.php`
Expected: `applyEvolutiveDie` n'apparaît plus ; `applyCapabilityEffect` apparaît 5 fois (déclaration + 4 appels).

- [ ] **Step 3 : Recharger les fixtures**

Run: `docker compose exec -T backend bin/console doctrine:fixtures:load --no-interaction`
Expected: chargement sans erreur (⚠️ destructif : purge les tables du compendium — attendu en dev).

- [ ] **Step 4 : Vérifier les données**

Run:
```bash
docker compose exec -T backend bin/console doctrine:query:sql \
  "SELECT name, effect FROM capability WHERE name IN ('Réflexes éclair','Divination','Peau de pierre','Armure de vent','Murmures dans le vent')"
```
Expected: chaque ligne montre un `effect` JSON contenant `bonuses` (et `evolutiveDie` le cas échéant). Réflexes éclair : `init` fixed 3 + `def` threshold [1→1, 5→2].

- [ ] **Step 5 : Commit**

```bash
git add backend/src/DataFixtures/AppFixtures.php
git commit -m "feat(fixtures): effect.bonuses Init/DEF des 5 capacités (Réflexes éclair, Divination, …)"
```

---

## Self-Review

**Couverture spec :**
- Schéma `threshold` → Task 1. ✓
- Résolution au rang de voie → Task 2 (calque `computeDamageReduction`). ✓
- Suppression `CAPABILITY_MODIFIERS` → Task 2 Steps 5. ✓
- Peuplement des 5 capacités → Task 3, valeurs verbatim de la spec. ✓
- Parité au rang bas + paliers aux rangs supérieurs → Task 2 Step 1 (tests). ✓
- Hors périmètre (parties conditionnelles) : non implémenté, conforme à la spec. ✓

**Placeholders :** aucun ; tout le code est fourni.

**Cohérence des types :** signature `computeCombatStats` identique entre Task 2 Step 1 (tests), Step 3 (impl) et Step 4 (hook) : `{ voies, protection, races, profiles, allVoies, perMod, agiMod, caracs, level }`. `thresholds: { minRank, value }[]` identique entre Task 1 (type + résolution + tests) et Task 3 (données PHP).

## Handoff exécution

Plan sauvegardé. Exécution en **subagent-driven** (recommandé) : un implémenteur par tâche, revue spec+qualité après chacune, revue finale de branche, puis PR.
