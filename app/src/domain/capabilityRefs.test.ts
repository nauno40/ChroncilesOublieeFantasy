import { describe, it, expect } from 'vitest';
import { resoudreEtat, etatsDeclares, lienEtat } from './capabilityRefs';
import type { HarmfulState } from '../types/normalized';

// Les 8 états du compendium, dans leur orthographe canonique.
const ETATS: HarmfulState[] = [
    'Affaibli', 'Aveuglé', 'Étourdi', 'Immobilisé',
    'Paralysé', 'Ralenti', 'Renversé', 'Surpris',
].map((name, i) => ({ id: String(i + 1), name, description: '', image: '' }));

describe('resoudreEtat', () => {
    it('accepte l’orthographe canonique', () => {
        expect(resoudreEtat('Étourdi', ETATS)).toBe('Étourdi');
    });

    it('ignore la casse et les accents', () => {
        expect(resoudreEtat('etourdi', ETATS)).toBe('Étourdi');
        expect(resoudreEtat('ÉTOURDI', ETATS)).toBe('Étourdi');
        expect(resoudreEtat('ETOURDI', ETATS)).toBe('Étourdi');
    });

    it('ignore l’accord — le féminin et le pluriel n’ajoutent qu’un suffixe', () => {
        expect(resoudreEtat('Étourdie', ETATS)).toBe('Étourdi');
        expect(resoudreEtat('Renversée', ETATS)).toBe('Renversé');
        expect(resoudreEtat('Immobilisées', ETATS)).toBe('Immobilisé');
        // « Surprise » est la forme féminine de « Surpris » : le nom connu en est un préfixe.
        expect(resoudreEtat('Surprise', ETATS)).toBe('Surpris');
    });

    it('écarte ce qui ne correspond à aucun état connu', () => {
        expect(resoudreEtat('Enflammé', ETATS)).toBeUndefined();
        expect(resoudreEtat('', ETATS)).toBeUndefined();
    });
});

describe('etatsDeclares', () => {
    it('résout chaque déclaration vers son nom canonique', () => {
        const cap = { name: 'Fauchage', states: ['Renversée', 'surpris'] };
        expect(etatsDeclares(cap, ETATS)).toEqual(['Renversé', 'Surpris']);
    });

    it('fusionne deux orthographes du même état en une seule entrée', () => {
        // Sinon le suivi de combat poserait deux pastilles pour une seule mécanique.
        const cap = { name: 'Choc', states: ['Renversé', 'Renversée', 'RENVERSEES'] };
        expect(etatsDeclares(cap, ETATS)).toEqual(['Renversé']);
    });

    it('écarte une déclaration périmée sans faire disparaître les autres', () => {
        const cap = { name: 'Mixte', states: ['Enflammé', 'Ralenti'] };
        expect(etatsDeclares(cap, ETATS)).toEqual(['Ralenti']);
    });

    it('rend un tableau vide quand rien n’est déclaré', () => {
        expect(etatsDeclares({ name: 'Rien' }, ETATS)).toEqual([]);
        expect(etatsDeclares({ name: 'Vide', states: [] }, ETATS)).toEqual([]);
    });
});

describe('lienEtat', () => {
    it('mène à la liste des états filtrée sur le nom', () => {
        expect(lienEtat('Étourdi')).toBe('/states?q=%C3%89tourdi');
    });
});
