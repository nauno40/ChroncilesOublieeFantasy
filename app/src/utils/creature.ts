import type { Creature } from '../types';

export const getCreatureName = (creature: Creature): string => {
    return creature.name?.[0]?.value || 'Unknown';
};

export const getCreatureLevel = (creature: Creature): number => {
    const val = creature.level?.[0]?.value;
    return val ? parseInt(val, 10) : 0;
};

export const getCreatureFamily = (creature: Creature): string => {
    return creature.creature_family?.[0]?.label || '';
};

export const getCreatureCategory = (creature: Creature): string => {
    return creature.category?.[0]?.label || '';
};

export const getCreatureArchetype = (creature: Creature): string => {
    return creature.archetype?.[0]?.label || '';
};

export const getCreatureEnvironment = (creature: Creature): string => {
    return creature.environment?.[0]?.label || '';
};

export const getCreatureSize = (creature: Creature): string => {
    return creature.size?.[0]?.label || '';
};

/**
 * Get the image path for a creature
 */
export const getCreatureImage = (creature: Creature): string => {
    const name = getCreatureName(creature);
    return `/assets/creatures/${name}.jpg`;
};
