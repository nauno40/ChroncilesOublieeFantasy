import React from 'react';
import type { Character } from '../../types/character';
import { findRace } from '../../domain/rules';
import type { RaceList } from './types';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    races: RaceList;
}

type Field = 'age' | 'height' | 'weight';
const FIELDS: { key: Field; label: string; placeholder: string }[] = [
    { key: 'age', label: 'Âge', placeholder: 'ex. 27 ans' },
    { key: 'height', label: 'Taille', placeholder: 'ex. 1,75 m' },
    { key: 'weight', label: 'Poids', placeholder: 'ex. 70 kg' },
];

const range = (min?: number, max?: number, unit?: string): string | undefined =>
    (min && max) ? `${min}–${max} ${unit}` : undefined;

/** Caractéristiques physiques : saisie libre + bornes du peuple sélectionné en guide (spec §8). */
export const PhysicalBlock: React.FC<Props> = ({ character, setCharacter, races }) => {
    const physical = character.playState?.physical ?? {};
    const set = (key: Field, val: string) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, physical: { ...prev.playState?.physical, [key]: val } } }));

    const race = findRace(character.race, races);
    const hints: Record<Field, string | undefined> = {
        age: race && (race.startingAge || race.lifeExpectancy)
            ? [
                race.startingAge ? `adulte ~${race.startingAge} ans` : undefined,
                race.lifeExpectancy ? `espérance ~${race.lifeExpectancy} ans` : undefined,
              ].filter(Boolean).join(' · ')
            : undefined,
        height: race ? range(race.minHeight, race.maxHeight, 'cm') : undefined,
        weight: race ? range(race.minWeight, race.maxWeight, 'kg') : undefined,
    };

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
                        {hints[f.key] && <p className="text-[9px] text-stone-600 italic leading-tight">{hints[f.key]}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};
