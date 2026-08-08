// @vitest-environment jsdom
/**
 * Test de rendu de `CapaciteSheet` : filet de sécurité contre le défaut qui a motivé
 * ce fichier (armorMaxDef présent dans le view-model, peuplé par les deux adaptateurs
 * et couvert par un test unitaire, mais jamais consommé par le JSX — cf.
 * RaceSheet.test.tsx pour le contexte complet). Ce fichier construit un view-model où
 * CHAQUE propriété de `CapaciteSheetVM` est renseignée avec une valeur distinctive,
 * rend le composant, et vérifie que chaque valeur apparaît dans le DOM.
 *
 * `CapaciteSheet` n'a pas d'onglet : tout le view-model est dans le DOM dès le
 * premier rendu, un seul test suffit. `voieId` ne produit pas de texte visible (c'est
 * la cible du lien porté par `voieName`) : vérifié via l'attribut `href`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CapaciteSheet } from './CapaciteSheet';
import type { CapaciteSheetVM } from './types';

afterEach(cleanup);

const vm: CapaciteSheetVM = {
    name: 'CapaciteMarkerNom',
    description: 'CapaciteMarkerDescription',
    rank: 4,
    actionType: 'CapaciteMarkerActionType',
    isSpell: true,
    limited: true,
    effect: ['CapaciteMarkerEffectLigne'],
    details: { marqueur: 'CapaciteMarkerDetailsValue' },
    detailLines: ['CapaciteMarkerDetailLigne'],
    voieName: 'CapaciteMarkerVoieName',
    voieId: 'capacite-voie-42',
};

describe('CapaciteSheet', () => {
    it('affiche toutes les propriétés du view-model', () => {
        const { container } = render(
            <MemoryRouter>
                <CapaciteSheet vm={vm} />
            </MemoryRouter>,
        );
        const text = container.textContent ?? '';

        expect(text).toContain(vm.name);
        expect(text).toContain(vm.description);
        expect(text).toContain(`Rang ${vm.rank}`);
        expect(text).toContain(vm.actionType);
        expect(text).toContain('CapaciteMarkerEffectLigne');
        expect(text).toContain('CapaciteMarkerDetailsValue');
        expect(text).toContain('CapaciteMarkerDetailLigne');
        expect(text).toContain(vm.voieName);

        // voieId : jamais affiché en texte, seulement comme cible du lien voieName.
        const voieLink = within(container).getByText(vm.voieName!).closest('a');
        expect(voieLink?.getAttribute('href')).toBe(`/voies/${vm.voieId}`);

        // Badges booléens : libellés fixes, vérifiés par présence exacte de l'élément.
        expect(within(container).getByText('Limité')).toBeTruthy();
        expect(within(container).getByText('Sort')).toBeTruthy();
    });
});
