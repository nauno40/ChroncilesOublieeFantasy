import React from 'react';
import type { Character } from '../../../../types/character';
import { ProtectionSection } from '../../ProtectionSection';
import { ArmorImpactPanel } from '../../ArmorImpactPanel';
import { WeaponsSection } from '../../WeaponsSection';
import { MasteriesBlock } from '../../MasteriesBlock';
import { InventorySection } from '../../InventorySection';
import { malusEncombrement } from '../../../../domain/rules';
import type { ArmorList, WeaponList, ProfileList } from '../../types';
import type { ProfileArmorImpact, Stats } from '../../../../domain/rules';
import { WizardShellLayout } from '../WizardShellLayout';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    allArmors: ArmorList;
    allWeapons: WeaponList;
    profiles: ProfileList;
    armorCap: number;
    armorImpacts: ProfileArmorImpact[];
    finalStats: Stats;
    onBack: () => void;
    onNext: () => void;
}

/** Étape « Équipement » : protection, armes, maîtrises (lecture) et inventaire de départ. */
export const StepEquipment: React.FC<Props> = ({
    character, setCharacter, allArmors, allWeapons, profiles, armorCap, armorImpacts, finalStats, onBack, onNext,
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
        <WeaponsSection character={character} setCharacter={setCharacter} allWeapons={allWeapons} />
        <MasteriesBlock character={character} profiles={profiles} />
        <InventorySection character={character} setCharacter={setCharacter} />
    </WizardShellLayout>
);
