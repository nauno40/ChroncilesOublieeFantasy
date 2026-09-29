import React from 'react';
import type { Character } from '../../../../types/character';
import type { ProfileList, AddEquipmentItem, EquipmentChoiceQueueSetter } from '../../types';
import { applyProfileSelection } from '../../../../domain/characterCreation';
import { onImageError } from '../../../common/imagePlaceholder';
import { WizardShellLayout } from '../WizardShellLayout';
import { WizardAvatarStrip } from '../WizardAvatarStrip';

interface ProfileWithArt {
    '@id'?: string;
    name?: string;
    description?: string;
    imageUrl?: string;
}

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    profiles: ProfileList;
    addEquipmentItem: AddEquipmentItem;
    setEquipmentChoiceQueue: EquipmentChoiceQueueSetter;
    setCurrentChoiceIndex: React.Dispatch<React.SetStateAction<number>>;
    setShowEquipmentModal: React.Dispatch<React.SetStateAction<boolean>>;
    onBack: () => void;
    onNext: () => void;
}

const profileIri = (p: Character['profile']): string => (typeof p === 'string' ? p : (p as { '@id'?: string })?.['@id'] || '');

/**
 * Étape « Profil » : choisir sa classe déclenche immédiatement la cascade d'équipement de
 * départ (via `applyProfileSelection`, partagée avec `IdentityBlock.tsx`) — y compris
 * l'ouverture de la modale de choix d'équipement si le profil en propose. On ne diffère pas
 * cette cascade à une étape « Équipement » séparée : ce serait un comportement différent de
 * la fiche classique, pour un gain incertain.
 */
export const StepProfile: React.FC<Props> = ({
    character, setCharacter, profiles, addEquipmentItem,
    setEquipmentChoiceQueue, setCurrentChoiceIndex, setShowEquipmentModal,
    onBack, onNext,
}) => {
    const list = profiles as unknown as ProfileWithArt[];
    const selectedIri = profileIri(character.profile);
    const selected = list.find(p => p['@id'] === selectedIri);

    const pick = (iri: string) => {
        const { characterPatch, choicesFound } = applyProfileSelection(iri, character, profiles, addEquipmentItem);
        if (choicesFound.length > 0) {
            setEquipmentChoiceQueue(choicesFound);
            setCurrentChoiceIndex(0);
            setShowEquipmentModal(true);
        } else {
            setShowEquipmentModal(false);
            setEquipmentChoiceQueue([]);
        }
        setCharacter(prev => ({ ...prev, ...characterPatch }));
    };

    const items = list.map(p => ({ iri: p['@id'] || '', name: p.name || '', image: p.imageUrl || '' }));

    return (
        <WizardShellLayout onBack={onBack} onNext={onNext} nextDisabled={!selectedIri}>
            <h2 className="font-display text-2xl text-stone-200 text-center">Choisissez votre profil</h2>
            <WizardAvatarStrip items={items} selectedIri={selectedIri} onSelect={pick} />

            {selected ? (
                <div className="space-y-4 text-center">
                    <img
                        src={selected.imageUrl}
                        onError={onImageError(selected.name || '', 'portrait')}
                        alt={selected.name}
                        className="portrait-feather w-full max-w-sm mx-auto aspect-[3/4] object-cover"
                    />
                    <h2 className="font-display text-2xl text-stone-200">{selected.name}</h2>
                    {selected.description && (
                        <p className="text-stone-400 text-sm font-body leading-relaxed max-w-md mx-auto">{selected.description}</p>
                    )}
                </div>
            ) : (
                <p className="text-center text-stone-500 text-sm italic py-8">
                    Choisissez un profil ci-dessus pour découvrir sa description.
                </p>
            )}
        </WizardShellLayout>
    );
};
