// @vitest-environment jsdom
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HomebrewFields } from './HomebrewFields';
import type { HomebrewFieldDef } from '../../services/homebrewSchemas';
import type { Creature, HarmfulState } from '../../types/normalized';

afterEach(cleanup);

const schemaImage: HomebrewFieldDef[] = [
    { key: 'image', label: 'Image (URL)', type: 'image', required: false },
];

describe('HomebrewFields — champ image', () => {
    it('affiche un aperçu quand une URL est saisie', () => {
        render(<HomebrewFields schema={schemaImage} data={{ image: 'https://exemple.test/i.png' }} onChange={() => {}} />);
        const apercu = screen.getByAltText('Aperçu') as HTMLImageElement;
        expect(apercu.src).toBe('https://exemple.test/i.png');
    });

    it("n'affiche aucun aperçu sans URL", () => {
        render(<HomebrewFields schema={schemaImage} data={{}} onChange={() => {}} />);
        expect(screen.queryByAltText('Aperçu')).toBeNull();
    });
});

describe('HomebrewFields — erreurs', () => {
    const schema: HomebrewFieldDef[] = [
        { key: 'speed', label: 'Vitesse', type: 'text', required: true },
    ];

    it('affiche le message sous le champ fautif', () => {
        render(<HomebrewFields schema={schema} data={{}} onChange={() => {}} errors={{ speed: '« Vitesse » est obligatoire.' }} />);
        expect(screen.getByText('« Vitesse » est obligatoire.')).toBeTruthy();
    });

    it("n'affiche rien quand il n'y a pas d'erreur", () => {
        render(<HomebrewFields schema={schema} data={{ speed: '10 m' }} onChange={() => {}} />);
        expect(screen.queryByText(/obligatoire/)).toBeNull();
    });

    it('expose une ancre de défilement par champ', () => {
        const { container } = render(<HomebrewFields schema={schema} data={{}} onChange={() => {}} />);
        expect(container.querySelector('#champ-speed')).toBeTruthy();
    });
});

const ETATS: HarmfulState[] = [
    { id: '1', name: 'Renversé', description: '', image: '' },
    { id: '2', name: 'Aveuglé', description: '', image: '' },
];
const loup = { id: 7, name: 'Loup' } as unknown as Creature;
const REFERENCES = {
    etats: ETATS,
    sources: { creatures: [loup], monstresMaison: [], armes: [], armures: [], communautaire: [] },
};
const SCHEMA_DECLARATIONS: HomebrewFieldDef[] = [
    { key: 'states', label: 'États infligés', type: 'etats', required: false },
    { key: 'summons', label: 'Invocations', type: 'invocations', required: false },
];

describe('HomebrewFields — déclarations', () => {
    it('ne rend aucun des deux champs sans références', () => {
        // Mieux vaut ne rien proposer qu'un sélecteur vide.
        render(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={{}} onChange={() => {}} />);
        expect(screen.queryByText('États infligés')).toBeNull();
        expect(screen.queryByText('Invocations')).toBeNull();
    });

    it('coche un état et remonte son nom canonique', () => {
        let recu: Record<string, unknown> | null = null;
        render(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={{}} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.click(screen.getByText('Renversé'));
        expect(recu!.states).toEqual(['Renversé']);
    });

    it('décoche un état déjà choisi', () => {
        let recu: Record<string, unknown> | null = null;
        render(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={{ states: ['Renversé'] }} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.click(screen.getByText('Renversé'));
        expect(recu!.states).toEqual([]);
    });

    it('conserve l’ordre du compendium, pas celui des clics', () => {
        // Deux capacités identiques doivent produire la même donnée.
        let recu: Record<string, unknown> | null = null;
        render(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={{ states: ['Aveuglé'] }} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.click(screen.getByText('Renversé'));
        expect(recu!.states).toEqual(['Renversé', 'Aveuglé']);
    });

    it('ajoute une ligne d’invocation vide, puis la renseigne', () => {
        let recu: Record<string, unknown> | null = null;
        const { rerender } = render(
            <HomebrewFields schema={SCHEMA_DECLARATIONS} data={{}} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.click(screen.getByText('Ajouter une invocation'));
        expect(recu!.summons).toEqual([{ type: 'creature', ref: '', quantity: 1 }]);

        rerender(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={recu!} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.change(screen.getByLabelText('Entité invoquée'), { target: { value: 'Loup' } });
        expect((recu!.summons as Record<string, unknown>[])[0]).toMatchObject({ type: 'creature', ref: 'Loup' });
    });

    it('retire une ligne d’invocation', () => {
        let recu: Record<string, unknown> | null = null;
        const data = { summons: [{ type: 'creature', ref: 'Loup', quantity: 1 }] };
        render(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={data} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.click(screen.getByLabelText('Retirer cette invocation'));
        expect(recu!.summons).toEqual([]);
    });
});
