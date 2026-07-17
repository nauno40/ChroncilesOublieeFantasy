import React from 'react';
import type { Character } from '../../types/character';
import { computeLanguageUsage } from '../../utils/cofRules';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    /** Modificateur d'INT effectif (pilote le nombre d'emplacements). */
    intMod: number;
}

type ListKey = 'languages' | 'talents';

/**
 * Édition des langues et talents secondaires (COF2 §Talent secondaire — budget partagé).
 * Compteur d'emplacements dérivé de l'INT, indicatif (jamais bloquant) ; « Commun » gratuit.
 */
export const LanguagesTalentsPanel: React.FC<Props> = ({ character, setCharacter, intMod }) => {
    const languages = character.playState?.languages ?? [];
    const talents = character.playState?.talents ?? [];
    const usage = computeLanguageUsage(languages, talents, intMod);
    const over = usage.used > usage.available;

    const setList = (key: ListKey, list: string[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, [key]: list } }));
    const updateItem = (key: ListKey, list: string[], idx: number, val: string) => {
        const next = [...list]; next[idx] = val; setList(key, next);
    };
    const addItem = (key: ListKey, list: string[]) => setList(key, [...list, '']);
    const removeItem = (key: ListKey, list: string[], idx: number) => setList(key, list.filter((_, i) => i !== idx));

    const column = (title: string, key: ListKey, list: string[], placeholder: string) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black text-stone-500 tracking-[0.2em]">{title}</label>
                <button onClick={() => addItem(key, list)} className="text-stone-500 hover:text-primary-400 text-sm" title={`Ajouter ${title.toLowerCase()}`}>+</button>
            </div>
            {list.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                    <input
                        type="text"
                        className="flex-1 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                        placeholder={placeholder}
                        value={item}
                        onChange={e => updateItem(key, list, idx, e.target.value)}
                    />
                    <button onClick={() => removeItem(key, list, idx)} className="text-stone-600 hover:text-red-400 text-xs" title="Retirer">✕</button>
                </div>
            ))}
        </div>
    );

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Langues & Talents</h3>
                <div className="flex items-center gap-2">
                    {usage.illiterate && (
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-900/30 border border-red-500/40 text-red-300">Illettré</span>
                    )}
                    <span className={`text-[10px] font-mono font-bold ${over ? 'text-red-400' : 'text-stone-400'}`}>
                        {usage.used} / {usage.available} empl.
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {column('Langues', 'languages', languages, 'ex. Commun, Elfique…')}
                {column('Talents secondaires', 'talents', talents, 'ex. Cuisine, Échecs…')}
            </div>
        </div>
    );
};
