// @vitest-environment jsdom
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HomebrewFields } from './HomebrewFields';
import type { HomebrewFieldDef } from '../../services/homebrewSchemas';

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
