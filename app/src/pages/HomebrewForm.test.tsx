// @vitest-environment jsdom
/**
 * Filet de rendu pour HomebrewForm : le point sensible ici n'est pas que
 * `saveChildren` rapporte un échec (déjà couvert par homebrewChildren.test.ts), mais
 * que ce compte-rendu atteigne effectivement le bloc `<details>` fautif dans le DOM —
 * exactement comme une erreur de validation cliente le fait. Un échec réseau/serveur
 * survient nécessairement *après* une validation réussie ; sans la correspondance
 * position → clé `capacites.<indice>.`, le bloc reste replié et l'auteur ne voit
 * l'échec que dans le bandeau de synthèse, jamais sur le bloc lui-même.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomebrewForm } from './HomebrewForm';
import { HomebrewService } from '../services/homebrewService';

vi.mock('../services/homebrewService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../services/homebrewService')>();
    return {
        ...actual,
        HomebrewService: { create: vi.fn(), update: vi.fn(), remove: vi.fn(), getById: vi.fn(), getAll: vi.fn() },
    };
});

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

const remplir = (id: string, valeur: string) => {
    const input = document.getElementById(id)?.querySelector('input, textarea') as HTMLInputElement;
    fireEvent.change(input, { target: { value: valeur } });
};

const ajouterLigne = (id: string, valeur: string) => {
    const conteneur = document.getElementById(id) as HTMLElement;
    fireEvent.click(within(conteneur).getByText('Ajouter'));
    const input = within(conteneur).getByRole('textbox');
    fireEvent.change(input, { target: { value: valeur } });
};

const renderForm = () =>
    render(
        <MemoryRouter initialEntries={['/bibliotheque/nouveau/voie']}>
            <Routes>
                <Route path="/bibliotheque/nouveau/:categorie" element={<HomebrewForm />} />
                {/* Cible de la navigation post-enregistrement (categoryPath('voie')) : une
                 *  route de repli évite un avertissement react-router bruyant sans rien
                 *  changer au comportement observé (le formulaire est démonté). */}
                <Route path="*" element={null} />
            </Routes>
        </MemoryRouter>,
    );

/** Remplit le strict nécessaire pour passer la validation cliente : les champs
 *  obligatoires de la voie, plus une capacité elle-même valide. */
const remplirFormulaireValide = () => {
    fireEvent.change(screen.getByPlaceholderText('Nom du contenu'), { target: { value: 'Voie de test' } });
    remplir('champ-category', 'profil');
    remplir('champ-maxRank', '5');
    // Volontairement PAS de `champ-details` : les mécaniques de la voie sont
    // facultatives, et le remplir masquerait une régression du champ obligatoire.

    fireEvent.click(screen.getByText('Ajouter une capacité'));
    remplir('champ-capacites.0.name', 'Frappe');
    remplir('champ-capacites.0.rank', '1');
    remplir('champ-capacites.0.actionType', 'Attaque');
    ajouterLigne('champ-capacites.0.effect', 'Un effet');
    ajouterLigne('champ-capacites.0.details', 'Un détail');
};

describe('HomebrewForm — échec serveur d’une capacité', () => {
    it('ouvre et signale le bloc de la capacité dont l’enregistrement échoue côté serveur', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ id: 42 }) // la voie elle-même
            .mockRejectedValueOnce(new Error('SQLSTATE[22001]: value too long')); // la capacité

        renderForm();
        remplirFormulaireValide();

        fireEvent.click(screen.getByText('Enregistrer'));

        await waitFor(() => {
            const bloc = document.querySelectorAll('details')[0];
            expect(bloc.open).toBe(true);
        });

        const bloc = document.querySelectorAll('details')[0];
        expect(bloc.className).toContain('border-red-500/50');
        expect(within(bloc).getByLabelText('Erreur dans cette capacité')).toBeTruthy();
    });

    it('ne signale plus le bloc une fois la reprise réussie', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ id: 42 }) // la voie
            .mockRejectedValueOnce(new Error('boum')) // la capacité, 1er essai
            .mockResolvedValueOnce({ id: 99 }); // la capacité, reprise
        (HomebrewService.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 42 });

        renderForm();
        remplirFormulaireValide();

        fireEvent.click(screen.getByText('Enregistrer'));
        await waitFor(() => expect(document.querySelectorAll('details')[0].open).toBe(true));

        fireEvent.click(screen.getByText('Enregistrer'));

        await waitFor(() => {
            expect(HomebrewService.create).toHaveBeenCalledTimes(3);
        });
        // La navigation suit un succès complet : le formulaire est démonté, plus aucun
        // bloc en échec ne peut donc rester signalé.
        await waitFor(() => expect(document.querySelectorAll('details').length).toBe(0));
    });
});

describe('HomebrewForm — défilement vers le bloc fautif', () => {
    // jsdom n'implémente pas scrollIntoView : on le remplace par un espion qui
    // consigne, à l'instant précis de l'appel, si le <details> englobant la cible est
    // déjà ouvert dans le DOM réel — c'est exactement ce qui distingue un défilement
    // prématuré (le bloc est encore fermé, sans boîte de rendu) d'un défilement
    // effectué après le commit React.
    const appelsOuverture: boolean[] = [];
    beforeEach(() => {
        appelsOuverture.length = 0;
        Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
            const details = this.closest('details');
            appelsOuverture.push(details ? details.open : true);
        });
    });

    it('défile vers le bloc de capacité fautif seulement une fois qu’il est ouvert dans le DOM', async () => {
        renderForm();
        // Tout est valide sauf le champ « Effet(s) » de la capacité : la seule erreur
        // de validation porte donc la clé `capacites.0.effect`, cible du défilement.
        fireEvent.change(screen.getByPlaceholderText('Nom du contenu'), { target: { value: 'Voie de test' } });
        remplir('champ-category', 'profil');
        remplir('champ-maxRank', '5');
        ajouterLigne('champ-details', 'Une ligne de détail');
        fireEvent.click(screen.getByText('Ajouter une capacité'));
        remplir('champ-capacites.0.name', 'Frappe');
        remplir('champ-capacites.0.rank', '1');
        remplir('champ-capacites.0.actionType', 'Attaque');
        ajouterLigne('champ-capacites.0.details', 'Un détail');

        expect(document.querySelectorAll('details')[0].open).toBe(false);

        fireEvent.click(screen.getByText('Enregistrer'));

        await waitFor(() => expect(appelsOuverture.length).toBeGreaterThan(0));
        expect(appelsOuverture).toEqual([true]);
    });
});

/**
 * Travail supplémentaire hors cahier des charges (cf. Task 4 réserve n°2) : éditer une
 * voie existante doit recharger ses capacités déjà enregistrées, avec le même filtrage
 * sur `parent` que la fiche de consultation (`childrenOf`, `homebrewService.ts`).
 */
describe('HomebrewForm — édition d’une voie recharge ses capacités', () => {
    const renderEditForm = () =>
        render(
            <MemoryRouter initialEntries={['/bibliotheque/42/modifier']}>
                <Routes>
                    <Route path="/bibliotheque/:id/modifier" element={<HomebrewForm />} />
                    <Route path="*" element={null} />
                </Routes>
            </MemoryRouter>,
        );

    const voie = {
        id: 42, category: 'voie', name: 'Voie du Gel', description: '', visibility: 'private' as const,
        data: { category: 'profil', maxRank: 5, details: ['x'] }, authorId: 1, authorPseudo: 'N',
        createdAt: '', updatedAt: '',
    };
    const capacite = (id: number, name: string, rank: number, parent: string) => ({
        id, category: 'capacite', name, description: '', visibility: 'private' as const,
        data: { rank }, parent, authorId: 1, authorPseudo: 'N', createdAt: '', updatedAt: '',
    });

    it('affiche, pré-remplis, les blocs des capacités déjà enregistrées — et pas celles d’une autre voie', async () => {
        (HomebrewService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(voie);
        (HomebrewService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([
            voie,
            capacite(1, 'Frappe', 1, '/api/homebrew_entries/42'),
            capacite(2, 'Griffe', 2, '/api/homebrew_entries/42'),
            capacite(3, 'Sans lien', 1, '/api/homebrew_entries/999'),
        ]);

        renderEditForm();

        await waitFor(() => expect(screen.getByText('Capacité 1 — Frappe')).toBeTruthy());
        expect(screen.getByText('Capacité 2 — Griffe')).toBeTruthy();
        expect(screen.queryByText(/Sans lien/)).toBeNull();
        expect(document.querySelectorAll('details').length).toBe(2);
    });

    it('ne déclenche pas la garde de fermeture (dirty) lors du seul chargement des capacités', async () => {
        (HomebrewService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(voie);
        (HomebrewService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([
            voie,
            capacite(1, 'Frappe', 1, '/api/homebrew_entries/42'),
        ]);
        const addSpy = vi.spyOn(window, 'addEventListener');

        renderEditForm();
        await waitFor(() => expect(screen.getByText('Capacité 1 — Frappe')).toBeTruthy());

        expect(addSpy.mock.calls.some(([type]) => type === 'beforeunload')).toBe(false);
        addSpy.mockRestore();
    });

    it('supprime côté serveur une capacité chargée puis retirée par l’auteur (« confirmed » correctement peuplé)', async () => {
        (HomebrewService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(voie);
        (HomebrewService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([
            voie,
            capacite(1, 'Frappe', 1, '/api/homebrew_entries/42'),
        ]);
        (HomebrewService.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 42 });
        (HomebrewService.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        renderEditForm();
        await waitFor(() => expect(screen.getByText('Capacité 1 — Frappe')).toBeTruthy());

        fireEvent.click(screen.getByLabelText('Supprimer la capacité'));
        fireEvent.click(screen.getByText('Enregistrer'));

        await waitFor(() => expect(HomebrewService.remove).toHaveBeenCalledWith(1));
    });
});
