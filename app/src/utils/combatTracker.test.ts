import { describe, it, expect } from 'vitest';
import type { Combatant } from '../types/campaign';
import type { TrackerState } from './combatTracker';
import { sortByInitiative, nextTurn, removeById, applyHp } from './combatTracker';

const mk = (id: string, initiative: number, hp = 10): Combatant => ({
    id, name: id, type: 'monster', initiative,
    hp: { current: hp, max: hp }, def: 10, per: 0, tiebreak: 0, states: [],
});

// Combattant avec type/niveau/1d20 explicites pour tester le départage COF2.
const mkFull = (
    id: string,
    initiative: number,
    opts: { type?: Combatant['type']; level?: number; per?: number; tiebreak?: number } = {},
): Combatant => ({
    id, name: id, type: opts.type ?? 'monster', initiative,
    hp: { current: 10, max: 10 }, def: 10,
    level: opts.level, per: opts.per ?? 0, tiebreak: opts.tiebreak ?? 0, states: [],
});

const state = (combatants: Combatant[], activeId: string | null, round = 1): TrackerState =>
    ({ round, activeId, combatants });

describe('sortByInitiative', () => {
    it('trie par initiative décroissante', () => {
        const r = sortByInitiative([mk('a', 5), mk('b', 12), mk('c', 8)]);
        expect(r.map(c => c.id)).toEqual(['b', 'c', 'a']);
    });
    it('conserve l\'ordre d\'insertion en dernier recours (tout égal)', () => {
        const r = sortByInitiative([mk('a', 10), mk('b', 10), mk('c', 10)]);
        expect(r.map(c => c.id)).toEqual(['a', 'b', 'c']);
    });
});

describe('sortByInitiative — départage COF2 à initiative égale', () => {
    it('le plus haut niveau/NC agit en premier — même une créature (NC 7) devant des PJ (niv. 5)', () => {
        const r = sortByInitiative([
            mkFull('pj5', 10, { type: 'player', level: 5 }),
            mkFull('mobNC7', 10, { type: 'monster', level: 7 }),
        ]);
        expect(r.map(c => c.id)).toEqual(['mobNC7', 'pj5']);
    });
    it('à niveau égal, le PJ agit avant le PNJ', () => {
        const r = sortByInitiative([
            mkFull('mob', 10, { type: 'monster', level: 3 }),
            mkFull('pj', 10, { type: 'player', level: 3 }),
        ]);
        expect(r.map(c => c.id)).toEqual(['pj', 'mob']);
    });
    it('même niveau et même type : le plus haut 1d20 stocké départage', () => {
        const r = sortByInitiative([
            mkFull('d5', 10, { type: 'player', level: 5, tiebreak: 5 }),
            mkFull('d18', 10, { type: 'player', level: 5, tiebreak: 18 }),
        ]);
        expect(r.map(c => c.id)).toEqual(['d18', 'd5']);
    });
    it('l\'INIT prime toujours sur le départage (PNJ à INIT plus haute passe devant un PJ de plus haut niveau)', () => {
        const r = sortByInitiative([
            mkFull('pj', 10, { type: 'player', level: 9 }),
            mkFull('mob', 12, { type: 'monster', level: 1 }),
        ]);
        expect(r.map(c => c.id)).toEqual(['mob', 'pj']);
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
