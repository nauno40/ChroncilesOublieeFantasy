import React from 'react';
import type { Character } from '../../types/character';
import type { ArmorList } from './types';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    allArmors: ArmorList;
    armorCap: number;
}

export const ProtectionSection: React.FC<Props> = ({ character, setCharacter, allArmors, armorCap }) => {
    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-5">
            <div className="flex justify-between items-center border-b border-primary-500/10 pb-3">
                <h3 className="text-stone-400 font-display font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-stone-500 rounded-full" />
                    Équipement & Inventaire
                </h3>
                <div className="flex items-center gap-1.5 bg-stone-900/50 px-3 py-1 rounded-full border border-yellow-500/20 focus-within:border-yellow-500/50 transition-colors">
                    <span className="text-[11px] uppercase font-bold text-yellow-500/60 tracking-wider">Argent</span>
                    <input
                        type="number"
                        min="0"
                        className="w-14 bg-transparent text-right text-sm font-mono font-bold text-yellow-500 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        aria-label="Pièces d’or" value={character.playState?.money?.po ?? 0}
                        onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, money: { ...prev.playState!.money, po: val } } }));
                        }}
                    />
                    <span className="text-[11px] font-bold text-yellow-500/60">po</span>
                    <input
                        type="number"
                        min="0"
                        className="w-16 bg-transparent text-right text-sm font-mono font-bold text-yellow-500 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        aria-label="Pièces d’argent" value={character.playState?.money?.pa ?? 0}
                        onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setCharacter(prev => ({
                                ...prev,
                                playState: { ...prev.playState!, money: { ...prev.playState!.money, pa: val } }
                            }));
                        }}
                    />
                    <span className="text-[11px] font-bold text-yellow-500/60">pa</span>
                    <input
                        type="number"
                        min="0"
                        className="w-14 bg-transparent text-right text-sm font-mono font-bold text-yellow-500 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        aria-label="Pièces de cuivre" value={character.playState?.money?.pc ?? 0}
                        onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, money: { ...prev.playState!.money, pc: val } } }));
                        }}
                    />
                    <span className="text-[11px] font-bold text-yellow-500/60">pc</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[11px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Armure</label>
                    <select
                        className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-3 py-2 text-stone-300 outline-none focus:border-primary-500/50"
                        aria-label="Armure portée" value={character.playState?.protection?.armor?.name || ''}
                        onChange={e => {
                            const val = e.target.value;
                            const found = allArmors.find(a => a.name === val);
                            setCharacter(prev => ({
                                ...prev,
                                playState: {
                                    ...prev.playState!,
                                    protection: {
                                        ...prev.playState!.protection,
                                        armor: { name: val, def: found ? (parseInt(found.value) || 0) : 0, agiMax: found?.acMaxAgi ?? null }
                                    }
                                }
                            }));
                        }}
                    >
                        <option value="">Aucune</option>
                        {/* Rien n'interdit de PORTER une armure plus lourde que ne l'autorise le
                            profil : COF2 (chap. 9) bride l'usage des capacités, pas l'habillage.
                            Les armures hors limite restent donc proposées, signalées — le panneau
                            « Sous l'armure » énonce ce qu'elles coûtent. */}
                        {allArmors.filter(a => !a.type.includes('Bouclier')).map(a => {
                            const armorDef = a.defense || 0;
                            return (
                                <option key={a.id} value={a.name}>
                                    {a.name} (+{a.value || armorDef}){armorDef > armorCap ? ' — hors limite du profil' : ''}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div>
                    <label className="text-[11px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Bouclier</label>
                    <select
                        className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-3 py-2 text-stone-300 outline-none focus:border-primary-500/50"
                        aria-label="Bouclier" value={character.playState?.protection?.shield?.name || ''}
                        onChange={e => {
                            const val = e.target.value;
                            const found = allArmors.find(a => a.name === val);
                            setCharacter(prev => ({
                                ...prev,
                                playState: {
                                    ...prev.playState!,
                                    protection: {
                                        ...prev.playState!.protection,
                                        shield: { name: val, def: found ? (parseInt(found.value) || 0) : 0 }
                                    }
                                }
                            }));
                        }}
                    >
                        <option value="">Aucun</option>
                        {allArmors.filter(a => a.type.includes('Bouclier')).map(a => (
                            <option key={a.id} value={a.name}>{a.name} (+{a.value})</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
