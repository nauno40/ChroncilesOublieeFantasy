// Formes « brutes » des données de référence du compendium telles que consommées par la
// fiche de personnage (races/profils/voies/équipement, avec relations API Platform exprimées
// en objets imbriqués — les hooks `useCharacterData`/`useCharacterSheet` ne re-fetchent que des
// collections déjà déployées côté serveur, jamais des IRIs à résoudre eux-mêmes pour ces champs).
// Distinct de `normalized.ts` (modèle « propre », domaine) : ici on ne décrit que les champs
// réellement lus par les hooks et les composants de la fiche (`components/character/*`), en
// étendant les formes minimales déjà définies pour le moteur de règles (`domain/rules`).

import type { CompendiumRace, CompendiumProfile, CompendiumVoie, RaceModifier } from '../domain/rules';

/** Une voie telle qu'exposée en relation imbriquée (race.availableVoies, profile.voies, /voies). */
export interface RefVoie extends CompendiumVoie {
    id?: number | string;
    type?: string;
    category?: string;
    description?: string;
}

export interface RefRace extends CompendiumRace {
    '@id'?: string;
    id?: number | string;
    name?: string;
    nom?: string; // nom legacy (export Drupal des fixtures)
    // Non-optionnel : AttributesPanel indexe `selectedRace.modifiers` dans une closure imbriquée
    // (map) où le garde de nullité du composant appelant ne peut pas être vu par TS ; le garde
    // runtime (`if (!selectedRace?.modifiers) return null`) reste intact et couvre l'absence réelle.
    modifiers: RaceModifier[];
    availableVoies?: RefVoie[];
    startingAge?: number;
    lifeExpectancy?: number;
    minHeight?: number;
    maxHeight?: number;
    minWeight?: number;
    maxWeight?: number;
}

export interface RefProfileMasteries {
    weapons?: string;
    armors?: string;
    shields?: string;
    special?: string;
    weaponsAndArmors?: string;
    constraints?: string;
}

/** Élément d'équipement de départ d'un profil (objet simple, choix, ou ensemble). */
export interface RefProfileStartingEquipmentItem {
    item?: string;
    stats?: string;
    examples?: string;
    choice?: RefProfileStartingEquipmentItem[];
    set?: RefProfileStartingEquipmentItem[];
}

export interface RefProfileStats {
    hpPerLevel?: number;
    profileType?: string;
    hitDie?: string;
    magicStat?: string;
    [key: string]: unknown;
}

export interface RefProfile extends CompendiumProfile {
    '@id'?: string;
    id?: number | string;
    name?: string;
    voies?: RefVoie[];
    startingEquipment?: (RefProfileStartingEquipmentItem | string)[] | null;
    masteries?: RefProfileMasteries | null;
    armorMaxDef?: number | null;
    stats?: RefProfileStats;
    hpPerLevel?: number;
}

/** Une pièce d'équipement (arme ou armure) telle que renvoyée par `/equipment`, plus les champs
 *  `defense`/`value` calculés côté client (cf. `useCharacterData`, filtrage de secours par type). */
export interface RefEquipmentItem {
    id?: number | string;
    '@id'?: string;
    name?: string;
    // Non-optionnel : lu sans garde de nullité par ProtectionSection/WeaponsSection (`a.type.includes(...)`).
    type: string;
    price?: string;
    acBonus?: number | null;
    acMaxAgi?: number | null;
    acPenalty?: number | null;
    // Non-optionnel : assigné directement à `CharacterWeapon.dmg` (string) par WeaponsSection.
    damage: string;
    range?: string;
    critical?: string;
    reload?: string;
    // Champs calculés client-side (normalisation defense/value) — absents de l'API brute pour
    // les armes ; non-optionnel côté armure car lu sans garde par ProtectionSection (`parseInt`).
    defense?: number;
    value: string;
}

/** Forme d'un item d'équipement passé à `addEquipmentItem` (départ de profil ou choix résolu
 *  par `EquipmentChoiceModal`) — recouvre les deux formes réellement rencontrées. */
export interface EquipmentLikeItem {
    item?: string;
    stats?: string;
    set?: EquipmentLikeItem[];
}
