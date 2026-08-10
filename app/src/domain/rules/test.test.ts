import { describe, expect, it } from 'vitest';
import { lancerTest, qualificatifDifficulte, DIFFICULTES } from './test';

/** Source d'aléa déterministe : rend les faces demandées, dans l'ordre. */
const des = (...faces: number[]) => {
    let i = 0;
    return () => (faces[i++] - 1) / 20 + 0.001;
};

describe('lancerTest', () => {
    it('reproduit l’exemple du livre : d20 14 + AGI +1 contre difficulté 15', () => {
        // « Lhagva veut sauter par-dessus un précipice […] 14 + 1 = 15 […] parvient de justesse. »
        const r = lancerTest({ carac: 1, difficulte: 15, rng: des(14) });
        expect(r.conserve).toBe(14);
        expect(r.total).toBe(15);
        expect(r.reussi).toBe(true);
    });

    it('échoue quand le total reste sous la difficulté', () => {
        expect(lancerTest({ carac: 1, difficulte: 15, rng: des(13) }).reussi).toBe(false);
    });

    it('garde le plus haut avec un dé bonus, le plus faible avec un dé malus', () => {
        expect(lancerTest({ deBonus: 1, rng: des(4, 13) }).conserve).toBe(13);
        // Exemple du livre : Wilibert, Affaibli, obtient 13 et 4 et garde 4.
        const wilibert = lancerTest({ carac: 2, deMalus: 1, difficulte: 15, rng: des(13, 4) });
        expect(wilibert.conserve).toBe(4);
        expect(wilibert.total).toBe(6);
        expect(wilibert.reussi).toBe(false);
    });

    it('ne cumule pas les dés d’un même type : deux dés bonus n’en font qu’un', () => {
        const r = lancerTest({ deBonus: 3, rng: des(4, 13, 20) });
        expect(r.des).toHaveLength(2);
        expect(r.conserve).toBe(13);
    });

    it('annule le dé bonus et le dé malus l’un par l’autre', () => {
        const r = lancerTest({ deBonus: 1, deMalus: 1, rng: des(7, 20) });
        expect(r.avantage).toBe('aucun');
        expect(r.des).toEqual([7]);
        expect(r.conserve).toBe(7);
    });

    it('lit le critique sur le dé CONSERVÉ, pas sur les dés écartés', () => {
        // Un 20 écarté par un dé malus n'est pas une réussite critique.
        const ecarte = lancerTest({ deMalus: 1, rng: des(20, 4) });
        expect(ecarte.conserve).toBe(4);
        expect(ecarte.critique).toBe(false);

        const garde = lancerTest({ deBonus: 1, rng: des(20, 4) });
        expect(garde.critique).toBe(true);
    });

    it('réussit automatiquement sur un critique, même sous la difficulté', () => {
        const r = lancerTest({ carac: -2, difficulte: 30, rng: des(20) });
        expect(r.total).toBe(18);
        expect(r.reussi).toBe(true);
    });

    it('échoue automatiquement sur un échec critique, même au-dessus de la difficulté', () => {
        const r = lancerTest({ carac: 5, modificateur: 20, difficulte: 10, rng: des(1) });
        expect(r.total).toBe(26);
        expect(r.echecCritique).toBe(true);
        expect(r.reussi).toBe(false);
    });

    it('rend un jet sans verdict quand aucune difficulté n’est visée', () => {
        expect(lancerTest({ carac: 3, rng: des(10) }).reussi).toBeUndefined();
    });
});

describe('table des difficultés', () => {
    it('porte les six qualificatifs du livre, dans l’ordre', () => {
        expect(DIFFICULTES.map(d => d.valeur)).toEqual([5, 10, 15, 20, 25, 30]);
        expect(qualificatifDifficulte(15)).toBe('Difficile');
        expect(qualificatifDifficulte(30)).toBe('Abominable');
        expect(qualificatifDifficulte(12)).toBeUndefined();
    });
});
