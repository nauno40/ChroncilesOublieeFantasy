import React from 'react';
import type { Character } from '../../types/character';
import type { WeaponList } from './types';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    allWeapons: WeaponList;
}

export const WeaponsSection: React.FC<Props> = ({ character, setCharacter, allWeapons }) => {
    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-5">
            <h3 className="text-primary-400 font-display font-bold uppercase text-xs tracking-[0.2em] border-b border-primary-500/10 pb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                Armes & Attaques
            </h3>

            <div className="space-y-3">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 text-[9px] uppercase font-black text-stone-500 px-3 tracking-widest">
                    <div className="col-span-4">Arme / Instrument</div>
                    <div className="col-span-2 text-center">Mod.</div>
                    <div className="col-span-2 text-center">Dégâts</div>
                    <div className="col-span-4 pl-2">Propriétés</div>
                </div>

                {/* Rows */}
                {(character.playState?.weapons || []).concat([{ name: '', atkMod: 0, dmg: '', special: '' }, { name: '', atkMod: 0, dmg: '', special: '' }]).slice(0, 4).map((weapon, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-stone-950/40 p-3 rounded-xl border border-white/5 hover:border-primary-500/20 hover:bg-stone-900/40 transition-all group">
                        <div className="col-span-4 relative">
                            <input // Keep input for manual entry or search
                                list={`weapons-list-${idx}`}
                                type="text"
                                className="w-full bg-stone-900/50 border border-stone-800 rounded px-2 py-1 text-sm font-bold text-white outline-none focus:border-primary-500/50 placeholder:text-stone-700"
                                placeholder="Nom de l'arme..."
                                value={weapon.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const newWeapons = [...(character.playState?.weapons || [])];
                                    if (!newWeapons[idx]) newWeapons[idx] = { name: '', atkMod: 0, dmg: '', special: '' };
                                    newWeapons[idx].name = val;

                                    // Auto-fill if match found
                                    const found = allWeapons.find(w => w.name === val);
                                    if (found) {
                                        newWeapons[idx].dmg = found.damage;
                                        newWeapons[idx].special = `${found.range ? `Portée ${found.range}, ` : ''}${found.critical ? `Crit ${found.critical}` : ''}`;
                                    }

                                    setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, weapons: newWeapons } }));
                                }}
                            />
                            <datalist id={`weapons-list-${idx}`}>
                                {allWeapons.map((w: any) => (
                                    <option key={w.id} value={w.name}>{w.type} - {w.damage}</option>
                                ))}
                            </datalist>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                            <div className="flex items-center bg-stone-900 border border-stone-800 rounded px-2 py-1 shadow-inner">
                                <span className="text-stone-600 font-bold text-xs mr-1">+</span>
                                <input
                                    type="number"
                                    className="w-8 bg-transparent text-center font-mono font-bold text-primary-400 outline-none"
                                    value={weapon.atkMod || 0}
                                    onChange={(e) => {
                                        const newWeapons = [...(character.playState?.weapons || [])];
                                        if (!newWeapons[idx]) newWeapons[idx] = { name: '', atkMod: 0, dmg: '', special: '' };
                                        newWeapons[idx].atkMod = parseInt(e.target.value);
                                        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, weapons: newWeapons } }));
                                    }}
                                />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <input
                                type="text"
                                className="w-full bg-transparent text-center border-none outline-none text-stone-300 font-mono placeholder:text-stone-800"
                                placeholder="1d8"
                                value={weapon.dmg}
                                onChange={(e) => {
                                    const newWeapons = [...(character.playState?.weapons || [])];
                                    if (!newWeapons[idx]) newWeapons[idx] = { name: '', atkMod: 0, dmg: '', special: '' };
                                    newWeapons[idx].dmg = e.target.value;
                                    setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, weapons: newWeapons } }));
                                }}
                            />
                        </div>
                        <div className="col-span-4">
                            <input
                                type="text"
                                className="w-full bg-transparent border-none outline-none text-[11px] text-stone-500 italic placeholder:text-stone-800"
                                placeholder="Critique, portée..."
                                value={weapon.special}
                                onChange={(e) => {
                                    const newWeapons = [...(character.playState?.weapons || [])];
                                    if (!newWeapons[idx]) newWeapons[idx] = { name: '', atkMod: 0, dmg: '', special: '' };
                                    newWeapons[idx].special = e.target.value;
                                    setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, weapons: newWeapons } }));
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
