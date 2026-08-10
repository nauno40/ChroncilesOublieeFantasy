import { describe, expect, it } from 'vitest';
import { CONDITIONS_TIR, malusTir } from './tirADistance';

describe('malusTir', () => {
    it('ne retient rien quand aucune condition n’est cochée', () => {
        expect(malusTir([])).toEqual({ modificateur: 0, deMalus: false, notes: [] });
    });

    it('additionne les modificateurs chiffrés', () => {
        expect(malusTir(['couvert-fort', 'penombre']).modificateur).toBe(-10);
        expect(malusTir(['couvert-faible']).modificateur).toBe(-2);
    });

    it('ne cumule jamais plus d’un dé malus', () => {
        // « Il n'est pas possible de cumuler plusieurs dés bonus ou malus. »
        const r = malusTir(['longue-portee', 'tireur-contact']);
        expect(r.deMalus).toBe(true);
        expect(r.modificateur).toBe(0);
    });

    it('n’invente aucun chiffre pour les cas « Spécial » du livre', () => {
        const r = malusTir(['brouillard-dense', 'noir-total']);
        expect(r.modificateur).toBe(0);
        expect(r.deMalus).toBe(false);
        expect(r.notes).toHaveLength(2);
        expect(r.notes[0]).toContain('Brouillard dense');
    });

    it('mêle les trois natures sans les confondre', () => {
        const r = malusTir(['longue-portee', 'melee-masquee', 'noir-total']);
        expect(r).toEqual({
            modificateur: -5,
            deMalus: true,
            notes: ['Noir total — Spécial : le tireur subit l’état Aveuglé, sauf capacité contraire.'],
        });
    });

    it('ignore un identifiant inconnu', () => {
        expect(malusTir(['penombre', 'inexistant']).modificateur).toBe(-5);
    });
});

describe('CONDITIONS_TIR', () => {
    it('reprend les neuf lignes du tableau, la pleine mêlée comptant pour deux', () => {
        // Le livre écrit « ‑2 (‑5) » sur une seule ligne : deux situations distinctes ici.
        expect(CONDITIONS_TIR).toHaveLength(10);
        expect(new Set(CONDITIONS_TIR.map(c => c.id)).size).toBe(10);
    });

    it('donne à chaque condition exactement une nature', () => {
        for (const c of CONDITIONS_TIR) {
            const natures = [c.modificateur !== undefined, c.deMalus === true].filter(Boolean).length;
            // Zéro nature = cas « Spécial », qui doit alors porter sa note.
            if (natures === 0) expect(c.note, `« ${c.label} » sans nature ni note`).toBeTruthy();
            expect(natures, `« ${c.label} » mêle chiffre et dé malus`).toBeLessThanOrEqual(1);
        }
    });
});
