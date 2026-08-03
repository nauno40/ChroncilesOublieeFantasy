// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CapabilityRefs } from './CapabilityRefs';
import type { HarmfulState, Creature } from '../../types/normalized';

afterEach(cleanup);

const ETATS: HarmfulState[] = [{ id: '1', name: 'Renversé', description: '', image: '' }];
const loup = { id: 7, name: 'Loup' } as unknown as Creature;
const SOURCES = { creatures: [loup], monstresMaison: [], armes: [], armures: [], communautaire: [] };

const rendre = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('CapabilityRefs', () => {
    it('affiche un état déclaré en lien vers la liste des états', () => {
        const capacite = { name: 'Fauchage', states: ['Renversée'] };
        rendre(<CapabilityRefs capacite={capacite} etatsConnus={ETATS} sources={SOURCES} />);
        const lien = screen.getByText('Renversé');
        expect(lien.closest('a')?.getAttribute('href')).toBe('/states?q=Renvers%C3%A9');
    });

    it('appelle onEtat au lieu de naviguer quand un gestionnaire est fourni', () => {
        const onEtat = vi.fn();
        const capacite = { name: 'Fauchage', states: ['Renversé'] };
        rendre(<CapabilityRefs capacite={capacite} etatsConnus={ETATS} sources={SOURCES} onEtat={onEtat} />);
        fireEvent.click(screen.getByText('Renversé'));
        expect(onEtat).toHaveBeenCalledWith('Renversé');
    });

    it('affiche une invocation résolue en lien vers son entité', () => {
        const capacite = { name: 'Appel', summons: [{ type: 'creature' as const, ref: 'Loup' }] };
        rendre(<CapabilityRefs capacite={capacite} etatsConnus={ETATS} sources={SOURCES} />);
        expect(screen.getByText(/Loup/).closest('a')?.getAttribute('href')).toBe('/bestiary/7');
    });

    it('n’affiche rien du tout quand la capacité ne déclare rien', () => {
        const { container } = rendre(
            <CapabilityRefs capacite={{ name: 'Simple' }} etatsConnus={ETATS} sources={SOURCES} />);
        expect(container.innerHTML).toBe('');
    });

    it('n’affiche ni état inconnu ni invocation introuvable', () => {
        const capacite = {
            name: 'Périmée',
            states: ['Enflammé'],
            summons: [{ type: 'creature' as const, ref: 'Dragon' }],
        };
        const { container } = rendre(
            <CapabilityRefs capacite={capacite} etatsConnus={ETATS} sources={SOURCES} />);
        expect(container.innerHTML).toBe('');
    });
});
