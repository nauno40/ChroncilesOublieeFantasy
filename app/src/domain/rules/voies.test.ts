import { describe, expect, it } from 'vitest';
import { memeVoies } from './voies';
import type { CharacterVoieRef } from '../../types/character';

const bouclier: CharacterVoieRef = { voie: '/api/voies/1', rank: 2, source: 'profil' };
const combat: CharacterVoieRef = { voie: '/api/voies/2', rank: 1, source: 'profil' };

describe('memeVoies', () => {
    it('reconnaît deux listes de même contenu portées par des tableaux distincts', () => {
        expect(memeVoies([bouclier, combat], [{ ...bouclier }, { ...combat }])).toBe(true);
    });

    it('traite une liste absente comme la liste vide', () => {
        expect(memeVoies(undefined, [])).toBe(true);
        expect(memeVoies(undefined, [bouclier])).toBe(false);
    });

    it('distingue un ajout de voie', () => {
        expect(memeVoies([bouclier], [bouclier, combat])).toBe(false);
    });

    it('distingue un changement de rang, de source ou de choix', () => {
        expect(memeVoies([bouclier], [{ ...bouclier, rank: 3 }])).toBe(false);
        expect(memeVoies([bouclier], [{ ...bouclier, source: 'hybride' }])).toBe(false);
        expect(memeVoies([bouclier], [{ ...bouclier, choices: { langue: 'nain' } }])).toBe(false);
    });

    it('distingue un simple changement d’ordre', () => {
        // L'ordre porte du sens : `characterVoies` est rendu par position (voie de profil 1..5).
        expect(memeVoies([bouclier, combat], [combat, bouclier])).toBe(false);
    });
});
