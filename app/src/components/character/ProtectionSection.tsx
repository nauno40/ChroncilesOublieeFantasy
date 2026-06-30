import React from 'react';
import type { Character } from '../../types/character';
import { getMaxArmorDef } from '../../utils/cofRules';
import type { ArmorList, ProfileList } from './types';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    allArmors: ArmorList;
    profiles: ProfileList;
}

export const ProtectionSection: React.FC<Props> = ({ character, setCharacter, allArmors, profiles }) => {
    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-5">
            <div className="flex justify-between items-center border-b border-primary-500/10 pb-3">
                <h3 className="text-stone-400 font-display font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-stone-500 rounded-full" />
                    Équipement & Inventaire
                </h3>
                <div className="flex items-center gap-2 bg-stone-900/50 px-3 py-1 rounded-full border border-yellow-500/20">
                    <span className="text-[10px] uppercase font-bold text-yellow-500/60 tracking-wider">Argent</span>
                    <span className="text-sm font-mono font-bold text-yellow-500">{character.data?.money?.pa || 0} pa</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Armure</label>
                    <select
                        className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-3 py-2 text-stone-300 outline-none focus:border-primary-500/50"
                        value={character.data?.protection?.armor?.name || ''}
                        onChange={e => {
                            const val = e.target.value;
                            const found = allArmors.find(a => a.name === val);
                            setCharacter(prev => ({
                                ...prev,
                                data: {
                                    ...prev.data!,
                                    protection: {
                                        ...prev.data!.protection!,
                                        armor: { name: val, def: found ? (parseInt(found.value) || 0) : 0 }
                                    }
                                }
                            }));
                        }}
                    >
                        <option value="">Aucune</option>
                        {allArmors.filter(a => {
                            if (a.type.includes('Bouclier')) return false;

                            const pId = (character.profile as any)?.['@id'] || (typeof character.profile === 'string' ? character.profile : '');
                            const profile = profiles.find(p => p['@id'] === pId || p.id === pId || p.name === pId || p['@id']?.includes(pId) || pId?.includes(p['@id'] || ''));
                            const profileName = profile?.name || '';
                            const maxDef = getMaxArmorDef(profileName);

                            const armorDef = a.defense || 0;
                            return armorDef <= maxDef;
                        }).map((a: any) => (
                            <option key={a.id} value={a.name}>{a.name} (+{a.value || a.defense || 0})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Bouclier</label>
                    <select
                        className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-3 py-2 text-stone-300 outline-none focus:border-primary-500/50"
                        value={character.data?.protection?.shield?.name || ''}
                        onChange={e => {
                            const val = e.target.value;
                            const found = allArmors.find(a => a.name === val);
                            setCharacter(prev => ({
                                ...prev,
                                data: {
                                    ...prev.data!,
                                    protection: {
                                        ...prev.data!.protection!,
                                        shield: { name: val, def: found ? (parseInt(found.value) || 0) : 0 }
                                    }
                                }
                            }));
                        }}
                    >
                        <option value="">Aucun</option>
                        {allArmors.filter(a => a.type.includes('Bouclier')).map((a: any) => (
                            <option key={a.id} value={a.name}>{a.name} (+{a.value})</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
