// @vitest-environment jsdom
/**
 * Test de rendu de `RaceSheet` : filet de sécurité contre le défaut qui a motivé ce
 * fichier (armorMaxDef présent dans le view-model, peuplé par les deux adaptateurs et
 * couvert par un test unitaire, mais jamais consommé par le JSX — donc affiché nulle
 * part). Les tests unitaires sur les adaptateurs (adapters.test.ts) prouvent que le
 * view-model est complet ; ils ne peuvent pas prouver qu'il est affiché. Ce fichier
 * construit un view-model où CHAQUE propriété est renseignée avec une valeur
 * distinctive, rend le composant, et vérifie que chaque valeur apparaît dans le DOM.
 *
 * `RaceSheet` a deux onglets (« Légendes & Culture » / « Règles & Capacités ») : les
 * champs de l'onglet inactif ne sont pas dans le DOM au premier rendu. On les couvre
 * avec un second test qui clique sur l'onglet, plutôt que de les retirer du
 * view-model — ce sont précisément les champs les plus susceptibles de disparaître
 * sans que personne ne le remarque.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RaceSheet } from './RaceSheet';
import type { RaceSheetVM } from './types';

afterEach(cleanup);

// Toutes les propriétés de RaceSheetVM sont renseignées avec des valeurs distinctives
// (préfixe "RaceMarker") pour pouvoir les retrouver sans ambiguïté dans le DOM.
const vm: RaceSheetVM = {
    name: 'RaceMarkerNom',
    description: 'RaceMarkerDescription',
    image: 'https://example.test/race-marker.webp',
    modifiers: [{ description: 'RaceMarkerModifierDescription' }],
    speed: 'RaceMarkerVitesse',
    minHeight: 111,
    maxHeight: 222,
    minWeight: 33,
    maxWeight: 44,
    startingAge: 55,
    lifeExpectancy: 666,
    abilities: 'RaceMarkerAbilities',
    physicalTraits: 'RaceMarkerPhysicalTraits',
    publicPerception: 'RaceMarkerPublicPerception',
    roleplay: 'RaceMarkerRoleplay',
    typicalNames: 'RaceMarkerTypicalNames',
    detailedDescription: 'RaceMarkerDetailedDescription',
    voies: [
        {
            id: 'race-voie-1',
            name: 'RaceMarkerVoieName',
            details: { marqueur: 'RaceMarkerVoieDetailsValue' },
            capabilities: [
                {
                    id: 'race-cap-1',
                    rank: 3,
                    name: 'RaceMarkerCapName',
                    description: 'RaceMarkerCapDescription',
                    details: { marqueur: 'RaceMarkerCapDetailsValue' },
                },
            ],
        },
    ],
};

describe('RaceSheet', () => {
    it('affiche le tronc commun (identité, image, statistiques vitales) et l\'onglet Légendes & Culture actif par défaut', () => {
        const { container } = render(
            <MemoryRouter>
                <RaceSheet vm={vm} />
            </MemoryRouter>,
        );
        const text = container.textContent ?? '';

        // Identité + image (deux <img> partagent la même source : bandeau + carte).
        expect(text).toContain(vm.name);
        const images = container.querySelectorAll('img');
        expect(images.length).toBeGreaterThan(0);
        for (const img of images) {
            expect(img.getAttribute('src')).toBe(vm.image);
        }

        // Statistiques Vitales (sidebar, hors onglet).
        expect(text).toContain('1.11m - 2.22m'); // heightLabel
        expect(text).toContain('33 kg - 44 kg'); // weightLabel
        expect(text).toContain('55 ans'); // startingAge
        expect(text).toContain('666 ans'); // lifeExpectancy
        expect(text).toContain(vm.speed);

        // Onglet « Légendes & Culture » (actif par défaut).
        expect(text).toContain(vm.description);
        expect(text).toContain(vm.detailedDescription);
        expect(text).toContain(vm.physicalTraits);
        expect(text).toContain(vm.publicPerception);
        expect(text).toContain(vm.roleplay);
        expect(text).toContain(vm.typicalNames);

        // Les champs de l'onglet « Règles & Capacités » ne sont pas encore dans le DOM.
        expect(text).not.toContain(vm.abilities);
        expect(text).not.toContain('RaceMarkerVoieName');
    });

    it('affiche l\'onglet Règles & Capacités après clic (traits raciaux, modificateurs, voies et capacités)', () => {
        const { container } = render(
            <MemoryRouter>
                <RaceSheet vm={vm} />
            </MemoryRouter>,
        );
        fireEvent.click(within(container).getByText('Règles & Capacités'));
        const text = container.textContent ?? '';

        expect(text).toContain(vm.abilities);
        expect(text).toContain('RaceMarkerModifierDescription');

        const voie = vm.voies![0];
        expect(text).toContain(voie.name);
        const voieLink = within(container).getByText(voie.name).closest('a');
        expect(voieLink?.getAttribute('href')).toBe(`/voies/${voie.id}`);
        expect(text).toContain('RaceMarkerVoieDetailsValue');

        const cap = voie.capabilities![0];
        expect(text).toContain(String(cap.rank));
        expect(text).toContain(cap.name);
        expect(text).toContain(cap.description);
        expect(text).toContain('RaceMarkerCapDetailsValue');
    });
});
