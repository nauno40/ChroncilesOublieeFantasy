# Bonus aux tests de caractéristique (#6a) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Résoudre les choix de capacité accordant un bonus aux *tests* d'une caractéristique (tatouage Barbare), via un mécanisme data-driven, affiché en rappel.

**Architecture:** (1) type `effect.caracTestBonus`/`choiceOptions` + fonction pure `resolveCaracTestBonuses` (TDD) ; (2) câblage hook + `ChoicesPanel` (menu déroulant) + `AttributesPanel` (badge) ; (3) données backend `CHOICE_OPTIONS_BY_CAPABILITY` (tatouage).

**Tech Stack:** React 19 + TypeScript (Vitest), Symfony 7.4 / PHP 8.3, Docker Compose.

## Global Constraints

- Spec de référence : `docs/superpowers/specs/2026-07-19-bonus-tests-carac-design.md`.
- C'est un bonus aux **tests**, jamais à la caractéristique : **aucune** propagation sur DEF/PV/attaque/mods.
- `resolveCaracTestBonuses` calque `computeDamageReduction` (`app/src/utils/cofRules.ts`) : même `byIri` (races+profiles+allVoies), même garde d'acquisition `c.rank >= 1 && c.rank <= entry.rank`, au rang courant de la voie.
- Seul le **tatouage** (Barbare « Tatouages ») est peuplé. Les bonus de tests conditionnels/contextuels restent en prose (hors périmètre).
- Commentaires en français.
- Gates (tous verts) : `docker compose exec -T frontend npx tsc -b` (0) ; `docker compose exec -T frontend npx vitest run` ; `docker compose exec -T frontend npm run lint` (0 **nouvelle** erreur, aucun nouveau `any` ; baseline ~130 tolérée).

---

### Task 1 : Types + `resolveCaracTestBonuses` (TDD)

**Files:**
- Modify: `app/src/utils/cofRules.ts` (interface `CapabilityEffect` ~243-246 ; nouvelle fonction)
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `CharacterVoieRef` (avec `choices?: Record<string, unknown>`), `CaracKey`, `CompendiumRace/Profile/Voie`.
- Produces: `CapabilityEffect.caracTestBonus?` / `choiceOptions?` ; `resolveCaracTestBonuses(voies, races, profiles, allVoies): Partial<Record<CaracKey, number>>`.

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter dans `app/src/utils/cofRules.test.ts` :

```ts
describe('resolveCaracTestBonuses', () => {
  const voie = {
    '@id': '/api/voies/tat', name: 'Voie du test',
    capabilities: [
      { rank: 2, name: 'Fixe', effect: { caracTestBonus: { carac: 'PER', value: 2 } } },
      { rank: 3, name: 'Tatouages', effect: { choiceOptions: [
        { label: 'Ours (+3 CON)', caracTestBonus: { carac: 'CON', value: 3 } },
        { label: 'Loup (+3 CHA)', caracTestBonus: { carac: 'CHA', value: 3 } },
      ] } },
    ],
  };
  const profiles = [{ voies: [voie] }] as unknown as Parameters<typeof resolveCaracTestBonuses>[2];

  it('applique un bonus fixe aux tests (capacité acquise)', () => {
    const r = resolveCaracTestBonuses([{ voie: '/api/voies/tat', rank: 2, source: 'profil' }], [], profiles, []);
    expect(r.PER).toBe(2);
    expect(r.CON ?? 0).toBe(0); // Tatouages (rang 3) pas encore acquis
  });
  it('résout le choix vers la carac choisie', () => {
    const r = resolveCaracTestBonuses(
      [{ voie: '/api/voies/tat', rank: 3, source: 'profil', choices: { '3': 'Ours (+3 CON)' } }],
      [], profiles, [],
    );
    expect(r.CON).toBe(3);
    expect(r.CHA ?? 0).toBe(0);
    expect(r.PER).toBe(2); // le fixe rang 2 reste acquis
  });
  it('aucun bonus de tatouage si le choix n\'est pas renseigné', () => {
    const r = resolveCaracTestBonuses([{ voie: '/api/voies/tat', rank: 3, source: 'profil' }], [], profiles, []);
    expect(r.CON ?? 0).toBe(0);
  });
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts -t "resolveCaracTestBonuses"`
Expected: FAIL (fonction absente).

- [ ] **Step 3 : Étendre le type**

Dans `app/src/utils/cofRules.ts`, remplacer `CapabilityEffect` :

```ts
export interface CapabilityEffect {
  evolutiveDie?: { count: number };
  bonuses?: CapabilityBonus[];
  armorCap?: number;
  caracTestBonus?: { carac: CaracKey; value: number };   // bonus fixe aux tests d'une carac
  choiceOptions?: { label: string; caracTestBonus?: { carac: CaracKey; value: number } }[]; // choix structuré
}
```

(`CaracKey` est déjà importé en tête de fichier.)

- [ ] **Step 4 : Implémenter `resolveCaracTestBonuses`**

Ajouter (après `resolveArmorCap`/`computeDamageReduction`, même structure) :

```ts
// Bonus aux TESTS de caractéristique (jamais à la carac elle-même) apportés par les
// capacités acquises : effect.caracTestBonus (fixe) + option choisie de effect.choiceOptions.
export const resolveCaracTestBonuses = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
): Partial<Record<CaracKey, number>> => {
  const byIri = new Map<string, CompendiumVoie>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);

  const out: Partial<Record<CaracKey, number>> = {};
  const add = (carac: CaracKey, value: number) => { out[carac] = (out[carac] ?? 0) + value; };

  (voies ?? []).forEach((entry) => {
    const v = byIri.get(entry.voie);
    (v?.capabilities ?? []).forEach((c) => {
      const rank = c.rank ?? 0;
      if (rank < 1 || rank > entry.rank || !c.effect) return;
      if (c.effect.caracTestBonus) add(c.effect.caracTestBonus.carac, c.effect.caracTestBonus.value);
      if (c.effect.choiceOptions) {
        const chosen = entry.choices?.[String(rank)];
        const opt = c.effect.choiceOptions.find((o) => o.label === chosen);
        if (opt?.caracTestBonus) add(opt.caracTestBonus.carac, opt.caracTestBonus.value);
      }
    });
  });
  return out;
};
```

- [ ] **Step 5 : Lancer les tests + type-check**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts && docker compose exec -T frontend npx tsc -b`
Expected: tous verts ; tsc 0.

- [ ] **Step 6 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(rules): resolveCaracTestBonuses + champs effect.caracTestBonus/choiceOptions"
```

---

### Task 2 : Câblage hook + `ChoicesPanel` (menu déroulant) + `AttributesPanel` (badge)

**Files:**
- Modify: `app/src/hooks/useCharacterSheet.ts` (import + memo + retour)
- Modify: `app/src/pages/CharacterSheet.tsx` (destructuration + rendu `<AttributesPanel>`)
- Modify: `app/src/components/character/AttributesPanel.tsx` (prop + badge)
- Modify: `app/src/components/character/ChoicesPanel.tsx` (menu déroulant si `effect.choiceOptions`)

**Interfaces:**
- Consumes: `resolveCaracTestBonuses` (Task 1).
- Produces: le hook expose `caracTestBonuses: Partial<Record<keyof Stats, number>>` ; `AttributesPanel` prend une prop du même type.

- [ ] **Step 1 : Exposer `caracTestBonuses` depuis le hook**

Dans `app/src/hooks/useCharacterSheet.ts` : ajouter `resolveCaracTestBonuses` à l'import `../utils/cofRules` ; après les autres dérivés, ajouter :

```ts
    // Bonus aux tests de carac (rappel ; n'affecte aucune valeur dérivée).
    const caracTestBonuses = useMemo(
        () => resolveCaracTestBonuses(characterVoies, races, profiles, allVoies),
        [characterVoies, races, profiles, allVoies],
    );
```

Ajouter `caracTestBonuses` à l'objet retourné.

- [ ] **Step 2 : Passer la prop dans `CharacterSheet`**

Dans `app/src/pages/CharacterSheet.tsx` : destructurer `caracTestBonuses` depuis `useCharacterSheet(...)` et l'ajouter au rendu `<AttributesPanel … caracTestBonuses={caracTestBonuses} />`.

- [ ] **Step 3 : Badge dans `AttributesPanel`**

Dans `app/src/components/character/AttributesPanel.tsx` :
- ajouter à l'interface `Props` : `caracTestBonuses?: Partial<Record<keyof Stats, number>>;` ;
- l'ajouter à la destructuration du composant ;
- dans la boucle des 7 caracs (`['AGI','CON',…].map((stat) => …`), à l'intérieur du cluster de droite (à côté de la « Valeur », ~ligne 225), ajouter :

```tsx
                            {(caracTestBonuses?.[stat] ?? 0) > 0 && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-700/40 text-amber-400" title="Bonus aux tests de cette caractéristique">
                                    tests +{caracTestBonuses![stat]}
                                </span>
                            )}
```

- [ ] **Step 4 : Menu déroulant dans `ChoicesPanel`**

Dans `app/src/components/character/ChoicesPanel.tsx` :
- étendre l'interface locale `CompendiumCap` avec `effect?: { choiceOptions?: { label: string }[] }` ;
- dans la construction des `rows`, ajouter à chaque ligne le champ `options?: string[]` = `cap.effect?.choiceOptions?.map(o => o.label)` ;
- au rendu, si `row.options` est non vide, rendre un `<select>` au lieu de l'`<input>` :

```tsx
                    {row.options && row.options.length > 0 ? (
                        <select
                            className="w-full bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                            value={row.value}
                            onChange={e => setChoice(row.idx, row.rank, e.target.value)}
                        >
                            <option value="">— choisir —</option>
                            {row.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    ) : (
                        <input
                            type="text"
                            className="w-full bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                            placeholder="Votre choix…"
                            value={row.value}
                            onChange={e => setChoice(row.idx, row.rank, e.target.value)}
                        />
                    )}
```

Mettre à jour le type de l'accumulateur `rows` pour inclure `options?: string[]`.

Note : `capabilityChoiceKey(details)` continue de détecter la ligne (le tatouage a `details.options_tatouages`) ; `effect.choiceOptions` ne fait qu'ajouter le menu déroulant. Les capacités à choix non structurées gardent le texte libre.

- [ ] **Step 5 : Type-check + tests + lint**

Run: `docker compose exec -T frontend npx tsc -b && docker compose exec -T frontend npx vitest run && docker compose exec -T frontend npm run lint`
Expected: tsc 0 ; vitest vert ; lint 0 nouvelle erreur.

- [ ] **Step 6 : Commit**

```bash
git add -A
git commit -m "feat(character): rappel bonus aux tests de carac + menu déroulant des choix structurés"
```

---

### Task 3 : Peupler `effect.choiceOptions` du tatouage (fixtures)

**Files:**
- Modify: `backend/src/DataFixtures/AppFixtures.php` (constante voisine de `COMBAT_BONUSES`/`ARMOR_CAP_BY_CAPABILITY` + `applyCapabilityEffect`)

**Interfaces:**
- Consumes: entité `Capability` (`getName()`, `setEffect(array)`).
- Produces: `Capability.effect.choiceOptions` (7 options) sur « Tatouages ».

- [ ] **Step 1 : Ajouter la table et la fusion**

Dans `backend/src/DataFixtures/AppFixtures.php`, ajouter une constante de classe :

```php
    /** Options structurées des capacités à choix (spec #6a : bonus aux tests de carac). */
    private const CHOICE_OPTIONS_BY_CAPABILITY = [
        'Tatouages' => [
            ['label' => 'Taureau (+3 FOR)',  'caracTestBonus' => ['carac' => 'FOR', 'value' => 3]],
            ['label' => 'Ours (+3 CON)',     'caracTestBonus' => ['carac' => 'CON', 'value' => 3]],
            ['label' => 'Panthère (+3 AGI)', 'caracTestBonus' => ['carac' => 'AGI', 'value' => 3]],
            ['label' => 'Chouette (+3 PER)', 'caracTestBonus' => ['carac' => 'PER', 'value' => 3]],
            ['label' => 'Loup (+3 CHA)',     'caracTestBonus' => ['carac' => 'CHA', 'value' => 3]],
            ['label' => 'Renard (+3 INT)',   'caracTestBonus' => ['carac' => 'INT', 'value' => 3]],
            ['label' => 'Serpent (+3 VOL)',  'caracTestBonus' => ['carac' => 'VOL', 'value' => 3]],
        ],
    ];
```

Dans `applyCapabilityEffect`, après le bloc `armorCap`, ajouter :

```php
        if (isset(self::CHOICE_OPTIONS_BY_CAPABILITY[$c->getName()])) {
            $effect['choiceOptions'] = self::CHOICE_OPTIONS_BY_CAPABILITY[$c->getName()];
        }
```

(le `setEffect($effect)` conditionné par `$effect !== []` reste inchangé.)

- [ ] **Step 2 : Recharger les fixtures**

Run: `docker compose exec -T backend bin/console doctrine:fixtures:load --no-interaction`
Expected: chargement sans erreur (destructif, attendu en dev).

- [ ] **Step 3 : Vérifier la donnée**

Run:
```bash
docker compose exec -T backend bin/console doctrine:query:sql \
  "SELECT name, effect FROM capability WHERE name = 'Tatouages'"
```
Expected: `effect` JSON contient `choiceOptions` avec les 7 options (« Ours (+3 CON) » → `caracTestBonus {carac: CON, value: 3}`).

- [ ] **Step 4 : Commit**

```bash
git add backend/src/DataFixtures/AppFixtures.php
git commit -m "feat(fixtures): effect.choiceOptions du tatouage (bonus aux tests de carac)"
```

---

## Self-Review

**Couverture spec :**
- Type `effect.caracTestBonus`/`choiceOptions` → Tasks 1 & 3. ✓
- `resolveCaracTestBonuses` au rang de voie, résout le choix → Task 1. ✓
- Menu déroulant des options structurées → Task 2 Step 4. ✓
- Rappel « tests +N » à côté de la carac → Task 2 Step 3. ✓
- Tatouage peuplé, 7 options → Task 3. ✓
- Aucune cascade sur les dérivés → `resolveCaracTestBonuses` renvoie un agrégat séparé, jamais injecté dans caracs/mods/DEF/PV. ✓
- Bonus conditionnels hors périmètre → non peuplés. ✓

**Placeholders :** aucun.

**Cohérence des types :** `resolveCaracTestBonuses(voies, races, profiles, allVoies): Partial<Record<CaracKey, number>>` identique entre Task 1 (impl+tests) et Task 2 (hook). `effect.choiceOptions[].label` + `caracTestBonus{carac,value}` identiques entre type (Task 1), lecture (`resolveCaracTestBonuses`, `ChoicesPanel`) et donnée PHP (Task 3). Prop `caracTestBonuses?: Partial<Record<keyof Stats, number>>` cohérente hook ↔ `AttributesPanel` (`CaracKey` == `keyof Stats`).

## Handoff exécution

Exécution en **subagent-driven** : un implémenteur par tâche, revue spec+qualité après chacune, revue finale de branche, puis PR.
