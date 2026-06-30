import type { useCharacterData } from '../../hooks/useCharacterData';
import type { useCharacterSheet } from '../../hooks/useCharacterSheet';

/**
 * Types des collections du compendium et des handlers/setters de la fiche,
 * passés en props aux composants. Dérivés du retour des hooks (beaucoup sont
 * `any` côté données, mais exprimés ici via ReturnType pour ne pas réécrire le
 * mot-clé `any` et rester cohérents avec la convention de typage du projet).
 */
type RefData = ReturnType<typeof useCharacterData>;
type SheetState = ReturnType<typeof useCharacterSheet>;

export type RaceList = RefData['races'];
export type ProfileList = RefData['profiles'];
export type WeaponList = RefData['allWeapons'];
export type ArmorList = RefData['allArmors'];
export type VoieList = RefData['prestigePaths'];

export type AddEquipmentItem = SheetState['addEquipmentItem'];
export type EquipmentChoiceQueueSetter = SheetState['setEquipmentChoiceQueue'];
export type GetCapabilityName = SheetState['getCapabilityName'];
export type SelectedVoiesSetter = SheetState['setSelectedVoies'];
export type PrestigeSelectorSetter = SheetState['setShowPrestigeSelector'];
export type IsMageFamily = SheetState['isMageFamily'];
export type RacialVoieOptions = SheetState['racialVoieOptions'];
