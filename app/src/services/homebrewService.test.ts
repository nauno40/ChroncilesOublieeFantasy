import { describe, it, expect } from 'vitest';
import { cheminInterne } from './homebrewService';

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
