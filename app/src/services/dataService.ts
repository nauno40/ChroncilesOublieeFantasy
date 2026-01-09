import type { Weapon, Armor, Food, Lodging, Mount, Creature, Race, Profile, Voie, Capacity, Material, Family } from '../types/normalized';
// Renaming Capacity to Capability for API consistency if needed, or stick to Capacity
import { ApiService } from './api';

import mountsData from '../data/mounts.json';
import foodData from '../data/food.json';
import lodgingData from '../data/lodging.json';

// Placeholder for now as we transition. 
// We will change these to return Promises.
// NOTE: This breaks existing synchronous usages!
// We must update the consumers of DataService.

export const DataService = {
    getWeapons: () => ApiService.getAll<Weapon>('equipment?type=Weapon&pagination=false&itemsPerPage=500'), // Adjust filter if needed
    getArmors: () => ApiService.getAll<Armor>('equipment?type=Armor&pagination=false&itemsPerPage=500'),
    getMaterials: () => ApiService.getAll<Material>('materials?pagination=false&itemsPerPage=500'),
    getFoods: () => Promise.resolve(foodData as unknown as Food[]),
    getLodgings: () => Promise.resolve(lodgingData as unknown as Lodging[]),
    getMounts: () => Promise.resolve(mountsData as unknown as Mount[]),
    getCreatures: () => ApiService.getAll<Creature>('creatures?pagination=false&itemsPerPage=500'),
    getCreatureById: (id: string | number) => ApiService.getOne<Creature>('creatures', id),
    getFamilies: () => ApiService.getAll<any>('creature_families?pagination=false&itemsPerPage=500'), // Creature Families
    getProfileFamilies: () => ApiService.getAll<Family>('families?pagination=false&itemsPerPage=500'), // Profile Families
    getRaces: () => ApiService.getAll<Race>('races?pagination=false&itemsPerPage=500'),
    getProfiles: () => ApiService.getAll<Profile>('profiles?pagination=false&itemsPerPage=500'),
    getVoies: () => ApiService.getAll<Voie>('voies?pagination=false&itemsPerPage=500'),
    getVoieById: (id: string | number) => ApiService.getOne<Voie>('voies', id),
    getVoiesByProfile: (profileId: string | number) => ApiService.getAll<Voie>(`voies?profile=${profileId}&pagination=false`),
    getCapabilities: () => ApiService.getAll<Capacity>('capabilities?pagination=false&itemsPerPage=500'),
    getCapabilityById: (id: string | number) => ApiService.getOne<Capacity>('capabilities', id),
    getCapabilitiesByVoie: (voieId: string | number) => ApiService.getAll<Capacity>(`capabilities?voie=${voieId}&pagination=false`),
    getStates: () => ApiService.getAll<any>('states?pagination=false&itemsPerPage=500'), // Use HarmfulState type if avail

    // Provision helper (combines food and lodging)
    getProvisions: async (): Promise<(Food | Lodging)[]> => {
        const [foods, lodgings] = await Promise.all([
            Promise.resolve(foodData as unknown as Food[]),
            Promise.resolve(lodgingData as unknown as Lodging[])
        ]);
        return [...foods, ...lodgings];
    },

    // Consolidated equipment map
    getAllEquipmentMap: async (): Promise<Map<string, any>> => {
        const map = new Map<string, any>();
        // Note: Check actual API endpoints for these. Equipment entity handles Weapons and Armors.
        // We might need to fetch 'equipment' and filter manually or use query params.
        // Assuming /api/equipment returns mixed.
        const equipment = await ApiService.getAll<any>('equipment?pagination=false&itemsPerPage=500');
        equipment.forEach(item => {
            // Infer type or use field
            const tab = item.type === 'Armor' ? 'armors' : 'weapons'; // Simplified
            map.set(String(item.id), { ...item, tab });
        });
        return map;
    }
};
