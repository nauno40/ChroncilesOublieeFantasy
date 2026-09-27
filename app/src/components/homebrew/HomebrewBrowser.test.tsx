// @vitest-environment jsdom
/**
 * Onglet, catégorie et recherche sont désormais filtrés CÔTÉ SERVEUR et paginés (remplace
 * `pagination=false`, qui chargeait toute la bibliothèque à chaque ouverture — cf.
 * l'état des lieux communauté). Ce fichier teste l'orchestration : quels paramètres partent
 * vers `HomebrewService.getPage`, le débounce de la recherche, et « Charger plus » qui
 * ajoute (n'écrase pas) la page suivante.
 */
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomebrewBrowser } from './HomebrewBrowser';
import { HomebrewService, type HomebrewEntry } from '../../services/homebrewService';

vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 7 } }) }));
vi.mock('../../services/homebrewService', async (importOriginal) => {
    const reel = await importOriginal<typeof import('../../services/homebrewService')>();
    return {
        ...reel,
        HomebrewService: {
            ...reel.HomebrewService,
            getPage: vi.fn(),
            getChildrenOf: vi.fn(async () => []),
            remove: vi.fn(async () => {}),
        },
    };
});

const entree = (id: number, overrides: Partial<HomebrewEntry> = {}): HomebrewEntry => ({
    id,
    category: 'sort',
    name: `Entrée ${id}`,
    description: null,
    visibility: 'public',
    data: null,
    authorId: 42,
    authorPseudo: 'Quelqu’un',
    createdAt: '',
    updatedAt: '',
    ...overrides,
});

const getPage = () => vi.mocked(HomebrewService.getPage);

const renderBrowser = (props: Partial<ComponentProps<typeof HomebrewBrowser>> = {}) => render(
    <MemoryRouter>
        <HomebrewBrowser tab="community" onTabChange={() => {}} {...props} />
    </MemoryRouter>,
);

beforeEach(() => {
    getPage().mockReset();
    getPage().mockResolvedValue({ items: [entree(1), entree(2)], totalItems: 2 });
});
afterEach(cleanup);

describe('HomebrewBrowser — chargement initial', () => {
    it('demande la page 1, filtrée sur l’onglet courant', async () => {
        renderBrowser({ tab: 'mine' });
        await waitFor(() => expect(getPage()).toHaveBeenCalled());

        expect(getPage()).toHaveBeenCalledWith(expect.objectContaining({ page: 1, scope: 'mine' }));
    });

    it('affiche les entrées reçues', async () => {
        renderBrowser();
        expect(await screen.findByText('Entrée 1')).toBeTruthy();
        expect(screen.getByText('Entrée 2')).toBeTruthy();
    });
});

describe('HomebrewBrowser — recherche débouncée', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    it('n’interroge pas le serveur à chaque frappe, seulement après une pause', async () => {
        renderBrowser();
        await waitFor(() => expect(getPage()).toHaveBeenCalledTimes(1));

        fireEvent.change(screen.getByPlaceholderText('Rechercher…'), { target: { value: 'éclat' } });
        // Immédiatement après la frappe : pas de nouvel appel.
        expect(getPage()).toHaveBeenCalledTimes(1);

        await act(async () => { await vi.advanceTimersByTimeAsync(300); });

        expect(getPage()).toHaveBeenCalledTimes(2);
        expect(getPage()).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: 'éclat' }));
    });
});

describe('HomebrewBrowser — « Charger plus »', () => {
    it('ajoute la page suivante à la liste déjà affichée, sans l’écraser', async () => {
        getPage().mockResolvedValueOnce({ items: [entree(1), entree(2)], totalItems: 4 });
        renderBrowser();
        expect(await screen.findByText('Entrée 1')).toBeTruthy();

        getPage().mockResolvedValueOnce({ items: [entree(3), entree(4)], totalItems: 4 });
        fireEvent.click(screen.getByText(/Charger plus/));

        await waitFor(() => expect(getPage()).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
        expect(await screen.findByText('Entrée 3')).toBeTruthy();
        // Les deux premières restent affichées : la page 2 s'ajoute, ne remplace pas.
        expect(screen.getByText('Entrée 1')).toBeTruthy();
    });

    it('n’affiche pas « Charger plus » une fois tout chargé', async () => {
        getPage().mockResolvedValue({ items: [entree(1)], totalItems: 1 });
        renderBrowser();
        await screen.findByText('Entrée 1');
        expect(screen.queryByText(/Charger plus/)).toBeNull();
    });
});

describe('HomebrewBrowser — changement d’onglet repart de la page 1', () => {
    it('réinitialise la liste (ne cumule pas avec la précédente) au changement d’onglet', async () => {
        const { rerender } = render(
            <MemoryRouter>
                <HomebrewBrowser tab="community" onTabChange={() => {}} />
            </MemoryRouter>,
        );
        await screen.findByText('Entrée 1');

        getPage().mockResolvedValueOnce({ items: [entree(9, { name: 'Ma création' })], totalItems: 1 });
        rerender(
            <MemoryRouter>
                <HomebrewBrowser tab="mine" onTabChange={() => {}} />
            </MemoryRouter>,
        );

        expect(await screen.findByText('Ma création')).toBeTruthy();
        expect(screen.queryByText('Entrée 1')).toBeNull();
        expect(getPage()).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, scope: 'mine' }));
    });
});
