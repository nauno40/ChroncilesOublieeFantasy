import React from 'react';
import type { Character, CaracKey } from '../../types/character';

const CARACS: CaracKey[] = ['FOR', 'AGI', 'CON', 'PER', 'CHA', 'INT', 'VOL'];
type SubTarget = 'contact' | 'distance';
const ROWS: { target: SubTarget; label: string; def: CaracKey }[] = [
    { target: 'contact', label: 'Attaque contact', def: 'FOR' },
    { target: 'distance', label: 'Attaque distance', def: 'AGI' },
];

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * Substitution de la caractéristique d'attaque (COF2 §7 #5, ex. moine → VOL au contact).
 * Piloté joueur ; défaut = FOR (contact) / AGI (distance). Une valeur au défaut retire
 * l'entrée (playState minimal). Aucun autre effet dérivé.
 */
export const CaracSubstitutionsPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const subs = character.playState?.caracSubstitutions ?? {};

    const setCarac = (target: SubTarget, carac: CaracKey, def: CaracKey) => {
        setCharacter(prev => {
            const next = { ...(prev.playState?.caracSubstitutions ?? {}) };
            if (carac === def) delete next[target];
            else next[target] = carac;
            return { ...prev, playState: { ...prev.playState!, caracSubstitutions: next } };
        });
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em] border-b border-white/5 pb-2">Substitution de caractéristique</h3>
            {ROWS.map(row => {
                const current = subs[row.target] ?? row.def;
                const isDefault = current === row.def;
                return (
                    <div key={row.target} className="flex items-center justify-between text-xs">
                        <span className="text-stone-500 uppercase font-bold tracking-wider">{row.label}</span>
                        <select
                            className={`bg-stone-950/40 border border-stone-800 rounded px-2 py-1 outline-none focus:border-primary-500/40 ${isDefault ? 'text-stone-500' : 'text-primary-300'}`}
                            value={current}
                            onChange={e => setCarac(row.target, e.target.value as CaracKey, row.def)}
                        >
                            {CARACS.map(c => <option key={c} value={c}>{c}{c === row.def ? ' (défaut)' : ''}</option>)}
                        </select>
                    </div>
                );
            })}
        </div>
    );
};
