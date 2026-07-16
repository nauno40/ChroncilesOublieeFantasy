import React from 'react';
import type { Character } from '../../types/character';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

export const InventorySection: React.FC<Props> = ({ character, setCharacter }) => {
    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-4">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em] border-b border-white/5 pb-2">Inventaire & Sac à Dos</h3>
            <textarea
                className="w-full bg-stone-950/30 border border-stone-800/50 rounded-xl p-5 text-stone-400 min-h-[180px] outline-none focus:border-primary-500/20 focus:bg-stone-900/30 transition-all resize-y font-body text-sm leading-relaxed placeholder:text-stone-800"
                placeholder="Vos richesses et vos fardeaux..."
                value={character.playState?.equipment?.join('\n') || ''}
                onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, equipment: lines } }));
                }}
            />
        </div>
    );
};
