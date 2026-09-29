import React from 'react';
import type { Character } from '../../../../types/character';
import { ProtectionSection } from '../../ProtectionSection';
import { ArmorImpactPanel } from '../../ArmorImpactPanel';
import { WizardEquipmentSummary } from './WizardEquipmentSummary';
import { malusEncombrement } from '../../../../domain/rules';
import type { ArmorList, ProfileList } from '../../types';
import type { ProfileArmorImpact, Stats } from '../../../../domain/rules';
import { WizardShellLayout } from '../WizardShellLayout';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    allArmors: ArmorList;
    profiles: ProfileList;
    armorCap: number;
    armorImpacts: ProfileArmorImpact[];
    finalStats: Stats;
    onBack: () => void;
    onNext: () => void;
}

/**
 * Étape « Équipement », assistant : protection (vraie décision, menus déroulants déjà
 * compacts) + ses conséquences, puis un résumé en lecture seule de ce que la cascade de
 * départ a déjà posé (armes, sac d'aventurier, maîtrises) — pas de tableau d'armes éditable
 * ni de zone de texte libre ici (`WeaponsSection`/`InventorySection`, fiche classique) :
 * l'édition fine reste possible après coup sur la fiche.
 */
export const StepEquipment: React.FC<Props> = ({
    character, setCharacter, allArmors, profiles, armorCap, armorImpacts, finalStats, onBack, onNext,
}) => (
    <WizardShellLayout onBack={onBack} onNext={onNext}>
        <ProtectionSection character={character} setCharacter={setCharacter} allArmors={allArmors} armorCap={armorCap} />
        <ArmorImpactPanel
            impacts={armorImpacts}
            armorName={character.playState?.protection?.armor?.name || undefined}
            malusEncombrement={malusEncombrement(character.playState?.protection)}
            agiPlafonnee={(() => {
                // N'annoncer le plafond que s'il bride RÉELLEMENT le personnage (même règle
                // que la fiche classique, cf. CharacterSheet.tsx).
                const plafond = character.playState?.protection?.armor?.agiMax;
                const agi = finalStats.AGI;
                return plafond != null && agi > plafond ? { agi, plafond } : undefined;
            })()}
        />
        <WizardEquipmentSummary character={character} profiles={profiles} />
    </WizardShellLayout>
);
