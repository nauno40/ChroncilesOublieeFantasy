import type { Creature, CustomCreature } from '../types';
import type { CarteCreature } from '../components/creature/CreatureCard';

// Helper functions to safely access creature properties
// Note: Detailed fields like category, archetype, environment, size were previously loaded from a JSON file.
// They should be migrated to the backend Entity in the future.

export const getCreatureName = (creature: Creature): string => {
    return creature.name || 'Unknown';
};

/**
 * Écrit un NC comme le livre l'écrit : « ½ », pas « 0.5 ».
 *
 * COF2 emploie le demi-niveau pour ses adversaires les plus faibles (bandit de base,
 * milicien, gobelin élite, rat géant) et le note ½ partout, jusque dans la règle de
 * l'attaque magique — « ½ vaut 0 ». Le chiffre décimal est la forme de stockage, pas
 * celle qu'on lit à la table.
 */
export const formatNC = (nc: number | string | undefined | null): string => {
    if (nc === undefined || nc === null || nc === '') return '—';
    // Le type est ouvert parce que les porteurs le sont : la fiche et la carte acceptent
    // déjà un NC textuel, et un monstre maison peut en porter un. Seul le 0,5 servi par
    // l'API se réécrit ; le reste s'affiche tel quel.
    return Number(nc) === 0.5 ? '½' : String(nc);
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
    // Priority: 1. Local asset (Full illustration), 2. Remote picture (Token)
    const name = getCreatureName(creature);
    if (name && name !== 'Unknown') {
        return `/assets/creatures/${name}.jpg`;
    }

    return creature.picture || '/assets/creatures/default.jpg';
};

/**
 * Vue « carte » d'une créature officielle, telle que la liste du bestiaire la présente.
 * Elle vit ici, à côté de son équivalent communautaire, pour que les deux sources
 * remplissent visiblement les mêmes cases — c'est là que se voit un champ oublié.
 */
export const carteDepuisCreature = (creature: Creature): CarteCreature => ({
    nom: getCreatureName(creature),
    image: getCreatureImage(creature),
    nc: creature.nc,
    pv: creature.hp,
    def: creature.def,
    force: creature.stats?.FOR,
    init: creature.init,
    categorie: getCreatureCategory(creature) || undefined,
});

/** Même vue, pour une créature maison ou communautaire. */
export const carteDepuisMonstreMaison = (c: CustomCreature): CarteCreature => ({
    nom: c.name,
    // Un monstre maison n'a pas d'illustration locale : `CardMedia` pose alors le
    // placeholder à l'initiale, comme pour toute création communautaire.
    image: c.picture || undefined,
    nc: c.nc,
    pv: c.hp,
    def: c.def,
    force: c.stats?.FOR,
    init: c.init,
    categorie: c.category || undefined,
    description: c.description || undefined,
});
