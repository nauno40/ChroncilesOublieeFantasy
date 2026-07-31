/**
 * View-models des feuilles de présentation. Tous les champs sont optionnels sauf
 * `name` : une entrée communautaire est partiellement remplie et la feuille doit se
 * dégrader proprement. Un champ absent vaut `undefined` — jamais `null`, `""` ni `0`,
 * qui feraient afficher une section vide.
 */

export interface SheetVoieRef {
    id?: string;
    name: string;
}

/**
 * Un modificateur de caractéristique tel que le compendium l'exprime réellement :
 * fixe (`stat` + `value`), au choix (`options` + `value`), ou formulé librement
 * (`description`). Un Record<string, number> perdrait les deux derniers cas.
 */
export interface SheetModifier {
    stat?: string;
    value?: number;
    options?: string[];
    description?: string;
}

export interface RaceSheetVM {
    name: string;
    description?: string;
    image?: string;
    modifiers?: SheetModifier[];
    speed?: string;
    minHeight?: number;
    maxHeight?: number;
    minWeight?: number;
    maxWeight?: number;
    startingAge?: number;
    lifeExpectancy?: number;
    abilities?: string;
    physicalTraits?: string;
    publicPerception?: string;
    roleplay?: string;
    typicalNames?: string;
    detailedDescription?: string;
    voies?: SheetVoieRef[];
}

export interface ProfileSheetVM {
    name: string;
    description?: string;
    image?: string;
    family?: string;
    hitDie?: string;
    magicStat?: string;
    armorMaxDef?: number;
    stats?: Record<string, number>;
    weaponsAuth?: string[];
    armorAuth?: string[];
    startingEquipment?: string[];
    masteries?: string[];
    note?: string;
    lore?: string[];
    voies?: SheetVoieRef[];
}

export interface SheetCapabilityRef {
    rank?: number;
    name: string;
    description?: string;
    isSpell?: boolean;
}

export interface VoieSheetVM {
    name: string;
    description?: string;
    category?: string;
    maxRank?: number;
    profileName?: string;
    capabilities?: SheetCapabilityRef[];
}

export interface CapaciteSheetVM {
    name: string;
    description?: string;
    rank?: number;
    actionType?: string;
    isSpell?: boolean;
    limited?: boolean;
    effect?: string[];
    details?: string[];
    voieName?: string;
}
