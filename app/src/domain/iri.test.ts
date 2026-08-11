import { describe, expect, it } from 'vitest';
import { idDepuisRef } from './iri';

describe('idDepuisRef', () => {
    it('lit un IRI, la forme la plus courante', () => {
        expect(idDepuisRef('/api/voies/123')).toBe('123');
        expect(idDepuisRef('/api/creature_families/7')).toBe('7');
    });

    it('lit un objet résolu, par son id ou son @id', () => {
        expect(idDepuisRef({ id: 42, name: 'Voie du Combat' })).toBe('42');
        expect(idDepuisRef({ '@id': '/api/voies/9' })).toBe('9');
        // `id` prime : c'est la forme la plus directe quand les deux sont présents.
        expect(idDepuisRef({ id: 1, '@id': '/api/voies/9' })).toBe('1');
    });

    it('accepte un identifiant déjà nu', () => {
        expect(idDepuisRef('123')).toBe('123');
        expect(idDepuisRef(123)).toBe('123');
    });

    it('rend null pour ce qui ne désigne rien', () => {
        expect(idDepuisRef(null)).toBeNull();
        expect(idDepuisRef(undefined)).toBeNull();
        expect(idDepuisRef('')).toBeNull();
        expect(idDepuisRef({})).toBeNull();
        expect(idDepuisRef({ nom: 'sans identifiant' })).toBeNull();
    });

    it('accepte l’identifiant zéro, qui est un identifiant valide', () => {
        expect(idDepuisRef({ id: 0 })).toBe('0');
    });
});
