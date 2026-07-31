// @vitest-environment jsdom
/**
 * Test de rendu de `VoieSheet` : filet de sécurité contre le défaut qui a motivé ce
 * fichier (armorMaxDef présent dans le view-model, peuplé par les deux adaptateurs et
 * couvert par un test unitaire, mais jamais consommé par le JSX — cf.
 * RaceSheet.test.tsx pour le contexte complet). Ce fichier construit un view-model où
 * CHAQUE propriété de `VoieSheetVM` est renseignée avec une valeur distinctive, rend
 * le composant, et vérifie que chaque valeur apparaît dans le DOM.
 *
 * `VoieSheet` n'a pas d'onglet : tout le view-model est dans le DOM dès le premier
 * rendu, un seul test suffit.
 *
 * En construisant ce test, `vm.description` s'est révélé être un second exemplaire du
 * même défaut (peuplé par les deux adaptateurs, jamais rendu) : corrigé dans
 * `VoieSheet.tsx` au passage (paragraphe sous le titre/catégorie), pas seulement
 * contourné dans le test.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VoieSheet } from './VoieSheet';
import type { VoieSheetVM } from './types';

afterEach(cleanup);

const vm: VoieSheetVM = {
    name: 'VoieMarkerNom',
    description: 'VoieMarkerDescription',
    category: 'VoieMarkerCategory',
    maxRank: 7,
    details: { marqueur: 'VoieMarkerDetailsValue' },
    capabilities: [
        {
            id: 'voie-cap-1',
            rank: 2,
            name: 'VoieMarkerCapName',
            description: 'VoieMarkerCapDescription',
            isSpell: true,
            limited: true,
            active: true,
            details: { marqueur: 'VoieMarkerCapDetailsValue' },
        },
    ],
};

describe('VoieSheet', () => {
    it('affiche toutes les propriétés du view-model', () => {
        const { container } = render(
            <MemoryRouter>
                <VoieSheet vm={vm} />
            </MemoryRouter>,
        );
        const text = container.textContent ?? '';

        expect(text).toContain(vm.name);
        expect(text).toContain(vm.description);
        expect(text).toContain(vm.category);
        expect(text).toContain(`Rang max. ${vm.maxRank}`);
        expect(text).toContain('VoieMarkerDetailsValue');

        const cap = vm.capabilities![0];
        expect(text).toContain(String(cap.rank));
        expect(text).toContain(cap.name);
        expect(text).toContain(cap.description);
        expect(text).toContain('VoieMarkerCapDetailsValue');
        // Badges booléens : libellés fixes, vérifiés par présence exacte de l'élément.
        expect(within(container).getByText('Sort')).toBeTruthy();
        expect(within(container).getByText('Limité')).toBeTruthy();
        expect(within(container).getByText('Actif')).toBeTruthy();
    });
});
