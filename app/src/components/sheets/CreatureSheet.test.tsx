// @vitest-environment jsdom
/**
 * Filet de rendu de `CreatureSheet`, sur le modèle des quatre autres feuilles : un
 * view-model ENTIÈREMENT rempli, chaque valeur distinctive recherchée dans le DOM. Le
 * défaut de référence du chantier (`armorMaxDef` peuplé, testé, jamais rendu) est né
 * d'un champ présent dans le modèle et absent du JSX — c'est ce que ce test empêche.
 *
 * Le second test est celui de l'iso : il monte les deux adaptateurs sur une même
 * créature et vérifie que la fiche officielle et la fiche maison montrent les mêmes
 * choses, à la nature du texte près (HTML officiel, texte saisi côté maison).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreatureSheet } from './CreatureSheet';
import type { CreatureSheetVM } from './types';
import { creatureToVM } from './adapters/fromOfficial';
import { customCreatureToVM } from './adapters/fromCustomCreature';
import type { Creature, CustomCreature } from '../../types/normalized';

afterEach(cleanup);

const vm: CreatureSheetVM = {
    name: 'CreatureMarkerNom',
    image: '/assets/creatures/marqueur.jpg',
    nc: 7,
    hp: 42,
    def: 17,
    init: 13,
    stats: { AGI: 1, CON: 2, FOR: 3, PER: 4, CHA: -1, INT: 0, VOL: 5 },
    familyName: 'CreatureMarkerFamille',
    familyDescription: 'CreatureMarkerFamilleDescription',
    category: 'CreatureMarkerCategorie',
    environment: 'CreatureMarkerMilieu',
    archetype: 'CreatureMarkerArchetype',
    size: 'CreatureMarkerTaille',
    attacks: [{ name: 'CreatureMarkerAttaque', test: '+9', dm: '2d6+4', special: 'CreatureMarkerAttaqueSpecial' }],
    capabilities: [{ name: 'CreatureMarkerCapacite', rank: 3, description: 'CreatureMarkerCapaciteDescription' }],
    specialAbilitiesHtml: '<p>CreatureMarkerSpecialHtml</p>',
    specialAbilitiesText: 'CreatureMarkerSpecialTexte',
    descriptionHtml: '<p>CreatureMarkerDescriptionHtml</p>',
    descriptionText: 'CreatureMarkerDescriptionTexte',
};

const monte = (v: CreatureSheetVM) => render(<MemoryRouter><CreatureSheet vm={v} /></MemoryRouter>);

describe('CreatureSheet', () => {
    it('affiche toutes les propriétés du view-model', () => {
        const { container } = monte(vm);
        const texte = container.textContent ?? '';

        for (const attendu of [
            vm.name, 'NC 7', '42', '17', '13',
            vm.familyName!, vm.familyDescription!,
            vm.category!, vm.environment!, vm.archetype!, vm.size!,
            'CreatureMarkerAttaque', '+9', '2d6+4', 'CreatureMarkerAttaqueSpecial',
            'CreatureMarkerCapacite', 'Rang 3', 'CreatureMarkerCapaciteDescription',
            'CreatureMarkerSpecialHtml', 'CreatureMarkerSpecialTexte',
            'CreatureMarkerDescriptionHtml', 'CreatureMarkerDescriptionTexte',
        ]) {
            expect(texte, `« ${attendu} » n'atteint pas le DOM`).toContain(attendu);
        }

        // Les sept caractéristiques, libellés et valeurs.
        for (const [carac, valeur] of Object.entries(vm.stats!)) {
            expect(texte).toContain(carac);
            expect(texte).toContain(String(valeur));
        }

        // L'illustration est rendue deux fois : le portrait et le bandeau décoratif.
        expect(container.querySelectorAll(`img[src="${vm.image}"]`).length).toBe(2);
    });

    it('ne rend aucune section vide quand le view-model est réduit au nom', () => {
        const { container } = monte({ name: 'Minimale' });
        const texte = container.textContent ?? '';
        for (const absent of ['Informations', 'Attaques', 'Capacités', 'Description']) {
            expect(texte, `la section « ${absent} » ne devrait pas être rendue`).not.toContain(absent);
        }
        expect(container.querySelectorAll('img').length).toBe(0);
    });
});

describe('iso officiel ↔ créature maison', () => {
    const caracs = { AGI: 1, CON: 2, FOR: 3, PER: 4, CHA: -1, INT: 0, VOL: 5 };
    const commun = {
        name: 'Gobelin', nc: 3, hp: 20, def: 14, init: 12, stats: caracs,
        category: 'Humanoïde', environment: 'Forêt', archetype: 'Combattant', size: 'Petite',
        attacks: [{ name: 'Dague', atk: '+5', dm: '1d4+2', special: 'Sournoise' }],
        capabilities: [{ name: 'Fuite', rank: 1, description: 'Détale' }],
    };

    it('montre les mêmes valeurs des deux côtés', () => {
        const off = monte(creatureToVM({ ...commun, id: 1, description: '<p>Petit et hargneux</p>' } as unknown as Creature));
        const texteOff = off.container.textContent ?? '';
        cleanup();

        const maison = monte(customCreatureToVM({ ...commun, id: 2, description: 'Petit et hargneux' } as unknown as CustomCreature));
        const texteMaison = maison.container.textContent ?? '';

        for (const attendu of ['Gobelin', 'NC 3', '20', '14', '12', 'Humanoïde', 'Forêt', 'Combattant', 'Petite',
            'Dague', '+5', '1d4+2', 'Sournoise', 'Fuite', 'Rang 1', 'Détale', 'Petit et hargneux']) {
            expect(texteOff, `« ${attendu} » absent de la fiche officielle`).toContain(attendu);
            expect(texteMaison, `« ${attendu} » absent de la fiche maison`).toContain(attendu);
        }
    });
});
