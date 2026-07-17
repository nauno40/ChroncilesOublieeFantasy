import React from 'react';
import type { Character } from '../../types/character';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

type Field = 'age' | 'height' | 'weight';
const FIELDS: { key: Field; label: string; placeholder: string }[] = [
    { key: 'age', label: 'Âge', placeholder: 'ex. 27 ans' },
    { key: 'height', label: 'Taille', placeholder: 'ex. 1,75 m' },
    { key: 'weight', label: 'Poids', placeholder: 'ex. 70 kg' },
];

/** Caractéristiques physiques (saisie libre — les bornes par peuple ne sont pas modélisées). */
export const PhysicalBlock: React.FC<Props> = ({ character, setCharacter }) => {
    const physical = character.playState?.physical ?? {};
    const set = (key: Field, val: string) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, physical: { ...prev.playState?.physical, [key]: val } } }));

    return (
        <div className="glass-panel p-4 rounded-2xl border-white/5 bg-stone-900/10">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em] mb-3">Physique</h3>
            <div className="grid grid-cols-3 gap-3">
                {FIELDS.map(f => (
                    <div key={f.key} className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">{f.label}</label>
                        <input
                            type="text"
                            className="w-full bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                            placeholder={f.placeholder}
                            value={physical[f.key] || ''}
                            onChange={e => set(f.key, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
