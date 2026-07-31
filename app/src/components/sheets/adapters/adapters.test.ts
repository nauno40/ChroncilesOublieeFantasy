import { describe, it, expect } from 'vitest';
import { raceToVM, profileToVM, voieToVM, capacityToVM } from './fromOfficial';
import { homebrewToRaceVM, homebrewToProfileVM, homebrewToVoieVM, homebrewToCapaciteVM } from './fromHomebrew';
import type { Race, Profile, Voie, Capacity, Family } from '../../../types/normalized';
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

    it('rattache à chaque voie ses propres capacités, triées par rang (IRI ou voieId brut)', () => {
        const race = { id: '1', name: 'Elfe' } as unknown as Race;
        const voies = [
            { id: '7201', name: "Voie de l'elfe sylvain" } as Voie,
            { id: '7207', name: 'Voie du haut-elfe' } as Voie,
        ];
        const capacities = [
            { id: '1', name: 'Sylvain Rang 2', rank: 2, voie: '/api/voies/7201' } as Capacity,
            { id: '2', name: 'Sylvain Rang 1', rank: 1, voie: '/api/voies/7201' } as Capacity,
            { id: '3', name: 'Haut-elfe Rang 1', rank: 1, voieId: '7207' } as Capacity,
        ];
        const vm = raceToVM(race, voies, capacities);
        expect(vm.voies?.[0].capabilities?.map(c => c.name)).toEqual(['Sylvain Rang 1', 'Sylvain Rang 2']);
        expect(vm.voies?.[1].capabilities?.map(c => c.name)).toEqual(['Haut-elfe Rang 1']);
    });

    it('reprend les details libres d\'une capacité (choix_capacite) ; undefined si absents', () => {
        const race = { id: '1', name: 'Elfe' } as unknown as Race;
        const voies = [{ id: '7201', name: "Voie de l'elfe sylvain" } as Voie];
        const capacities = [
            {
                id: '1', name: 'Enfant de la forêt', rank: 2, voie: '/api/voies/7201',
                details: { choix_capacite: ['Druide (Rang 1)', 'Rôdeur (Rang 1)'] },
            } as unknown as Capacity,
            { id: '2', name: 'Sans détail', rank: 1, voie: '/api/voies/7201' } as Capacity,
        ];
        const vm = raceToVM(race, voies, capacities);
        const caps = vm.voies?.[0].capabilities;
        expect(caps?.find(c => c.name === 'Enfant de la forêt')?.details).toEqual({
            choix_capacite: ['Druide (Rang 1)', 'Rôdeur (Rang 1)'],
        });
        expect(caps?.find(c => c.name === 'Sans détail')?.details).toBeUndefined();
    });

    it('laisse capabilities undefined pour une voie sans capacité', () => {
        const race = { id: '1', name: 'Elfe' } as unknown as Race;
        const voies = [{ id: '9', name: 'Voie sans capacité' } as Voie];
        const vm = raceToVM(race, voies, []);
        expect(vm.voies?.[0].capabilities).toBeUndefined();
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

describe('adaptateurs de profil (classes) — fidélité à ClassDetail.tsx', () => {
    it('rend les maîtrises structurées en entrées libellées (armes/armures/boucliers/contraintes)', () => {
        const p = {
            id: 1, name: 'Guerrier', description: 'Brave', hitDie: '1D10',
            masteries: { weapons: 'Toutes les armes', armors: 'Toutes les armures', shields: 'Tous les boucliers', constraints: 'Aucune' },
        } as unknown as Profile;
        const vm = profileToVM(p);
        expect(vm.masteries).toEqual([
            { label: 'Armes', value: 'Toutes les armes' },
            { label: 'Armures', value: 'Toutes les armures' },
            { label: 'Boucliers', value: 'Tous les boucliers' },
            { label: 'Contraintes', value: 'Aucune' },
        ]);
        expect(vm.weaponsAndArmor).toBeUndefined();
    });

    it('ne garde que les blocs de maîtrise renseignés', () => {
        const p = { id: 1, name: 'Moine', description: 'Ascète', hitDie: '1D8', masteries: { weapons: 'Armes de contact' } } as unknown as Profile;
        const vm = profileToVM(p);
        expect(vm.masteries).toEqual([{ label: 'Armes', value: 'Armes de contact' }]);
    });

    it('utilise le repli weaponsAndArmor quand les maîtrises structurées sont absentes', () => {
        const p = { id: 1, name: 'Barde', description: 'Chante', hitDie: '1D8', weaponsAndArmor: 'Armes simples et armure légère' } as unknown as Profile;
        const vm = profileToVM(p);
        expect(vm.masteries).toBeUndefined();
        expect(vm.weaponsAndArmor).toBe('Armes simples et armure légère');
    });

    it('rend le lore en entrées libellées (clé formatée → texte), tableau aplati sans perte', () => {
        const p = {
            id: 1, name: 'Barbare', description: 'Sauvage', hitDie: '1D12',
            lore: { terres_d_osgild: 'On trouve quelques clans...', origines_possibles: ['Montagnards', 'Tribus de la jungle'] },
        } as unknown as Profile;
        const vm = profileToVM(p);
        expect(vm.lore).toEqual([
            { label: "Terres d'Osgild", value: 'On trouve quelques clans...' },
            { label: 'Origines possibles', value: 'Montagnards\nTribus de la jungle' },
        ]);
    });

    it('porte le badge « limité » (limited) sur les capacités de voie de classe', () => {
        const p = { id: 1, name: 'Voleur', description: 'Discret', hitDie: '1D8' } as unknown as Profile;
        const voies = [{ id: '5', name: 'Voie du poison' } as Voie];
        const capacities = [
            { id: '1', name: 'Coup sournois', rank: 1, voie: '/api/voies/5', limited: true } as Capacity,
            { id: '2', name: 'Esquive', rank: 2, voie: '/api/voies/5', isSpell: true } as Capacity,
        ];
        const vm = profileToVM(p, voies, capacities);
        const caps = vm.voies?.[0].capabilities;
        expect(caps?.find(c => c.name === 'Coup sournois')?.limited).toBe(true);
        expect(caps?.find(c => c.name === 'Esquive')?.limited).toBeUndefined();
        expect(caps?.find(c => c.name === 'Esquive')?.isSpell).toBe(true);
    });

    it('projette la famille (entité, pas une chaîne) avec sous-titre calculé et bonus', () => {
        const family = {
            id: 1, name: 'Combattants', description: 'Les maîtres du champ de bataille.',
            baseHp: 5, recoveryDie: '1d10', luckPoints: 2, manaStat: null, specials: 'Résistance accrue',
        } as unknown as Family;
        const p = { id: 1, name: 'Guerrier', description: 'Brave', hitDie: '1D10', magicStat: null } as unknown as Profile;
        const vm = profileToVM(p, undefined, undefined, family);
        expect(vm.family).toEqual({
            name: 'Combattants', subtitle: 'Famille des Combattants', description: 'Les maîtres du champ de bataille.',
            baseHp: 5, recoveryDie: '1d10', luckPoints: 2, manaStat: undefined, bonus: 'Résistance accrue',
        });
    });

    it('n\'ajoute pas "Famille des" si le nom de famille commence déjà par "Famille"', () => {
        const family = { id: 1, name: 'Famille des Mages', description: '', baseHp: 3, recoveryDie: '1d6', luckPoints: 0, manaStat: null } as unknown as Family;
        const p = { id: 1, name: 'Magicien', description: 'Étudie', hitDie: '1D4' } as unknown as Profile;
        const vm = profileToVM(p, undefined, undefined, family);
        expect(vm.family?.subtitle).toBe('Famille des Mages');
    });

    it('masque les points de chance à 0 (pas une valeur affichable)', () => {
        const family = { id: 1, name: 'Mages', description: '', baseHp: 3, recoveryDie: '1d6', luckPoints: 0, manaStat: 'INT' } as unknown as Family;
        const p = { id: 1, name: 'Magicien', description: 'Étudie', hitDie: '1D4' } as unknown as Profile;
        const vm = profileToVM(p, undefined, undefined, family);
        expect(vm.family?.luckPoints).toBeUndefined();
    });

    it('titre le panneau de statistiques avec profile.stats.profileType', () => {
        const p = {
            id: 1, name: 'Moine', description: 'Ascète', hitDie: '1D8',
            stats: { hpPerLevel: 4, profileType: 'Combattant agile / Corps à corps / Mystique', hitDie: '1D8', magicStat: 'PER' },
        } as unknown as Profile;
        const vm = profileToVM(p);
        expect(vm.profileType).toBe('Combattant agile / Corps à corps / Mystique');
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

    it('projette une classe homebrew complète : maîtrises/lore en entrées sans label, famille en {name}', () => {
        const entry = {
            ...emptyEntry('classe'), name: 'Berserker totémique', description: 'Guerrier lié à un esprit animal',
            data: {
                family: 'Combattants totémiques', magicStat: 'VOL', armorMaxDef: 4,
                weaponsAuth: ['Armes à deux mains'], armorAuth: ['Cuir'],
                startingEquipment: ['Hache tribale'], masteries: ['Toutes armes de contact', 'Boucliers interdits'],
                lore: ['Les clans du nord vénèrent leurs totems.'],
            },
        } as HomebrewEntry;
        const vm = homebrewToProfileVM(entry);
        expect(vm.family).toEqual({ name: 'Combattants totémiques' });
        expect(vm.masteries).toEqual([
            { label: '', value: 'Toutes armes de contact' },
            { label: '', value: 'Boucliers interdits' },
        ]);
        expect(vm.lore).toEqual([{ label: '', value: 'Les clans du nord vénèrent leurs totems.' }]);
        expect(vm.weaponsAuth).toEqual(['Armes à deux mains']);
        expect(vm.armorAuth).toEqual(['Cuir']);
    });

    it('laisse family/masteries/lore undefined pour une classe homebrew sans détail', () => {
        const vm = homebrewToProfileVM(emptyEntry('classe'));
        expect(vm.family).toBeUndefined();
        expect(vm.masteries).toBeUndefined();
        expect(vm.lore).toBeUndefined();
    });

    it('projette une voie homebrew', () => {
        const entry = { ...emptyEntry('voie'), name: 'Voie du Gel', data: { category: 'profil', maxRank: 5 } } as HomebrewEntry;
        const vm = homebrewToVoieVM(entry);
        expect(vm).toMatchObject({ name: 'Voie du Gel', category: 'profil', maxRank: 5 });
    });
});
