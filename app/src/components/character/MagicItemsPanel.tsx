import React from 'react';
import type { Character, MagicItem, ItemBonusTarget } from '../../types/character';

const TARGET_LABELS: Record<ItemBonusTarget, string> = {
    def: 'DEF', init: 'Init', pv: 'PV', rd: 'RD', attaque: 'Attaque', dm: 'DM',
};
const TARGETS: ItemBonusTarget[] = ['def', 'init', 'pv', 'rd', 'attaque', 'dm'];

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * Objets magiques / ad hoc porteurs d'un bonus mécanique. Les objets « équipés »
 * alimentent la dérivation (DEF/Init/PV/RD/attaque, DM en note). Piloté joueur.
 */
export const MagicItemsPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const items = character.playState?.magicItems ?? [];

    const write = (next: MagicItem[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, magicItems: next } }));
    const update = (idx: number, patch: Partial<MagicItem>) =>
        write(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    const add = () => write([...items, { name: '', target: 'def', value: 1, equipped: true }]);
    const remove = (idx: number) => write(items.filter((_, i) => i !== idx));

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Objets magiques</h3>
                <button onClick={add} className="text-stone-500 hover:text-primary-400 text-sm" title="Ajouter un objet">+</button>
            </div>
            {items.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucun objet à bonus.</p>}
            {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs">
                    <input
                        type="checkbox"
                        checked={it.equipped}
                        onChange={e => update(idx, { equipped: e.target.checked })}
                        title="Équipé"
                        className="accent-primary-500"
                    />
                    <input
                        type="text"
                        className="flex-1 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-200 outline-none focus:border-primary-500/40"
                        placeholder="Nom de l'objet"
                        value={it.name}
                        onChange={e => update(idx, { name: e.target.value })}
                    />
                    <select
                        className="bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-stone-200 outline-none"
                        value={it.target}
                        onChange={e => update(idx, { target: e.target.value as ItemBonusTarget })}
                    >
                        {TARGETS.map(t => <option key={t} value={t}>{TARGET_LABELS[t]}</option>)}
                    </select>
                    <input
                        type="number"
                        className="w-12 bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-center text-stone-200 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        value={it.value}
                        onChange={e => update(idx, { value: parseInt(e.target.value) || 0 })}
                    />
                    <button onClick={() => remove(idx)} className="text-stone-600 hover:text-red-400" title="Retirer">✕</button>
                </div>
            ))}
        </div>
    );
};
