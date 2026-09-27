// @vitest-environment jsdom
/**
 * `CommentThread` est purement présentationnel vis-à-vis de `useComments` (mocké ici) :
 * ce qu'il affiche et propose selon l'état du fil se vérifie dans le DOM.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommentThread } from './CommentThread';
import { useComments } from '../../hooks/useComments';

vi.mock('../../hooks/useComments', () => ({ useComments: vi.fn() }));

const mockUseComments = vi.mocked(useComments);

afterEach(cleanup);

const renderThread = () => render(
    <MemoryRouter>
        <CommentThread targetType="homebrew_entry" targetId={1} />
    </MemoryRouter>
);

describe('CommentThread', () => {
    it('propose de se connecter, jamais un bouton de publication, sans session', () => {
        mockUseComments.mockReturnValue({
            comments: [], loading: false, posting: false, removingId: null,
            onAdd: undefined, onRemove: vi.fn(), canRemove: () => false,
        });
        renderThread();
        expect(screen.getByText('Connectez-vous')).toBeTruthy();
        expect(screen.queryByText('Publier')).toBeNull();
    });

    it('liste les commentaires avec leur auteur', () => {
        mockUseComments.mockReturnValue({
            comments: [{ id: 1, targetType: 'homebrew_entry', targetId: 1, content: 'Bravo !', authorId: 2, authorPseudo: 'Alice', createdAt: '2026-01-01T00:00:00Z' }],
            loading: false, posting: false, removingId: null,
            onAdd: vi.fn(), onRemove: vi.fn(), canRemove: () => false,
        });
        renderThread();
        expect(screen.getByText('Bravo !')).toBeTruthy();
        expect(screen.getByText('Alice')).toBeTruthy();
    });

    it('ne propose de supprimer que les commentaires que canRemove autorise', () => {
        mockUseComments.mockReturnValue({
            comments: [{ id: 1, targetType: 'homebrew_entry', targetId: 1, content: 'Le mien', authorId: 2, authorPseudo: 'Moi', createdAt: '2026-01-01T00:00:00Z' }],
            loading: false, posting: false, removingId: null,
            onAdd: vi.fn(), onRemove: vi.fn(), canRemove: () => true,
        });
        const { container } = renderThread();
        expect(container.querySelector('button[title="Supprimer ce commentaire"]')).toBeTruthy();
    });

    it('n’affiche aucun bouton de suppression quand canRemove refuse', () => {
        mockUseComments.mockReturnValue({
            comments: [{ id: 1, targetType: 'homebrew_entry', targetId: 1, content: 'Pas le mien', authorId: 2, authorPseudo: 'Bob', createdAt: '2026-01-01T00:00:00Z' }],
            loading: false, posting: false, removingId: null,
            onAdd: vi.fn(), onRemove: vi.fn(), canRemove: () => false,
        });
        const { container } = renderThread();
        expect(container.querySelector('button[title="Supprimer ce commentaire"]')).toBeNull();
    });

    it('publie un nouveau commentaire depuis le brouillon', () => {
        const onAdd = vi.fn().mockResolvedValue(undefined);
        mockUseComments.mockReturnValue({
            comments: [], loading: false, posting: false, removingId: null,
            onAdd, onRemove: vi.fn(), canRemove: () => false,
        });
        renderThread();
        fireEvent.change(screen.getByPlaceholderText('Votre commentaire…'), { target: { value: 'Superbe travail' } });
        fireEvent.click(screen.getByText('Publier'));
        expect(onAdd).toHaveBeenCalledWith('Superbe travail');
    });
});
