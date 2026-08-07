/**
 * Schémas structurés par catégorie de la Bibliothèque (HomebrewEntry.data), fidèles
 * aux entités du compendium. Consommés par <HomebrewFields> (formulaire) et
 * <HomebrewData> (fiche). Vague 1 : race, classe, objet-magique, sort, état.
 */

export type HomebrewFieldType = 'text' | 'textarea' | 'number' | 'bool' | 'select' | 'caracs' | 'lines' | 'image' | 'etats' | 'invocations';

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
    /**
     * Champ requis pour enregistrer. Explicite, jamais déduit de `tab` : c'est ce qui
     * rend le niveau d'exigence réversible sans refonte. Non optionnel à dessein : la
     * validation traite un `required` absent comme `true` (cf. homebrewValidation.ts),
     * donc un champ ajouté sans y penser devenait obligatoire en silence (fail-closed
     * par défaut). Le typage force désormais une erreur de compilation à la place.
     */
    required: boolean;
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
    { key: 'type', label: 'Type', type: 'text', placeholder: 'ex. Arme, Armure, Anneau…', required: true },
    { key: 'rarity', label: 'Rareté', type: 'select', options: rarityOptions, required: true },
    { key: 'price', label: 'Prix', type: 'text', placeholder: 'ex. 500 po', required: true },
    { key: 'weight', label: 'Poids (kg)', type: 'number', required: true },
    { key: 'material', label: 'Matériau', type: 'text', required: true },
    { key: 'quality', label: 'Qualité', type: 'text', required: true },
    { key: 'damage', label: 'Dégâts (si arme)', type: 'text', placeholder: 'ex. 1d8', required: false },
    { key: 'range', label: 'Portée (si arme)', type: 'text', required: false },
    { key: 'critical', label: 'Critique (si arme)', type: 'text', required: false },
    { key: 'acBonus', label: 'Bonus DEF (si armure)', type: 'number', required: false },
    { key: 'acMaxAgi', label: 'AGI max (si armure)', type: 'number', required: false },
    { key: 'acPenalty', label: 'Malus (si armure)', type: 'number', required: false },
    { key: 'properties', label: 'Propriétés / effets', type: 'lines', required: true },
];

export const HOMEBREW_SCHEMAS: Record<string, HomebrewFieldDef[]> = {
    // → Race
    race: [
        { key: 'image', label: 'Image (URL)', type: 'image', required: false, placeholder: 'https://…' },
        { key: 'modifiers', label: 'Modificateurs de caractéristiques', type: 'caracs', required: true },
        { key: 'speed', label: 'Vitesse', type: 'text', placeholder: 'ex. 10 m', required: true },
        { key: 'minHeight', label: 'Taille min (cm)', type: 'number', required: true },
        { key: 'maxHeight', label: 'Taille max (cm)', type: 'number', required: true },
        { key: 'minWeight', label: 'Poids min (kg)', type: 'number', required: true },
        { key: 'maxWeight', label: 'Poids max (kg)', type: 'number', required: true },
        { key: 'startingAge', label: 'Âge de départ', type: 'number', required: true },
        { key: 'lifeExpectancy', label: 'Espérance de vie', type: 'number', required: true },
        { key: 'abilities', label: 'Capacités raciales', type: 'textarea', tab: 'rules', required: true },
        { key: 'physicalTraits', label: 'Traits physiques', type: 'textarea', tab: 'lore', required: false },
        { key: 'publicPerception', label: 'Perception publique', type: 'textarea', tab: 'lore', required: false },
        { key: 'roleplay', label: 'Roleplay', type: 'textarea', tab: 'lore', required: false },
        { key: 'typicalNames', label: 'Noms typiques', type: 'textarea', tab: 'lore', required: false },
        { key: 'detailedDescription', label: 'Description détaillée', type: 'textarea', tab: 'lore', required: false },
    ],
    // → Profile
    classe: [
        { key: 'image', label: 'Image (URL)', type: 'image', required: false, placeholder: 'https://…' },
        { key: 'family', label: 'Famille', type: 'text', placeholder: 'ex. Combattants, Mages…', required: true },
        { key: 'note', label: 'Note', type: 'textarea', tab: 'lore', required: false },
        { key: 'lore', label: 'Lore', type: 'lines', tab: 'lore', required: false },
        { key: 'weaponsAuth', label: 'Armes autorisées', type: 'lines', tab: 'rules', required: true },
        { key: 'armorAuth', label: 'Armures autorisées', type: 'lines', tab: 'rules', required: true },
        { key: 'armorMaxDef', label: 'DEF max d’armure', type: 'number', required: true },
        { key: 'magicStat', label: 'Caractéristique de magie', type: 'select', options: magicStatOptions, required: false },
        { key: 'stats', label: 'Stats de départ', type: 'caracs', required: true },
        { key: 'startingEquipment', label: 'Équipement de départ', type: 'lines', tab: 'rules', required: true },
        { key: 'masteries', label: 'Maîtrises', type: 'lines', tab: 'rules', required: true },
    ],
    // → Equipment (objet magique)
    'objet-magique': equipmentFields,
    // → Equipment (équipement non magique) — même schéma
    equipement: equipmentFields,
    // → Capability (isSpell)
    sort: [
        { key: 'rank', label: 'Rang', type: 'number', required: true },
        { key: 'actionType', label: 'Type d’action', type: 'text', placeholder: 'ex. Limitée, Attaque…', required: true },
        { key: 'limited', label: 'Usage limité', type: 'bool', required: false },
        { key: 'effect', label: 'Effet(s)', type: 'lines', required: true },
        { key: 'details', label: 'Détails', type: 'lines', required: true },
        // Mêmes déclarations que `capacite` : un sort passe par le même adaptateur et la
        // même feuille, et c'est précisément le contenu qui inflige des états.
        { key: 'states', label: 'États infligés', type: 'etats', required: false },
        { key: 'summons', label: 'Invocations', type: 'invocations', required: false },
    ],
    // → Capability
    capacite: [
        { key: 'rank', label: 'Rang', type: 'number', required: true },
        { key: 'actionType', label: 'Type d’action', type: 'text', placeholder: 'ex. Limitée, Attaque…', required: true },
        { key: 'isSpell', label: 'Est un sort', type: 'bool', required: false },
        { key: 'limited', label: 'Usage limité', type: 'bool', required: false },
        { key: 'effect', label: 'Effet(s)', type: 'lines', required: true },
        { key: 'details', label: 'Détails', type: 'lines', required: true },
        // Déclarations facultatives, de même forme que celles des capacités officielles
        // (colonnes `Capability.states` / `summons`) : `etatsDeclares` et
        // `resoudreInvocation` s'y appliquent sans adaptation.
        { key: 'states', label: 'États infligés', type: 'etats', required: false },
        { key: 'summons', label: 'Invocations', type: 'invocations', required: false },
    ],
    // → Voie
    voie: [
        { key: 'category', label: 'Catégorie', type: 'text', placeholder: 'ex. profil, peuple, prestige…', required: true },
        { key: 'maxRank', label: 'Rang maximum', type: 'number', required: true },
        // Les capacités d'une voie ne se saisissent plus ici : elles ont leurs propres
        // blocs, et sont enregistrées comme des entrées à part entière. Ce champ garde
        // le rôle du `details` d'une voie officielle — les mécaniques qui ne relèvent
        // d'aucune capacité précise — et n'est donc plus obligatoire.
        { key: 'details', label: 'Mécaniques de la voie', type: 'lines', required: false, placeholder: 'ex. les capacités de cette voie ignorent le malus d\'armure' },
    ],
    // → Poison
    poison: [
        { key: 'effectFail', label: 'Effet (échec)', type: 'textarea', required: true },
        { key: 'effectSuccess', label: 'Effet (réussite)', type: 'textarea', required: true },
        { key: 'duration', label: 'Durée', type: 'text', required: true },
        { key: 'delay', label: 'Délai', type: 'text', required: true },
        { key: 'note', label: 'Note', type: 'textarea', required: true },
    ],
    // → Trap
    piege: [
        { key: 'detectDifficulty', label: 'Difficulté de détection', type: 'text', placeholder: 'ex. DIF 15', required: true },
        { key: 'disarmDifficulty', label: 'Difficulté de désamorçage', type: 'text', required: true },
        { key: 'effect', label: 'Effet', type: 'textarea', required: true },
        { key: 'complement', label: 'Complément', type: 'textarea', required: true },
    ],
    // → HarmfulState : schéma réel = nom + description (aucun champ data supplémentaire)
    etat: [],
};

/** Vrai si la catégorie possède des champs structurés (vague 1). */
export const hasStructuredSchema = (category: string): boolean =>
    (HOMEBREW_SCHEMAS[category]?.length ?? 0) > 0;

/** Catégories disposant d'une feuille de présentation dédiée (`components/sheets`),
 * donc d'un aperçu côté formulaire (`HomebrewFormPreview`) — les autres catégories
 * n'ont pas de rendu de fiche communautaire dédié.
 */
export const HOMEBREW_SHEET_CATEGORIES = ['race', 'classe', 'voie', 'capacite', 'sort'];

/** Restreint un objet data aux clés du schéma de la catégorie (élague le cross-catégorie). */
export const pruneToSchema = (category: string, data: Record<string, unknown>): Record<string, unknown> => {
    const schema = HOMEBREW_SCHEMAS[category];
    if (!schema) return {};
    const out: Record<string, unknown> = {};
    for (const f of schema) {
        if (data[f.key] === undefined) continue;
        // Une ligne d'invocation dont l'entité n'a pas été choisie ne désigne rien : la
        // conserver polluerait la donnée et produirait un lien mort à l'affichage.
        if (f.type === 'invocations' && Array.isArray(data[f.key])) {
            out[f.key] = (data[f.key] as { ref?: string }[]).filter(s => s.ref);
            continue;
        }
        out[f.key] = data[f.key];
    }
    return out;
};

/** Un enfant d'entrée : une capacité rattachée à sa voie. */
export interface HomebrewChild {
    category: string;
    name: string;
    data: Record<string, unknown>;
}

/**
 * Élague chaque enfant selon le schéma de **sa propre** catégorie. `pruneToSchema` ne
 * traite qu'un niveau : sans cette fonction, les champs parasites d'une capacité
 * partiraient en base.
 */
export const pruneChildren = (children: HomebrewChild[]): HomebrewChild[] =>
    children.map(c => ({ category: c.category, name: c.name, data: pruneToSchema(c.category, c.data) }));
