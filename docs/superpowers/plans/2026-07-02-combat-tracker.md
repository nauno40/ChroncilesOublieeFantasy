# Combat Tracker Refonte Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le Suivi de Combat (`CombatTracker.tsx`, aujourd'hui un mock) en outil MJ réel : données réelles (bestiaire + PJ), initiative fixe COF2, états préjudiciables, persistance `localStorage`.

**Architecture:** 100 % client-side React. La logique pure (tri initiative, avance de tour, retrait) vit dans un module testé `utils/combatTracker.ts`. Le composant `CombatTracker.tsx` gère l'état React, la persistance (`co_combat_tracker`) et le rendu. Les données proviennent des services existants (`DataService`, `ApiService`). Aucun backend, aucun temps réel.

**Tech Stack:** React 19 + TypeScript, Vite, Tailwind v4, lucide-react (icônes), Vitest (tests). Pas de nouvelle dépendance.

## Global Constraints

- Frontend uniquement, dans `app/`. Aucune modification backend.
- Persistance via `localStorage`, clé préfixée `co_` : `co_combat_tracker` (convention maison, cf. `co_soundboard_tracks`).
- Initiative = valeur fixe COF2 (pas de jet de dé). Tri décroissant.
- `npm run build` (type-check) et `npm run lint` sans **nouvelle** erreur (baseline connue : ~163 no-explicit-any pré-existants ; « lint OK » = pas de nouvelle erreur).
- Commandes exécutées depuis `app/`. Le projet tourne aussi en Docker mais `npm` local suffit pour build/lint/test.
- Français pour l'UI et les commentaires.

---

## File Structure

- `app/src/types/campaign.ts` — **modifié** : interface `Combatant` (renommer `ac`→`def`, ajouter `states`, `source`).
- `app/src/utils/combatTracker.ts` — **créé** : logique pure (`TrackerState`, `sortByInitiative`, `nextTurn`, `removeById`, `applyHp`).
- `app/src/utils/combatTracker.test.ts` — **créé** : tests unitaires Vitest de la logique pure.
- `app/src/pages/CombatTracker.tsx` — **réécrit** : composant complet (état, persistance, ajout, tours, PV, import, états).

Décomposition : Task 1 pose le socle testé (types + logique pure). Task 2 réécrit le composant avec l'ajout manuel + persistance + tours + PV. Task 3 ajoute l'import bestiaire/PJ. Task 4 ajoute les états préjudiciables.

---

### Task 1: Logique pure + type Combatant (TDD)

**Files:**
- Modify: `app/src/types/campaign.ts:57-65` (interface `Combatant`)
- Create: `app/src/utils/combatTracker.ts`
- Test: `app/src/utils/combatTracker.test.ts`

**Interfaces:**
- Produces (consommés par Task 2/3/4) :
  - `interface Combatant { id: string; name: string; type: 'player'|'npc'|'monster'; initiative: number; hp: { current: number; max: number }; def: number; states: string[]; source?: 'manual'|'bestiary'|'character'; referenceId?: string }`
  - `interface TrackerState { round: number; activeId: string | null; combatants: Combatant[] }`
  - `sortByInitiative(combatants: Combatant[]): Combatant[]`
  - `nextTurn(state: TrackerState): TrackerState`
  - `removeById(state: TrackerState, id: string): TrackerState`
  - `applyHp(combatants: Combatant[], id: string, delta: number): Combatant[]`

- [ ] **Step 1: Mettre à jour l'interface `Combatant`**

Dans `app/src/types/campaign.ts`, remplacer l'interface existante (lignes ~57-65) par :

```ts
export interface Combatant {
    id: string;
    name: string;
    type: 'player' | 'npc' | 'monster';
    initiative: number;
    hp: { current: number; max: number };
    def: number;
    states: string[];
    source?: 'manual' | 'bestiary' | 'character';
    referenceId?: string; // ID source (bestiaire/perso)
}
```

- [ ] **Step 2: Écrire les tests (qui échouent)**

Créer `app/src/utils/combatTracker.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import type { Combatant } from '../types/campaign';
import type { TrackerState } from './combatTracker';
import { sortByInitiative, nextTurn, removeById, applyHp } from './combatTracker';

const mk = (id: string, initiative: number, hp = 10): Combatant => ({
    id, name: id, type: 'monster', initiative,
    hp: { current: hp, max: hp }, def: 10, states: [],
});

const state = (combatants: Combatant[], activeId: string | null, round = 1): TrackerState =>
    ({ round, activeId, combatants });

describe('sortByInitiative', () => {
    it('trie par initiative décroissante', () => {
        const r = sortByInitiative([mk('a', 5), mk('b', 12), mk('c', 8)]);
        expect(r.map(c => c.id)).toEqual(['b', 'c', 'a']);
    });
    it('conserve l\'ordre d\'insertion en cas d\'égalité (stable)', () => {
        const r = sortByInitiative([mk('a', 10), mk('b', 10), mk('c', 10)]);
        expect(r.map(c => c.id)).toEqual(['a', 'b', 'c']);
    });
});

describe('nextTurn', () => {
    it('avance au combattant suivant sans changer le round', () => {
        const r = nextTurn(state([mk('a', 20), mk('b', 10)], 'a', 1));
        expect(r.activeId).toBe('b');
        expect(r.round).toBe(1);
    });
    it('boucle du dernier au premier et incrémente le round', () => {
        const r = nextTurn(state([mk('a', 20), mk('b', 10)], 'b', 1));
        expect(r.activeId).toBe('a');
        expect(r.round).toBe(2);
    });
    it('démarre au premier sans incrémenter quand activeId est null', () => {
        const r = nextTurn(state([mk('a', 20), mk('b', 10)], null, 1));
        expect(r.activeId).toBe('a');
        expect(r.round).toBe(1);
    });
    it('met activeId à null sur liste vide', () => {
        const r = nextTurn(state([], 'a', 3));
        expect(r.activeId).toBeNull();
    });
});

describe('removeById', () => {
    it('laisse le tour actif intact quand on retire un autre combattant', () => {
        const r = removeById(state([mk('a', 20), mk('b', 10), mk('c', 5)], 'b'), 'c');
        expect(r.activeId).toBe('b');
        expect(r.combatants.map(c => c.id)).toEqual(['a', 'b']);
    });
    it('déplace le tour actif au combattant occupant la position quand on retire l\'actif', () => {
        const r = removeById(state([mk('a', 20), mk('b', 10), mk('c', 5)], 'b'), 'b');
        expect(r.activeId).toBe('c');
    });
    it('clampe le tour actif au dernier quand on retire le dernier (actif)', () => {
        const r = removeById(state([mk('a', 20), mk('b', 10)], 'b'), 'b');
        expect(r.activeId).toBe('a');
    });
    it('met activeId à null quand plus personne', () => {
        const r = removeById(state([mk('a', 20)], 'a'), 'a');
        expect(r.activeId).toBeNull();
    });
});

describe('applyHp', () => {
    it('applique des dégâts et clampe à 0', () => {
        const r = applyHp([mk('a', 10, 6)], 'a', -9);
        expect(r[0].hp.current).toBe(0);
    });
    it('soigne sans dépasser le max', () => {
        const dmg = applyHp([mk('a', 10, 10)], 'a', -4); // 6/10
        const r = applyHp(dmg, 'a', 8); // clamp 10
        expect(r[0].hp.current).toBe(10);
    });
});
```

- [ ] **Step 3: Lancer les tests pour vérifier qu'ils échouent**

Run: `cd app && npm run test:run -- combatTracker`
Expected: FAIL (`Failed to resolve import './combatTracker'` / fonctions absentes).

- [ ] **Step 4: Implémenter le module pur**

Créer `app/src/utils/combatTracker.ts` :

```ts
import type { Combatant } from '../types/campaign';

export interface TrackerState {
    round: number;
    activeId: string | null;
    combatants: Combatant[];
}

/** Tri par initiative décroissante, stable en cas d'égalité (ordre d'insertion). */
export const sortByInitiative = (combatants: Combatant[]): Combatant[] =>
    combatants
        .map((c, i) => ({ c, i }))
        .sort((a, b) => b.c.initiative - a.c.initiative || a.i - b.i)
        .map(({ c }) => c);

/** Avance au combattant suivant dans l'ordre d'initiative ; wrap => round + 1. */
export const nextTurn = (state: TrackerState): TrackerState => {
    const order = sortByInitiative(state.combatants);
    if (order.length === 0) return { ...state, activeId: null };
    const idx = order.findIndex(c => c.id === state.activeId);
    // Pas de tour actif (ou introuvable) : on démarre au premier, round inchangé.
    if (idx === -1) return { ...state, activeId: order[0].id };
    const nextIdx = (idx + 1) % order.length;
    const wrapped = nextIdx === 0;
    return {
        ...state,
        activeId: order[nextIdx].id,
        round: wrapped ? state.round + 1 : state.round,
    };
};

/** Retire un combattant par id sans corrompre le tour actif. */
export const removeById = (state: TrackerState, id: string): TrackerState => {
    const order = sortByInitiative(state.combatants);
    const removedIdx = order.findIndex(c => c.id === id);
    const remaining = order.filter(c => c.id !== id);
    let activeId = state.activeId;
    if (state.activeId === id) {
        activeId = remaining.length === 0
            ? null
            : remaining[Math.min(removedIdx, remaining.length - 1)].id;
    }
    return { ...state, combatants: remaining, activeId };
};

/** Applique un delta de PV, clampé entre 0 et max. */
export const applyHp = (combatants: Combatant[], id: string, delta: number): Combatant[] =>
    combatants.map(c =>
        c.id === id
            ? { ...c, hp: { ...c.hp, current: Math.max(0, Math.min(c.hp.max, c.hp.current + delta)) } }
            : c,
    );
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

Run: `cd app && npm run test:run -- combatTracker`
Expected: PASS (tous les `describe` verts).

- [ ] **Step 6: Type-check + lint**

Run: `cd app && npm run build && npm run lint`
Expected: build OK ; aucune **nouvelle** erreur lint (le fichier `CombatTracker.tsx` référence encore `ac` → il sera réécrit en Task 2 ; si le build casse à cause de `ac`, passer directement Task 2 dans le même lot et committer ensemble). Note : la référence à `ac` dans `CombatTracker.tsx` **cassera `tsc`**. Pour garder Task 1 committable isolément, appliquer d'abord Task 2 Step 1 (le remplacement complet du fichier) avant ce build, OU committer Task 1 puis Task 2 sans build intermédiaire. Recommandé : committer Task 1 (types + util + tests verts) sans le build global, le build complet est validé en fin de Task 2.

- [ ] **Step 7: Commit**

```bash
cd app && git add src/types/campaign.ts src/utils/combatTracker.ts src/utils/combatTracker.test.ts
git commit -m "feat(combat): pure combat-tracker logic + Combatant type (COF2 init)"
```

---

### Task 2: Réécriture du composant — persistance, ajout manuel, tours, PV

**Files:**
- Modify (réécriture complète): `app/src/pages/CombatTracker.tsx`

**Interfaces:**
- Consumes (de Task 1) : `TrackerState`, `sortByInitiative`, `nextTurn`, `removeById`, `applyHp`, `Combatant`.
- Produces : composant `CombatTracker` exporté (déjà routé `/tools/tracker` dans `App.tsx:52` — inchangé). Établit la clé `localStorage` `co_combat_tracker` et l'état `hpInputs: Record<string,string>` réutilisés en Task 3/4.

- [ ] **Step 1: Réécrire `CombatTracker.tsx`**

Remplacer **tout** le contenu de `app/src/pages/CombatTracker.tsx` par :

```tsx
import React, { useState, useEffect } from 'react';
import { Sword, RefreshCw, Trash2, Shield } from 'lucide-react';
import type { Combatant } from '../types/campaign';
import type { TrackerState } from '../utils/combatTracker';
import { sortByInitiative, nextTurn, removeById, applyHp } from '../utils/combatTracker';

const STORAGE_KEY = 'co_combat_tracker';

const loadState = (): TrackerState => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved) as TrackerState;
    } catch {
        // stockage corrompu : on repart propre
    }
    return { round: 1, activeId: null, combatants: [] };
};

export const CombatTracker: React.FC = () => {
    const [state, setState] = useState<TrackerState>(loadState);
    const [hpInputs, setHpInputs] = useState<Record<string, string>>({});

    // Formulaire d'ajout manuel
    const [name, setName] = useState('');
    const [init, setInit] = useState('');
    const [hp, setHp] = useState('');
    const [def, setDef] = useState('');
    const [type, setType] = useState<'player' | 'monster'>('monster');

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const ordered = sortByInitiative(state.combatants);

    const addCombatant = (c: Combatant) =>
        setState(s => ({ ...s, combatants: [...s.combatants, c] }));

    const addManual = () => {
        if (!name.trim()) return;
        const maxHp = parseInt(hp) || 0;
        addCombatant({
            id: crypto.randomUUID(),
            name: name.trim(),
            type,
            initiative: parseInt(init) || 0,
            hp: { current: maxHp, max: maxHp },
            def: parseInt(def) || 0,
            states: [],
            source: 'manual',
        });
        setName(''); setInit(''); setHp(''); setDef('');
    };

    const handleNext = () => setState(s => nextTurn(s));
    const handleRemove = (id: string) => setState(s => removeById(s, id));
    const changeHp = (id: string, delta: number) =>
        setState(s => ({ ...s, combatants: applyHp(s.combatants, id, delta) }));

    const applyInput = (id: string, sign: 1 | -1) => {
        const amount = parseInt(hpInputs[id] || '');
        if (!amount) return;
        changeHp(id, sign * amount);
        setHpInputs(prev => ({ ...prev, [id]: '' }));
    };

    const resetCombat = () => {
        if (state.combatants.length && !window.confirm('Vider le combat en cours ?')) return;
        setState({ round: 1, activeId: null, combatants: [] });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                    <h1 className="text-3xl font-display font-bold text-primary-400 flex items-center gap-3 drop-shadow-md">
                        <Sword className="text-primary-600" size={32} /> Suivi de Combat
                    </h1>
                    <div className="text-stone-400 font-mono text-sm mt-1 ml-1">
                        ROUND <span className="text-primary-300 font-bold text-lg">{state.round}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={resetCombat}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded-xl text-sm font-bold border border-white/10 transition-colors">
                        Réinitialiser
                    </button>
                    <button onClick={handleNext}
                        className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-stone-950 px-6 py-2 rounded-xl flex items-center gap-2 font-bold cursor-pointer transition-all shadow-lg hover:shadow-primary-500/20 active:scale-95">
                        <RefreshCw size={20} /> Tour Suivant
                    </button>
                </div>
            </header>

            {/* Ajout manuel */}
            <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-3 shadow-lg items-end">
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Nom du combattant"
                    className="flex-1 min-w-[160px] bg-black/40 border border-white/10 text-stone-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600"
                    onKeyDown={e => e.key === 'Enter' && addManual()} />
                <input type="number" value={init} onChange={e => setInit(e.target.value)} placeholder="INIT"
                    className="w-20 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                <input type="number" value={hp} onChange={e => setHp(e.target.value)} placeholder="PV"
                    className="w-20 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                <input type="number" value={def} onChange={e => setDef(e.target.value)} placeholder="DEF"
                    className="w-20 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                <select value={type} onChange={e => setType(e.target.value as 'player' | 'monster')}
                    className="bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="monster">Adversaire</option>
                    <option value="player">Personnage</option>
                </select>
                <button onClick={addManual}
                    className="bg-primary-900/40 hover:bg-primary-800/60 text-primary-200 px-4 py-2 rounded-lg text-sm font-bold border border-primary-500/30 transition-colors uppercase tracking-wide">
                    + Ajouter
                </button>
            </div>

            {/* Liste */}
            <div className="space-y-3">
                {ordered.map(c => (
                    <div key={c.id}
                        className={`relative flex flex-wrap items-center gap-3 p-4 rounded-xl border transition-all duration-300 backdrop-blur-md ${
                            c.id === state.activeId
                                ? 'bg-primary-900/20 border-primary-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.02] z-10'
                                : 'bg-stone-900/40 border-white/5 opacity-80 hover:opacity-100 hover:bg-stone-800/60'
                        }`}>
                        {c.id === state.activeId && (
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary-500 rounded-r shadow-[0_0_10px_#f59e0b]" />
                        )}

                        <div className="w-14 text-center">
                            <span className="text-[10px] text-stone-500 uppercase block font-bold mb-0.5">INIT</span>
                            <div className="text-2xl font-display font-bold text-stone-300 border-2 border-white/10 rounded-lg py-1 bg-black/20">{c.initiative}</div>
                        </div>

                        <div className="flex-1 min-w-[120px]">
                            <div className={`font-bold text-lg font-display ${c.type === 'player' ? 'text-blue-300' : 'text-red-300'}`}>{c.name}</div>
                            <div className="text-xs text-stone-500 flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                    <Shield size={12} className="text-stone-400" /> <span className="text-stone-300 font-mono font-bold">DEF {c.def}</span>
                                </span>
                            </div>
                        </div>

                        {/* PV : ±1 rapides + saisie libre dégâts/soins */}
                        <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                            <div className="flex flex-col items-center w-16">
                                <span className="text-[9px] text-stone-500 uppercase font-bold mb-0.5">PV</span>
                                <div className={`font-mono text-xl font-bold ${c.hp.current < c.hp.max / 2 ? 'text-red-500' : 'text-green-500'}`}>
                                    {c.hp.current}<span className="text-xs text-stone-600 font-normal ml-0.5">/{c.hp.max}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button onClick={() => changeHp(c.id, 1)} className="bg-stone-800 hover:bg-green-900/50 text-green-500 w-8 h-6 rounded flex items-center justify-center text-xs border border-stone-700 transition-all active:scale-95">+</button>
                                <button onClick={() => changeHp(c.id, -1)} className="bg-stone-800 hover:bg-red-900/50 text-red-500 w-8 h-6 rounded flex items-center justify-center text-xs border border-stone-700 transition-all active:scale-95">-</button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <input type="number" value={hpInputs[c.id] || ''}
                                    onChange={e => setHpInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                                    placeholder="±"
                                    className="w-14 bg-black/40 border border-white/10 text-stone-100 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                                <div className="flex gap-1">
                                    <button onClick={() => applyInput(c.id, -1)} className="flex-1 bg-red-900/40 hover:bg-red-800/60 text-red-200 rounded text-[10px] font-bold py-0.5 border border-red-500/30">Dég.</button>
                                    <button onClick={() => applyInput(c.id, 1)} className="flex-1 bg-green-900/40 hover:bg-green-800/60 text-green-200 rounded text-[10px] font-bold py-0.5 border border-green-500/30">Soin</button>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => handleRemove(c.id)} className="text-stone-600 hover:text-red-500 p-2 rounded-full hover:bg-stone-900/50 transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {ordered.length === 0 && (
                    <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-stone-800/50 bg-stone-900/20 backdrop-blur-sm">
                        <Sword size={48} className="mx-auto mb-4 text-stone-700 opacity-50" />
                        <p className="text-stone-400 font-display text-lg">Le champ de bataille est vide.</p>
                        <p className="text-stone-600 text-sm mt-1">Ajoutez des combattants pour commencer.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
```

- [ ] **Step 2: Type-check + lint**

Run: `cd app && npm run build && npm run lint`
Expected: build OK (plus aucune référence à `ac`) ; aucune **nouvelle** erreur lint.

- [ ] **Step 3: Vérification manuelle (persistance + tours)**

Run: `cd app && npm run dev` puis ouvrir `http://localhost:5173/tools/tracker` (connecté).
Vérifier : ajouter 3 combattants manuels avec des INIT différentes → liste triée décroissant ; « Tour Suivant » surligne successivement, wrap → ROUND passe à 2 ; « Dég. » 5 retire 5 PV (clamp 0), « Soin » ne dépasse pas le max ; supprimer le combattant actif ne casse pas le surlignage ; **recharger la page** → l'état est restauré.

- [ ] **Step 4: Commit**

```bash
cd app && git add src/pages/CombatTracker.tsx
git commit -m "feat(combat): rewrite tracker with persistence, manual add, HP damage/heal"
```

---

### Task 3: Import depuis le bestiaire et les personnages

**Files:**
- Modify: `app/src/pages/CombatTracker.tsx`

**Interfaces:**
- Consumes : `DataService.getCreatures()` → `Creature[]` (`{ id, name, hp, init, def }`), `ApiService.getAll<Character>('characters')` → `Character[]` (`{ id, name, data: { hp:{current,max}, init, def } }`), `addCombatant`, `Combatant` (de Task 2).
- Produces : combattants avec `source: 'bestiary' | 'character'` et `referenceId`, numérotation auto des doublons.

- [ ] **Step 1: Ajouter les imports de données et l'état d'import**

Dans `app/src/pages/CombatTracker.tsx`, compléter les imports en tête de fichier :

```tsx
import { DataService } from '../services/dataService';
import { ApiService } from '../services/api';
import type { Creature } from '../types/normalized';
import type { Character } from '../types/character';
```

Puis, à l'intérieur du composant, sous les états du formulaire manuel, ajouter :

```tsx
    // Import bestiaire / PJ
    const [creatures, setCreatures] = useState<Creature[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [creatureId, setCreatureId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [characterId, setCharacterId] = useState('');

    useEffect(() => {
        DataService.getCreatures().then(setCreatures).catch(() => setCreatures([]));
        ApiService.getAll<Character>('characters').then(setCharacters).catch(() => setCharacters([]));
    }, []);
```

- [ ] **Step 2: Ajouter les fonctions d'import (numérotation auto des doublons)**

Sous `addManual`, ajouter :

```tsx
    const addFromBestiary = () => {
        const creature = creatures.find(c => String(c.id) === creatureId);
        if (!creature) return;
        const qty = Math.max(1, parseInt(quantity) || 1);
        const additions: Combatant[] = Array.from({ length: qty }, () => ({
            id: crypto.randomUUID(),
            name: qty > 1 ? '' : creature.name, // numéroté juste après
            type: 'monster' as const,
            initiative: creature.init,
            hp: { current: creature.hp, max: creature.hp },
            def: creature.def,
            states: [],
            source: 'bestiary' as const,
            referenceId: String(creature.id),
        }));
        // Numérotation : « Gobelin 1 », « Gobelin 2 » si quantité > 1, sinon nom brut
        additions.forEach((c, i) => { c.name = qty > 1 ? `${creature.name} ${i + 1}` : creature.name; });
        setState(s => ({ ...s, combatants: [...s.combatants, ...additions] }));
        setQuantity('1');
    };

    const addFromCharacter = () => {
        const character = characters.find(c => String(c.id) === characterId);
        if (!character) return;
        addCombatant({
            id: crypto.randomUUID(),
            name: character.name,
            type: 'player',
            initiative: character.data.init,
            hp: { current: character.data.hp.current, max: character.data.hp.max },
            def: character.data.def,
            states: [],
            source: 'character',
            referenceId: String(character.id),
        });
    };
```

- [ ] **Step 3: Ajouter les panneaux d'import dans l'UI**

Juste **après** le bloc « Ajout manuel » (le `div.glass-panel` du formulaire) et **avant** le bloc `{/* Liste */}`, insérer :

```tsx
            {/* Import bestiaire / PJ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-2 items-end shadow-lg">
                    <div className="text-xs text-stone-400 uppercase font-bold w-full">Bestiaire</div>
                    <select value={creatureId} onChange={e => setCreatureId(e.target.value)}
                        className="flex-1 min-w-[140px] bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="">— Créature —</option>
                        {creatures.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                    <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
                        className="w-16 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    <button onClick={addFromBestiary}
                        className="bg-red-900/40 hover:bg-red-800/60 text-red-200 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/30 transition-colors">+ Monstre</button>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-2 items-end shadow-lg">
                    <div className="text-xs text-stone-400 uppercase font-bold w-full">Personnages</div>
                    <select value={characterId} onChange={e => setCharacterId(e.target.value)}
                        className="flex-1 min-w-[140px] bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="">— Personnage —</option>
                        {characters.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                    <button onClick={addFromCharacter}
                        className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 px-4 py-2 rounded-lg text-sm font-bold border border-blue-500/30 transition-colors">+ PJ</button>
                </div>
            </div>
```

- [ ] **Step 4: Type-check + lint**

Run: `cd app && npm run build && npm run lint`
Expected: build OK ; aucune **nouvelle** erreur lint.

- [ ] **Step 5: Vérification manuelle (import)**

Run: `cd app && npm run dev` → `/tools/tracker`.
Vérifier : sélectionner une créature + quantité 3 → « + Monstre » ajoute « <Nom> 1/2/3 » avec PV/INIT/DEF du bestiaire ; sélectionner un PJ → « + PJ » ajoute le perso avec ses INIT/DEF/PV réels ; les nouveaux combattants s'insèrent au bon rang d'initiative.

- [ ] **Step 6: Commit**

```bash
cd app && git add src/pages/CombatTracker.tsx
git commit -m "feat(combat): import combatants from bestiary and player characters"
```

---

### Task 4: États préjudiciables (badges)

**Files:**
- Modify: `app/src/pages/CombatTracker.tsx`

**Interfaces:**
- Consumes : `DataService.getStates()` → `HarmfulState[]` (`{ id, name, description, image }`), l'état `state.combatants[].states: string[]` (de Task 1).
- Produces : ajout/retrait d'états sur un combattant, rendus en badges.

- [ ] **Step 1: Charger les états et ajouter les helpers**

Compléter l'import de types en tête de fichier :

```tsx
import type { Creature, HarmfulState } from '../types/normalized';
```

(remplace la ligne `import type { Creature } from '../types/normalized';` de Task 3.)

Ajouter l'état + le chargement dans le composant :

```tsx
    const [harmfulStates, setHarmfulStates] = useState<HarmfulState[]>([]);

    useEffect(() => {
        DataService.getStates().then(setHarmfulStates).catch(() => setHarmfulStates([]));
    }, []);
```

Ajouter les helpers d'ajout/retrait d'état (sous `changeHp`) :

```tsx
    const addState = (id: string, stateName: string) => {
        if (!stateName) return;
        setState(s => ({
            ...s,
            combatants: s.combatants.map(c =>
                c.id === id && !c.states.includes(stateName)
                    ? { ...c, states: [...c.states, stateName] } : c),
        }));
    };

    const removeState = (id: string, stateName: string) =>
        setState(s => ({
            ...s,
            combatants: s.combatants.map(c =>
                c.id === id ? { ...c, states: c.states.filter(n => n !== stateName) } : c),
        }));
```

- [ ] **Step 2: Afficher les badges + sélecteur dans chaque rangée**

Dans le `<div className="flex-1 min-w-[120px]">` de la rangée, **après** le `<div>` contenant le badge « DEF », ajouter un bloc états :

```tsx
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                {c.states.map(stateName => (
                                    <button key={stateName} onClick={() => removeState(c.id, stateName)}
                                        title="Retirer l'état"
                                        className="text-[10px] uppercase tracking-wide bg-purple-900/40 hover:bg-red-900/50 text-purple-200 hover:text-red-200 px-2 py-0.5 rounded border border-purple-500/30 transition-colors">
                                        {stateName} ✕
                                    </button>
                                ))}
                                <select value="" onChange={e => { addState(c.id, e.target.value); e.target.value = ''; }}
                                    className="text-[10px] bg-black/40 border border-white/10 text-stone-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500">
                                    <option value="">+ État</option>
                                    {harmfulStates.map(hs => <option key={hs.id} value={hs.name}>{hs.name}</option>)}
                                </select>
                            </div>
```

- [ ] **Step 3: Type-check + lint**

Run: `cd app && npm run build && npm run lint`
Expected: build OK ; aucune **nouvelle** erreur lint.

- [ ] **Step 4: Vérification manuelle (états)**

Run: `cd app && npm run dev` → `/tools/tracker`.
Vérifier : sur une rangée, le sélecteur « + État » liste les états du compendium ; en sélectionner un ajoute un badge ; cliquer le badge le retire ; recharger la page → les états sont persistés.

- [ ] **Step 5: Lancer toute la suite de tests + build final**

Run: `cd app && npm run test:run && npm run build`
Expected: tous les tests passent, build OK.

- [ ] **Step 6: Commit**

```bash
cd app && git add src/pages/CombatTracker.tsx
git commit -m "feat(combat): harmful-state badges on combatants"
```

---

## Notes de vérification finale

- La route `/tools/tracker` (`App.tsx:52`) et la carte du hub `Tools.tsx` restent inchangées — aucune modif de navigation nécessaire.
- Hors périmètre confirmé : backend, sync temps réel (Mercure), grille de combat, lien campagne↔rencontre (le bouton mort « Créer une rencontre » de `CampaignDetail.tsx` reste tel quel).
- Scénario de recette complet : ajouter 2 PJ (import) + 3 gobelins (bestiaire, quantité 3), poser « à terre » sur un gobelin, infliger 8 dégâts à un PJ, avancer 5 tours (round s'incrémente), supprimer le combattant actif, recharger la page → tout est restauré depuis `co_combat_tracker`.
