import React from 'react';
import type { Character } from '../../types/character';
import { MIN_STAT, MAX_STAT, type Stats } from '../../domain/rules';
import type { RaceList } from './types';

interface Props {
    character: Partial<Character>;
    selectedProfileType: 'polyvalent' | 'expert' | 'specialist';
    setSelectedProfileType: React.Dispatch<React.SetStateAction<'polyvalent' | 'expert' | 'specialist'>>;
    profileValues: number[];
    stats: Stats;
    races: RaceList;
    racialBonusChoices: Record<string, string>;
    setRacialBonusChoices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    finalStats: Stats;
    updateStat: (stat: keyof Stats, value: string) => void;
    caracTestBonuses?: Partial<Record<keyof Stats, number>>;
}

export const AttributesPanel: React.FC<Props> = ({
    character,
    selectedProfileType,
    setSelectedProfileType,
    profileValues,
    stats,
    races,
    racialBonusChoices,
    setRacialBonusChoices,
    finalStats,
    updateStat,
    caracTestBonuses,
}) => {
    return (
        <div className="glass-panel p-5 rounded-xl space-y-4 border border-white/10">
            <header className="flex flex-col border-b border-primary-500/20 pb-4 mb-4 gap-4">
                <div className="flex justify-between items-start">
                    <h2 className="text-primary-400 font-display font-bold uppercase text-sm tracking-wider">Caractéristiques</h2>
                </div>

                {/* Profile Selection UI */}
                {character.level === 0 && (
                    <div className="space-y-3 bg-stone-900/40 p-3 rounded-lg border border-white/5">
                        <div className="flex justify-between gap-2">
                            {(['polyvalent', 'expert', 'specialist'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedProfileType(type)}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${selectedProfileType === type
                                        ? 'bg-primary-500/20 border-primary-500 text-primary-300'
                                        : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-primary-500/30'}`}
                                >
                                    {type === 'specialist' ? 'Spécialiste' : type}
                                </button>
                            ))}
                        </div>
                        <div className="text-[10px] text-stone-400 flex flex-wrap gap-2 justify-center">
                            <span className="opacity-50">Valeurs à répartir :</span>
                            {profileValues.map((v, i) => (
                                <span key={i} className="font-mono font-bold text-white bg-stone-800 px-1.5 rounded">{v}</span>
                            ))}
                        </div>
                        {/* Validation */}
                        {(() => {
                            // Count frequencies of values
                            const getCounts = (arr: number[]) => arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {} as Record<number, number>);
                            const currentCounts = getCounts(Object.values(stats));
                            const targetCounts = getCounts(profileValues);

                            // Check if current matches target
                            const isValid = Object.keys(targetCounts).every(k => (currentCounts[parseInt(k)] || 0) === targetCounts[parseInt(k)]);

                            return (
                                <div className={`text-center text-[10px] font-bold uppercase ${isValid ? 'text-green-500' : 'text-amber-500'}`}>
                                    {isValid ? 'Répartition Valide' : 'Ajustez vos caractéristiques pour correspondre au profil'}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Racial Choice UI */}
                {character.race && (
                    (() => {
                        const selectedRace = races.find(r => (r.name || r.nom) === character.race || r['@id'] === character.race);
                        if (!selectedRace?.modifiers) return null;

                        // Filter only choice or special modifiers that require user input
                        const activeModifiers = selectedRace.modifiers.filter((m: any) => m.type === 'choice' || (m.type === 'special' && m.stat === 'Lowest') || (m.type === 'logic' && m.logic === 'add_to_lowest'));

                        if (activeModifiers.length === 0) return null;

                        return (
                            <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-white/10">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Bonus Raciaux</span>
                                {activeModifiers.map((mod: any) => {
                                    // Find original index for unique key
                                    const originalIndex = selectedRace.modifiers.indexOf(mod);
                                    const choiceKey = `bonus_${originalIndex}`;

                                    const isBonus = mod.value > 0;
                                    const labelColor = isBonus ? 'text-green-400' : 'text-red-400';
                                    const labelPrefix = isBonus ? 'Bonus' : 'Malus';
                                    const sign = isBonus ? '+' : '';

                                    if (mod.type === 'choice') {
                                        return (
                                            <div key={choiceKey} className="bg-stone-900/50 p-2 rounded border border-white/5 flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-stone-400 uppercase font-bold">{mod.stat}</span>
                                                    <span className={`text-[10px] font-bold ${labelColor}`}>{labelPrefix} ({sign}{mod.value})</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {mod.options.map((opt: string) => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => setRacialBonusChoices(prev => ({ ...prev, [choiceKey]: opt }))}
                                                            className={`flex-1 py-1 rounded border text-[10px] uppercase font-bold transition-all ${racialBonusChoices[choiceKey] === opt
                                                                ? (isBonus ? 'bg-green-500/20 border-green-500 text-green-300' : 'bg-red-500/20 border-red-500 text-red-300')
                                                                : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-600'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    // Special Human "Lowest" selector
                                    if ((mod.type === 'special' && mod.stat === 'Lowest') || (mod.type === 'logic' && mod.logic === 'add_to_lowest')) {
                                        // Calculate Lowest Stats logic
                                        const minVal = Math.min(...Object.values(stats));
                                        // Filter stats that equal minVal
                                        const lowestStats = Object.keys(stats).filter(key => stats[key as keyof typeof stats] === minVal);

                                        const count = mod.count || 1;
                                        const inputs = [];

                                        for (let i = 0; i < count; i++) {
                                            const subChoiceKey = `${choiceKey}_${i}`;
                                            const currentSelection = racialBonusChoices[subChoiceKey];

                                            // Filter out choices made in OTHER dropdowns of this same modifier
                                            // But keep the current selection in the list so it can be seen/changed
                                            const otherSelections: string[] = [];
                                            for (let j = 0; j < count; j++) {
                                                if (i !== j) {
                                                    const otherKey = `${choiceKey}_${j}`;
                                                    if (racialBonusChoices[otherKey]) otherSelections.push(racialBonusChoices[otherKey]);
                                                }
                                            }

                                            const availableOptions = lowestStats.filter(s => !otherSelections.includes(s));

                                            inputs.push(
                                                <div key={subChoiceKey} className="bg-stone-900/50 p-2 rounded border border-white/5 flex flex-col gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-stone-400 uppercase font-bold">Faiblesse à combler ({i + 1}/{count})</span>
                                                        <span className="text-[10px] font-bold text-green-400">Bonus (+1)</span>
                                                    </div>
                                                    <div className="text-[9px] text-stone-500 italic mb-1">
                                                        Restriction : {availableOptions.join(', ')}
                                                    </div>
                                                    <select
                                                        className="bg-stone-950 border border-stone-800 text-stone-300 text-[10px] rounded px-2 py-1.5 outline-none focus:border-green-500/50 transition-all"
                                                        value={currentSelection || ''}
                                                        onChange={(e) => setRacialBonusChoices(prev => ({ ...prev, [subChoiceKey]: e.target.value }))}
                                                    >
                                                        <option value="">Choisir une caractéristique...</option>
                                                        {availableOptions.map(s => (
                                                            <option key={s} value={s}>{s} ({stats[s as keyof typeof stats]})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            );
                                        }

                                        return <div key={choiceKey} className="flex flex-col gap-2">{inputs}</div>;
                                    }
                                    return null;
                                })}
                            </div>
                        );
                    })()
                )}
            </header>

            {(['AGI', 'CON', 'FOR', 'PER', 'CHA', 'INT', 'VOL'] as const).map((stat) => {
                const finalVal = finalStats[stat];
                const baseVal = stats[stat];
                const diff = finalVal - baseVal;
                // COF2 : la valeur de caractéristique EST la valeur de jeu (pas de « modificateur » séparé).
                const withSign = (n: number) => `${n > 0 ? '+' : ''}${n}`;

                return (
                    <div key={stat} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center font-bold text-stone-500 border border-stone-800 text-xs shadow-inner">
                                {stat}
                            </span>
                            {character.level === 0 ? (
                                <div className="flex items-center gap-1 bg-stone-950/50 rounded-lg p-0.5 border border-stone-800">
                                    <button
                                        onClick={() => updateStat(stat, (baseVal - 1).toString())}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        disabled={baseVal <= MIN_STAT}
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-bold text-white text-lg">{withSign(baseVal)}</span>
                                    <button
                                        onClick={() => updateStat(stat, (baseVal + 1).toString())}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        disabled={baseVal >= MAX_STAT}
                                    >
                                        +
                                    </button>
                                    {diff !== 0 && (
                                        <span className={`ml-1 text-xs font-bold ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {diff > 0 ? '+' : ''}{diff}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-lg font-bold text-white w-12 text-center">{withSign(finalVal)}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Valeur</span>
                                <span className={`w-10 text-right font-display font-bold text-lg ${finalVal > 0 ? 'text-primary-400' : 'text-stone-500'}`}>
                                    {withSign(finalVal)}
                                </span>
                            </div>
                            {(caracTestBonuses?.[stat] ?? 0) > 0 && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-700/40 text-amber-400" title="Bonus aux tests de cette caractéristique">
                                    tests +{caracTestBonuses![stat]}
                                </span>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};
