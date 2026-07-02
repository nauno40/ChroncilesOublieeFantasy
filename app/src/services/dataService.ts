import type { Weapon, Armor, Food, Lodging, Mount, Creature, Race, Profile, Voie, Capacity, Material, Family, HarmfulState } from '../types/normalized';
// Renaming Capacity to Capability for API consistency if needed, or stick to Capacity
import { ApiService } from './api';

// Placeholder for now as we transition. 
// We will change these to return Promises.
// NOTE: This breaks existing synchronous usages!
// We must update the consumers of DataService.

export const DataService = {
    getWeapons: async () => {
        const all = await ApiService.getAll<Weapon>('equipment?pagination=false&itemsPerPage=500');
        // Filter out armors client-side until DB is normalized for Weapon vs Armor
        return all.filter(e => {
            const type = (e.type || '').toLowerCase();
            return !type.includes('armure') && !type.includes('bouclier');
        });
    },
    getArmors: async () => {
        const all = await ApiService.getAll<Armor>('equipment?pagination=false&itemsPerPage=500');
        return all.filter(e => {
            const type = (e.type || '').toLowerCase();
            return type.includes('armure') || type.includes('bouclier');
        });
    },
    getMaterials: () => ApiService.getAll<Material>('materials?pagination=false&itemsPerPage=500'),
    getFoods: () => ApiService.getAll<Food>('foods?pagination=false&itemsPerPage=500'),
    getLodgings: () => ApiService.getAll<Lodging>('lodgings?pagination=false&itemsPerPage=500'),
    getMounts: () => ApiService.getAll<Mount>('mounts?pagination=false&itemsPerPage=500'),
    getCreatures: () => ApiService.getAll<Creature>('creatures?pagination=false&itemsPerPage=500'),
    getCreatureById: (id: string | number) => ApiService.getOne<Creature>('creatures', id),
    getFamilies: () => ApiService.getAll<any>('creature_families?pagination=false&itemsPerPage=500'), // Creature Families
    getProfileFamilies: () => ApiService.getAll<Family>('families?pagination=false&itemsPerPage=500'), // Profile Families
    getRaces: () => ApiService.getAll<Race>('races?pagination=false&itemsPerPage=500'),
    getRaceById: (id: string | number) => ApiService.getOne<Race>('races', id),
    getProfiles: () => ApiService.getAll<Profile>('profiles?pagination=false&itemsPerPage=500'),
    getVoies: () => ApiService.getAll<Voie>('voies?pagination=false&itemsPerPage=500'),
    getVoieById: (id: string | number) => ApiService.getOne<Voie>('voies', id),
    getVoiesByProfile: (profileId: string | number) => ApiService.getAll<Voie>(`voies?profile=${profileId}&pagination=false`),
    getCapabilities: () => ApiService.getAll<Capacity>('capabilities?pagination=false&itemsPerPage=500'),
    getCapabilityById: (id: string | number) => ApiService.getOne<Capacity>('capabilities', id),
    getCapabilitiesByVoie: (voieId: string | number) => ApiService.getAll<Capacity>(`capabilities?voie=${voieId}&pagination=false`),
    getStates: () => ApiService.getAll<HarmfulState>('states?pagination=false&itemsPerPage=500'),

    // Provision helper (combines food and lodging)
    getProvisions: async (): Promise<(Food | Lodging)[]> => {
        const [foods, lodgings] = await Promise.all([
            ApiService.getAll<Food>('foods?pagination=false&itemsPerPage=500'),
            ApiService.getAll<Lodging>('lodgings?pagination=false&itemsPerPage=500')
        ]);
        return [...foods, ...lodgings];
    },

    // Consolidated equipment map
    getAllEquipmentMap: async (): Promise<Map<string, any>> => {
        const map = new Map<string, any>();
        const equipment = await ApiService.getAll<any>('equipment?pagination=false&itemsPerPage=500');
        equipment.forEach(item => {
            let tab = 'weapons';
            const lowerType = (item.type || '').toLowerCase();

            if (['Mount', 'Food', 'Lodging'].includes(item.type)) {
                tab = 'provisions'; // Or whatever tab they belong to, or ignore if this map is only for combat gear
            } else if (lowerType.includes('armure') || lowerType.includes('bouclier')) {
                tab = 'armors';
            }
            // else default to weapons

            map.set(String(item.id), { ...item, tab });
        });
        return map;
    }
};
