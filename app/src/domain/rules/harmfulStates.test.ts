import { describe, it, expect } from 'vitest';
import { basculerEtatNomme, etatEnLignes, etatEstChiffre, resumeEtat } from './harmfulStates';
import type { ActiveState } from '../../types/character';
import type { HarmfulState } from '../../types/normalized';

// Les valeurs viennent des états officiels (COF2, partie 2 § États préjudiciables).

const etat = (name: string, effects: HarmfulState['effects']): HarmfulState =>
    ({ id: name.toLowerCase(), name, description: '', image: '', effects });

describe('etatEnLignes', () => {
    it('produit une ligne par cible touchée', () => {
        const lignes = etatEnLignes(etat('Renversé', {
            bonuses: [{ target: 'attaque', value: -5 }, { target: 'def', value: -5 }],
        }));
        expect(lignes).toEqual([
            { name: 'Renversé', active: false, target: 'attaque', value: -5 },
            { name: 'Renversé', active: false, target: 'def', value: -5 },
        ]);
    });

    it('ne pose aucun groupe d’exclusion', () => {
        // Un groupe sert à n'avoir qu'une posture active à la fois : appliqué ici, il
        // ferait que les deux lignes d'un même état se chassent l'une l'autre.
        const lignes = etatEnLignes(etat('Aveuglé', {
            bonuses: [{ target: 'init', value: -5 }, { target: 'def', value: -5 }],
        }));
        expect(lignes.every(l => l.group === undefined)).toBe(true);
    });

    it('ne produit aucune ligne pour un état sans pénalité chiffrée', () => {
        // Ralenti ne change aucune valeur : il limite le nombre d'actions.
        expect(etatEnLignes(etat('Ralenti', { note: 'Une seule action par round' }))).toEqual([]);
        expect(etatEnLignes(etat('Inconnu', undefined))).toEqual([]);
    });
});

describe('etatEstChiffre', () => {
    it('distingue ce que la fiche sait appliquer de ce qu’elle ne peut que rappeler', () => {
        expect(etatEstChiffre(etat('Étourdi', { bonuses: [{ target: 'def', value: -5 }], noAction: true }))).toBe(true);
        expect(etatEstChiffre(etat('Essoufflé', { moveLimit: 5 }))).toBe(false);
    });
});

describe('resumeEtat', () => {
    it('énonce le dé malus selon sa portée', () => {
        expect(resumeEtat({ malusDie: 'all' })).toBe('dé malus à tous les tests');
        expect(resumeEtat({ malusDie: 'attack' })).toBe("dé malus aux tests d'attaque");
    });

    it('cumule les contraintes dans l’ordre de lecture', () => {
        expect(resumeEtat({ malusDie: 'attack', noMove: true })).toBe("dé malus aux tests d'attaque · pas de déplacement");
    });

    it('rend le déplacement plafonné avec son unité', () => {
        expect(resumeEtat({ moveLimit: 5 })).toBe('déplacement limité à 5 m');
    });

    it('reprend la note du compendium telle quelle', () => {
        expect(resumeEtat({ noAction: true, note: 'touché automatiquement' }))
            .toBe('aucune action possible · touché automatiquement');
    });

    it('ne renvoie rien quand il n’y a rien à ajouter', () => {
        expect(resumeEtat(undefined)).toBeUndefined();
        expect(resumeEtat({ bonuses: [{ target: 'def', value: -5 }] })).toBeUndefined();
    });
});

describe('basculerEtatNomme', () => {
    const renverse: ActiveState[] = [
        { name: 'Renversé', active: false, target: 'attaque', value: -5 },
        { name: 'Renversé', active: false, target: 'def', value: -5 },
        { name: 'Rage', active: false, target: 'dm', value: 2 },
    ];

    it('active toutes les lignes du même état d’un seul geste', () => {
        // Appliquer la moitié d'un état serait pire que de ne rien appliquer.
        const apres = basculerEtatNomme(renverse, 0, true);
        expect(apres.filter(s => s.active).map(s => s.target)).toEqual(['attaque', 'def']);
    });

    it('les désactive de la même façon', () => {
        const actif = basculerEtatNomme(renverse, 0, true);
        expect(basculerEtatNomme(actif, 1, false).some(s => s.active)).toBe(false);
    });

    it('ne touche pas les états portant un autre nom', () => {
        const apres = basculerEtatNomme(renverse, 0, true);
        expect(apres.find(s => s.name === 'Rage')!.active).toBe(false);
    });

    it('respecte encore l’exclusion de groupe des postures', () => {
        const postures: ActiveState[] = [
            { name: 'Défensive', group: 'posture', active: true, target: 'def', value: 2 },
            { name: 'Offensive', group: 'posture', active: false, target: 'dm', value: 2 },
        ];
        const apres = basculerEtatNomme(postures, 1, true);
        expect(apres.map(s => s.active)).toEqual([false, true]);
    });
});
