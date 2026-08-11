/**
 * Ce qu'implique le type d'une créature (COF2, Opposition, § « Type de créature »).
 *
 * La fiche affichait « Non-vivante » et s'arrêtait là. Le livre, lui, attache à chaque type
 * une liste d'immunités précises — un squelette est immunisé aux poisons ET à toute attaque
 * demandant un test de CON — que le MJ devait connaître de mémoire ou rouvrir le livre pour
 * retrouver, au moment même où un joueur tente d'empoisonner le mort-vivant.
 *
 * Les libellés reprennent le texte du livre plutôt que de le résumer : c'est une règle
 * qu'on lit à la table, pas un rappel décoratif.
 */
export interface TypeCreature {
    /** Intitulé canonique, tel que le livre le nomme. */
    label: string;
    /** Ce que le type accorde, une implication par entrée. */
    implications: string[];
    /**
     * Implications qui ne valent que pour une créature dépourvue d'intelligence. Le livre les
     * conditionne explicitement : une créature végétative intelligente « n'a pas d'autre
     * immunité particulière ». Les afficher sans réserve les rendrait fausses une fois sur deux.
     */
    siSansIntelligence?: string[];
}

export const TYPES_CREATURE: Record<string, TypeCreature> = {
    vivante: {
        label: 'Créature vivante',
        // « La catégorie par défaut » : elle n'accorde rien, et c'est une information en soi.
        implications: [],
    },
    humanoide: {
        label: 'Humanoïde',
        implications: [
            'Marche sur deux jambes et est généralement douée de parole : les interactions vont au-delà du combat.',
            'Certaines capacités ne peuvent cibler que des créatures humanoïdes.',
        ],
    },
    vegetative: {
        label: 'Créature végétative',
        implications: [
            'Ne respire pas.',
            'Immunisée aux maladies et aux poisons.',
        ],
        siSansIntelligence: [
            'Immunisée à toutes les attaques mentales (celles auxquelles on résiste par un test opposé d’attaque magique basé sur la VOL).',
        ],
    },
    'non-vivante': {
        label: 'Créature non vivante',
        implications: [
            'Ne respire pas.',
            'Immunisée aux maladies et aux poisons.',
            'Immunisée à toutes les attaques qui demandent un test de CON.',
            'Infatigable.',
            'Voit dans le noir.',
        ],
        siSansIntelligence: [
            'Immunisée à toutes les attaques mentales (celles auxquelles on résiste par un test opposé d’attaque magique basé sur la VOL).',
        ],
    },
};

/**
 * Reconnaît le type dans le libellé porté par la donnée, officielle ou maison.
 *
 * Le compendium sert « Vivante », « Humanoïde », « Non-vivante », « Végétative » ; un monstre
 * maison porte du texte libre, saisi avec ou sans accents, au masculin ou au féminin. On
 * cherche le radical, et un libellé qui ne correspond à aucun type n'en reçoit aucun — une
 * créature « Aberration » ne doit pas hériter des immunités des morts-vivants.
 */
export const typeCreature = (libelle: string | undefined | null): TypeCreature | undefined => {
    if (!libelle) return undefined;
    const nu = libelle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (nu.includes('non') && nu.includes('viv')) return TYPES_CREATURE['non-vivante'];
    if (nu.includes('vegeta')) return TYPES_CREATURE.vegetative;
    if (nu.includes('humanoid')) return TYPES_CREATURE.humanoide;
    if (nu.includes('viv')) return TYPES_CREATURE.vivante;
    return undefined;
};
