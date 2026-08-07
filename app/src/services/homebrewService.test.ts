import { describe, it, expect } from 'vitest';
import { categoryPath, categoryPathLabel, cheminInterne, childrenOf, messageSuppression } from './homebrewService';
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

describe('messageSuppression', () => {
    it('n’annonce aucune capacité quand il n’y en a pas', () => {
        expect(messageSuppression('Ma voie', 0)).toBe('Supprimer « Ma voie » ?');
    });

    it('ne compte pas au singulier', () => {
        expect(messageSuppression('Ma voie', 1)).toBe('Supprimer « Ma voie » et sa capacité ?');
    });

    it('annonce le nombre exact au pluriel — c’est ce qui évite d’en perdre cinq d’un clic', () => {
        expect(messageSuppression('Ma voie', 5)).toBe('Supprimer « Ma voie » et ses 5 capacités ?');
    });
});

describe('categoryPathLabel', () => {
    it('nomme la page réellement visée par categoryPath', () => {
        // Un sort revient à la page des Capacités : l'intitulé doit dire cette page-là,
        // pas la catégorie de l'entrée.
        expect(categoryPath('sort')).toBe('/capacites');
        expect(categoryPathLabel('sort')).toBe('Retour aux Capacités');
    });

    it('couvre les quatre catégories à page de type', () => {
        expect(categoryPathLabel('race')).toBe('Retour aux Races');
        expect(categoryPathLabel('classe')).toBe('Retour aux Classes');
        expect(categoryPathLabel('voie')).toBe('Retour aux Voies');
        expect(categoryPathLabel('capacite')).toBe('Retour aux Capacités');
    });

    it('renvoie à la Bibliothèque pour une catégorie sans page de type', () => {
        expect(categoryPath('poison')).toBe('/bibliotheque');
        expect(categoryPathLabel('poison')).toBe('Retour à la Bibliothèque');
    });
});
