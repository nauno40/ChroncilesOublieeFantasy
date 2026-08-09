// @vitest-environment jsdom
/**
 * Preuve d'iso officiel ↔ communautaire pour les types présentés en tableau.
 *
 * Les deux listes décrivaient leurs colonnes chacune de son côté et avaient déjà divergé
 * (« Détecter » contre « Détection »). Vérifier que `COLONNES_TABLE` est bien importée des
 * deux côtés ne prouverait rien sur le rendu — le défaut de référence du chantier
 * (`armorMaxDef` peuplé, testé, jamais rendu) est né exactement de cette confusion. Ce
 * test monte donc **les deux vrais composants** et compare les en-têtes obtenus dans le DOM.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const poisonsOfficiels = [{
    id: 1, name: 'Venin de vouivre', effectFail: 'Perd 1d6 PV', effectSuccess: 'Aucun effet',
    duration: '1 heure', delay: '1 round', note: 'Ingestion',
}];
const piegesOfficiels = [{
    id: 1, name: 'Fosse à pieux', detectDifficulty: 'DIF 15', disarmDifficulty: 'DIF 12',
    effect: '2d6 DM', complement: 'DM/2 sur test AGI',
}];

vi.mock('../../services/dataService', () => ({
    DataService: {
        getPoisons: () => Promise.resolve(poisonsOfficiels),
        getTraps: () => Promise.resolve(piegesOfficiels),
    },
}));

const { Poisons } = await import('../../pages/Poisons');
const { Traps } = await import('../../pages/Traps');
const { HomebrewList } = await import('../homebrew/HomebrewList');

afterEach(cleanup);

/** En-têtes de la table de grand écran (le rendu mobile n'en a pas). */
const entetes = (racine: HTMLElement): string[] =>
    Array.from(racine.querySelectorAll('thead th')).map(th => th.textContent?.trim() ?? '');

const entreeCommunautaire = (category: string, data: Record<string, unknown>) => ({
    id: 42, name: 'Création maison', description: 'Une entrée de la bibliothèque',
    category, visibility: 'public' as const, authorId: 7, authorPseudo: 'quelqu’un', data,
    createdAt: '2026-08-10T00:00:00+00:00', updatedAt: '2026-08-10T00:00:00+00:00',
});

const listeCommunautaire = (category: string, data: Record<string, unknown>) => render(
    <MemoryRouter>
        <HomebrewList
            entries={[entreeCommunautaire(category, data)]}
            category={category}
            duplicatingId={null}
            onOpen={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onDuplicate={() => {}}
        />
    </MemoryRouter>,
);

describe('table du compendium : officiel et communautaire', () => {
    it('un poison communautaire porte les colonnes de la table officielle', async () => {
        const officiel = render(<MemoryRouter><Poisons /></MemoryRouter>);
        await screen.findAllByText('Venin de vouivre');
        const attendues = entetes(officiel.container);
        cleanup();

        const communautaire = listeCommunautaire('poison', {
            effectFail: 'Paralysie', effectSuccess: 'Rien', duration: '2 rounds', delay: 'immédiat', note: 'Contact',
        });
        // La colonne terminale (auteur/actions) n'existe que côté communautaire : c'est le
        // seul delta admis, comme `OwnerBar` sur les fiches.
        expect(entetes(communautaire.container).slice(0, attendues.length)).toEqual(attendues);
    });

    it('un piège communautaire porte les colonnes de la table officielle', async () => {
        const officiel = render(<MemoryRouter><Traps /></MemoryRouter>);
        await screen.findAllByText('Fosse à pieux');
        const attendues = entetes(officiel.container);
        cleanup();

        const communautaire = listeCommunautaire('piege', {
            detectDifficulty: 'DIF 18', disarmDifficulty: 'DIF 20', effect: '3d6 DM', complement: 'Rechargeable',
        });
        expect(entetes(communautaire.container).slice(0, attendues.length)).toEqual(attendues);
    });

    it('affiche toutes les valeurs saisies d’une entrée communautaire', () => {
        // Le défaut le plus coûteux du chantier est un champ saisi qui n'atteint aucune
        // colonne : on vérifie chaque valeur dans le DOM, pas seulement les en-têtes.
        const { container } = listeCommunautaire('piege', {
            detectDifficulty: 'DIF 18', disarmDifficulty: 'DIF 20', effect: '3d6 DM', complement: 'Rechargeable',
        });
        const table = container.querySelector('table') as HTMLElement;
        for (const valeur of ['DIF 18', 'DIF 20', '3d6 DM', 'Rechargeable']) {
            expect(within(table).getByText(valeur)).toBeTruthy();
        }
    });
});
