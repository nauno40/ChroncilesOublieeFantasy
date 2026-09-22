// @vitest-environment jsdom
/**
 * La bibliothèque communautaire se consulte désormais sans compte (jalon B, site
 * communautaire) : un visiteur anonyme (myId absent) ne doit voir AUCUN bouton
 * « Dupliquer chez moi » sur le contenu d'autrui — l'action exige ROLE_USER côté API et
 * échouerait systématiquement, ce que le design system interdit déjà pour OwnerBar.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HomebrewList } from './HomebrewList';
import type { HomebrewEntry } from '../../services/homebrewService';

afterEach(cleanup);

const entree = (overrides: Partial<HomebrewEntry> = {}): HomebrewEntry => ({
    id: 1,
    category: 'race',
    name: 'Peuple des cimes',
    description: null,
    visibility: 'public',
    data: null,
    authorId: 42,
    authorPseudo: 'Quelqu’un',
    createdAt: '',
    updatedAt: '',
    ...overrides,
});

const noop = () => {};

describe('HomebrewList', () => {
    it('ne propose pas de dupliquer le contenu d’autrui à un visiteur anonyme', () => {
        render(
            <HomebrewList
                entries={[entree()]}
                category="race"
                myId={undefined}
                duplicatingId={null}
                onOpen={noop}
                onEdit={noop}
                onDelete={noop}
                onDuplicate={noop}
            />
        );
        expect(screen.queryByText(/Dupliquer chez moi/i)).toBeNull();
    });

    it('propose de dupliquer le contenu d’autrui à un membre connecté', () => {
        const onDuplicate = vi.fn();
        render(
            <HomebrewList
                entries={[entree()]}
                category="race"
                myId={7}
                duplicatingId={null}
                onOpen={noop}
                onEdit={noop}
                onDelete={noop}
                onDuplicate={onDuplicate}
            />
        );
        expect(screen.getByText(/Dupliquer chez moi/i)).toBeTruthy();
    });
});
