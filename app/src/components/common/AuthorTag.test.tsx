// @vitest-environment jsdom
/**
 * Le profil public d'un auteur (jalon B, site communautaire) se rejoint depuis
 * n'importe quelle étiquette d'auteur — mais seulement quand un `authorId` est fourni :
 * l'étiquette reste un simple badge partout ailleurs, comme avant ce chantier.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthorTag } from './AuthorTag';

afterEach(cleanup);

describe('AuthorTag', () => {
    it('renvoie vers le profil public quand authorId est fourni', () => {
        render(<MemoryRouter><AuthorTag pseudo="Nauno" authorId={42} /></MemoryRouter>);
        const lien = screen.getByRole('link');
        expect(lien.getAttribute('href')).toBe('/profil/42');
    });

    it('reste un simple badge sans authorId', () => {
        render(<MemoryRouter><AuthorTag pseudo="Nauno" /></MemoryRouter>);
        expect(screen.queryByRole('link')).toBeNull();
        expect(screen.getByText('Nauno')).toBeTruthy();
    });
});
