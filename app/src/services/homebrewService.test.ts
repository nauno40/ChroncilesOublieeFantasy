import { describe, it, expect } from 'vitest';
import { cheminInterne, childrenOf } from './homebrewService';
import type { HomebrewEntry } from './homebrewService';

// Environnement Node (pas de `window`) : on injecte explicitement l'origine plutôt
// que de dépendre de `window.location.origin`, cf. la signature de `cheminInterne`.
const ORIGINE = 'https://compagnon.example';

describe('cheminInterne', () => {
    it('rejette une URL protocol-relative (//exemple.tld)', () => {
        expect(cheminInterne('//exemple.tld', ORIGINE)).toBeNull();
    });

    it('rejette une URL déguisée avec antislash (/\\exemple.tld)', () => {
        expect(cheminInterne('/\\exemple.tld', ORIGINE)).toBeNull();
    });

    it('rejette une URL déguisée avec antislash puis barre oblique (/\\/exemple.tld)', () => {
        expect(cheminInterne('/\\/exemple.tld', ORIGINE)).toBeNull();
    });

    it('rejette une URL absolue vers un autre site (https://exemple.tld)', () => {
        expect(cheminInterne('https://exemple.tld', ORIGINE)).toBeNull();
    });

    it('rejette un schéma javascript: (javascript:alert(1))', () => {
        expect(cheminInterne('javascript:alert(1)', ORIGINE)).toBeNull();
    });

    it('accepte un chemin interne simple (/races)', () => {
        expect(cheminInterne('/races', ORIGINE)).toBe('/races');
    });

    it('accepte un chemin interne avec requête (/capacites?tab=mine)', () => {
        expect(cheminInterne('/capacites?tab=mine', ORIGINE)).toBe('/capacites?tab=mine');
    });

    it('rejette l\'absence de valeur', () => {
        expect(cheminInterne(null, ORIGINE)).toBeNull();
        expect(cheminInterne('', ORIGINE)).toBeNull();
    });
});

// Entrée minimale conforme à la forme réelle de l'API (vérifié sur l'API réelle, pas
// une fixture supposée) : `parent` est une IRI (`/api/homebrew_entries/<id>`), jamais
// un objet imbriqué ni un identifiant nu ; absente (pas `null`) sur une entrée autonome.
const entree = (id: number, parent?: string): HomebrewEntry => ({
    id, category: 'capacite', name: `Entrée ${id}`, description: '', visibility: 'private',
    data: {}, authorId: 1, authorPseudo: 'N', createdAt: '', updatedAt: '', ...(parent ? { parent } : {}),
} as HomebrewEntry);

describe('childrenOf', () => {
    it('retient les entrées dont `parent` désigne l’IRI du parent donné', () => {
        const toutes = [
            entree(593, undefined),
            entree(594, '/api/homebrew_entries/593'),
            entree(595, '/api/homebrew_entries/593'),
            entree(596, '/api/homebrew_entries/999'),
        ];
        expect(childrenOf(593, toutes).map(e => e.id)).toEqual([594, 595]);
    });

    it('ne confond pas deux parents dont l’identifiant partage un préfixe (593 vs 5931)', () => {
        const toutes = [entree(1, '/api/homebrew_entries/5931')];
        expect(childrenOf(593, toutes)).toEqual([]);
    });

    it('renvoie un tableau vide quand aucune entrée n’a ce parent', () => {
        expect(childrenOf(593, [entree(1, undefined)])).toEqual([]);
    });
});
