import React from 'react';
import type { Character } from '../../../../types/character';
import { AttributesPanel } from '../../AttributesPanel';
import type { RaceList } from '../../types';
import type { Stats } from '../../../../domain/rules';
import { WizardShellLayout } from '../WizardShellLayout';

interface Props {
    character: Partial<Character>;
    selectedProfileType: 'polyvalent' | 'expert' | 'specialist';
    setSelectedProfileType: React.Dispatch<React.SetStateAction<'polyvalent' | 'expert' | 'specialist'>>;
    profileValues: number[];
    stats: Stats;
    races: RaceList;
    racialBonusChoices: Record<string, string>;
    setRacialBonusChoices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    finalStats: Stats;
    updateStat: (stat: keyof Stats, value: string) => void;
    caracTestBonuses?: Partial<Record<keyof Stats, number>>;
    onBack: () => void;
    onNext: () => void;
}

/** Étape « Caractéristiques » : répartition des valeurs (série polyvalent/expert/spécialiste). */
export const StepAttributes: React.FC<Props> = ({ onBack, onNext, ...panelProps }) => (
    <WizardShellLayout onBack={onBack} onNext={onNext}>
        <AttributesPanel {...panelProps} />
    </WizardShellLayout>
);
