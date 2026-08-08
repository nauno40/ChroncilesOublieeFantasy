import type { Weapon, Armor, Food, Lodging, Mount, Creature, Race, Profile, Voie, Capacity, Material, Family, HarmfulState, Poison, Trap } from '../types/normalized';
// Renaming Capacity to Capability for API consistency if needed, or stick to Capacity
import { ApiService } from './api';

/** Forme commune des entrées de la collection `equipment` — armes, armures et matériel
 *  partagent l'identifiant, le nom et le type ; le reste diffère selon la catégorie. */
type EquipmentLike = { id: number | string; name: string; type?: string } & Record<string, unknown>;


/**
 * Cache mémoire (durée de session) des collections du compendium — données de
 * référence *statiques* (ne changent que via l'admin / les fixtures, jamais
 * depuis l'app côté joueur). Sans lui, chaque montage de composant retéléchargeait
 * les mêmes collections (creatures/voies/capabilities pèsent plusieurs Mo).
 *
 * On mémoïse la *Promise* : les appels concurrents partagent un unique fetch
 * réseau (ce qui supprime aussi les « Failed to fetch » dus aux requêtes
 * dupliquées en parallèle). Chaque appelant reçoit une *copie* du tableau, pour
 * qu'un tri/push local ne corrompe pas l'entrée partagée. Une requête échouée
 * est retirée du cache afin qu'un nouvel essai puisse repartir proprement.
 */
const collectionCache = new Map<string, Promise<unknown[]>>();

function cachedGetAll<T>(endpoint: string): Promise<T[]> {
    let base = collectionCache.get(endpoint) as Promise<T[]> | undefined;
    if (!base) {
        base = ApiService.getAll<T>(endpoint).catch((err) => {
            collectionCache.delete(endpoint);
            throw err;
        });
        collectionCache.set(endpoint, base as Promise<unknown[]>);
    }
    return base.then((arr) => arr.slice());
}

export const DataService = {
    /** Vide le cache compendium (à appeler après une édition admin en session). */
    clearCache: () => collectionCache.clear(),

    getWeapons: async () => {
        const all = await cachedGetAll<Weapon>('equipment?pagination=false&itemsPerPage=500');
        // Filter out armors client-side until DB is normalized for Weapon vs Armor
        return all.filter(e => {
            const type = (e.type || '').toLowerCase();
            return !type.includes('armure') && !type.includes('bouclier');
        });
    },
    getArmors: async () => {
        const all = await cachedGetAll<Armor>('equipment?pagination=false&itemsPerPage=500');
        return all.filter(e => {
            const type = (e.type || '').toLowerCase();
            return type.includes('armure') || type.includes('bouclier');
        });
    },
    // Équipement brut complet (caché) — pour les consommateurs qui appliquent leur
    // propre filtrage/normalisation (ex. useCharacterData : armes vs armures).
    getEquipment: <T = unknown>() => cachedGetAll<T>('equipment?pagination=false&itemsPerPage=500'),
    getMaterials: () => cachedGetAll<Material>('materials?pagination=false&itemsPerPage=500'),
    getFoods: () => cachedGetAll<Food>('foods?pagination=false&itemsPerPage=500'),
    getLodgings: () => cachedGetAll<Lodging>('lodgings?pagination=false&itemsPerPage=500'),
    getMounts: () => cachedGetAll<Mount>('mounts?pagination=false&itemsPerPage=500'),
    getCreatures: () => cachedGetAll<Creature>('creatures?pagination=false&itemsPerPage=500'),
    getCreatureById: (id: string | number) => ApiService.getOne<Creature>('creatures', id),
    // Familles de créature : l'API n'expose qu'un identifiant et un nom, et c'est tout ce
    // que les appelants lisent.
    getFamilies: () => cachedGetAll<{ id: number | string; name: string }>('creature_families?pagination=false&itemsPerPage=500'),
    getProfileFamilies: () => cachedGetAll<Family>('families?pagination=false&itemsPerPage=500'), // Profile Families
    getRaces: () => cachedGetAll<Race>('races?pagination=false&itemsPerPage=500'),
    getRaceById: (id: string | number) => ApiService.getOne<Race>('races', id),
    getProfiles: () => cachedGetAll<Profile>('profiles?pagination=false&itemsPerPage=500'),
    getVoies: () => cachedGetAll<Voie>('voies?pagination=false&itemsPerPage=500'),
    getVoieById: (id: string | number) => ApiService.getOne<Voie>('voies', id),
    getVoiesByProfile: (profileId: string | number) => cachedGetAll<Voie>(`voies?profile=${profileId}&pagination=false`),

    // Compteurs légers (totalItems Hydra) — pour le tableau de bord, sans rapatrier les collections.
    countCreatures: () => ApiService.count('creatures'),
    countVoies: () => ApiService.count('voies'),
    countProfiles: () => ApiService.count('profiles'),
    getCapabilities: () => cachedGetAll<Capacity>('capabilities?pagination=false&itemsPerPage=500'),
    getCapabilityById: (id: string | number) => ApiService.getOne<Capacity>('capabilities', id),
    getCapabilitiesByVoie: (voieId: string | number) => cachedGetAll<Capacity>(`capabilities?voie=${voieId}&pagination=false`),
    getStates: () => cachedGetAll<HarmfulState>('states?pagination=false&itemsPerPage=500'),
    getPoisons: () => cachedGetAll<Poison>('poisons?pagination=false&itemsPerPage=500'),
    getTraps: () => cachedGetAll<Trap>('traps?pagination=false&itemsPerPage=500'),

    // Provision helper (combines food and lodging)
    getProvisions: async (): Promise<(Food | Lodging)[]> => {
        const [foods, lodgings] = await Promise.all([
            cachedGetAll<Food>('foods?pagination=false&itemsPerPage=500'),
            cachedGetAll<Lodging>('lodgings?pagination=false&itemsPerPage=500')
        ]);
        return [...foods, ...lodgings];
    },

    // Consolidated equipment map
    // La collection `equipment` mélange armes, armures et matériel : on la lit sous sa
    // forme commune, en ajoutant l'onglet de destination calculé ici.
    getAllEquipmentMap: async (): Promise<Map<string, EquipmentLike & { tab: string }>> => {
        const map = new Map<string, EquipmentLike & { tab: string }>();
        const equipment = await cachedGetAll<EquipmentLike>('equipment?pagination=false&itemsPerPage=500');
        equipment.forEach(item => {
            let tab = 'weapons';
            const lowerType = (item.type || '').toLowerCase();

            if (['Mount', 'Food', 'Lodging'].includes(item.type ?? '')) {
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
