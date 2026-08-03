// @vitest-environment jsdom
/**
 * `OwnerBar` est la SEULE différence visuelle admise entre une fiche officielle et une
 * fiche communautaire : ce qu'elle offre, et à qui, se vérifie donc dans le DOM et non
 * dans les intentions du composant.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { OwnerBar } from './OwnerBar';

afterEach(cleanup);

describe('OwnerBar', () => {
    it('propose de dupliquer son PROPRE contenu, sans « chez moi »', () => {
        // Partir d'une de ses voies pour en faire une variante est un usage légitime :
        // le bouton était auparavant réservé au contenu d'autrui.
        const onDuplicate = vi.fn();
        render(<OwnerBar pseudo="moi" visibility="private" mine onEdit={() => {}} onDelete={() => {}} onDuplicate={onDuplicate} />);

        const bouton = screen.getByText('Dupliquer');
        fireEvent.click(bouton);
        expect(onDuplicate).toHaveBeenCalledOnce();
        expect(screen.queryByText(/chez moi/)).toBeNull();
    });

    it('dit « Dupliquer chez moi » sur le contenu d’autrui', () => {
        render(<OwnerBar pseudo="quelqu’un" visibility="public" mine={false} onDuplicate={() => {}} />);
        expect(screen.getByText(/Dupliquer chez moi/)).toBeTruthy();
    });

    it('n’offre Modifier et Supprimer que sur son propre contenu', () => {
        render(<OwnerBar pseudo="quelqu’un" visibility="public" mine={false} onEdit={() => {}} onDelete={() => {}} onDuplicate={() => {}} />);
        expect(screen.queryByText('Modifier')).toBeNull();
        expect(screen.queryByText('Supprimer')).toBeNull();
    });

    it('ne rend aucun bouton sans gestionnaire — pas d’action morte', () => {
        const { container } = render(<OwnerBar pseudo="moi" visibility="private" mine />);
        expect(container.querySelectorAll('button')).toHaveLength(0);
    });
});
