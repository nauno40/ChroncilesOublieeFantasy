// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CombatantCapabilities } from './CombatantCapabilities';
import type { HarmfulState, Creature } from '../../types/normalized';

afterEach(cleanup);

const ETATS: HarmfulState[] = [{ id: '1', name: 'Renversé', description: '', image: '' }];
const loup = { id: 7, name: 'Loup' } as unknown as Creature;
const SOURCES = { creatures: [loup], monstresMaison: [], armes: [], armures: [], communautaire: [] };

const CAPACITES = [
    { label: 'Fauchage', description: 'La victime est Renversée.', states: ['Renversée'] },
    { label: 'Appel de la meute', summons: [{ type: 'creature' as const, ref: 'Loup', quantity: 2 }] },
];

const monter = (props: Partial<React.ComponentProps<typeof CombatantCapabilities>> = {}) =>
    render(
        <MemoryRouter>
            <CombatantCapabilities
                capacites={CAPACITES}
                etatsConnus={ETATS}
                sources={SOURCES}
                onPoserEtat={props.onPoserEtat ?? (() => {})}
                onInvoquer={props.onInvoquer ?? (() => {})}
                {...props}
            />
        </MemoryRouter>,
    );

describe('CombatantCapabilities', () => {
    it('démarre replié, en annonçant le nombre de capacités', () => {
        monter();
        expect(screen.getByText('Capacités (2)')).toBeTruthy();
        expect(screen.queryByText('Fauchage')).toBeNull();
    });

    it('affiche les capacités une fois déplié', () => {
        monter();
        fireEvent.click(screen.getByText('Capacités (2)'));
        expect(screen.getByText('Fauchage')).toBeTruthy();
        expect(screen.getByText('La victime est Renversée.')).toBeTruthy();
    });

    it('remonte le nom CANONIQUE de l’état, pas la forme déclarée', () => {
        // La capacité déclare « Renversée » ; le suivi de combat doit recevoir « Renversé »,
        // sans quoi le combattant porterait un état absent du compendium.
        const onPoserEtat = vi.fn();
        monter({ onPoserEtat });
        fireEvent.click(screen.getByText('Capacités (2)'));
        fireEvent.click(screen.getByText('Renversé'));
        expect(onPoserEtat).toHaveBeenCalledWith('Renversé');
    });

    it('remonte la créature invoquée, sa quantité et sa référence d’origine', () => {
        const onInvoquer = vi.fn();
        monter({ onInvoquer });
        fireEvent.click(screen.getByText('Capacités (2)'));
        fireEvent.click(screen.getByText(/Ajouter Loup/));
        expect(onInvoquer).toHaveBeenCalledWith(loup, 2, 'Loup');
    });

    it('n’offre pas d’ajout au combat pour un objet — un objet n’est pas un combattant', () => {
        const onInvoquer = vi.fn();
        render(
            <MemoryRouter>
                <CombatantCapabilities
                    capacites={[{ label: 'Forge', summons: [{ type: 'item' as const, ref: 'Épée longue' }] }]}
                    etatsConnus={ETATS}
                    sources={{ ...SOURCES, armes: [{ id: '11', name: 'Épée longue' } as never] }}
                    onPoserEtat={() => {}}
                    onInvoquer={onInvoquer}
                />
            </MemoryRouter>,
        );
        fireEvent.click(screen.getByText('Capacités (1)'));
        expect(screen.queryByText(/Ajouter/)).toBeNull();
        // Le lien vers la fiche de l’objet, lui, reste offert par CapabilityRefs.
        expect(screen.getByText(/Épée longue/)).toBeTruthy();
    });
});
