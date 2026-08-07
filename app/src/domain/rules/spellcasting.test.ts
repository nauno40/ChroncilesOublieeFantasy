import { describe, it, expect } from 'vitest';
import { armorImpacts, manaSurcharge, profileAllowedDef, spellManaCost } from './spellcasting';
import type { CompendiumProfile } from './types';
import type { CharacterVoieRef } from '../../types/character';

// Les exemples chiffrés viennent du chapitre 9 « Profils hybrides », § Magie et sorts.

describe('profileAllowedDef', () => {
    it('ramène « aucune armure » (-1) et l’absence de valeur à 0', () => {
        expect(profileAllowedDef(-1)).toBe(0);
        expect(profileAllowedDef(undefined)).toBe(0);
        expect(profileAllowedDef(null)).toBe(0);
    });

    it('rend telle quelle la limite d’un profil qui autorise une armure', () => {
        expect(profileAllowedDef(2)).toBe(2);
        expect(profileAllowedDef(6)).toBe(6);
    });
});

describe('manaSurcharge', () => {
    it('sort de magicien en armure de cuir : surcoût égal à la DEF de l’armure', () => {
        // « un sort de magicien de rang 3 (3 PM) en armure de cuir (DEF +2) coûtera 5 PM »
        expect(manaSurcharge(2, profileAllowedDef(-1), 'Magicien')).toBe(2);
        expect(spellManaCost(3) + manaSurcharge(2, profileAllowedDef(-1), 'Magicien')).toBe(5);
    });

    it('sort de forgesort en cotte de mailles : différence avec la limite du profil', () => {
        // « en cotte de maille (DEF +5), sort de forgesort (DEF max +2) : 3 PM supplémentaires »
        expect(manaSurcharge(5, 2, 'Forgesort')).toBe(3);
    });

    it('sort de barde en cotte de mailles : 2 PM seulement', () => {
        expect(manaSurcharge(5, 3, 'Barde')).toBe(2);
    });

    it('sort de prêtre : aucun surcoût, quelle que soit l’armure', () => {
        expect(manaSurcharge(7, 4, 'Prêtre')).toBe(0);
        expect(manaSurcharge(7, 4, 'pretre')).toBe(0); // insensible à la casse et aux accents
    });

    it('armure plus légère que la limite : rien à payer', () => {
        expect(manaSurcharge(2, 5, 'Guerrier')).toBe(0);
    });
});

// --- armorImpacts ---

const voieDe = (iri: string, caps: { rank: number; name: string; isSpell?: boolean; armorCap?: number }[]) => ({
    '@id': iri,
    capabilities: caps.map(c => ({
        rank: c.rank,
        name: c.name,
        isSpell: c.isSpell ?? false,
        ...(c.armorCap === undefined ? {} : { effect: { armorCap: c.armorCap } }),
    })),
});

const profils: CompendiumProfile[] = [
    {
        name: 'Magicien',
        armorMaxDef: -1,
        voies: [voieDe('/api/voies/1', [
            { rank: 1, name: 'Projectile de mana', isSpell: true },
            { rank: 2, name: 'Maîtrise de la magie' },
        ])],
    },
    {
        name: 'Guerrier',
        armorMaxDef: 5,
        voies: [voieDe('/api/voies/2', [{ rank: 1, name: 'Attaque en puissance' }])],
    },
    {
        name: 'Barbare',
        armorMaxDef: 3,
        voies: [voieDe('/api/voies/3', [
            { rank: 1, name: 'Rage' },
            { rank: 2, name: 'Tour de force', armorCap: 4 },
        ])],
    },
];

const entree = (voie: string, rank: number): CharacterVoieRef => ({ voie, rank, source: 'profil' });

describe('armorImpacts', () => {
    it('sans armure, rien à signaler', () => {
        expect(armorImpacts([entree('/api/voies/1', 2)], profils, 0)).toEqual([]);
    });

    it('un guerrier en cotte de mailles reste dans sa limite', () => {
        expect(armorImpacts([entree('/api/voies/2', 1)], profils, 5)).toEqual([]);
    });

    it('un guerrier-magicien en cotte de mailles : capacités de mage bridées, sort renchéri', () => {
        const impacts = armorImpacts([entree('/api/voies/2', 1), entree('/api/voies/1', 2)], profils, 5);
        expect(impacts).toHaveLength(1);
        expect(impacts[0].profileName).toBe('Magicien');
        expect(impacts[0].allowedDef).toBe(0);
        expect(impacts[0].blocked).toEqual(['Maîtrise de la magie']);
        expect(impacts[0].spells).toEqual([
            { name: 'Projectile de mana', rank: 1, base: 1, surcharge: 5, total: 6 },
        ]);
    });

    it('une capacité qui relève le plafond ne le relève que pour son propre profil', () => {
        // Tour de force (barbare rang 2) autorise la chemise de mailles (+4) : le barbare passe,
        // mais les capacités de magicien du même personnage restent bridées.
        const voies = [entree('/api/voies/3', 2), entree('/api/voies/1', 1)];
        const impacts = armorImpacts(voies, profils, 4);
        expect(impacts.map(i => i.profileName)).toEqual(['Magicien']);
    });

    it('ignore une voie qui ne relève d’aucun profil (peuple, prestige)', () => {
        const voies: CharacterVoieRef[] = [{ voie: '/api/voies/99', rank: 2, source: 'peuple' }];
        expect(armorImpacts(voies, profils, 6)).toEqual([]);
    });

    it('n’expose que les capacités réellement acquises', () => {
        // Rang 1 seulement : la capacité de rang 2 n'est pas encore prise, rien à brider.
        const impacts = armorImpacts([entree('/api/voies/1', 1)], profils, 2);
        expect(impacts[0].blocked).toEqual([]);
        expect(impacts[0].spells.map(s => s.name)).toEqual(['Projectile de mana']);
    });
});
