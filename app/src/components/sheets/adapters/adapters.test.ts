import { describe, it, expect } from 'vitest';
import { raceToVM, profileToVM, voieToVM, capacityToVM } from './fromOfficial';
import { homebrewToRaceVM, homebrewToProfileVM, homebrewToVoieVM, homebrewToCapaciteVM } from './fromHomebrew';
import type { Race, Profile, Voie, Capacity, Family } from '../../../types/normalized';
import type { HomebrewEntry } from '../../../services/homebrewService';
import { HOMEBREW_SCHEMAS } from '../../../services/homebrewSchemas';
import type { HomebrewFieldDef } from '../../../services/homebrewSchemas';

// Fabrique une entrée homebrew minimale : seul le nom est renseigné.
const emptyEntry = (category: string): HomebrewEntry => ({
    id: 1, category, name: 'Sans détail', description: '', visibility: 'private',
    data: {}, authorId: 1, authorPseudo: 'Nauno',
} as HomebrewEntry);

describe('adaptateurs officiels', () => {
    it('projette une race complète', () => {
        const race = {
            id: 506, name: 'Elfe', description: 'Peuple sylvestre', detailedDescription: 'Longue histoire',
            publicPerception: 'Distants', abilities: 'Vision nocturne', startingAge: 20, lifeExpectancy: 400,
            physicalTraits: 'Élancés', typicalNames: 'Aelar', minHeight: 160, maxHeight: 190,
            minWeight: 50, maxWeight: 75, roleplay: 'Fier', image: '/elfe.webp', speed: '20 m/tour',
            modifiers: [{ stat: 'AGI', value: 1 }, { stat: 'CON', value: -1 }],
        } as unknown as Race;
        const vm = raceToVM(race, [{ id: 9, name: 'Voie des Elfes' } as unknown as Voie]);
        expect(vm.name).toBe('Elfe');
        expect(vm.modifiers).toEqual([{ stat: 'AGI', value: 1, options: undefined, description: undefined }, { stat: 'CON', value: -1, options: undefined, description: undefined }]);
        expect(vm.startingAge).toBe(20);
        expect(vm.speed).toBe('20 m/tour');
        expect(vm.voies).toEqual([{ id: '9', name: 'Voie des Elfes' }]);
    });

    it('mappe `speed` (champ réel de l\'API sur les 8 races officielles, ex. "20 m/tour")', () => {
        const race = { id: 506, name: 'Elfe sylvain', speed: '20 m/tour' } as unknown as Race;
        expect(raceToVM(race).speed).toBe('20 m/tour');
    });

    it('laisse `speed` undefined quand absent', () => {
        const race = { id: 506, name: 'Sans vitesse' } as unknown as Race;
        expect(raceToVM(race).speed).toBeUndefined();
    });

    it('projette une capacité et sa voie', () => {
        const cap = { id: 35651, name: 'Boule de feu', description: 'Explose', rank: 3, isSpell: true, limited: true } as unknown as Capacity;
        const vm = capacityToVM(cap, 'Voie du Feu');
        expect(vm).toMatchObject({ name: 'Boule de feu', rank: 3, isSpell: true, limited: true, voieName: 'Voie du Feu' });
    });

    it('porte le drapeau `active` (capacité active vs passive) sur une capacité standalone', () => {
        const active = { id: 1, name: 'Frappe', description: '', active: true } as unknown as Capacity;
        const passive = { id: 2, name: 'Endurance', description: '', active: false } as unknown as Capacity;
        expect(capacityToVM(active).active).toBe(true);
        expect(capacityToVM(passive).active).toBeUndefined();
    });

    it('porte les JSON libres (Capacity.details) et le lien vers la voie (voieId, identifiant entier comme le renvoie l\'API) sur une capacité standalone', () => {
        const cap = { id: 35651, name: 'Pas de brume', description: 'Se téléporte', details: { note: 'Une fois par combat' } } as unknown as Capacity;
        // L'API renvoie des identifiants entiers (ex. `voie: "/api/voies/7131"` résolu en
        // `voie.id: 7131`, un nombre) — jamais des chaînes. Avant la correction de `str()`
        // (accepte désormais nombre ET chaîne via `idStr`), un id numérique produisait
        // toujours `voieId: undefined`.
        const vm = capacityToVM(cap, 'Voie de la brume', 42);
        expect(vm.details).toEqual({ note: 'Une fois par combat' });
        expect(vm.voieName).toBe('Voie de la brume');
        expect(vm.voieId).toBe('42');
    });

    it('accepte aussi un voieId déjà en chaîne (objets renormalisés par d\'autres pages)', () => {
        const cap = { id: 1, name: 'Solitaire', description: '' } as unknown as Capacity;
        expect(capacityToVM(cap, undefined, '42').voieId).toBe('42');
    });

    it('laisse voieId undefined quand aucune voie n\'est fournie', () => {
        const cap = { id: 1, name: 'Solitaire', description: '' } as unknown as Capacity;
        expect(capacityToVM(cap).voieId).toBeUndefined();
    });

    it('porte isSpell et actionType sur une capacité standalone (isSpell déjà géré, actionType complété)', () => {
        const spell = { id: 1, name: 'Éclair', description: '', isSpell: true, actionType: 'Attaque' } as unknown as Capacity;
        const mundane = { id: 2, name: 'Coup de poing', description: '' } as unknown as Capacity;
        expect(capacityToVM(spell)).toMatchObject({ isSpell: true, actionType: 'Attaque' });
        expect(capacityToVM(mundane).isSpell).toBeUndefined();
        expect(capacityToVM(mundane).actionType).toBeUndefined();
    });

    it('projette une voie et ses capacités triées par rang', () => {
        const voie = { id: 7131, name: 'Voie du Feu', description: 'Brûler', type: 'profil' } as unknown as Voie;
        const caps = [
            { id: 35652, name: 'Rang 2', rank: 2 } as unknown as Capacity,
            { id: 35651, name: 'Rang 1', rank: 1 } as unknown as Capacity,
        ];
        const vm = voieToVM(voie, caps);
        expect(vm.capabilities?.map(c => c.rank)).toEqual([1, 2]);
    });

    it('porte la catégorie et le rang max d\'une voie officielle (Voie.category, champ réel de l\'API, pas Voie.type)', () => {
        const voie = { id: 7131, name: "Voie de l'Énergie Vitale", category: 'Personnage', maxRank: 5 } as unknown as Voie;
        const vm = voieToVM(voie);
        expect(vm.category).toBe('Personnage');
        expect(vm.maxRank).toBe(5);
    });

    it('replie category sur `type` quand `category` (champ API réel) est absent, pour les objets déjà renormalisés', () => {
        const voie = { id: 9, name: 'Voie du Feu', type: 'profil' } as unknown as Voie;
        expect(voieToVM(voie).category).toBe('profil');
    });

    it('porte les JSON libres de la voie (Détails & Mécaniques) ; undefined si absents', () => {
        const withDetails = { id: 9, name: 'Voie du Feu', type: 'profil', details: { famille: 'Élémentaire' } } as unknown as Voie;
        const withoutDetails = { id: 10, name: 'Voie sans détail', type: 'profil' } as unknown as Voie;
        expect(voieToVM(withDetails).details).toEqual({ famille: 'Élémentaire' });
        expect(voieToVM(withoutDetails).details).toBeUndefined();
    });

    it('porte le drapeau `active` sur les capacités listées par une voie', () => {
        const voie = { id: 7131, name: 'Voie de l\'Énergie Vitale', type: 'profil' } as unknown as Voie;
        const caps = [
            { id: 35651, name: 'Frappe vitale', rank: 1, active: true } as unknown as Capacity,
            { id: 35652, name: 'Résistance', rank: 2, active: false } as unknown as Capacity,
        ];
        const vm = voieToVM(voie, caps);
        expect(vm.capabilities?.find(c => c.name === 'Frappe vitale')?.active).toBe(true);
        expect(vm.capabilities?.find(c => c.name === 'Résistance')?.active).toBeUndefined();
    });

    it('rattache à chaque voie ses propres capacités, triées par rang (IRI ou voieId brut)', () => {
        const race = { id: 506, name: 'Elfe' } as unknown as Race;
        const voies = [
            { id: 7201, name: "Voie de l'elfe sylvain" } as unknown as Voie,
            { id: 7207, name: 'Voie du haut-elfe' } as unknown as Voie,
        ];
        const capacities = [
            { id: 36002, name: 'Sylvain Rang 2', rank: 2, voie: '/api/voies/7201' } as unknown as Capacity,
            { id: 36001, name: 'Sylvain Rang 1', rank: 1, voie: '/api/voies/7201' } as unknown as Capacity,
            { id: 37001, name: 'Haut-elfe Rang 1', rank: 1, voieId: 7207 } as unknown as Capacity,
        ];
        const vm = raceToVM(race, voies, capacities);
        expect(vm.voies?.[0].capabilities?.map(c => c.name)).toEqual(['Sylvain Rang 1', 'Sylvain Rang 2']);
        expect(vm.voies?.[1].capabilities?.map(c => c.name)).toEqual(['Haut-elfe Rang 1']);
    });

    it('reprend les details libres d\'une capacité (choix_capacite) ; undefined si absents', () => {
        const race = { id: 506, name: 'Elfe' } as unknown as Race;
        const voies = [{ id: 7201, name: "Voie de l'elfe sylvain" } as unknown as Voie];
        const capacities = [
            {
                id: 36002, name: 'Enfant de la forêt', rank: 2, voie: '/api/voies/7201',
                details: { choix_capacite: ['Druide (Rang 1)', 'Rôdeur (Rang 1)'] },
            } as unknown as Capacity,
            { id: 36001, name: 'Sans détail', rank: 1, voie: '/api/voies/7201' } as unknown as Capacity,
        ];
        const vm = raceToVM(race, voies, capacities);
        const caps = vm.voies?.[0].capabilities;
        expect(caps?.find(c => c.name === 'Enfant de la forêt')?.details).toEqual({
            choix_capacite: ['Druide (Rang 1)', 'Rôdeur (Rang 1)'],
        });
        expect(caps?.find(c => c.name === 'Sans détail')?.details).toBeUndefined();
    });

    it('laisse capabilities undefined pour une voie sans capacité', () => {
        const race = { id: 506, name: 'Elfe' } as unknown as Race;
        const voies = [{ id: 9, name: 'Voie sans capacité' } as unknown as Voie];
        const vm = raceToVM(race, voies, []);
        expect(vm.voies?.[0].capabilities).toBeUndefined();
    });

    it('préserve les modificateurs choice avec options', () => {
        const race = {
            id: 1, name: 'Gnome', modifiers: [
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
            id: 1, name: 'Humain', modifiers: [
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
        const voies = [{ id: 5, name: 'Voie du poison' } as unknown as Voie];
        const capacities = [
            { id: 101, name: 'Coup sournois', rank: 1, voie: '/api/voies/5', limited: true } as unknown as Capacity,
            { id: 102, name: 'Esquive', rank: 2, voie: '/api/voies/5', isSpell: true } as unknown as Capacity,
        ];
        const vm = profileToVM(p, voies, capacities);
        const caps = vm.voies?.[0].capabilities;
        expect(caps?.find(c => c.name === 'Coup sournois')?.limited).toBe(true);
        expect(caps?.find(c => c.name === 'Esquive')?.limited).toBeUndefined();
        expect(caps?.find(c => c.name === 'Esquive')?.isSpell).toBe(true);
    });

    it('conserve l\'identifiant stable de chaque capacité officielle (clé React fiable) — identifiant entier comme le renvoie l\'API', () => {
        const p = { id: 1, name: 'Voleur', description: 'Discret', hitDie: '1D8' } as unknown as Profile;
        const voies = [{ id: 5, name: 'Voie du poison' } as unknown as Voie];
        // L'API renvoie toujours un entier pour `Capacity.id` (ex. `"id": 35651`), jamais
        // une chaîne : une fixture en chaîne masquait le bug `str(c.id) === undefined`
        // pour un id numérique (corrigé via `idStr`, cf. adapters/shared.ts).
        const capacities = [
            { id: 42, name: 'Coup sournois', rank: 1, voie: '/api/voies/5' } as unknown as Capacity,
        ];
        const vm = profileToVM(p, voies, capacities);
        expect(vm.voies?.[0].capabilities?.[0].id).toBe('42');
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
        expect(vmProfile.masteries).toBeUndefined();
        const vmCapacite = homebrewToCapaciteVM(emptyEntry('sort'));
        expect(vmCapacite.effect).toBeUndefined();
        expect(vmCapacite.detailLines).toBeUndefined();
    });

    it('projette une classe homebrew complète : armes/armures autorisées + maîtrises libres rejoignent la carte Maîtrises (pas de carte à part), lore en entrées sans label, famille en {name}', () => {
        const entry = {
            ...emptyEntry('classe'), name: 'Berserker totémique', description: 'Guerrier lié à un esprit animal',
            data: {
                family: 'Combattants totémiques', magicStat: 'VOL', armorMaxDef: 4,
                weaponsAuth: ['Armes à deux mains', 'Armes de jet'], armorAuth: ['Cuir'],
                startingEquipment: ['Hache tribale'], masteries: ['Boucliers interdits'],
                lore: ['Les clans du nord vénèrent leurs totems.'],
            },
        } as HomebrewEntry;
        const vm = homebrewToProfileVM(entry);
        // Le schéma communautaire ne capture qu'un nom de famille : le sous-titre doit
        // néanmoins être calculé (même logique que l'officiel), sinon ce nom saisi par
        // l'auteur est silencieusement invisible sur sa propre fiche.
        expect(vm.family).toEqual({ name: 'Combattants totémiques', subtitle: 'Famille des Combattants totémiques' });
        // weaponsAuth/armorAuth : mêmes intitulés que l'officiel (masteries.weapons/armors),
        // fondus en une seule entrée par champ, dans la même carte que les maîtrises libres.
        expect(vm.masteries).toEqual([
            { label: 'Armes', value: 'Armes à deux mains, Armes de jet' },
            { label: 'Armures', value: 'Cuir' },
            { label: '', value: 'Boucliers interdits' },
        ]);
        expect(vm.lore).toEqual([{ label: '', value: 'Les clans du nord vénèrent leurs totems.' }]);
    });

    it('projette les stats de départ (caracs) communautaires dans `stats` — même porteur que le panneau officiel', () => {
        const entry = {
            ...emptyEntry('classe'), name: 'Berserker totémique',
            data: { stats: { AGI: 1, CON: 2, FOR: 3, PER: 0, CHA: 0, INT: -1, VOL: 0 } },
        } as HomebrewEntry;
        const vm = homebrewToProfileVM(entry);
        expect(vm.stats).toEqual({ AGI: 1, CON: 2, FOR: 3, PER: 0, CHA: 0, INT: -1, VOL: 0 });
    });

    it('n\'ajoute pas "Famille des" au sous-titre homebrew si le nom commence déjà par "Famille"', () => {
        const entry = { ...emptyEntry('classe'), data: { family: 'Famille des Mages Errants' } } as HomebrewEntry;
        const vm = homebrewToProfileVM(entry);
        expect(vm.family?.subtitle).toBe('Famille des Mages Errants');
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

    it('projette `details` (lignes libres communautaires) en mécaniques de la voie, rendues par DynamicDetailsRenderer — ne produit plus de pseudo-capacités', () => {
        const entry = { ...emptyEntry('voie'), name: 'Voie du Gel', data: { category: 'profil', details: ['Rang 1 — Souffle glacé.', 'Rang 2 — Armure de givre.'] } } as HomebrewEntry;
        const vm = homebrewToVoieVM(entry);
        expect(vm.details).toEqual({ mecaniques_voie: ['Rang 1 — Souffle glacé.', 'Rang 2 — Armure de givre.'] });
        expect(vm.capabilities).toBeUndefined();
    });

    it('laisse `details` undefined quand le champ communautaire est absent', () => {
        const entry = { ...emptyEntry('voie'), name: 'Voie du Gel', data: { category: 'profil' } } as HomebrewEntry;
        expect(homebrewToVoieVM(entry).details).toBeUndefined();
    });

    it('projette une capacité/sort homebrew : effect et details (lignes) restent deux listes distinctes', () => {
        const entry = {
            ...emptyEntry('capacite'), name: 'Frappe du vide', description: 'Frappe dans une brèche',
            data: { rank: 2, isSpell: true, limited: true, effect: ['1d8 DM psychique.'], details: ['Portée 5 m.', 'Nécessite une arme tranchante.'] },
        } as HomebrewEntry;
        const vm = homebrewToCapaciteVM(entry);
        expect(vm.effect).toEqual(['1d8 DM psychique.']);
        expect(vm.detailLines).toEqual(['Portée 5 m.', 'Nécessite une arme tranchante.']);
        expect(vm.details).toBeUndefined();
        expect(vm.isSpell).toBe(true);
        expect(vm.limited).toBe(true);
    });

    it('force isSpell=true pour la catégorie `sort` même sans champ isSpell explicite', () => {
        const entry = { ...emptyEntry('sort'), name: 'Éclair', data: {} } as HomebrewEntry;
        expect(homebrewToCapaciteVM(entry).isSpell).toBe(true);
    });
});

describe('homebrewToVoieVM — enfants', () => {
    const voie = { id: 7, category: 'voie', name: 'Voie du Gel', description: 'Froid', visibility: 'private',
        data: { category: 'profil', maxRank: 5 }, authorId: 1, authorPseudo: 'N' } as unknown as HomebrewEntry;

    it('projette les enfants en capacités, triées par rang', () => {
        const enfants = [
            { id: 2, category: 'capacite', name: 'Rang 2', data: { rank: 2 } },
            { id: 1, category: 'capacite', name: 'Rang 1', data: { rank: 1 } },
        ] as unknown as HomebrewEntry[];
        const vm = homebrewToVoieVM(voie, enfants);
        expect(vm.capabilities?.map(c => c.rank)).toEqual([1, 2]);
        expect(vm.capabilities?.[0].name).toBe('Rang 1');
    });

    it('laisse capabilities indéfini quand la voie n’a pas d’enfant', () => {
        expect(homebrewToVoieVM(voie, []).capabilities).toBeUndefined();
        expect(homebrewToVoieVM(voie).capabilities).toBeUndefined();
    });

    it('reporte les badges d’une capacité enfant', () => {
        const enfants = [{ id: 3, category: 'sort', name: 'Givre', data: { rank: 1, limited: true } }] as unknown as HomebrewEntry[];
        const vm = homebrewToVoieVM(voie, enfants);
        expect(vm.capabilities?.[0]).toMatchObject({ isSpell: true, limited: true });
    });
});

/**
 * Couverture de schéma (demandée par la revue finale) : pour chaque catégorie sur
 * feuille (race, classe, voie, capacite), une entrée communautaire dont TOUTES les clés
 * du schéma (`services/homebrewSchemas.ts`) sont renseignées doit produire un
 * view-model où toutes les propriétés correspondantes sont définies. Un champ ajouté au
 * schéma sans être mappé par l'adaptateur (le défaut C1 : `armorMaxDef` peuplé mais non
 * rendu n'aurait pas suffi à passer inaperçu si un test avait vérifié systématiquement
 * chaque clé du schéma plutôt qu'un sous-ensemble choisi à la main) fera échouer ces
 * tests. Rappel (cf. tête de fichier) : ceci prouve la complétude de l'adaptateur
 * (schéma → view-model), pas le rendu (view-model → JSX) — les deux doivent être
 * vérifiés séparément.
 */
describe('couverture de schéma communautaire (toute clé du schéma → une propriété définie du view-model)', () => {
    it('race : tous les champs du schéma produisent une propriété définie', () => {
        const entry = {
            ...emptyEntry('race'), name: 'Race complète', description: 'Une description',
            data: {
                image: 'https://exemple.test/race.png',
                modifiers: { AGI: 1, CON: -1 },
                speed: '10 m',
                minHeight: 150, maxHeight: 200,
                minWeight: 40, maxWeight: 90,
                startingAge: 18, lifeExpectancy: 80,
                abilities: 'Vision nocturne',
                physicalTraits: 'Petits et trapus',
                publicPerception: 'Méfiants',
                roleplay: 'Prudents',
                typicalNames: 'Aldo, Berta',
                detailedDescription: 'Longue histoire.',
            },
        } as HomebrewEntry;
        const vm = homebrewToRaceVM(entry);
        for (const field of HOMEBREW_SCHEMAS.race) {
            expect(vm, `champ de schéma "${field.key}"`).toHaveProperty(field.key);
            expect((vm as unknown as Record<string, unknown>)[field.key], `champ de schéma "${field.key}"`).not.toBeUndefined();
        }
    });

    /**
     * Pour classe/voie/capacite, une clé de schéma ne correspond pas toujours à une
     * propriété de même nom sur le view-model (ex. `weaponsAuth`/`armorAuth` fondent
     * dans `vm.masteries`, `details` devient `vm.capabilities` ou `vm.detailLines`) :
     * une simple boucle `toHaveProperty(field.key)` comme pour `race` ne suffit donc
     * pas. `FIELD_CHECKS` associe explicitement chaque clé de schéma à la vérification
     * qui prouve qu'elle a atteint le view-model. Boucler sur `HOMEBREW_SCHEMAS[...]`
     * (plutôt que sur les clés de `FIELD_CHECKS`) est ce qui rend le test générique :
     * un champ ajouté au schéma sans entrée correspondante dans `FIELD_CHECKS` fait
     * échouer le test explicitement (au lieu de ne rien vérifier silencieusement,
     * le défaut C1 qui a motivé ce test).
     */
    const checkSchemaCoverage = <VM,>(
        schema: HomebrewFieldDef[],
        vm: VM,
        checks: Record<string, (vm: VM) => unknown>,
    ): void => {
        for (const field of schema) {
            const check = checks[field.key];
            expect(check, `aucune vérification définie pour le champ de schéma "${field.key}" (FIELD_CHECKS incomplet)`).toBeDefined();
            expect(check!(vm), `champ de schéma "${field.key}" absent du view-model rendu`).toBeTruthy();
        }
    };

    it('classe : tous les champs du schéma produisent une propriété définie (armorMaxDef inclus — défaut C1)', () => {
        const entry = {
            ...emptyEntry('classe'), name: 'Classe complète', description: 'Une description',
            data: {
                image: 'https://exemple.test/classe.png',
                family: 'Guerriers',
                note: 'Une note',
                lore: ['Une ligne de lore.'],
                weaponsAuth: ['Épées'],
                armorAuth: ['Cuir'],
                armorMaxDef: 4,
                magicStat: 'INT',
                stats: { AGI: 1, CON: 1, FOR: 1, PER: 1, CHA: 1, INT: 1, VOL: 1 },
                startingEquipment: ['Une épée'],
                masteries: ['Boucliers interdits'],
            },
        } as HomebrewEntry;
        const vm = homebrewToProfileVM(entry);
        checkSchemaCoverage(HOMEBREW_SCHEMAS.classe, vm, {
            image: v => v.image,
            family: v => v.family,
            note: v => v.note,
            lore: v => v.lore,
            // weaponsAuth/armorAuth/masteries n'ont pas de propriété dédiée : ils
            // rejoignent tous la carte "Maîtrises" (vm.masteries), par design (cf.
            // fromHomebrew.ts) — chacun vérifié via l'entrée qu'il y produit.
            weaponsAuth: v => v.masteries?.some(m => m.label === 'Armes'),
            armorAuth: v => v.masteries?.some(m => m.label === 'Armures'),
            armorMaxDef: v => v.armorMaxDef,
            magicStat: v => v.magicStat,
            stats: v => v.stats,
            startingEquipment: v => v.startingEquipment,
            masteries: v => v.masteries?.some(m => m.label === '' && m.value === 'Boucliers interdits'),
        });
    });

    it('voie : tous les champs du schéma produisent une propriété définie', () => {
        const entry = {
            ...emptyEntry('voie'), name: 'Voie complète', description: 'Une description',
            data: { category: 'profil', maxRank: 5, details: ['Rang 1 — Effet.'] },
        } as HomebrewEntry;
        const vm = homebrewToVoieVM(entry);
        checkSchemaCoverage(HOMEBREW_SCHEMAS.voie, vm, {
            category: v => v.category,
            maxRank: v => v.maxRank,
            // `details` (schéma, lignes libres) rejoint `vm.details` (mécaniques de la
            // voie, rendues par DynamicDetailsRenderer) — plus de pseudo-capacités.
            details: v => v.details,
        });
    });

    it('capacite : tous les champs du schéma produisent une propriété définie', () => {
        const entry = {
            ...emptyEntry('capacite'), name: 'Capacité complète', description: 'Une description',
            data: {
                rank: 3, actionType: 'Attaque', isSpell: true, limited: true,
                effect: ['1d6 DM'], details: ['Portée 5 m.'],
                states: ['Renversé'],
                summons: [{ type: 'creature', ref: 'Loup', quantity: 2 }],
            },
        } as HomebrewEntry;
        const vm = homebrewToCapaciteVM(entry);
        checkSchemaCoverage(HOMEBREW_SCHEMAS.capacite, vm, {
            rank: v => v.rank,
            actionType: v => v.actionType,
            isSpell: v => v.isSpell,
            limited: v => v.limited,
            effect: v => v.effect,
            // `details` (schéma) n'a pas de propriété dédiée : il devient `detailLines`,
            // forme différente du `details` officiel (objet JSON) — cf. fromHomebrew.ts.
            details: v => v.detailLines,
            states: v => v.states,
            summons: v => v.summons,
        });
    });
});
