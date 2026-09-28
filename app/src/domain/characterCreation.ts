import type { Character } from '../types/character';
import type { EquipmentLikeItem } from '../types/compendiumRefs';
import { ADVENTURER_PACK } from '../hooks/useCharacterSheet';
import { findProfile } from './rules';
import type { AddEquipmentItem, ProfileList } from '../components/character/types';

export interface ApplyProfileSelectionResult {
    /** À fusionner dans `character` via `setCharacter(prev => ({ ...prev, ...patch }))`. */
    characterPatch: Pick<Partial<Character>, 'profile' | 'playState'>;
    /** Choix d'équipement à résoudre (file pour `EquipmentChoiceModal`), vide si aucun. */
    choicesFound: EquipmentLikeItem[][];
}

/**
 * Cascade déclenchée par le choix d'un profil (COF2 création) : réinitialise armes/
 * protection/inventaire, résout l'équipement de départ (items directs vs. choix mis en
 * file), ajoute le sac d'aventurier et tire 2d6 pa de bourse initiale.
 *
 * Extrait de `IdentityBlock.tsx` (comportement identique, zéro changement de règle) pour
 * être appelé aussi bien depuis la fiche classique que depuis l'étape « Profil » de
 * l'assistant de création guidée — sans dupliquer cette logique aux deux endroits.
 */
export const applyProfileSelection = (
    selectedId: string,
    character: Partial<Character>,
    profiles: ProfileList,
    addEquipmentItem: AddEquipmentItem,
): ApplyProfileSelectionResult => {
    const p = findProfile(selectedId, profiles);

    const nextPlayState = {
        ...character.playState!,
        weapons: [],
        protection: { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } },
        equipment: [],
    };

    const choicesFound: EquipmentLikeItem[][] = [];

    if (p && p.startingEquipment) {
        p.startingEquipment.forEach(eq => {
            if (typeof eq === 'string') return;
            if (eq.item) {
                addEquipmentItem(eq, nextPlayState);
            } else if (eq.choice) {
                choicesFound.push(eq.choice);
            }
        });
    }

    const adventurerEquipment = [...ADVENTURER_PACK];
    const roll2d6 = () => (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1);
    const initialGold = roll2d6();

    return {
        characterPatch: {
            profile: selectedId,
            playState: {
                ...nextPlayState,
                money: { ...nextPlayState.money, pa: initialGold },
                equipment: [...adventurerEquipment, ...nextPlayState.equipment],
            },
        },
        choicesFound,
    };
};
