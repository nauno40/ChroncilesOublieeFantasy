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
                    value={character.data?.rp?.ideal || ''}
                    onChange={e => setCharacter({ ...character, data: { ...character.data!, rp: { ...character.data!.rp!, ideal: e.target.value } } })}
                />
            </div>
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
                <label className="text-xs uppercase font-black text-red-900/60 tracking-[0.2em] ml-1">Travers / Défaut</label>
                <textarea
                    className="w-full bg-stone-950/40 border border-stone-800/50 rounded-xl p-4 text-stone-300 focus:border-red-900/30 focus:bg-stone-900/40 outline-none h-32 resize-none transition-all font-body leading-relaxed placeholder:text-stone-800"
                    placeholder="Les ombres de votre passé..."
                    value={character.data?.rp?.flaw || ''}
                    onChange={e => setCharacter({ ...character, data: { ...character.data!, rp: { ...character.data!.rp!, flaw: e.target.value } } })}
                />
            </div>
        </div>
    );
};
