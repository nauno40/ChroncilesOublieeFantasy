import React from 'react';
import type { Character, Usage, UsagePeriod } from '../../types/character';
import { resetUsages } from '../../domain/rules';

const PERIOD_LABELS: Record<UsagePeriod, string> = {
    jour: 'Jour', combat: 'Combat', round: 'Round', autre: 'Autre',
};
const PERIODS: UsagePeriod[] = ['jour', 'combat', 'round', 'autre'];

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * Suivi des capacités à usage limité (X/jour, /combat, /round) — aide de table.
 * Piloté joueur ; aucun effet sur les valeurs dérivées. Les boutons de reset ne touchent
 * que les usages (pas PV/PM/DR).
 */
export const UsagesPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const usages = character.playState?.usages ?? [];

    const write = (next: Usage[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, usages: next } }));
    const update = (idx: number, patch: Partial<Usage>) =>
        write(usages.map((u, i) => (i === idx ? { ...u, ...patch } : u)));
    const add = () => write([...usages, { name: '', max: 1, used: 0, per: 'jour' }]);
    const remove = (idx: number) => write(usages.filter((_, i) => i !== idx));
    const setUsed = (idx: number, u: Usage, delta: number) =>
        update(idx, { used: Math.max(0, Math.min(u.max, u.used + delta)) });
    const reset = (periods: UsagePeriod[]) => write(resetUsages(usages, periods));

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Usages limités</h3>
                <button onClick={add} className="text-stone-500 hover:text-primary-400 text-sm" title="Ajouter un usage">+</button>
            </div>
            {usages.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucune capacité à usage limité suivie.</p>}
            {usages.map((u, idx) => {
                const spent = u.used >= u.max;
                return (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                        <input
                            type="text"
                            className="flex-1 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-200 outline-none focus:border-primary-500/40"
                            placeholder="Nom de la capacité"
                            value={u.name}
                            onChange={e => update(idx, { name: e.target.value })}
                        />
                        <select
                            className="bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-stone-200 outline-none"
                            value={u.per}
                            onChange={e => update(idx, { per: e.target.value as UsagePeriod })}
                        >
                            {PERIODS.map(p => <option key={p} value={p}>{PERIOD_LABELS[p]}</option>)}
                        </select>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setUsed(idx, u, -1)} className="text-stone-500 hover:text-green-400 w-5 text-center" title="−1 utilisé">−</button>
                            <span className={`font-mono font-bold ${spent ? 'text-red-400' : 'text-stone-300'}`}>{u.used}/</span>
                            <input
                                type="number"
                                className="w-9 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                value={u.max}
                                onChange={e => {
                                    const max = Math.max(0, parseInt(e.target.value) || 0);
                                    update(idx, { max, used: Math.min(u.used, max) }); // re-borne `used` si le max baisse
                                }}
                            />
                            <button onClick={() => setUsed(idx, u, 1)} className="text-stone-500 hover:text-red-400 w-5 text-center" title="+1 utilisé">+</button>
                        </div>
                        <button onClick={() => remove(idx)} className="text-stone-600 hover:text-red-400" title="Retirer">✕</button>
                    </div>
                );
            })}
            {usages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <button onClick={() => reset(['jour', 'combat', 'round'])} className="text-[9px] uppercase font-bold px-2 py-1 rounded border border-stone-700 text-stone-400 hover:border-primary-500/50 hover:text-primary-300 transition-all">Repos long</button>
                    <button onClick={() => reset(['combat', 'round'])} className="text-[9px] uppercase font-bold px-2 py-1 rounded border border-stone-700 text-stone-400 hover:border-primary-500/50 hover:text-primary-300 transition-all">Fin de combat</button>
                    <button onClick={() => reset(['round'])} className="text-[9px] uppercase font-bold px-2 py-1 rounded border border-stone-700 text-stone-400 hover:border-primary-500/50 hover:text-primary-300 transition-all">Nouveau round</button>
                </div>
            )}
        </div>
    );
};
