import React from 'react';
import type { Character, ActiveState, ItemBonusTarget } from '../../types/character';
import { activateState } from '../../utils/cofRules';

const TARGET_LABELS: Record<ItemBonusTarget, string> = {
    def: 'DEF', init: 'Init', pv: 'PV', rd: 'RD', attaque: 'Attaque', dm: 'DM',
};
const TARGETS: ItemBonusTarget[] = ['def', 'init', 'pv', 'rd', 'attaque', 'dm'];

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * États activables (buffs/postures, COF2 §7 #3). Un état actif compose son bonus dans la
 * dérivation (comme un objet équipé). Exclusion : une seule active par `group`. Piloté joueur.
 */
export const ActiveStatesPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const states = character.playState?.activeStates ?? [];

    const write = (next: ActiveState[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, activeStates: next } }));
    const update = (idx: number, patch: Partial<ActiveState>) =>
        write(states.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    const toggle = (idx: number, s: ActiveState) => write(activateState(states, idx, !s.active));
    const add = () => write([...states, { name: '', active: false, target: 'def', value: 1 }]);
    const remove = (idx: number) => write(states.filter((_, i) => i !== idx));

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">États activables</h3>
                <button onClick={add} className="text-stone-500 hover:text-primary-400 text-sm" title="Ajouter un état">+</button>
            </div>
            {states.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucun état.</p>}
            {states.map((s, idx) => (
                <div key={idx} className={`flex flex-wrap items-center gap-1.5 text-xs rounded-lg border p-1.5 ${s.active ? 'border-primary-500/40 bg-primary-900/10' : 'border-white/5'}`}>
                    <button
                        onClick={() => toggle(idx, s)}
                        title={s.active ? 'Actif' : 'Inactif'}
                        className={`text-[9px] uppercase font-black px-2 py-1 rounded border transition-all ${s.active ? 'bg-primary-500/20 border-primary-500 text-primary-200' : 'bg-stone-950 border-stone-700 text-stone-500 hover:text-white'}`}
                    >{s.active ? 'Actif' : 'Off'}</button>
                    <input type="text" className="flex-1 min-w-[80px] bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-200 outline-none focus:border-primary-500/40"
                        placeholder="Nom (ex. Rage)" value={s.name} onChange={e => update(idx, { name: e.target.value })} />
                    <input type="text" className="w-20 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-400 outline-none focus:border-primary-500/40"
                        placeholder="Groupe" value={s.group || ''} onChange={e => update(idx, { group: e.target.value || undefined })} />
                    <select className="bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-stone-200 outline-none"
                        value={s.target} onChange={e => update(idx, { target: e.target.value as ItemBonusTarget })}>
                        {TARGETS.map(t => <option key={t} value={t}>{TARGET_LABELS[t]}</option>)}
                    </select>
                    <input type="number" className="w-12 bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-center text-stone-200 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        value={s.value} onChange={e => update(idx, { value: parseInt(e.target.value) || 0 })} />
                    <button onClick={() => remove(idx)} className="text-stone-600 hover:text-red-400" title="Retirer">✕</button>
                </div>
            ))}
        </div>
    );
};
