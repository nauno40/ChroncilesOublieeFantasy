// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CapabilityCard } from './CapabilityCard';

afterEach(cleanup);

describe('CapabilityCard', () => {
    it('affiche rang, nom, description et les badges présents', () => {
        render(<CapabilityCard cap={{ rank: 3, name: 'Boule de feu', description: 'Explose', isSpell: true, limited: true, active: true }} />);
        expect(screen.getByText('Boule de feu')).toBeTruthy();
        expect(screen.getByText('Explose')).toBeTruthy();
        expect(screen.getByText('3')).toBeTruthy();
        expect(screen.getByText(/Sort/)).toBeTruthy();
        expect(screen.getByText(/Limité/)).toBeTruthy();
        expect(screen.getByText(/Actif/)).toBeTruthy();
    });

    it('n’affiche aucun badge absent', () => {
        render(<CapabilityCard cap={{ name: 'Simple' }} />);
        expect(screen.queryByText(/Sort/)).toBeNull();
        expect(screen.queryByText(/Limité/)).toBeNull();
        expect(screen.queryByText(/Actif/)).toBeNull();
    });

    it('affiche le rang 0, qui est une valeur légitime', () => {
        render(<CapabilityCard cap={{ rank: 0, name: 'Rang zéro' }} />);
        expect(screen.getByText('0')).toBeTruthy();
    });

    it('affiche l’effet et les détails en lignes libres d’une capacité communautaire', () => {
        // Une capacité communautaire porte son contenu principal dans `effect`, pas dans
        // `description` : sans ces deux blocs elle s'affichait réduite à son nom au sein
        // de sa voie — constaté dans un navigateur, invisible pour les tests du modèle.
        render(<CapabilityCard cap={{
            rank: 1, name: 'Braise',
            effect: ['Inflige 1d6 dégâts de feu', 'Portée 10 m'],
            detailLines: ['Une fois par combat'],
        }} />);
        expect(screen.getByText('Inflige 1d6 dégâts de feu')).toBeTruthy();
        expect(screen.getByText('Portée 10 m')).toBeTruthy();
        expect(screen.getByText('Une fois par combat')).toBeTruthy();
    });

    it('n’affiche pas de liste vide quand effet et détails sont absents', () => {
        const { container } = render(<CapabilityCard cap={{ name: 'Sans effet', effect: [], detailLines: [] }} />);
        expect(container.querySelectorAll('ul').length).toBe(0);
    });
});
