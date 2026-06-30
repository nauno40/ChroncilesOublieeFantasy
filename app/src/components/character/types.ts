import type { useCharacterData } from '../../hooks/useCharacterData';

/**
 * Types des collections du compendium passées en props aux composants de la
 * fiche. Dérivés du retour de useCharacterData (tous `any[]` côté données, mais
 * exprimés sans le mot-clé `any` pour rester cohérents avec la convention de
 * typage du projet).
 */
type RefData = ReturnType<typeof useCharacterData>;

export type RaceList = RefData['races'];
export type ProfileList = RefData['profiles'];
export type WeaponList = RefData['allWeapons'];
export type ArmorList = RefData['allArmors'];
export type VoieList = RefData['prestigePaths'];
