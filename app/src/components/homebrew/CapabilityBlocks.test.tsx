// @vitest-environment jsdom
/**
 * Filet de rendu pour CapabilityBlocks : le point sensible de ce composant n'est pas
 * qu'un champ existe dans son état, mais qu'un bloc porteur d'erreur s'ouvre
 * *effectivement* dans le DOM (attribut `open` de <details>) — sans quoi l'auteur
 * verrait un enregistrement refusé sans cause visible, l'erreur cachée dans un bloc
 * replié. On vérifie donc l'attribut DOM réel, pas seulement la présence d'un texte
 * (qu'un <details> fermé peut techniquement contenir sans l'exposer visuellement).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CapabilityBlocks } from './CapabilityBlocks';
import type { ChildDraft } from '../../services/homebrewChildren';

afterEach(cleanup);

const drafts: ChildDraft[] = [
    { category: 'capacite', name: 'Frappe', data: { rank: 1 } },
    { category: 'capacite', name: 'Parade', data: { rank: 2 } },
];

describe('CapabilityBlocks', () => {
    it('affiche un bloc replié par capacité, titré par sa position et son nom', () => {
        render(<CapabilityBlocks drafts={drafts} onChange={() => {}} errors={{}} />);
        expect(screen.getByText('Capacité 1 — Frappe')).toBeTruthy();
        expect(screen.getByText('Capacité 2 — Parade')).toBeTruthy();

        const blocs = document.querySelectorAll('details');
        expect(blocs).toHaveLength(2);
        blocs.forEach(bloc => expect(bloc.open).toBe(false));
    });

    it('ouvre automatiquement le bloc porteur d’erreur et le signale, laisse les autres repliés', () => {
        render(
            <CapabilityBlocks
                drafts={drafts}
                onChange={() => {}}
                errors={{ 'capacites.1.rank': 'Capacité 2 — « Rang » est obligatoire.' }}
            />,
        );

        const blocs = document.querySelectorAll('details');
        expect(blocs[0].open).toBe(false);
        expect(blocs[1].open).toBe(true);
        expect(blocs[1].querySelector('[aria-label="Erreur dans cette capacité"]')).toBeTruthy();
        expect(blocs[0].querySelector('[aria-label="Erreur dans cette capacité"]')).toBeNull();
    });

    it('ajoute un brouillon vide au clic sur « Ajouter une capacité »', () => {
        let dernierAppel: ChildDraft[] | null = null;
        render(<CapabilityBlocks drafts={[]} onChange={d => { dernierAppel = d; }} errors={{}} />);
        screen.getByText('Ajouter une capacité').click();
        expect(dernierAppel).toEqual([{ category: 'capacite', name: '', data: {} }]);
    });

    it('remonte le contenu du champ Nom avec l’identifiant d’ancre attendu par le défilement', () => {
        render(<CapabilityBlocks drafts={drafts} onChange={() => {}} errors={{}} />);
        expect(document.getElementById('champ-capacites.0.name')).toBeTruthy();
        expect(document.getElementById('champ-capacites.1.name')).toBeTruthy();
    });
});
