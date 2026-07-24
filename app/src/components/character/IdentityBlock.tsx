import React from 'react';
import type { Character } from '../../types/character';
import { ADVENTURER_PACK } from '../../hooks/useCharacterSheet';
import { findProfile } from '../../domain/rules';
import type { EquipmentLikeItem } from '../../types/compendiumRefs';
import type { RaceList, ProfileList, AddEquipmentItem, EquipmentChoiceQueueSetter } from './types';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    races: RaceList;
    profiles: ProfileList;
    addEquipmentItem: AddEquipmentItem;
    setEquipmentChoiceQueue: EquipmentChoiceQueueSetter;
    setCurrentChoiceIndex: React.Dispatch<React.SetStateAction<number>>;
    setShowEquipmentModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const IdentityBlock: React.FC<Props> = ({
    character,
    setCharacter,
    races,
    profiles,
    addEquipmentItem,
    setEquipmentChoiceQueue,
    setCurrentChoiceIndex,
    setShowEquipmentModal,
}) => {
    return (
        <div className="glass-panel p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 border border-white/10">
            <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-stone-500 tracking-wider ml-1">Nom du Personnage</label>
                <input
                    type="text"
                    className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-3 text-2xl font-display font-bold text-white outline-none focus:border-primary-500/50 focus:bg-stone-900/50 transition-all placeholder:text-stone-700"
                    value={character.name || ''}
                    onChange={e => setCharacter({ ...character, name: e.target.value })}
                    placeholder="Nom du héros"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-stone-500 tracking-wider ml-1">Niveau</label>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-3 text-xl font-mono font-bold text-primary-400 outline-none focus:border-primary-500/50 transition-all text-center"
                            value={character.level || 1}
                            onChange={e => setCharacter({ ...character, level: parseInt(e.target.value) })}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-600 font-bold text-xs uppercase">
                            NIV
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-stone-500 tracking-wider ml-1">Race</label>
                <select
                    className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-3 text-lg font-bold text-stone-200 outline-none focus:border-primary-500/50 focus:bg-stone-900/50 transition-all cursor-pointer appearance-none"
                    value={(character.race as { '@id'?: string })?.['@id'] || (typeof character.race === 'string' ? character.race : '')}
                    onChange={e => {
                        // Find race object
                        const selectedId = e.target.value; // IRI
                        setCharacter(prev => ({
                            ...prev,
                            race: selectedId,
                            // Racial Voie logic is now handled by effect
                        }));
                    }}
                >
                    <option value="">Choisir une race...</option>
                    {races.map(r => (
                        <option key={r['@id']} value={r['@id']}>{r.name || r.nom}</option>
                    ))}
                </select>
            </div>



            <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-stone-500 tracking-wider ml-1">Profil (Classe)</label>
                <select
                    className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-3 text-lg font-bold text-stone-200 outline-none focus:border-primary-500/50 focus:bg-stone-900/50 transition-all cursor-pointer appearance-none"
                    value={(character.profile as { '@id'?: string })?.['@id'] || (typeof character.profile === 'string' ? character.profile : '')}
                    onChange={e => {
                        const selectedId = e.target.value; // IRI

                        // Parse Starting Equipment
                        const p = findProfile(selectedId, profiles);

                        // Réinitialise armes / protection / inventaire au changement de profil.
                        const nextPlayState = {
                            ...character.playState!,
                            weapons: [],
                            protection: { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } },
                            equipment: []
                        };

                        const choicesFound: EquipmentLikeItem[][] = [];

                        if (p && p.startingEquipment) {
                            p.startingEquipment.forEach(eq => {
                                if (typeof eq === 'string') return;
                                // Direct Item
                                if (eq.item) {
                                    addEquipmentItem(eq, nextPlayState);
                                }
                                // Choice
                                else if (eq.choice) {
                                    choicesFound.push(eq.choice);
                                }
                            });
                        }

                        // If we found choices, start the queue
                        if (choicesFound.length > 0) {
                            setEquipmentChoiceQueue(choicesFound);
                            setCurrentChoiceIndex(0);
                            setShowEquipmentModal(true);
                        } else {
                            setShowEquipmentModal(false);
                            setEquipmentChoiceQueue([]);
                        }

                        // Add Sac d'Aventurier
                        const adventurerEquipment = [...ADVENTURER_PACK];

                        // Bourse de 2d6 pa
                        const roll2d6 = () => (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1);
                        const initialGold = roll2d6();

                        setCharacter(prev => ({
                            ...prev,
                            profile: selectedId,
                            playState: {
                                ...nextPlayState,
                                money: { ...nextPlayState.money, pa: initialGold },
                                equipment: [...adventurerEquipment, ...nextPlayState.equipment]
                            }
                        }));
                    }}
                >
                    <option value="">Choisir un profil...</option>
                    {profiles.map(p => (
                        <option key={p['@id']} value={p['@id']}>{p.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};
