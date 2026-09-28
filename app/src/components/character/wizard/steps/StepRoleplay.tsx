import React from 'react';
import type { Character } from '../../../../types/character';
import { PhysicalBlock } from '../../PhysicalBlock';
import { RoleplaySection } from '../../RoleplaySection';
import { LanguagesTalentsPanel } from '../../LanguagesTalentsPanel';
import type { RaceList } from '../../types';
import { WizardShellLayout } from '../WizardShellLayout';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    races: RaceList;
    intMod: number;
    onBack: () => void;
    onNext: () => void;
    nextLabel?: string;
}

/** Étape « Rôleplay & Langues » : physique, idéal/travers/secret, langues et talents. */
export const StepRoleplay: React.FC<Props> = ({ character, setCharacter, races, intMod, onBack, onNext, nextLabel }) => (
    <WizardShellLayout onBack={onBack} onNext={onNext} nextLabel={nextLabel}>
        <PhysicalBlock character={character} setCharacter={setCharacter} races={races} />
        <RoleplaySection character={character} setCharacter={setCharacter} />
        <LanguagesTalentsPanel character={character} setCharacter={setCharacter} intMod={intMod} races={races} />
    </WizardShellLayout>
);
