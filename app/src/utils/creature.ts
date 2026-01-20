import type { Creature } from '../types';

// Helper functions to safely access creature properties
// Note: Detailed fields like category, archetype, environment, size were previously loaded from a JSON file.
// They should be migrated to the backend Entity in the future.

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
    return creature.category || '';
};

export const getCreatureArchetype = (creature: Creature): string => {
    return creature.archetype || '';
};

export const getCreatureEnvironment = (creature: Creature): string => {
    return creature.environment || '';
};

export const getCreatureSize = (creature: Creature): string => {
    return creature.size || '';
};

/**
 * Get the image path for a creature
 */
export const getCreatureImage = (creature: Creature): string => {
    // Use database picture field, fallback to name-based lookup
    if (creature.picture) {
        return creature.picture;
    }
    const name = getCreatureName(creature);
    return `/assets/creatures/${name}.jpg`;
};
