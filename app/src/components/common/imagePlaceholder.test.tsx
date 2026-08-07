// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { imagePlaceholder, onImageError } from './imagePlaceholder';

afterEach(cleanup);

describe('imagePlaceholder', () => {
    it('porte l’initiale du nom, en majuscule', () => {
        expect(imagePlaceholder('elfe sylvain')).toContain('%3EE%3C/text%3E');
    });

    it('n’émet aucune requête réseau (SVG encodé dans l’URL)', () => {
        expect(imagePlaceholder('Gnome').startsWith('data:image/svg+xml,')).toBe(true);
    });

    it('utilise le format portrait pour une fiche, la carte par défaut', () => {
        expect(imagePlaceholder('Gnome', 'portrait')).toContain('height="533"');
        expect(imagePlaceholder('Gnome')).toContain('height="300"');
    });

    it('tolère un nom vide plutôt que d’échouer', () => {
        expect(() => imagePlaceholder('')).not.toThrow();
    });
});

describe('onImageError', () => {
    it('remplace une illustration injoignable par la vignette générique', () => {
        // Cas réel : les illustrations officielles sont hébergées sur un site tiers.
        render(<img src="https://exemple.invalide/nain.png" alt="Nain" onError={onImageError('Nain')} />);
        const img = screen.getByAltText('Nain') as HTMLImageElement;

        fireEvent.error(img);

        expect(img.getAttribute('src')).toBe(imagePlaceholder('Nain'));
    });

    it('ne reboucle pas si la vignette elle-même échoue', () => {
        render(<img src={imagePlaceholder('Nain')} alt="Nain" onError={onImageError('Nain')} />);
        const img = screen.getByAltText('Nain') as HTMLImageElement;
        const avant = img.getAttribute('src');

        fireEvent.error(img);

        expect(img.getAttribute('src')).toBe(avant);
    });
});
