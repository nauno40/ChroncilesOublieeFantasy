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

// `Equipment` sépare armes et armures côté client depuis la même collection : le type
// « Corps » range en armures (cf. la page). Le matériel vient d'une collection à part.
const equipementOfficiel = [
    { id: 1, name: 'Épée longue', type: 'Contact', damage: '1d8', critical: '20', range: '', reload: '', requirements: 'Deux mains', price: '15 po' },
    { id: 2, name: 'Cotte de mailles', type: 'Corps', acBonus: 5, comments: 'Lourde', price: '150 po' },
];
const materielOfficiel = [{ id: 3, name: 'Corde (15 m)', notes: 'Chanvre', price: '1 po' }];

vi.mock('../../services/dataService', () => ({
    DataService: {
        getPoisons: () => Promise.resolve(poisonsOfficiels),
        getTraps: () => Promise.resolve(piegesOfficiels),
        getWeapons: () => Promise.resolve(equipementOfficiel),
        getMaterials: () => Promise.resolve(materielOfficiel),
    },
}));

const { Poisons } = await import('../../pages/Poisons');
const { Traps } = await import('../../pages/Traps');
const { Equipment } = await import('../../pages/Equipment');
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

const listeCommunautaire = (category: string, data: Record<string, unknown>, sousType?: 'arme' | 'armure' | 'materiel') => render(
    <MemoryRouter>
        <HomebrewList
            entries={[entreeCommunautaire(category, data)]}
            category={category}
            duplicatingId={null}
            onOpen={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onDuplicate={() => {}}
            sousType={sousType}
        />
    </MemoryRouter>,
);

/** Rend la page officielle de l'équipement sur l'une de ses trois pastilles. */
const equipementOfficielRendu = async (pastille: 'Armes' | 'Armures' | 'Matériel') => {
    const vue = render(<MemoryRouter><Equipment /></MemoryRouter>);
    await screen.findAllByRole('tab', { name: pastille });
    if (pastille !== 'Armes') {
        (await screen.findAllByRole('tab', { name: pastille }))[0].click();
        // Le clic déclenche un rendu React : laisser la file de micro-tâches se vider.
        await new Promise(r => setTimeout(r, 0));
    }
    return vue;
};

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

    it.each([
        ['Armes' as const, 'arme' as const, { type: 'Contact', damage: '2d6', critical: '19-20', range: '5 m', reload: '1 action', properties: ['Deux mains'], price: '30 po' }],
        ['Armures' as const, 'armure' as const, { type: 'Corps', acBonus: 4, properties: ['Bruyante'], price: '90 po' }],
        ['Matériel' as const, 'materiel' as const, { properties: ['Solide'], price: '2 po' }],
    ])('un équipement communautaire (%s) porte les colonnes de la table officielle', async (pastille, sousType, data) => {
        const officiel = await equipementOfficielRendu(pastille);
        const attendues = entetes(officiel.container);
        expect(attendues.length).toBeGreaterThan(2); // garde-fou : une table vide ne prouverait rien
        cleanup();

        const communautaire = listeCommunautaire('equipement', data, sousType);
        expect(entetes(communautaire.container).slice(0, attendues.length)).toEqual(attendues);
    });

    it('affiche les champs d’arme que la liste communautaire perdait', () => {
        // Critique, portée, rechargement et « spécial » étaient saisis dans le formulaire
        // et n'atteignaient aucune colonne : l'auteur ne les revoyait jamais dans sa liste.
        const { container } = listeCommunautaire('equipement', {
            type: 'Distance', damage: '1d6', critical: '19-20', range: '20 m',
            reload: '1 action', properties: ['Munitions rares'], price: '30 po',
        }, 'arme');
        const table = container.querySelector('table') as HTMLElement;
        for (const valeur of ['19-20', '20 m', '1 action', 'Munitions rares']) {
            expect(within(table).getByText(valeur)).toBeTruthy();
        }
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
