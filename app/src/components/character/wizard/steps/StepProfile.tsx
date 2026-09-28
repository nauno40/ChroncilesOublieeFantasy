import React from 'react';
import type { Character } from '../../../../types/character';
import type { ProfileList, AddEquipmentItem, EquipmentChoiceQueueSetter } from '../../types';
import { applyProfileSelection } from '../../../../domain/characterCreation';
import { onImageError } from '../../../common/imagePlaceholder';
import { WizardShellLayout } from '../WizardShellLayout';

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

    return (
        <WizardShellLayout
            onBack={onBack}
            onNext={onNext}
            nextDisabled={!selectedIri}
            aside={
                <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                    {selected ? (
                        <>
                            <img
                                src={selected.imageUrl}
                                onError={onImageError(selected.name || '', 'portrait')}
                                alt={selected.name}
                                className="w-full aspect-[3/4] object-cover"
                            />
                            <div className="p-5 space-y-3">
                                <h2 className="font-display font-bold text-2xl text-white">{selected.name}</h2>
                                {selected.description && (
                                    <p className="text-stone-300 text-sm font-body leading-relaxed">{selected.description}</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-stone-400 text-sm">
                            Choisissez un profil dans la liste pour découvrir sa description.
                        </div>
                    )}
                </div>
            }
        >
            <div className="glass-panel p-5 rounded-xl border border-white/10">
                <h2 className="font-display font-bold text-primary-400 uppercase text-sm tracking-wider mb-4">Choisissez votre profil</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {list.map(p => {
                        const isSelected = p['@id'] === selectedIri;
                        return (
                            <button
                                key={p['@id']}
                                type="button"
                                onClick={() => pick(p['@id'] || '')}
                                className={`text-left rounded-xl overflow-hidden border transition-all ${isSelected ? 'border-primary-500 ring-2 ring-primary-500/40' : 'border-white/10 hover:border-primary-500/40'}`}
                            >
                                <img
                                    src={p.imageUrl}
                                    onError={onImageError(p.name || '', 'card')}
                                    alt={p.name}
                                    className="w-full aspect-[4/3] object-cover"
                                />
                                <div className="px-3 py-2 bg-stone-900/60">
                                    <span className="font-display font-bold text-sm text-stone-100">{p.name}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </WizardShellLayout>
    );
};
