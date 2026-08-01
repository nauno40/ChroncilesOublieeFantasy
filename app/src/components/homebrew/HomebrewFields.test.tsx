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
