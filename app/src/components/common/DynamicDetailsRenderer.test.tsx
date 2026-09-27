// @vitest-environment jsdom
/**
 * `DynamicDetailsRenderer` n'a pas de schéma : il devine quoi afficher depuis le PRÉFIXE
 * de chaque clé JSON (statistiques_, mecaniques_, choix_ / options_, note ou note_speciale,
 * repli générique). Une seule branche cassée fait taire silencieusement un champ sur
 * toutes les fiches qui l'utilisent — d'où ce test branche par branche.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DynamicDetailsRenderer } from './DynamicDetailsRenderer';

afterEach(cleanup);

describe('DynamicDetailsRenderer', () => {
    it('ne rend rien sans détails (null ou undefined)', () => {
        const { container: withNull } = render(<DynamicDetailsRenderer details={null} />);
        expect(withNull.firstChild).toBeNull();

        cleanup();
        const { container: withUndefined } = render(<DynamicDetailsRenderer details={undefined} />);
        expect(withUndefined.firstChild).toBeNull();
    });

    it('rend un bloc « statistiques_* » avec titre dérivé de la clé et ses paires', () => {
        render(<DynamicDetailsRenderer details={{ statistiques_loup_monture: { FOR: 3, DEF: 14 } }} />);
        expect(screen.getByText('Statistiques : loup monture')).toBeTruthy();
        expect(screen.getByText('FOR')).toBeTruthy();
        expect(screen.getByText('3')).toBeTruthy();
        expect(screen.getByText('DEF')).toBeTruthy();
        expect(screen.getByText('14')).toBeTruthy();
    });

    it('rend « note » et « note_speciale » comme un encart texte simple', () => {
        render(<DynamicDetailsRenderer details={{ note: 'Effet cumulable', note_speciale: 'Ne fonctionne pas sous l’eau' }} />);
        expect(screen.getByText('Effet cumulable')).toBeTruthy();
        expect(screen.getByText('Ne fonctionne pas sous l’eau')).toBeTruthy();
    });

    it('rend un bloc « mecaniques_* » en liste quand la valeur est un tableau', () => {
        render(<DynamicDetailsRenderer details={{ mecaniques_vol: ['Vitesse 12m', 'Manœuvrabilité bonne'] }} />);
        expect(screen.getByText('Mécaniques vol')).toBeTruthy();
        expect(screen.getByText('Vitesse 12m')).toBeTruthy();
        expect(screen.getByText('Manœuvrabilité bonne')).toBeTruthy();
    });

    it('rend un bloc « mecaniques_* » en paires clé/valeur quand la valeur est un objet', () => {
        render(<DynamicDetailsRenderer details={{ mecaniques_transformation: { duree: '1 heure', cout: '2 PM' } }} />);
        expect(screen.getByText('duree:')).toBeTruthy();
        expect(screen.getByText('1 heure')).toBeTruthy();
        expect(screen.getByText('cout:')).toBeTruthy();
        expect(screen.getByText('2 PM')).toBeTruthy();
    });

    it('rend « choix_* »/« options_* » en liste quand la valeur est un tableau', () => {
        render(<DynamicDetailsRenderer details={{ choix_capacite: ['Frappe puissante', 'Esquive'] }} />);
        expect(screen.getByText('choix capacite')).toBeTruthy();
        expect(screen.getByText('Frappe puissante')).toBeTruthy();
        expect(screen.getByText('Esquive')).toBeTruthy();
    });

    it('rend « choix_* »/« options_* » en texte italique quand la valeur n’est pas un tableau', () => {
        render(<DynamicDetailsRenderer details={{ options_origines: 'Au choix du joueur' }} />);
        expect(screen.getByText('Au choix du joueur')).toBeTruthy();
    });

    it('rend une clé inconnue via le repli générique, brute pour un scalaire', () => {
        render(<DynamicDetailsRenderer details={{ portee_max: '30 mètres' }} />);
        expect(screen.getByText('portee max:')).toBeTruthy();
        expect(screen.getByText('30 mètres')).toBeTruthy();
    });

    it('sérialise en JSON une clé inconnue dont la valeur est un objet', () => {
        render(<DynamicDetailsRenderer details={{ champ_exotique: { a: 1, b: 2 } }} />);
        expect(screen.getByText('{"a":1,"b":2}')).toBeTruthy();
    });

    it('applique la classe fournie au conteneur', () => {
        const { container } = render(<DynamicDetailsRenderer details={{ note: 'x' }} className="mt-4" />);
        expect(container.firstElementChild?.className).toContain('mt-4');
    });
});
