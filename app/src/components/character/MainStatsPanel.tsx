import React from 'react';
import type { Character } from '../../types/character';
import type { Stats } from '../../utils/cofRules';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    combatStats: { init: number; def: number };
    mods: Stats;
    /** Dé évolutif « d4° » courant, dérivé du niveau (d4→d6→d8→d10→d12). */
    evolutiveDie: string;
    /** Valeurs dérivées (non stockées) : PV max, PC max, PM max, dé de récupération. */
    maxHp: number;
    luckMax: number;
    manaMax: number;
    recoveryDie: string;
}

export const MainStatsPanel: React.FC<Props> = ({ character, setCharacter, combatStats, mods, evolutiveDie, maxHp, luckMax, manaMax, recoveryDie }) => {
    const luckCurrent = character.playState?.luck?.current ?? 0;
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel p-3 rounded-xl text-center border-stone-800 relative overflow-hidden bg-stone-900/10">
                <label className="text-[9px] uppercase font-black text-stone-500 tracking-[0.2em] block mb-1">Initiative</label>
                <div className="text-2xl font-display font-bold text-stone-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                    {combatStats.init}
                </div>
                <div className="text-[8px] text-stone-600 font-bold uppercase mt-1">10 + PER + Bonus</div>
            </div>
            <div className="glass-panel p-3 rounded-xl text-center border-primary-500/20 relative overflow-hidden group bg-stone-900/10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
                <label className="text-[9px] uppercase font-black text-primary-500/70 tracking-[0.2em] block mb-1">Défense</label>
                <div className="text-2xl font-display font-bold text-white outline-none drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    {combatStats.def}
                </div>
                <div className="text-[8px] text-stone-500 font-bold uppercase mt-1">10 + AGI + Armure</div>
            </div>
            <div className="glass-panel p-3 rounded-xl text-center border-green-900/40 bg-green-950/5 relative overflow-hidden transition-all hover:bg-green-950/10 col-span-2">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500/30" />
                <label className="text-[9px] uppercase font-black text-green-600 tracking-[0.2em] block mb-1">Points de Vie</label>
                <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl font-display font-bold text-green-400">{maxHp}</div>
                </div>
                <div className="text-[8px] text-green-900/60 font-bold uppercase mt-1">PV MAX (calculé)</div>
            </div>
            {/* Row 3: Luck & Mana */}
            <div className="glass-panel p-3 rounded-xl border-white/5 bg-stone-900/20 text-center">
                <label className="text-[9px] uppercase font-black text-amber-600/80 tracking-widest block mb-2">Chance</label>
                <div className="flex items-center justify-center gap-2">
                    <input
                        type="number"
                        className="w-10 bg-stone-950/50 border border-stone-800 rounded text-center text-lg font-bold text-amber-400 outline-none focus:border-amber-500/50 shadow-inner p-0.5"
                        value={luckCurrent}
                        onChange={e => setCharacter(prev => ({
                            ...prev,
                            playState: { ...prev.playState!, luck: { ...prev.playState!.luck, current: parseInt(e.target.value) || 0 } }
                        }))}
                    />
                    <span className="text-stone-700 font-black text-xs">/</span>
                    <span className="w-8 text-center text-sm text-stone-500 font-bold">{luckMax}</span>
                </div>
            </div>

            <div className="glass-panel p-3 rounded-xl text-center border-blue-900/40 bg-blue-950/5 relative overflow-hidden transition-all hover:bg-blue-950/10">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/30" />
                <label className="text-[9px] uppercase font-black text-blue-500 tracking-[0.2em] block mb-1">Mana</label>
                <div className="text-2xl font-display font-bold text-blue-400">
                    {manaMax}
                </div>
                <div className="text-[8px] text-blue-900/60 font-bold uppercase mt-1">PM MAX (calculé)</div>
            </div>

            {/* Row 4: Recovery + evolutive die (Full Width) */}
            <div className="glass-panel p-3 rounded-xl border-white/5 bg-stone-900/20 col-span-2 flex items-center justify-around px-6">
                <div className="flex flex-col items-center">
                    <div className="text-lg font-bold text-white font-display w-20 text-center">{recoveryDie}</div>
                    <div className="text-[8px] text-stone-600 text-center font-bold uppercase mt-1">Dé de récup.</div>
                </div>
                <div className="w-px self-stretch bg-white/5" />
                <div className="flex flex-col items-center">
                    <div className="text-lg font-bold text-white font-display w-20 text-center">{evolutiveDie}</div>
                    <div className="text-[8px] text-stone-600 text-center font-bold uppercase mt-1">Dé évolutif d4°</div>
                </div>
            </div>

            {/* Row 5: Attacks (Full Width) */}
            <div className="glass-panel p-3 rounded-xl col-span-2 border-white/5 bg-stone-900/20">
                <div className="grid grid-cols-2 gap-4 h-full divide-x divide-white/5">
                    <div className="text-center">
                        <label className="text-[9px] uppercase font-black text-stone-500 tracking-widest block mb-1">Atk. CàC</label>
                        <div className="text-xl font-display font-bold text-white text-shadow-sm transition-all hover:scale-110">
                            <span className="text-stone-600 text-xs mr-1">+</span>{mods.FOR + (character.level || 1)}
                        </div>
                    </div>
                    <div className="text-center pl-4">
                        <label className="text-[9px] uppercase font-black text-stone-500 tracking-widest block mb-1">Atk. Tir</label>
                        <div className="text-xl font-display font-bold text-white text-shadow-sm transition-all hover:scale-110">
                            <span className="text-stone-600 text-xs mr-1">+</span>{mods.AGI + (character.level || 1)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
