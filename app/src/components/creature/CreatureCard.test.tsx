// @vitest-environment jsdom
/**
 * Iso officiel ↔ communautaire du bestiaire, au niveau de la carte.
 *
 * Les deux listes s'écrivaient séparément et ne montraient pas les mêmes valeurs : la
 * communautaire alignait « NC · PV · DEF · INIT » dans une phrase, sans illustration ni
 * pied de statistiques. Le test monte les deux view-models issus des deux sources et
 * vérifie que le DOM porte les mêmes libellés et les mêmes valeurs.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreatureCard } from './CreatureCard';
import { carteDepuisCreature, carteDepuisMonstreMaison } from '../../domain/creature';
import type { Creature, CustomCreature } from '../../types';

afterEach(cleanup);

const caracs = { AGI: 1, CON: 2, FOR: 3, PER: 0, CHA: -1, VOL: 1 } as Creature['stats'];

const officielle = {
    id: 1, name: 'Gobelin', description: 'Petit et hargneux', nc: 1, hp: 8, def: 13, init: 11,
    stats: { ...caracs, INT: 0 }, category: 'Humanoïde',
} as Creature;

const maison: CustomCreature = {
    id: 2, name: 'Gobelin des cavernes', description: 'Variante maison', nc: 1, hp: 8, def: 13, init: 11,
    stats: { ...caracs, INT: 0 }, category: 'Humanoïde', visibility: 'public', authorId: 7, authorPseudo: 'quelqu’un',
};

const rendu = (carte: ReturnType<typeof carteDepuisCreature>) =>
    render(<MemoryRouter><CreatureCard carte={carte} to="/x" /></MemoryRouter>);

describe('carte de créature', () => {
    it('montre les mêmes statistiques quelle que soit la source', () => {
        const off = rendu(carteDepuisCreature(officielle));
        const libelles = (c: HTMLElement) => Array.from(c.querySelectorAll('div')).map(d => d.textContent).join('|');
        const attendus = ['DEF', 'FOR', 'INIT', 'PV', 'NC 1', '13', '3', '11', '8'];
        for (const attendu of attendus) {
            expect(libelles(off.container), `« ${attendu} » absent de la carte officielle`).toContain(attendu);
        }
        cleanup();

        const com = rendu(carteDepuisMonstreMaison(maison));
        for (const attendu of attendus) {
            expect(libelles(com.container), `« ${attendu} » absent de la carte communautaire`).toContain(attendu);
        }
    });

    it('dit « NC », le mot des règles, et non « NIV »', () => {
        // La carte officielle annonçait « NIV » ; le chapitre « Bestiaire » parle de
        // niveau de créature (NC), et la liste communautaire disait déjà NC.
        const { container } = rendu(carteDepuisCreature(officielle));
        expect(container.textContent).toContain('NC 1');
        expect(container.textContent).not.toContain('NIV');
    });

    it('affiche un tiret pour une valeur absente plutôt qu’une case vide', () => {
        const { container } = rendu(carteDepuisMonstreMaison({ ...maison, def: undefined as unknown as number, init: undefined as unknown as number }));
        const pieds = within(container).getAllByText('—');
        expect(pieds.length).toBeGreaterThanOrEqual(2);
    });

    it('porte la description d’une créature maison, absente du bestiaire officiel', () => {
        const { container } = rendu(carteDepuisMonstreMaison(maison));
        expect(container.textContent).toContain('Variante maison');
    });
});
