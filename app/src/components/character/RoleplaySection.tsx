import React from 'react';
import { Dices } from 'lucide-react';
import type { Character } from '../../types/character';
import { IDEAUX_HEROIQUES, TRAVERS, SECRETS_INTIMES, rollFrom } from '../../domain/roleplayTables';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

// Bouton de tirage aléatoire (d20/d40) qui remplit un champ de roleplay.
const RollButton: React.FC<{ table: string[]; onRoll: (v: string) => void; title: string }> = ({ table, onRoll, title }) => (
    <button
        type="button"
        onClick={() => onRoll(rollFrom(table))}
        title={title}
        className="flex items-center gap-1 text-[10px] uppercase font-bold text-stone-500 hover:text-primary-400 border border-white/10 hover:border-primary-500/30 rounded px-2 py-1 transition-all active:scale-95"
    >
        <Dices size={12} /> Tirer
    </button>
);

export const RoleplaySection: React.FC<Props> = ({ character, setCharacter }) => {
    const setRp = (field: 'ideal' | 'flaw' | 'secret', value: string) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, rp: { ...prev.playState!.rp, [field]: value } } }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
                <div className="flex items-center justify-between ml-1">
                    <label className="text-xs uppercase font-black text-primary-500/60 tracking-[0.2em]">Idéal Héroïque</label>
                    <RollButton table={IDEAUX_HEROIQUES} onRoll={v => setRp('ideal', v)} title="Tirer un idéal héroïque (d20)" />
                </div>
                <textarea
                    className="w-full bg-stone-950/40 border border-stone-800/50 rounded-xl p-4 text-stone-300 focus:border-primary-500/30 focus:bg-stone-900/40 outline-none h-32 resize-none transition-all font-body leading-relaxed placeholder:text-stone-800"
                    placeholder="Ce qui anime votre héros..."
                    value={character.playState?.rp?.ideal || ''}
                    onChange={e => setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, rp: { ...prev.playState!.rp, ideal: e.target.value } } }))}
                />
            </div>
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
                <div className="flex items-center justify-between ml-1">
                    <label className="text-xs uppercase font-black text-red-900/60 tracking-[0.2em]">Travers / Défaut</label>
                    <RollButton table={TRAVERS} onRoll={v => setRp('flaw', v)} title="Tirer un travers (d20)" />
                </div>
                <textarea
                    className="w-full bg-stone-950/40 border border-stone-800/50 rounded-xl p-4 text-stone-300 focus:border-red-900/30 focus:bg-stone-900/40 outline-none h-32 resize-none transition-all font-body leading-relaxed placeholder:text-stone-800"
                    placeholder="Les ombres de votre passé..."
                    value={character.playState?.rp?.flaw || ''}
                    onChange={e => setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, rp: { ...prev.playState!.rp, flaw: e.target.value } } }))}
                />
            </div>
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
                <div className="flex items-center justify-between ml-1">
                    <label className="text-xs uppercase font-black text-purple-500/60 tracking-[0.2em]">Secret</label>
                    <RollButton table={SECRETS_INTIMES} onRoll={v => setRp('secret', v)} title="Tirer un secret intime (d20 sur 2 tables)" />
                </div>
                <textarea
                    className="w-full bg-stone-950/40 border border-stone-800/50 rounded-xl p-4 text-stone-300 focus:border-purple-500/30 focus:bg-stone-900/40 outline-none h-32 resize-none transition-all font-body leading-relaxed placeholder:text-stone-800"
                    placeholder="Ce que votre héros cache..."
                    value={character.playState?.rp?.secret || ''}
                    onChange={e => setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, rp: { ...prev.playState!.rp, secret: e.target.value } } }))}
                />
            </div>
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
                <label className="text-xs uppercase font-black text-stone-500/60 tracking-[0.2em] ml-1">Notes</label>
                <textarea
                    className="w-full bg-stone-950/40 border border-stone-800/50 rounded-xl p-4 text-stone-300 focus:border-stone-500/30 focus:bg-stone-900/40 outline-none h-32 resize-none transition-all font-body leading-relaxed placeholder:text-stone-800"
                    placeholder="Notes libres..."
                    value={character.playState?.rp?.notes || ''}
                    onChange={e => setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, rp: { ...prev.playState!.rp, notes: e.target.value } } }))}
                />
            </div>
        </div>
    );
};
