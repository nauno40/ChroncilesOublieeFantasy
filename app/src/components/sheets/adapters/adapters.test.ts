import { describe, it, expect } from 'vitest';
import { raceToVM, profileToVM, voieToVM, capacityToVM } from './fromOfficial';
import { homebrewToRaceVM, homebrewToProfileVM, homebrewToVoieVM, homebrewToCapaciteVM } from './fromHomebrew';
import type { Race, Profile, Voie, Capacity } from '../../../types/normalized';
import type { HomebrewEntry } from '../../../services/homebrewService';

// Fabrique une entrée homebrew minimale : seul le nom est renseigné.
const emptyEntry = (category: string): HomebrewEntry => ({
    id: 1, category, name: 'Sans détail', description: '', visibility: 'private',
    data: {}, authorId: 1, authorPseudo: 'Nauno',
} as HomebrewEntry);

describe('adaptateurs officiels', () => {
    it('projette une race complète', () => {
        const race = {
            id: '1', name: 'Elfe', description: 'Peuple sylvestre', detailedDescription: 'Longue histoire',
            publicPerception: 'Distants', abilities: 'Vision nocturne', startingAge: 20, lifeExpectancy: 400,
            physicalTraits: 'Élancés', typicalNames: 'Aelar', minHeight: 160, maxHeight: 190,
            minWeight: 50, maxWeight: 75, roleplay: 'Fier', image: '/elfe.webp',
            modifiers: [{ stat: 'AGI', value: 1 }, { stat: 'CON', value: -1 }],
        } as unknown as Race;
        const vm = raceToVM(race, [{ id: '9', name: 'Voie des Elfes' } as Voie]);
        expect(vm.name).toBe('Elfe');
        expect(vm.modifiers).toEqual([{ stat: 'AGI', value: 1, options: undefined, description: undefined }, { stat: 'CON', value: -1, options: undefined, description: undefined }]);
        expect(vm.startingAge).toBe(20);
        expect(vm.voies).toEqual([{ id: '9', name: 'Voie des Elfes' }]);
    });

    it('projette une capacité et sa voie', () => {
        const cap = { id: '3', name: 'Boule de feu', description: 'Explose', rank: 3, isSpell: true, limited: true } as Capacity;
        const vm = capacityToVM(cap, 'Voie du Feu');
        expect(vm).toMatchObject({ name: 'Boule de feu', rank: 3, isSpell: true, limited: true, voieName: 'Voie du Feu' });
    });

    it('projette une voie et ses capacités triées par rang', () => {
        const voie = { id: '9', name: 'Voie du Feu', description: 'Brûler', type: 'profil' } as unknown as Voie;
        const caps = [
            { id: '2', name: 'Rang 2', rank: 2 } as Capacity,
            { id: '1', name: 'Rang 1', rank: 1 } as Capacity,
        ];
        const vm = voieToVM(voie, caps);
        expect(vm.capabilities?.map(c => c.rank)).toEqual([1, 2]);
    });

    it('préserve les modificateurs choice avec options', () => {
        const race = {
            id: '1', name: 'Gnome', modifiers: [
                { type: 'choice', options: ['AGI', 'PER'], value: 1, stat: undefined },
            ],
        } as unknown as Race;
        const vm = raceToVM(race);
        expect(vm.modifiers).toHaveLength(1);
        expect(vm.modifiers?.[0]).toMatchObject({ value: 1, options: ['AGI', 'PER'] });
        expect(vm.modifiers?.[0]?.stat).toBeUndefined();
    });

    it('préserve les modificateurs logic avec description', () => {
        const race = {
            id: '1', name: 'Humain', modifiers: [
                { type: 'logic', description: '+1 à la valeur d\'une de ses deux plus faibles caractéristiques', value: 1, stat: undefined },
            ],
        } as unknown as Race;
        const vm = raceToVM(race);
        expect(vm.modifiers).toHaveLength(1);
        expect(vm.modifiers?.[0]).toMatchObject({ value: 1, description: '+1 à la valeur d\'une de ses deux plus faibles caractéristiques' });
        expect(vm.modifiers?.[0]?.stat).toBeUndefined();
    });

    it('projette un profil', () => {
        const p = { id: 1, name: 'Guerrier', description: 'Brave', hitDie: '1D10', magicStat: null, armorMaxDef: 5 } as unknown as Profile;
        const vm = profileToVM(p);
        expect(vm).toMatchObject({ name: 'Guerrier', hitDie: '1D10', armorMaxDef: 5 });
        expect(vm.magicStat).toBeUndefined();
    });

    it('laisse stats undefined si aucune clé COF2 numérique (Profile.stats = métadonnées)', () => {
        const p = {
            id: 1, name: 'Moine', description: 'Ascète', hitDie: '1D8', magicStat: 'PER', armorMaxDef: 3,
            stats: { hpPerLevel: 4, profileType: 'Combattant agile', hitDie: '1D8', magicStat: 'PER' } as unknown as Record<string, number>,
        } as unknown as Profile;
        const vm = profileToVM(p);
        expect(vm.stats).toBeUndefined();
    });

    it('conserve les stats à 0 (valeur légitime en COF2)', () => {
        const p = {
            id: 1, name: 'Paladin', description: 'Guerrier de foi', hitDie: '1D10', magicStat: 'VOL', armorMaxDef: 6,
            stats: { AGI: 0, CON: 1, FOR: 2, PER: 0, CHA: 1, INT: -1, VOL: 0 } as unknown as Record<string, number>,
        } as unknown as Profile;
        const vm = profileToVM(p);
        expect(vm.stats).toMatchObject({ AGI: 0, CON: 1, FOR: 2, PER: 0, CHA: 1, INT: -1, VOL: 0 });
    });
});

describe('adaptateurs homebrew', () => {
    it('projette une race homebrew complète', () => {
        const entry = {
            ...emptyEntry('race'), name: 'Ondins', description: 'Peuple aquatique',
            data: { modifiers: { CON: 1 }, speed: '10 m', startingAge: 16, abilities: 'Respiration aquatique' },
        } as HomebrewEntry;
        const vm = homebrewToRaceVM(entry);
        expect(vm).toMatchObject({ name: 'Ondins', description: 'Peuple aquatique', speed: '10 m', startingAge: 16 });
        expect(vm.modifiers).toEqual([{ stat: 'CON', value: 1 }]);
    });

    it('laisse undefined tout champ absent (aucune section vide)', () => {
        const vm = homebrewToRaceVM(emptyEntry('race'));
        expect(vm.name).toBe('Sans détail');
        expect(vm.description).toBeUndefined();
        expect(vm.modifiers).toBeUndefined();
        expect(vm.startingAge).toBeUndefined();
        expect(vm.abilities).toBeUndefined();
        expect(vm.voies).toBeUndefined();
    });

    it('ne renvoie jamais de tableau vide pour les listes', () => {
        const vmProfile = homebrewToProfileVM(emptyEntry('classe'));
        expect(vmProfile.weaponsAuth).toBeUndefined();
        expect(vmProfile.masteries).toBeUndefined();
        const vmCapacite = homebrewToCapaciteVM(emptyEntry('sort'));
        expect(vmCapacite.effect).toBeUndefined();
        expect(vmCapacite.details).toBeUndefined();
    });

    it('projette une voie homebrew', () => {
        const entry = { ...emptyEntry('voie'), name: 'Voie du Gel', data: { category: 'profil', maxRank: 5 } } as HomebrewEntry;
        const vm = homebrewToVoieVM(entry);
        expect(vm).toMatchObject({ name: 'Voie du Gel', category: 'profil', maxRank: 5 });
    });
});
