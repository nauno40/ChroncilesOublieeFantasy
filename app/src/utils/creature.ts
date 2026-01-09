import type { Creature } from '../types';
import creaturesData from '../data/creatures.json';

// Create a lookup map for performance
const creatureDetailsMap = new Map<string, any>();
(creaturesData as any[]).forEach(c => {
    // Navigate the complex structure to find the name
    // internal_name or name[0].value
    const name = c.name?.[0]?.value;
    if (name) {
        creatureDetailsMap.set(name, c);
    }
});

const getDetail = (creature: Creature, field: string): string => {
    // Try to get from creature object first if it exists (future proofing)
    if ((creature as any)[field]) return (creature as any)[field];

    // Fallback to local JSON lookup
    const details = creatureDetailsMap.get(creature.name);
    if (!details) return '';

    // Extract format: array of {value, label} or just value
    const item = details[field]?.[0];
    return item?.label || item?.value || '';
};

export const getCreatureName = (creature: Creature): string => {
    return creature.name || 'Unknown';
};

export const getCreatureLevel = (creature: Creature): number => {
    return creature.nc || 0;
};

export const getCreatureFamily = (creature: Creature): string => {
    return creature.family?.name || '';
};

export const getCreatureCategory = (creature: Creature): string => {
    return getDetail(creature, 'category');
};

export const getCreatureArchetype = (creature: Creature): string => {
    return getDetail(creature, 'archetype');
};

export const getCreatureEnvironment = (creature: Creature): string => {
    return getDetail(creature, 'environment');
};

export const getCreatureSize = (creature: Creature): string => {
    return getDetail(creature, 'size');
};

/**
 * Get the image path for a creature
 */
export const getCreatureImage = (creature: Creature): string => {
    // Fallback to name-based lookup
    const name = getCreatureName(creature);
    return `/assets/creatures/${name}.jpg`;
};
