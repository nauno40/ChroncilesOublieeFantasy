import React from 'react';
import type { Character } from '../../types/character';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

export const RoleplaySection: React.FC<Props> = ({ character, setCharacter }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
                <label className="text-xs uppercase font-black text-primary-500/60 tracking-[0.2em] ml-1">Idéal Héroïque</label>
                <textarea
                    className="w-full bg-stone-950/40 border border-stone-800/50 rounded-xl p-4 text-stone-300 focus:border-primary-500/30 focus:bg-stone-900/40 outline-none h-32 resize-none transition-all font-body leading-relaxed placeholder:text-stone-800"
                    placeholder="Ce qui anime votre héros..."
                    value={character.playState?.rp?.ideal || ''}
                    onChange={e => setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, rp: { ...prev.playState!.rp, ideal: e.target.value } } }))}
                />
            </div>
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
                <label className="text-xs uppercase font-black text-red-900/60 tracking-[0.2em] ml-1">Travers / Défaut</label>
                <textarea
                    className="w-full bg-stone-950/40 border border-stone-800/50 rounded-xl p-4 text-stone-300 focus:border-red-900/30 focus:bg-stone-900/40 outline-none h-32 resize-none transition-all font-body leading-relaxed placeholder:text-stone-800"
                    placeholder="Les ombres de votre passé..."
                    value={character.playState?.rp?.flaw || ''}
                    onChange={e => setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, rp: { ...prev.playState!.rp, flaw: e.target.value } } }))}
                />
            </div>
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
                <label className="text-xs uppercase font-black text-purple-500/60 tracking-[0.2em] ml-1">Secret</label>
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
