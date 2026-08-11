import { describe, it, expect } from 'vitest';
import type { Combatant } from '../types/campaign';
import type { TrackerState } from './combatTracker';
import {
    sortByInitiative, nextTurn, removeById, applyHp,
    enregistrerTentative, bonusResistance, resistancesAcquises,
} from './combatTracker';

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

describe('rendement décroissant au suivi de combat', () => {
    const base: TrackerState = { round: 1, activeId: null, combatants: [] };

    it('n’accorde rien à la première tentative', () => {
        const s = enregistrerTentative(base, 'cible', 'Injonction');
        expect(bonusResistance(s, 'cible', 'Injonction')).toBe(0);
    });

    it('accorde +5 par répétition de la MÊME capacité', () => {
        let s = enregistrerTentative(base, 'cible', 'Injonction');
        s = enregistrerTentative(s, 'cible', 'Injonction');
        expect(bonusResistance(s, 'cible', 'Injonction')).toBe(5);
        s = enregistrerTentative(s, 'cible', 'Injonction');
        expect(bonusResistance(s, 'cible', 'Injonction')).toBe(10);
    });

    it('ne mélange pas deux capacités qui infligent le même état', () => {
        // Le livre compte les répétitions d'une CAPACITÉ, pas d'un état : Renverser et
        // Bousculade renversent toutes deux sans se renforcer l'une l'autre.
        let s = enregistrerTentative(base, 'cible', 'Renverser');
        s = enregistrerTentative(s, 'cible', 'Bousculade');
        expect(bonusResistance(s, 'cible', 'Renverser')).toBe(0);
        expect(bonusResistance(s, 'cible', 'Bousculade')).toBe(0);
    });

    it('compte par cible : deux victimes ne partagent pas leur accoutumance', () => {
        let s = enregistrerTentative(base, 'a', 'Injonction');
        s = enregistrerTentative(s, 'a', 'Injonction');
        expect(bonusResistance(s, 'a', 'Injonction')).toBe(5);
        expect(bonusResistance(s, 'b', 'Injonction')).toBe(0);
    });

    it('rend la liste de ce qu’une cible a appris à encaisser', () => {
        let s = enregistrerTentative(base, 'cible', 'Injonction');
        s = enregistrerTentative(s, 'cible', 'Injonction');
        s = enregistrerTentative(s, 'cible', 'Étourdir');   // une seule fois : aucun bonus
        expect(resistancesAcquises(s, 'cible')).toEqual([{ capacite: 'Injonction', bonus: 5 }]);
    });

    it('ignore une capacité sans nom', () => {
        expect(enregistrerTentative(base, 'cible', '')).toBe(base);
    });

    it('traite un état enregistré avant cette version comme vierge', () => {
        expect(bonusResistance(base, 'cible', 'Injonction')).toBe(0);
        expect(resistancesAcquises(base, 'cible')).toEqual([]);
    });
});
