import { describe, it, expect } from 'vitest';
import { hasValue, validateHomebrew } from './homebrewValidation';
import { HOMEBREW_SCHEMAS } from './homebrewSchemas';

/** Construit une donnée qui remplit tous les champs requis d'une catégorie. */
const complet = (categorie: string): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const f of HOMEBREW_SCHEMAS[categorie] ?? []) {
        if (f.required === false) continue;
        if (f.type === 'number') out[f.key] = 3;
        else if (f.type === 'bool') out[f.key] = true;
        else if (f.type === 'caracs') out[f.key] = { AGI: 1 };
        else if (f.type === 'lines') out[f.key] = ['une ligne'];
        else if (f.type === 'select') out[f.key] = f.options?.[1]?.value ?? 'x';
        else out[f.key] = 'valeur';
    }
    return out;
};

describe('hasValue', () => {
    it('considère 0 comme une valeur renseignée', () => {
        expect(hasValue(0)).toBe(true);
    });
    it('rejette le vide sous toutes ses formes', () => {
        expect(hasValue(undefined)).toBe(false);
        expect(hasValue(null)).toBe(false);
        expect(hasValue('')).toBe(false);
        expect(hasValue('   ')).toBe(false);
        expect(hasValue([])).toBe(false);
        expect(hasValue(['', '  '])).toBe(false);
    });
    it('rejette un bloc de caractéristiques entièrement à zéro', () => {
        expect(hasValue({ AGI: 0, CON: 0 })).toBe(false);
        expect(hasValue({ AGI: 0, CON: 1 })).toBe(true);
    });
});

describe('validateHomebrew', () => {
    it('exige le nom quelle que soit la catégorie', () => {
        const erreurs = validateHomebrew('etat', '   ', {});
        expect(erreurs).toHaveLength(1);
        expect(erreurs[0].key).toBe('name');
    });

    it('ne signale rien quand tous les champs requis sont remplis', () => {
        for (const categorie of ['race', 'classe', 'voie', 'capacite', 'sort', 'poison', 'piege']) {
            expect(validateHomebrew(categorie, 'Nom', complet(categorie))).toEqual([]);
        }
    });

    it('signale exactement les champs requis manquants', () => {
        const erreurs = validateHomebrew('voie', 'Nom', {});
        expect(erreurs.map(e => e.key).sort()).toEqual(['category', 'details', 'maxRank']);
    });

    it('accepte 0 comme valeur d’un champ requis', () => {
        const data = { ...complet('capacite'), rank: 0 };
        expect(validateHomebrew('capacite', 'Nom', data)).toEqual([]);
    });

    it('n’exige pas les cases à cocher, qui portent toujours une valeur', () => {
        const sansBooleens = complet('capacite');
        delete sansBooleens.isSpell;
        delete sansBooleens.limited;
        expect(validateHomebrew('capacite', 'Nom', sansBooleens)).toEqual([]);
    });

    it('n’exige aucun champ pour un état, dont le schéma est vide', () => {
        expect(validateHomebrew('etat', 'Nom', {})).toEqual([]);
    });

    it('n’exige pas les champs conditionnels de l’équipement', () => {
        expect(validateHomebrew('equipement', 'Nom', complet('equipement'))).toEqual([]);
    });

    it('refuse un équipement mêlant bloc arme et bloc armure', () => {
        const data = { ...complet('objet-magique'), damage: '1d8', acBonus: 2 };
        const erreurs = validateHomebrew('objet-magique', 'Nom', data);
        expect(erreurs).toHaveLength(1);
        expect(erreurs[0].key).toBe('');
        expect(erreurs[0].message).toMatch(/arme/i);
        expect(erreurs[0].message).toMatch(/armure/i);
    });

    it('accepte un équipement ne renseignant qu’un seul bloc', () => {
        const arme = { ...complet('equipement'), damage: '1d8', critical: '20' };
        expect(validateHomebrew('equipement', 'Nom', arme)).toEqual([]);
        const armure = { ...complet('equipement'), acBonus: 3 };
        expect(validateHomebrew('equipement', 'Nom', armure)).toEqual([]);
    });
});
