import { ApiService } from './api';
import type { CustomCreature } from '../types';

const RESOURCE = 'custom_creatures';

// Champs réellement modifiables par le client. On exclut id / owner / clés JSON-LD
// (@id, @type…) pour ne pas les renvoyer au backend (owner est posé côté serveur).
const WRITABLE_FIELDS: (keyof CustomCreature)[] = [
    'name', 'description', 'nc', 'hp', 'def', 'init',
    'stats', 'specialAbilities', 'attacks', 'capabilities',
    'picture', 'category', 'environment', 'archetype', 'size',
];

const toPayload = (data: Partial<CustomCreature>): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};
    for (const key of WRITABLE_FIELDS) {
        if (data[key] !== undefined) {
            payload[key] = data[key];
        }
    }
    return payload;
};

export const getMonsters = async (): Promise<CustomCreature[]> => {
    try {
        return await ApiService.getAll<CustomCreature>(RESOURCE);
    } catch (error) {
        console.error('Failed to fetch custom monsters', error);
        return [];
    }
};

export const getMonster = async (id: number | string): Promise<CustomCreature | null> => {
    try {
        return await ApiService.getOne<CustomCreature>(RESOURCE, id);
    } catch (error) {
        console.error(`Failed to fetch custom monster ${id}`, error);
        return null;
    }
};

export const createMonster = async (data: Partial<CustomCreature>): Promise<CustomCreature> => {
    return ApiService.post<CustomCreature>(RESOURCE, toPayload(data));
};

export const updateMonster = async (id: number, data: Partial<CustomCreature>): Promise<CustomCreature> => {
    return ApiService.put<CustomCreature>(RESOURCE, id, toPayload(data));
};

export const deleteMonster = async (id: number): Promise<void> => {
    return ApiService.delete(RESOURCE, id);
};
