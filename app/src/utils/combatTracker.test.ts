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
