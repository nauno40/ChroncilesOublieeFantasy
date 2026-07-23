# Octroi de capacité de peuple (entrée de voie `trait`) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La capacité raciale choisie (`choix_capacite`) est réellement octroyée via une entrée `characterVoie` `source:'trait'` (rang 1, gratuite, hors plafond) dont les effets dérivent automatiquement.

**Architecture:** (1) rendre `'trait'` un `source` légal (front + backend) ; (2) l'exclure du budget/plafond + fonction pure d'éligibilité (cofRules, TDD) ; (3) `RacialGrantPanel` (sélecteur contraint) + câblage.

**Tech Stack:** React 19 + TypeScript (Vitest), Symfony 7.4 / PHP 8.3, Docker Compose.

## Global Constraints

- Spec de référence : `docs/superpowers/specs/2026-07-19-octroi-capacite-design.md`.
- Périmètre **rang 1 uniquement** (l'entrée trait est toujours `rank: 1`). Le cas « rang 2 à la place » est hors périmètre.
- La dérivation n'est **pas** modifiée : les fonctions itèrent déjà `characterVoies` et incluent l'entrée `'trait'`.
- Une seule entrée `'trait'` par personnage (la re-sélection remplace).
- Commentaires en français.
- Gates : `docker compose exec -T frontend npx tsc -b` (0) ; `docker compose exec -T frontend npx vitest run` ; `docker compose exec -T frontend npm run lint` (0 nouvelle erreur, aucun nouveau `any`).

---

### Task 1 : `'trait'` accepté comme source (front + backend)

**Files:**
- Modify: `app/src/types/character.ts` (`VoieSource`)
- Modify: `backend/src/Entity/CharacterVoie.php` (`Assert\Choice`)

**Interfaces:**
- Produces: `VoieSource` inclut `'trait'` ; l'API accepte `source: 'trait'`.

- [ ] **Step 1 : Étendre `VoieSource` (front)**

Dans `app/src/types/character.ts` :

```ts
export type VoieSource = 'profil' | 'peuple' | 'prestige' | 'hybride' | 'trait';
```

- [ ] **Step 2 : Autoriser `'trait'` côté backend**

Dans `backend/src/Entity/CharacterVoie.php`, mettre à jour la contrainte :

```php
    #[Assert\Choice(choices: ['profil', 'peuple', 'prestige', 'hybride', 'trait'])]
```

- [ ] **Step 3 : Vérifier la compilation front**

Run: `docker compose exec -T frontend npx tsc -b`
Expected: 0 erreur (aucun `switch` exhaustif sur `VoieSource` ne casse ; `voieKindOf('trait')` tombe sur la branche par défaut `'profile'`, `isProfil('trait')` renvoie `false`).

- [ ] **Step 4 : Commit**

```bash
git add app/src/types/character.ts backend/src/Entity/CharacterVoie.php
git commit -m "feat(model): source 'trait' pour les capacités octroyées par le peuple"
```

---

### Task 2 : Exclusions budget/plafond + `racialGrantInfo` (cofRules, TDD)

**Files:**
- Modify: `app/src/utils/cofRules.ts` (`computeSpentPoints`, `countCappedVoies` ; nouvelle fonction + type)
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: Task 1 (`VoieSource` inclut `'trait'`).
- Produces: `RacialGrant` + `racialGrantInfo(voies, races, profiles, allVoies): RacialGrant | null`.

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter dans `app/src/utils/cofRules.test.ts` :

```ts
describe('octroi de capacité (source trait)', () => {
  it('une entrée trait ne consomme aucun point', () => {
    const voies = [{ voie: '/api/voies/x', rank: 1, source: 'trait' as const }];
    expect(computeSpentPoints(voies, 1, false)).toBe(0);
  });
  it('une entrée trait ne compte pas dans le plafond de voies', () => {
    const voies = [
      { voie: '/a', rank: 1, source: 'profil' as const },
      { voie: '/t', rank: 1, source: 'trait' as const },
    ];
    expect(countCappedVoies(voies)).toBe(1);
  });

  const peupleVoie = {
    '@id': '/api/voies/peuple', name: 'Voie du demi-orque',
    capabilities: [
      { rank: 1, name: 'Impressionnant' },
      { rank: 2, name: 'Talent pour la violence', effect: { choiceOptions: [
        { label: 'Barbare (Rang 1)' }, { label: 'Guerrier (Rang 1)' },
      ] } },
    ],
  };
  const races = [{ availableVoies: [peupleVoie] }] as unknown as Parameters<typeof racialGrantInfo>[1];

  it('null si le peuple n\'est pas pris ou pas au bon rang', () => {
    expect(racialGrantInfo([], races, [], [])).toBeNull();
    expect(racialGrantInfo([{ voie: '/api/voies/peuple', rank: 1, source: 'peuple' }], races, [], [])).toBeNull();
  });
  it('éligible au rang requis : profils autorisés parsés', () => {
    const g = racialGrantInfo([{ voie: '/api/voies/peuple', rank: 2, source: 'peuple' }], races, [], []);
    expect(g).toEqual({ capabilityRank: 2, allowedProfiles: ['Barbare', 'Guerrier'] });
  });
  it('« N\'importe quel profil » → [\'*\']', () => {
    const any = [{ availableVoies: [{ '@id': '/v', name: 'V', capabilities: [
      { rank: 1, name: 'Touche-à-tout', effect: { choiceOptions: [{ label: "N'importe quel profil (Rang 1 ou 2)" }] } },
    ] }] }] as unknown as Parameters<typeof racialGrantInfo>[1];
    const g = racialGrantInfo([{ voie: '/v', rank: 1, source: 'peuple' }], any, [], []);
    expect(g?.allowedProfiles).toEqual(['*']);
  });
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts -t "octroi de capacité"`
Expected: FAIL (`racialGrantInfo` absente ; trait pas encore exclu).

- [ ] **Step 3 : Exclure `'trait'` du budget et du plafond**

Dans `computeSpentPoints`, au début du `forEach((v) => { … })` :

```ts
    if (v.source === 'trait') return; // capacité octroyée : gratuite (hors budget)
```

Dans `countCappedVoies` :

```ts
export const countCappedVoies = (voies: CharacterVoieRef[] | undefined): number =>
  (voies ?? []).filter(v => v.source !== 'peuple' && v.source !== 'trait').length;
```

- [ ] **Step 4 : Implémenter `racialGrantInfo`**

Ajouter dans `app/src/utils/cofRules.ts` (près de `resolveCaracTestBonuses`, même construction `byIri`) :

```ts
export interface RacialGrant {
  capabilityRank: number;      // rang de la capacité choix_capacite dans la voie de peuple
  allowedProfiles: string[];   // noms de profils autorisés ; ['*'] = tous
}

// Éligibilité au trait racial « choisir une capacité d'un profil » (spec #6, octroi).
// null si le peuple n'a pas ce trait, ou si la voie de peuple n'a pas atteint son rang.
export const racialGrantInfo = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
): RacialGrant | null => {
  const byIri = new Map<string, CompendiumVoie>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);

  const peuple = (voies ?? []).find(e => e.source === 'peuple');
  if (!peuple) return null;
  const v = byIri.get(peuple.voie);
  if (!v) return null;
  const cap = (v.capabilities ?? []).find(c => (c.effect?.choiceOptions?.length ?? 0) > 0);
  const capRank = cap?.rank ?? 0;
  if (!cap || capRank < 1 || peuple.rank < capRank) return null;

  const labels = (cap.effect?.choiceOptions ?? []).map(o => o.label);
  const allowedProfiles = labels.some(l => /importe quel profil/i.test(l))
    ? ['*']
    : labels.map(l => l.split(' (')[0].trim());
  return { capabilityRank: capRank, allowedProfiles };
};
```

- [ ] **Step 5 : Lancer les tests + type-check**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts && docker compose exec -T frontend npx tsc -b`
Expected: tous verts ; tsc 0.

- [ ] **Step 6 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(rules): trait hors budget/plafond + racialGrantInfo (éligibilité octroi)"
```

---

### Task 3 : `RacialGrantPanel` + câblage

**Files:**
- Create: `app/src/components/character/RacialGrantPanel.tsx`
- Modify: `app/src/hooks/useCharacterSheet.ts` (import + memo + retour)
- Modify: `app/src/pages/CharacterSheet.tsx` (destructuration + rendu conditionnel)

**Interfaces:**
- Consumes: `racialGrantInfo`, `RacialGrant` (Task 2).
- Produces: le hook expose `racialGrant: RacialGrant | null` ; `<RacialGrantPanel>` écrit l'entrée `{rank:1, source:'trait'}`.

- [ ] **Step 1 : Créer `RacialGrantPanel`**

Créer `app/src/components/character/RacialGrantPanel.tsx` :

```tsx
import React from 'react';
import type { Character } from '../../types/character';
import type { ProfileList } from './types';
import type { RacialGrant } from '../../utils/cofRules';

interface VoieLite { '@id'?: string; name?: string; capabilities?: { rank?: number; name?: string }[] }
interface ProfileLite { name?: string; voies?: VoieLite[] }

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    profiles: ProfileList;
    grant: RacialGrant;
}

/** Capacité octroyée par le peuple (trait `choix_capacite`) : une capacité de rang 1 d'un profil autorisé, gratuite. */
export const RacialGrantPanel: React.FC<Props> = ({ character, setCharacter, profiles, grant }) => {
    const all = grant.allowedProfiles.includes('*');
    const allowed = (profiles as ProfileLite[]).filter(p => all || (!!p.name && grant.allowedProfiles.includes(p.name)));
    const options: { iri: string; label: string }[] = [];
    for (const p of allowed) for (const v of (p.voies ?? [])) if (v['@id']) options.push({ iri: v['@id'], label: `${p.name} — ${v.name}` });

    const current = (character.characterVoies ?? []).find(e => e.source === 'trait');
    const value = current?.voie ?? '';
    const chosenVoie = allowed.flatMap(p => p.voies ?? []).find(v => v['@id'] === value);
    const grantedCap = (chosenVoie?.capabilities ?? []).find(c => c.rank === 1)?.name;

    const setVoie = (iri: string) =>
        setCharacter(prev => {
            const cv = (prev.characterVoies ?? []).filter(e => e.source !== 'trait');
            if (iri) cv.push({ voie: iri, rank: 1, source: 'trait' });
            return { ...prev, characterVoies: cv };
        });

    return (
        <div className="glass-panel p-4 rounded-2xl border-white/5 bg-stone-900/10 space-y-2">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Capacité de peuple</h3>
            <p className="text-[10px] text-stone-500 italic leading-snug">
                Une capacité de rang 1 {all ? "de n'importe quel profil" : `de ${grant.allowedProfiles.join(' ou ')}`}, offerte par ton peuple (gratuite).
            </p>
            <select
                className="w-full bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                value={value}
                onChange={e => setVoie(e.target.value)}
            >
                <option value="">— aucune —</option>
                {options.map(o => <option key={o.iri} value={o.iri}>{o.label}</option>)}
            </select>
            {grantedCap && <p className="text-[10px] text-stone-400">Capacité octroyée : <strong className="text-stone-200">{grantedCap}</strong></p>}
        </div>
    );
};
```

- [ ] **Step 2 : Exposer `racialGrant` depuis le hook**

Dans `app/src/hooks/useCharacterSheet.ts` : ajouter `racialGrantInfo` (et le type `RacialGrant` si besoin) à l'import `../utils/cofRules` ; ajouter :

```ts
    // Trait racial « choisir une capacité d'un profil » (octroi, source:'trait').
    const racialGrant = useMemo(
        () => racialGrantInfo(characterVoies, races, profiles, allVoies),
        [characterVoies, races, profiles, allVoies],
    );
```

Ajouter `racialGrant` à l'objet retourné.

- [ ] **Step 3 : Rendre le panneau dans `CharacterSheet`**

Dans `app/src/pages/CharacterSheet.tsx` : importer `RacialGrantPanel` ; destructurer `racialGrant` depuis `useCharacterSheet(...)` ; rendre le panneau (section « Voies & Progression », après `ChoicesPanel`) :

```tsx
                        {racialGrant && <RacialGrantPanel character={character} setCharacter={setCharacter} profiles={profiles} grant={racialGrant} />}
```

- [ ] **Step 4 : Type-check + tests + lint**

Run: `docker compose exec -T frontend npx tsc -b && docker compose exec -T frontend npx vitest run && docker compose exec -T frontend npm run lint`
Expected: tsc 0 ; vitest vert ; lint 0 nouvelle erreur.

- [ ] **Step 5 : Commit**

```bash
git add -A
git commit -m "feat(character): RacialGrantPanel — octroi d'une capacité de peuple (source trait)"
```

---

## Self-Review

**Couverture spec :**
- `'trait'` accepté front + backend → Task 1. ✓
- Exclusions budget/plafond → Task 2 Step 3. ✓
- `racialGrantInfo` (éligibilité + profils, parse « N'importe ») → Task 2 Step 4 + tests. ✓
- `RacialGrantPanel` (sélecteur contraint, entrée trait rang 1, capacité affichée, retrait) → Task 3. ✓
- Dérivation automatique (aucun changement) → garanti par l'itération existante de `characterVoies`. ✓
- Une seule entrée trait (re-sélection remplace) → `filter(source!=='trait')` puis push. ✓
- Rang 1 uniquement / rang 2 différé → l'entrée est toujours `rank:1`. ✓

**Placeholders :** aucun.

**Cohérence des types :** `RacialGrant { capabilityRank, allowedProfiles }` identique entre cofRules (Task 2), hook et `RacialGrantPanel` (Task 3). Entrée `{ voie, rank: 1, source: 'trait' }` conforme à `CharacterVoieRef`. `racialGrantInfo(voies, races, profiles, allVoies)` identique entre impl, tests et appel hook.

## Handoff exécution

Exécution en **subagent-driven** : un implémenteur par tâche, revue spec+qualité après chacune, revue finale de branche, puis PR.
