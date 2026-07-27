/**
 * Schémas structurés par catégorie de la Bibliothèque (HomebrewEntry.data), fidèles
 * aux entités du compendium. Consommés par <HomebrewFields> (formulaire) et
 * <HomebrewData> (fiche). Vague 1 : race, classe, objet-magique, sort, état.
 */

export type HomebrewFieldType = 'text' | 'textarea' | 'number' | 'bool' | 'select' | 'caracs' | 'lines';

export interface HomebrewFieldDef {
    key: string;
    label: string;
    type: HomebrewFieldType;
    placeholder?: string;
    /** Pour les champs 'select'. */
    options?: { value: string; label: string }[];
    /**
     * Onglet de la fiche détail pour les champs longs (textarea/lines) : 'lore'
     * (légendes & culture) ou 'rules' (règles & capacités). Absent = 'rules'.
     * Les onglets n'apparaissent que si la catégorie a des champs des DEUX types.
     */
    tab?: 'lore' | 'rules';
}

/** Caractéristiques COF2 (valeurs directes, pas des scores). */
export const CARAC_KEYS = ['AGI', 'CON', 'FOR', 'PER', 'CHA', 'INT', 'VOL'] as const;
export type CaracKey = typeof CARAC_KEYS[number];

const magicStatOptions = [
    { value: '', label: '— Aucune —' },
    ...CARAC_KEYS.map(k => ({ value: k, label: k })),
];

const rarityOptions = [
    { value: 'Commun', label: 'Commun' },
    { value: 'Peu commun', label: 'Peu commun' },
    { value: 'Rare', label: 'Rare' },
    { value: 'Très rare', label: 'Très rare' },
    { value: 'Légendaire', label: 'Légendaire' },
];

// → Equipment : partagé entre « objet-magique » et « equipement » (même entité compendium).
const equipmentFields: HomebrewFieldDef[] = [
    { key: 'type', label: 'Type', type: 'text', placeholder: 'ex. Arme, Armure, Anneau…' },
    { key: 'rarity', label: 'Rareté', type: 'select', options: rarityOptions },
    { key: 'price', label: 'Prix', type: 'text', placeholder: 'ex. 500 po' },
    { key: 'weight', label: 'Poids (kg)', type: 'number' },
    { key: 'material', label: 'Matériau', type: 'text' },
    { key: 'quality', label: 'Qualité', type: 'text' },
    { key: 'damage', label: 'Dégâts (si arme)', type: 'text', placeholder: 'ex. 1d8' },
    { key: 'range', label: 'Portée (si arme)', type: 'text' },
    { key: 'critical', label: 'Critique (si arme)', type: 'text' },
    { key: 'acBonus', label: 'Bonus DEF (si armure)', type: 'number' },
    { key: 'acMaxAgi', label: 'AGI max (si armure)', type: 'number' },
    { key: 'acPenalty', label: 'Malus (si armure)', type: 'number' },
    { key: 'properties', label: 'Propriétés / effets', type: 'lines' },
];

export const HOMEBREW_SCHEMAS: Record<string, HomebrewFieldDef[]> = {
    // → Race
    race: [
        { key: 'modifiers', label: 'Modificateurs de caractéristiques', type: 'caracs' },
        { key: 'speed', label: 'Vitesse', type: 'text', placeholder: 'ex. 10 m' },
        { key: 'minHeight', label: 'Taille min (cm)', type: 'number' },
        { key: 'maxHeight', label: 'Taille max (cm)', type: 'number' },
        { key: 'minWeight', label: 'Poids min (kg)', type: 'number' },
        { key: 'maxWeight', label: 'Poids max (kg)', type: 'number' },
        { key: 'startingAge', label: 'Âge de départ', type: 'number' },
        { key: 'lifeExpectancy', label: 'Espérance de vie', type: 'number' },
        { key: 'abilities', label: 'Capacités raciales', type: 'textarea', tab: 'rules' },
        { key: 'physicalTraits', label: 'Traits physiques', type: 'textarea', tab: 'lore' },
        { key: 'publicPerception', label: 'Perception publique', type: 'textarea', tab: 'lore' },
        { key: 'roleplay', label: 'Roleplay', type: 'textarea', tab: 'lore' },
        { key: 'typicalNames', label: 'Noms typiques', type: 'textarea', tab: 'lore' },
        { key: 'detailedDescription', label: 'Description détaillée', type: 'textarea', tab: 'lore' },
    ],
    // → Profile
    classe: [
        { key: 'family', label: 'Famille', type: 'text', placeholder: 'ex. Combattants, Mages…' },
        { key: 'note', label: 'Note', type: 'textarea', tab: 'lore' },
        { key: 'lore', label: 'Lore', type: 'lines', tab: 'lore' },
        { key: 'weaponsAuth', label: 'Armes autorisées', type: 'lines', tab: 'rules' },
        { key: 'armorAuth', label: 'Armures autorisées', type: 'lines', tab: 'rules' },
        { key: 'armorMaxDef', label: 'DEF max d’armure', type: 'number' },
        { key: 'magicStat', label: 'Caractéristique de magie', type: 'select', options: magicStatOptions },
        { key: 'stats', label: 'Stats de départ', type: 'caracs' },
        { key: 'startingEquipment', label: 'Équipement de départ', type: 'lines', tab: 'rules' },
        { key: 'masteries', label: 'Maîtrises', type: 'lines', tab: 'rules' },
    ],
    // → Equipment (objet magique)
    'objet-magique': equipmentFields,
    // → Equipment (équipement non magique) — même schéma
    equipement: equipmentFields,
    // → Capability (isSpell)
    sort: [
        { key: 'rank', label: 'Rang', type: 'number' },
        { key: 'actionType', label: 'Type d’action', type: 'text', placeholder: 'ex. Limitée, Attaque…' },
        { key: 'limited', label: 'Usage limité', type: 'bool' },
        { key: 'effect', label: 'Effet(s)', type: 'lines' },
        { key: 'details', label: 'Détails', type: 'lines' },
    ],
    // → Capability
    capacite: [
        { key: 'rank', label: 'Rang', type: 'number' },
        { key: 'actionType', label: 'Type d’action', type: 'text', placeholder: 'ex. Limitée, Attaque…' },
        { key: 'isSpell', label: 'Est un sort', type: 'bool' },
        { key: 'limited', label: 'Usage limité', type: 'bool' },
        { key: 'effect', label: 'Effet(s)', type: 'lines' },
        { key: 'details', label: 'Détails', type: 'lines' },
    ],
    // → Voie
    voie: [
        { key: 'category', label: 'Catégorie', type: 'text', placeholder: 'ex. profil, peuple, prestige…' },
        { key: 'maxRank', label: 'Rang maximum', type: 'number' },
        { key: 'details', label: 'Capacités / détails (par rang)', type: 'lines' },
    ],
    // → Poison
    poison: [
        { key: 'effectFail', label: 'Effet (échec)', type: 'textarea' },
        { key: 'effectSuccess', label: 'Effet (réussite)', type: 'textarea' },
        { key: 'duration', label: 'Durée', type: 'text' },
        { key: 'delay', label: 'Délai', type: 'text' },
        { key: 'note', label: 'Note', type: 'textarea' },
    ],
    // → Trap
    piege: [
        { key: 'detectDifficulty', label: 'Difficulté de détection', type: 'text', placeholder: 'ex. DIF 15' },
        { key: 'disarmDifficulty', label: 'Difficulté de désamorçage', type: 'text' },
        { key: 'effect', label: 'Effet', type: 'textarea' },
        { key: 'complement', label: 'Complément', type: 'textarea' },
    ],
    // → HarmfulState : schéma réel = nom + description (aucun champ data supplémentaire)
    etat: [],
};

/** Vrai si la catégorie possède des champs structurés (vague 1). */
export const hasStructuredSchema = (category: string): boolean =>
    (HOMEBREW_SCHEMAS[category]?.length ?? 0) > 0;

/** Restreint un objet data aux clés du schéma de la catégorie (élague le cross-catégorie). */
export const pruneToSchema = (category: string, data: Record<string, unknown>): Record<string, unknown> => {
    const schema = HOMEBREW_SCHEMAS[category];
    if (!schema) return {};
    const out: Record<string, unknown> = {};
    for (const f of schema) {
        if (data[f.key] !== undefined) out[f.key] = data[f.key];
    }
    return out;
};
