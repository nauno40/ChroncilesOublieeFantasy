import weaponsData from '../data/weapons.json';
import armorsData from '../data/armors.json';
import materialsData from '../data/materials.json';
import foodData from '../data/food.json';
import lodgingData from '../data/lodging.json';
import mountsData from '../data/mounts.json';
import creaturesData from '../data/creatures.json';
import type { Weapon, Armor, Material, Food, Lodging, Mount, Creature } from '../types/normalized';

// Generic data accessor
const getAll = <T>(data: unknown): T[] => {
    return data as T[];
};

export const DataService = {
    getWeapons: (): Weapon[] => getAll<Weapon>(weaponsData),
    getArmors: (): Armor[] => getAll<Armor>(armorsData),
    getMaterials: (): Material[] => getAll<Material>(materialsData),
    getFoods: (): Food[] => getAll<Food>(foodData),
    getLodgings: (): Lodging[] => getAll<Lodging>(lodgingData),
    getMounts: (): Mount[] => getAll<Mount>(mountsData),
    getCreatures: (): Creature[] => getAll<Creature>(creaturesData),

    // Provision helper (combines food and lodging)
    getProvisions: (): (Food | Lodging)[] => {
        return [...getAll<Food>(foodData), ...getAll<Lodging>(lodgingData)];
    }
};
