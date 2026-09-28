import React from 'react';
import type { Character } from '../../../../types/character';
import { VoiesTree } from '../../VoiesTree';
import { ChoicesPanel } from '../../ChoicesPanel';
import { RacialGrantPanel } from '../../RacialGrantPanel';
import type {
    RaceList, ProfileList, AllVoieList, VoieList,
    GetCapabilityName, GetVoieName, GetResolvedDice, SelectedVoiesSetter, IsMageFamily, RacialVoieOptions,
} from '../../types';
import type { RacialGrant } from '../../../../domain/rules';
import { WizardShellLayout } from '../WizardShellLayout';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    races: RaceList;
    profiles: ProfileList;
    allVoies: AllVoieList;
    prestigePaths: VoieList;
    voieOptionsByProfile: { profile: string; voies: { iri: string; name: string }[] }[];
    spentPoints: number;
    maxStartingPoints: number;
    isMageFamily: IsMageFamily;
    mageReplacedRaceVoie: boolean;
    setMageReplacedRaceVoie: React.Dispatch<React.SetStateAction<boolean>>;
    racialVoieOptions: RacialVoieOptions;
    selectedVoies: string[];
    setSelectedVoies: SelectedVoiesSetter;
    getCapabilityName: GetCapabilityName;
    getVoieName: GetVoieName;
    getResolvedDice: GetResolvedDice;
    racialGrant: RacialGrant | null | undefined;
    onBack: () => void;
    onNext: () => void;
}

/** Étape « Voies » : arbre de voies (peuple/profil/prestige) + choix liés + octroi racial, tels quels. */
export const StepVoies: React.FC<Props> = ({
    character, setCharacter, races, profiles, allVoies, prestigePaths, voieOptionsByProfile,
    spentPoints, maxStartingPoints, isMageFamily, mageReplacedRaceVoie, setMageReplacedRaceVoie,
    racialVoieOptions, selectedVoies, setSelectedVoies, getCapabilityName, getVoieName, getResolvedDice,
    racialGrant, onBack, onNext,
}) => (
    <WizardShellLayout onBack={onBack} onNext={onNext}>
        <VoiesTree
            character={character}
            setCharacter={setCharacter}
            spentPoints={spentPoints}
            maxStartingPoints={maxStartingPoints}
            isMageFamily={isMageFamily}
            mageReplacedRaceVoie={mageReplacedRaceVoie}
            setMageReplacedRaceVoie={setMageReplacedRaceVoie}
            racialVoieOptions={racialVoieOptions}
            selectedVoies={selectedVoies}
            setSelectedVoies={setSelectedVoies}
            getCapabilityName={getCapabilityName}
            getVoieName={getVoieName}
            getResolvedDice={getResolvedDice}
            prestigePaths={prestigePaths}
            voieOptionsByProfile={voieOptionsByProfile}
        />
        <ChoicesPanel character={character} setCharacter={setCharacter} races={races} profiles={profiles} allVoies={allVoies} />
        {racialGrant && <RacialGrantPanel character={character} setCharacter={setCharacter} profiles={profiles} grant={racialGrant} />}
    </WizardShellLayout>
);
