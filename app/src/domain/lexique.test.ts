import { describe, it, expect } from 'vitest';
import { LEXIQUE } from './lexique';

// Le lexique existe pour qu'un concept ne porte qu'un nom. Ces tests gardent les deux
// règles qui, sinon, se relâchent au premier ajout : l'unicité et la casse.

describe('LEXIQUE', () => {
    it('n’attribue jamais deux clés au même libellé', () => {
        const libelles = Object.values(LEXIQUE);
        expect(new Set(libelles).size).toBe(libelles.length);
    });

    it('n’écrit une capitale qu’au premier mot', () => {
        // La typographie en petites capitales relève du CSS : figer « Suivi de Combat »
        // dans la donnée empêcherait d'en changer sans réécrire les chaînes.
        const motsPropres = ['Officiel', 'Communauté'];
        for (const libelle of Object.values(LEXIQUE)) {
            const mots = libelle.split(/[\s&]+/).slice(1).filter(Boolean);
            for (const mot of mots) {
                if (motsPropres.includes(mot)) continue;
                expect(mot[0], `« ${libelle} » : « ${mot} » ne devrait pas prendre de capitale`)
                    .toBe(mot[0].toLowerCase());
            }
        }
    });

    it('dit « Peuples », le mot du livre COF2', () => {
        // « Race » est un import D&D, resté des premières fixtures.
        expect(Object.values(LEXIQUE).some(l => /race/i.test(l))).toBe(false);
        expect(LEXIQUE.peuples).toBe('Peuples');
    });
});
