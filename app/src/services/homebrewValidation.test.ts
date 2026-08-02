import { describe, it, expect } from 'vitest';
import { hasValue, validateHomebrew } from './homebrewValidation';
import { HOMEBREW_SCHEMAS, pruneChildren, type HomebrewFieldDef } from './homebrewSchemas';

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

    // C2 : « — Aucune — » (magicStat === '') est la réponse honnête pour 6 des 14 classes
    // officielles (Rôdeur, Arquebusier, Barbare, Chevalier, Voleur, Guerrier). `complet()`
    // ne suffit pas à couvrir ce cas : il pioche `options[1]` (une caractéristique réelle),
    // jamais l'option vide — d'où ces deux tests dédiés.
    it('n’exige pas magicStat : une classe sans caractéristique de magie ne produit pas d’erreur', () => {
        const sansMagicStat = complet('classe');
        delete sansMagicStat.magicStat;
        expect(validateHomebrew('classe', 'Nom', sansMagicStat)).toEqual([]);
    });

    it('accepte magicStat vide (« — Aucune — »), qui reste rejeté par hasValue(\'\')', () => {
        expect(hasValue('')).toBe(false); // rappel de la cause du bug : '' n'est pas "renseigné"
        const data = { ...complet('classe'), magicStat: '' };
        expect(validateHomebrew('classe', 'Nom', data)).toEqual([]);
    });
});

describe('validateHomebrew — enfants', () => {
    const voieValide = { category: 'profil', maxRank: 5, details: ['x'] };

    it('ne signale rien quand les capacités sont complètes', () => {
        const enfants = [{ category: 'capacite', name: 'Frappe', data: { rank: 1, actionType: 'Limitée', effect: ['e'], details: ['d'] } }];
        expect(validateHomebrew('voie', 'Voie test', voieValide, enfants)).toEqual([]);
    });

    it('préfixe l’erreur d’un enfant par sa position', () => {
        const enfants = [
            { category: 'capacite', name: 'Complète', data: { rank: 1, actionType: 'A', effect: ['e'], details: ['d'] } },
            { category: 'capacite', name: 'Incomplète', data: {} },
        ];
        const erreurs = validateHomebrew('voie', 'Voie test', voieValide, enfants);
        expect(erreurs.every(e => e.key.startsWith('capacites.1.'))).toBe(true);
        expect(erreurs.some(e => e.key === 'capacites.1.rank')).toBe(true);
    });

    it('exige le nom d’une capacité', () => {
        const enfants = [{ category: 'capacite', name: '   ', data: { rank: 1, actionType: 'A', effect: ['e'], details: ['d'] } }];
        const erreurs = validateHomebrew('voie', 'Voie test', voieValide, enfants);
        expect(erreurs.some(e => e.key === 'capacites.0.name')).toBe(true);
    });

    it('nomme la position dans le message, pas l’indice', () => {
        const enfants = [
            { category: 'capacite', name: 'A', data: { rank: 1, actionType: 'A', effect: ['e'], details: ['d'] } },
            { category: 'capacite', name: 'B', data: {} },
        ];
        const erreurs = validateHomebrew('voie', 'Voie test', voieValide, enfants);
        expect(erreurs[0].message).toContain('capacité 2');
        expect(erreurs[0].message).not.toContain('capacites.1');
    });

    it('valide la voie même sans capacité', () => {
        expect(validateHomebrew('voie', 'Voie test', voieValide, [])).toEqual([]);
        expect(validateHomebrew('voie', 'Voie test', voieValide)).toEqual([]);
    });
});

describe('pruneChildren', () => {
    it('élague chaque enfant selon le schéma de sa catégorie', () => {
        const out = pruneChildren([
            { category: 'capacite', name: 'A', data: { rank: 2, parasite: 'x', speed: '10 m' } },
        ]);
        expect(out[0].data).toEqual({ rank: 2 });
    });

    it('conserve catégorie et nom', () => {
        const out = pruneChildren([{ category: 'sort', name: 'Éclair', data: { rank: 1 } }]);
        expect(out[0]).toMatchObject({ category: 'sort', name: 'Éclair' });
    });
});

describe('HomebrewFieldDef.required', () => {
    it('n’est plus optionnel : l’omettre est une erreur de compilation, pas un piège silencieux (I6)', () => {
        // @ts-expect-error — `required` est désormais `boolean` (non optionnel). Si cette
        // ligne compile sans erreur, le contrat fail-closed décrit dans I6 est revenu :
        // `tsc -b` doit échouer ici tant que `required` n'est pas fourni.
        const champSansRequired: HomebrewFieldDef = { key: 'x', label: 'X', type: 'text' };
        expect(champSansRequired).toBeDefined();
    });

    it('est déclaré explicitement sur les 62 champs actuels des schémas', () => {
        const tousLesChamps = Object.values(HOMEBREW_SCHEMAS).flat();
        expect(tousLesChamps.length).toBeGreaterThan(0);
        for (const champ of tousLesChamps) {
            expect(typeof champ.required).toBe('boolean');
        }
    });
});
