# Résolution de choix — effet de combat (#6b) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une option choisie d'une capacité peut accorder un bonus de combat (`bonuses`) ou relever le plafond d'armure (`armorCap`) ; démontré sur Guerrier « Armure lourde ».

**Architecture:** (1) enrichir le payload d'option `choiceOptions` + rendre `computeCombatStats`/`resolveArmorCap` conscients de l'option choisie + généraliser le déclencheur `ChoicesPanel` (front, TDD) ; (2) peupler Guerrier « Armure lourde » (backend).

**Tech Stack:** React 19 + TypeScript (Vitest), Symfony 7.4 / PHP 8.3, Docker Compose.

## Global Constraints

- Spec de référence : `docs/superpowers/specs/2026-07-19-choix-effet-combat-design.md`.
- **Aucun changement de signature** de `computeCombatStats`/`resolveArmorCap` : `entry` (qui porte `choices`) et la capacité `c` sont déjà en portée. Option choisie = `c.effect.choiceOptions?.find(o => o.label === entry.choices?.[String(c.rank)])`.
- Évaluation au rang courant de la voie (`entry.rank`). Clé de choix `String(c.rank)` (comme #6a).
- Non-régression : les options `caracTestBonus` (tatouage, #6a) restent inchangées ; une capacité sans option choisie ne gagne aucun bonus.
- Commentaires en français.
- Gates (tous verts) : `docker compose exec -T frontend npx tsc -b` (0) ; `docker compose exec -T frontend npx vitest run` ; `docker compose exec -T frontend npm run lint` (0 nouvelle erreur, aucun nouveau `any`).

---

### Task 1 : Payload d'option enrichi + dérivation choice-aware + déclencheur `ChoicesPanel`

**Files:**
- Modify: `app/src/utils/cofRules.ts` (interface `CapabilityEffect.choiceOptions` ; corps de `computeCombatStats` et `resolveArmorCap`)
- Modify: `app/src/components/character/ChoicesPanel.tsx` (déclencheur de ligne + type local)
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `resolveCapabilityEffect`, `aggregateResolvedBonuses`, `CapabilityBonus`.
- Produces: `choiceOptions[]` accepte `bonuses?: CapabilityBonus[]` et `armorCap?: number` ; `computeCombatStats`/`resolveArmorCap` appliquent l'option choisie.

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter dans `app/src/utils/cofRules.test.ts` :

```ts
describe('choix à effet de combat (#6b)', () => {
  const zero = { FOR: 0, AGI: 0, CON: 0, INT: 0, PER: 0, CHA: 0, VOL: 0 };
  const voie = {
    '@id': '/api/voies/gw', name: 'Voie du guerrier',
    capabilities: [{ rank: 3, name: 'Armure lourde', effect: { choiceOptions: [
      { label: '+1 DEF', bonuses: [{ target: 'def', scalesWith: 'fixed', value: 1 }] },
      { label: 'Armure de plaque (DEF +6)', armorCap: 6 },
    ] } }],
  };
  const profiles = [{ voies: [voie] }] as unknown as Parameters<typeof computeCombatStats>[0]['profiles'];
  const combat = (rank: number, choice?: string) => computeCombatStats({
    voies: [{ voie: '/api/voies/gw', rank, source: 'profil', ...(choice ? { choices: { '3': choice } } : {}) }],
    protection: undefined, races: [], profiles, allVoies: [], perMod: 0, agiMod: 0, caracs: zero, level: 5,
  });

  it('applique le bonus DEF de l\'option choisie', () => {
    expect(combat(3, '+1 DEF').def).toBe(11); // 10 + 1
  });
  it('n\'applique pas le bonus DEF si une autre option est choisie', () => {
    expect(combat(3, 'Armure de plaque (DEF +6)').def).toBe(10);
  });
  it('n\'applique rien sans choix', () => {
    expect(combat(3).def).toBe(10);
  });
  it('n\'applique rien si la capacité n\'est pas acquise', () => {
    expect(combat(2, '+1 DEF').def).toBe(10);
  });

  const armorCap = (rank: number, choice?: string) => resolveArmorCap(
    [{ voie: '/api/voies/gw', rank, source: 'profil', ...(choice ? { choices: { '3': choice } } : {}) }],
    [], profiles as unknown as Parameters<typeof resolveArmorCap>[2], [], 5,
  );
  it('relève le plafond d\'armure via l\'option choisie', () => {
    expect(armorCap(3, 'Armure de plaque (DEF +6)')).toBe(6);
  });
  it('ne relève pas le plafond pour une autre option / sans choix', () => {
    expect(armorCap(3, '+1 DEF')).toBe(5);
    expect(armorCap(3)).toBe(5);
  });
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts -t "#6b"`
Expected: FAIL (options `bonuses`/`armorCap` non typées / non lues).

- [ ] **Step 3 : Enrichir le type d'option**

Dans `app/src/utils/cofRules.ts`, remplacer le champ `choiceOptions` de `CapabilityEffect` :

```ts
  choiceOptions?: {
    label: string;
    caracTestBonus?: { carac: CaracKey; value: number };   // #6a
    bonuses?: CapabilityBonus[];                             // #6b — bonus de combat de l'option
    armorCap?: number;                                       // #6b — plafond d'armure ouvert par l'option
  }[];
```

- [ ] **Step 4 : `computeCombatStats` conscient du choix**

Dans le `forEach` des capacités de `computeCombatStats`, après le `resolved.push(resolveCapabilityEffect(c.effect, …))` existant, ajouter la résolution de l'option choisie :

```ts
        resolved.push(resolveCapabilityEffect(c.effect, { level, rank: entry.rank, caracs }));
        // Bonus de combat de l'option choisie (#6b).
        const chosen = c.effect.choiceOptions?.find(o => o.label === entry.choices?.[String(c.rank)]);
        if (chosen?.bonuses) resolved.push(resolveCapabilityEffect({ bonuses: chosen.bonuses }, { level, rank: entry.rank, caracs }));
```

- [ ] **Step 5 : `resolveArmorCap` conscient du choix**

Remplacer le bloc interne du `forEach` de `resolveArmorCap` (la garde qui teste `typeof c.effect?.armorCap`) par une garde sur le rang seul, puis deux vérifications :

```ts
      if ((c.rank ?? 0) >= 1 && (c.rank ?? 0) <= entry.rank) {
        if (typeof c.effect?.armorCap === 'number') cap = Math.max(cap, c.effect.armorCap);
        // Plafond ouvert par l'option choisie (#6b).
        const chosen = c.effect?.choiceOptions?.find(o => o.label === entry.choices?.[String(c.rank)]);
        if (typeof chosen?.armorCap === 'number') cap = Math.max(cap, chosen.armorCap);
      }
```

- [ ] **Step 6 : Lancer les tests + type-check**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts && docker compose exec -T frontend npx tsc -b`
Expected: tous verts ; tsc 0.

- [ ] **Step 7 : Généraliser le déclencheur `ChoicesPanel`**

Dans `app/src/components/character/ChoicesPanel.tsx`, étendre le type local `CompendiumCap` pour que `effect.choiceOptions` puisse porter des options (déjà `{ label: string }[]`, suffisant pour le déclencheur — inchangé). Remplacer la condition de création de ligne :

```tsx
            const cap = (v.capabilities || []).find(c => c.rank === rank);
            const key = cap ? capabilityChoiceKey(cap.details) : undefined;
            const hasStructured = (cap?.effect?.choiceOptions?.length ?? 0) > 0;
            if (cap && (key || hasStructured)) {
                rows.push({
                    idx, rank, voieName: v.name || '', capName: cap.name || '',
                    help: key ? capabilityChoiceHelp(cap.details?.[key]) : undefined,
                    value: String(entry.choices?.[String(rank)] ?? ''),
                    options: cap.effect?.choiceOptions?.map(o => o.label),
                });
            }
```

- [ ] **Step 8 : Type-check + tests + lint**

Run: `docker compose exec -T frontend npx tsc -b && docker compose exec -T frontend npx vitest run && docker compose exec -T frontend npm run lint`
Expected: tsc 0 ; vitest vert ; lint 0 nouvelle erreur.

- [ ] **Step 9 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts app/src/components/character/ChoicesPanel.tsx
git commit -m "feat(rules): options de choix à effet de combat (bonuses/armorCap) + déclencheur ChoicesPanel"
```

---

### Task 2 : Peupler Guerrier « Armure lourde » (fixtures)

**Files:**
- Modify: `backend/src/DataFixtures/AppFixtures.php` (constante `CHOICE_OPTIONS_BY_CAPABILITY`)

**Interfaces:**
- Consumes: entité `Capability`.
- Produces: `Capability.effect.choiceOptions` (2 options) sur « Armure lourde ».

- [ ] **Step 1 : Ajouter l'entrée**

Dans `backend/src/DataFixtures/AppFixtures.php`, ajouter à la constante `CHOICE_OPTIONS_BY_CAPABILITY` (à côté de « Tatouages ») :

```php
        'Armure lourde' => [
            ['label' => '+1 DEF', 'bonuses' => [['target' => 'def', 'scalesWith' => 'fixed', 'value' => 1]]],
            ['label' => 'Armure de plaque (DEF +6)', 'armorCap' => 6],
        ],
```

(Le mécanisme de fusion dans `applyCapabilityEffect` est déjà en place — rien d'autre à changer.)

- [ ] **Step 2 : Recharger les fixtures**

Run: `docker compose exec -T backend bin/console doctrine:fixtures:load --no-interaction`
Expected: chargement sans erreur (destructif, attendu en dev).

- [ ] **Step 3 : Vérifier la donnée**

Run:
```bash
docker compose exec -T backend bin/console doctrine:query:sql \
  "SELECT name, effect FROM capability WHERE name = 'Armure lourde'"
```
Expected: `effect` JSON contient `choiceOptions` : option « +1 DEF » avec `bonuses` (def fixed 1) et option « Armure de plaque (DEF +6) » avec `armorCap: 6`.

- [ ] **Step 4 : Commit**

```bash
git add backend/src/DataFixtures/AppFixtures.php
git commit -m "feat(fixtures): choiceOptions de Guerrier Armure lourde (+1 DEF / plaque)"
```

---

## Self-Review

**Couverture spec :**
- Payload d'option `bonuses`/`armorCap` → Task 1 Step 3 + Task 2. ✓
- `computeCombatStats` choice-aware → Task 1 Step 4 + tests. ✓
- `resolveArmorCap` choice-aware → Task 1 Step 5 + tests. ✓
- Déclencheur `ChoicesPanel` (choiceOptions sans clé legacy) → Task 1 Step 7. ✓
- Guerrier « Armure lourde » peuplé → Task 2. ✓
- Exclusivité (une option) → par construction (une valeur de choix par rang). ✓
- Non-régression tatouage / capacités sans choix → l'ajout est conditionné à une option choisie correspondante. ✓
- Note hybride hors périmètre → non modélisée. ✓

**Placeholders :** aucun.

**Cohérence des types :** payload `{label, caracTestBonus?, bonuses?, armorCap?}` identique entre type (Task 1 Step 3), lecture (`computeCombatStats`/`resolveArmorCap`) et donnée PHP (Task 2). Clé de choix `String(c.rank)` cohérente avec #6a et avec l'écriture de `ChoicesPanel` (`setChoice` → `choices[String(rank)]`).

## Handoff exécution

Exécution en **subagent-driven** : un implémenteur par tâche, revue spec+qualité après chacune, revue finale de branche, puis PR.
