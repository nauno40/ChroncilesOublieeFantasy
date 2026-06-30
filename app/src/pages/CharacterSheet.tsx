import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import { Save, ChevronLeft, RefreshCw, Trash2 } from 'lucide-react';
import { Tooltip } from '../components/common';
import { EquipmentChoiceModal } from '../components/EquipmentChoiceModal';
import { useCharacterData } from '../hooks/useCharacterData';
import { useCharacterSheet, ADVENTURER_PACK } from '../hooks/useCharacterSheet';
import { calculateMod, getMaxArmorDef } from '../utils/cofRules';

export const CharacterSheet: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = !id;

    // Compendium reference data (races/profiles/equipment/voies)
    const { races, profiles, allWeapons, allArmors, allVoies, prestigePaths } = useCharacterData();

    // Form state, derived values (cofRules) and sync effects
    const {
        character, setCharacter,
        loading, saving,
        stats, mods, finalStats, combatStats,
        spentPoints, maxStartingPoints,
        selectedVoies, setSelectedVoies,
        selectedProfileType, setSelectedProfileType,
        racialBonusChoices, setRacialBonusChoices,
        racialVoieOptions,
        isMageFamily,
        mageReplacedRaceVoie, setMageReplacedRaceVoie,
        showPrestigeSelector, setShowPrestigeSelector,
        showEquipmentModal, setShowEquipmentModal,
        equipmentChoiceQueue, setEquipmentChoiceQueue,
        currentChoiceIndex, setCurrentChoiceIndex,
        profileValues,
        handleSave, updateStat, getCapabilityName, addEquipmentItem,
    } = useCharacterSheet({ races, profiles, allVoies, id, isNew, navigate });

    if (loading) return <div className="p-8 text-center text-primary-200">Chargement...</div>;

    return (
        <div className="max-w-[95%] mx-auto space-y-6 pb-24 pt-6 px-4 animate-fade-in">

            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-stone-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-2xl">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate('/characters')}
                        className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-stone-500 hover:text-primary-400 hover:border-primary-500/30 transition-all group border border-white/5"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold font-display text-gradient-gold tracking-widest leading-none">
                            {isNew ? 'Nouveau Héros' : character.name}
                        </h1>
                        <p className="text-[10px] uppercase font-black text-stone-500 tracking-[0.3em] mt-2 ml-0.5 opacity-70">
                            Chroniqueur de Légendes
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-500 text-stone-950 font-display font-black uppercase text-xs tracking-widest px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary-900/20 active:scale-95 disabled:opacity-50 border border-primary-400/20"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        {saving ? 'Incantation...' : 'Enregistrer'}
                    </button>
                    {!isNew && (
                        <button
                            onClick={async () => {
                                if (confirm("Bannir ce héros définitivement ?")) {
                                    await ApiService.delete('characters', id!);
                                    navigate('/characters');
                                }
                            }}
                            className="p-3 glass-panel text-stone-600 hover:text-red-500 hover:border-red-900/30 transition-all rounded-xl border border-white/5"
                            title="Supprimer"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Sheet Layout - Mimicking the PDF */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Attributes (25%) */}
                <div className="lg:col-span-3 space-y-4">
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

                            // Re-calculate mod based on Final Stat
                            const mod = calculateMod(finalVal);

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
                                                    disabled={baseVal <= 9}
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-bold text-white text-lg">{baseVal}</span>
                                                <button
                                                    onClick={() => updateStat(stat, (baseVal + 1).toString())}
                                                    className="w-6 h-6 flex items-center justify-center rounded bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    disabled={baseVal >= 14}
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
                                            <span className="text-lg font-bold text-white w-12 text-center">{finalVal}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Mod.</span>
                                            <span className={`w-10 text-right font-display font-bold text-lg ${mod > 0 ? 'text-primary-400' : 'text-stone-500'}`}>
                                                {mod > 0 ? '+' : ''}{mod}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>


                    {/* Main Stats Row - Moved to Left Column */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="glass-panel p-3 rounded-xl text-center border-stone-800 relative overflow-hidden bg-stone-900/10">
                            <label className="text-[9px] uppercase font-black text-stone-500 tracking-[0.2em] block mb-1">Initiative</label>
                            <div className="text-2xl font-display font-bold text-stone-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                                {combatStats.init}
                            </div>
                            <div className="text-[8px] text-stone-600 font-bold uppercase mt-1">10 + PER + Bonus</div>
                        </div>
                        <div className="glass-panel p-3 rounded-xl text-center border-primary-500/20 relative overflow-hidden group bg-stone-900/10">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
                            <label className="text-[9px] uppercase font-black text-primary-500/70 tracking-[0.2em] block mb-1">Défense</label>
                            <div className="text-2xl font-display font-bold text-white outline-none drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                {combatStats.def}
                            </div>
                            <div className="text-[8px] text-stone-500 font-bold uppercase mt-1">10 + AGI + Armure</div>
                        </div>
                        <div className="glass-panel p-3 rounded-xl text-center border-green-900/40 bg-green-950/5 relative overflow-hidden transition-all hover:bg-green-950/10 col-span-2">
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500/30" />
                            <label className="text-[9px] uppercase font-black text-green-600 tracking-[0.2em] block mb-1">Points de Vie</label>
                            <div className="flex items-center justify-center gap-2">
                                <input
                                    type="number"
                                    className="w-16 bg-transparent text-center text-2xl font-display font-bold text-green-400 outline-none"
                                    value={character.data?.hp?.max || 0}
                                    onChange={e => {
                                        const val = parseInt(e.target.value);
                                        setCharacter(prev => ({
                                            ...prev,
                                            data: { ...prev.data!, hp: { ...prev.data!.hp!, max: val } }
                                        }));
                                    }}
                                />
                            </div>
                            <div className="text-[8px] text-green-900/60 font-bold uppercase mt-1">PV MAXIMUM</div>
                        </div>
                        {/* Row 3: Luck & Mana */}
                        <div className="glass-panel p-3 rounded-xl border-white/5 bg-stone-900/20 text-center">
                            <label className="text-[9px] uppercase font-black text-amber-600/80 tracking-widest block mb-2">Chance</label>
                            <div className="flex items-center justify-center gap-2">
                                <input
                                    type="number"
                                    className="w-10 bg-stone-950/50 border border-stone-800 rounded text-center text-lg font-bold text-amber-400 outline-none focus:border-amber-500/50 shadow-inner p-0.5"
                                    value={character.data?.luck?.current || 0}
                                    onChange={e => setCharacter({ ...character, data: { ...character.data!, luck: { ...character.data!.luck!, current: parseInt(e.target.value) } } })}
                                />
                                <span className="text-stone-700 font-black text-xs">/</span>
                                <input
                                    type="number"
                                    className="w-8 bg-transparent text-center text-sm text-stone-500 font-bold outline-none"
                                    value={character.data?.luck?.max || 0}
                                    onChange={e => setCharacter({ ...character, data: { ...character.data!, luck: { ...character.data!.luck!, max: parseInt(e.target.value) } } })}
                                />
                            </div>
                        </div>

                        <div className="glass-panel p-3 rounded-xl text-center border-blue-900/40 bg-blue-950/5 relative overflow-hidden transition-all hover:bg-blue-950/10">
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/30" />
                            <label className="text-[9px] uppercase font-black text-blue-500 tracking-[0.2em] block mb-1">Mana</label>
                            <div className="flex items-center justify-center gap-2">
                                <input
                                    type="number"
                                    className="w-16 bg-transparent text-center text-2xl font-display font-bold text-blue-400 outline-none"
                                    value={character.data?.mp?.max || 0}
                                    readOnly={true}
                                />
                            </div>
                            <div className="text-[8px] text-blue-900/60 font-bold uppercase mt-1">PM MAX</div>
                        </div>

                        {/* Row 4: Recovery (Full Width) */}
                        <div className="glass-panel p-3 rounded-xl border-white/5 bg-stone-900/20 text-center col-span-2 flex items-center justify-between px-6">
                            <label className="text-[9px] uppercase font-black text-stone-500 tracking-widest block">Récupération</label>
                            <div className="flex flex-col items-center">
                                <input
                                    type="text"
                                    className="bg-transparent border-b border-stone-800 text-center text-lg font-bold text-white outline-none focus:border-primary-500/50 transition-all font-display w-24"
                                    placeholder="ex: d8"
                                    value={character.data?.recovery?.die || ''}
                                    onChange={e => setCharacter({ ...character, data: { ...character.data!, recovery: { ...character.data!.recovery!, die: e.target.value } } })}
                                />
                                <div className="text-[8px] text-stone-600 text-center font-bold uppercase mt-1">Dés de vie</div>
                            </div>
                        </div>

                        {/* Row 5: Attacks (Full Width) */}
                        <div className="glass-panel p-3 rounded-xl col-span-2 border-white/5 bg-stone-900/20">
                            <div className="grid grid-cols-2 gap-4 h-full divide-x divide-white/5">
                                <div className="text-center">
                                    <label className="text-[9px] uppercase font-black text-stone-500 tracking-widest block mb-1">Atk. CàC</label>
                                    <div className="text-xl font-display font-bold text-white text-shadow-sm transition-all hover:scale-110">
                                        <span className="text-stone-600 text-xs mr-1">+</span>{mods.FOR + (character.level || 1)}
                                    </div>
                                </div>
                                <div className="text-center pl-4">
                                    <label className="text-[9px] uppercase font-black text-stone-500 tracking-widest block mb-1">Atk. Tir</label>
                                    <div className="text-xl font-display font-bold text-white text-shadow-sm transition-all hover:scale-110">
                                        <span className="text-stone-600 text-xs mr-1">+</span>{mods.AGI + (character.level || 1)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Center/Right Column: Identity & Combat (75%) */}
                <div className="lg:col-span-9 space-y-6">

                    {/* Identity Block */}
                    <div className="glass-panel p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 border border-white/10">
                        <div className="space-y-1">
                            <label className="text-xs uppercase font-bold text-stone-500 tracking-wider ml-1">Nom du Personnage</label>
                            <input
                                type="text"
                                className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-3 text-2xl font-display font-bold text-white outline-none focus:border-primary-500/50 focus:bg-stone-900/50 transition-all placeholder:text-stone-700"
                                value={character.name || ''}
                                onChange={e => setCharacter({ ...character, name: e.target.value })}
                                placeholder="Nom du héros"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs uppercase font-bold text-stone-500 tracking-wider ml-1">Niveau</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-3 text-xl font-mono font-bold text-primary-400 outline-none focus:border-primary-500/50 transition-all text-center"
                                        value={character.level || 1}
                                        onChange={e => setCharacter({ ...character, level: parseInt(e.target.value) })}
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-600 font-bold text-xs uppercase">
                                        NIV
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase font-bold text-stone-500 tracking-wider ml-1">Race</label>
                            <select
                                className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-3 text-lg font-bold text-stone-200 outline-none focus:border-primary-500/50 focus:bg-stone-900/50 transition-all cursor-pointer appearance-none"
                                value={(character.race as any)?.['@id'] || (typeof character.race === 'string' ? character.race : '')}
                                onChange={e => {
                                    // Find race object
                                    const selectedId = e.target.value; // IRI
                                    setCharacter(prev => ({
                                        ...prev,
                                        race: selectedId,
                                        // Racial Voie logic is now handled by effect
                                    }));
                                }}
                            >
                                <option value="">Choisir une race...</option>
                                {races.map(r => (
                                    <option key={r['@id']} value={r['@id']}>{r.name || r.nom}</option>
                                ))}
                            </select>
                        </div>



                        <div className="space-y-1">
                            <label className="text-xs uppercase font-bold text-stone-500 tracking-wider ml-1">Profil (Classe)</label>
                            <select
                                className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-3 text-lg font-bold text-stone-200 outline-none focus:border-primary-500/50 focus:bg-stone-900/50 transition-all cursor-pointer appearance-none"
                                value={(character.profile as any)?.['@id'] || (typeof character.profile === 'string' ? character.profile : '')}
                                onChange={e => {
                                    const selectedId = e.target.value; // IRI

                                    // Parse Starting Equipment
                                    const p = profiles.find(pr => pr.name === selectedId || pr['@id'] === selectedId);

                                    let currentData = {
                                        ...character.data!,
                                        // Reset equipment/combat stats on profile change? Maybe safer.
                                        // For now, let's append or ensure we don't duplicate if same profile re-selected?
                                        // Simpler: Just clear and add.
                                        attack: { ...character.data!.attack!, weapons: [] },
                                        protection: { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } },
                                        equipment: []
                                    };

                                    const choicesFound: any[] = [];

                                    if (p && p.startingEquipment) {
                                        p.startingEquipment.forEach((eq: any, _index: number) => {
                                            // Direct Item
                                            if (eq.item) {
                                                addEquipmentItem(eq, currentData);
                                            }
                                            // Choice
                                            else if (eq.choice) {
                                                choicesFound.push(eq.choice);
                                            }
                                        });
                                    }

                                    // If we found choices, start the queue
                                    if (choicesFound.length > 0) {
                                        setEquipmentChoiceQueue(choicesFound);
                                        setCurrentChoiceIndex(0);
                                        setShowEquipmentModal(true);
                                    } else {
                                        setShowEquipmentModal(false);
                                        setEquipmentChoiceQueue([]);
                                    }

                                    // Add Sac d'Aventurier
                                    const adventurerEquipment = [...ADVENTURER_PACK];

                                    // Bourse de 2d6 pa
                                    const roll2d6 = () => (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1);
                                    const initialGold = roll2d6();

                                    setCharacter(prev => ({
                                        ...prev,
                                        profile: selectedId,
                                        data: {
                                            ...currentData,
                                            money: { pa: initialGold },
                                            equipment: [...adventurerEquipment, ...currentData.equipment]
                                        }
                                    }));
                                }}
                            >
                                <option value="">Choisir un profil...</option>
                                {profiles.map(p => (
                                    <option key={p['@id']} value={p['@id']}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>



                    {/* Roleplay Section */}
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


                    {/* Protection Section */}
                    <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-5">
                        <div className="flex justify-between items-center border-b border-primary-500/10 pb-3">
                            <h3 className="text-stone-400 font-display font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-stone-500 rounded-full" />
                                Équipement & Inventaire
                            </h3>
                            <div className="flex items-center gap-2 bg-stone-900/50 px-3 py-1 rounded-full border border-yellow-500/20">
                                <span className="text-[10px] uppercase font-bold text-yellow-500/60 tracking-wider">Argent</span>
                                <span className="text-sm font-mono font-bold text-yellow-500">{character.data?.money?.pa || 0} pa</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Armure</label>
                                <select
                                    className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-3 py-2 text-stone-300 outline-none focus:border-primary-500/50"
                                    value={character.data?.protection?.armor?.name || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        const found = allArmors.find(a => a.name === val);
                                        setCharacter(prev => ({
                                            ...prev,
                                            data: {
                                                ...prev.data!,
                                                protection: {
                                                    ...prev.data!.protection!,
                                                    armor: { name: val, def: found ? (parseInt(found.value) || 0) : 0 }
                                                }
                                            }
                                        }));
                                    }}
                                >
                                    <option value="">Aucune</option>
                                    {allArmors.filter(a => {
                                        if (a.type.includes('Bouclier')) return false;

                                        const pId = (character.profile as any)?.['@id'] || (typeof character.profile === 'string' ? character.profile : '');
                                        const profile = profiles.find(p => p['@id'] === pId || p.id === pId || p.name === pId || p['@id']?.includes(pId) || pId?.includes(p['@id'] || ''));
                                        const profileName = profile?.name || '';
                                        const maxDef = getMaxArmorDef(profileName);

                                        const armorDef = a.defense || 0;
                                        return armorDef <= maxDef;
                                    }).map((a: any) => (
                                        <option key={a.id} value={a.name}>{a.name} (+{a.value || a.defense || 0})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Bouclier</label>
                                <select
                                    className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-3 py-2 text-stone-300 outline-none focus:border-primary-500/50"
                                    value={character.data?.protection?.shield?.name || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        const found = allArmors.find(a => a.name === val);
                                        setCharacter(prev => ({
                                            ...prev,
                                            data: {
                                                ...prev.data!,
                                                protection: {
                                                    ...prev.data!.protection!,
                                                    shield: { name: val, def: found ? (parseInt(found.value) || 0) : 0 }
                                                }
                                            }
                                        }));
                                    }}
                                >
                                    <option value="">Aucun</option>
                                    {allArmors.filter(a => a.type.includes('Bouclier')).map((a: any) => (
                                        <option key={a.id} value={a.name}>{a.name} (+{a.value})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Weapons Section */}
                    <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-5">
                        <h3 className="text-primary-400 font-display font-bold uppercase text-xs tracking-[0.2em] border-b border-primary-500/10 pb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                            Armes & Attaques
                        </h3>

                        <div className="space-y-3">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 text-[9px] uppercase font-black text-stone-500 px-3 tracking-widest">
                                <div className="col-span-4">Arme / Instrument</div>
                                <div className="col-span-2 text-center">Mod.</div>
                                <div className="col-span-2 text-center">Dégâts</div>
                                <div className="col-span-4 pl-2">Propriétés</div>
                            </div>

                            {/* Rows */}
                            {(character.data?.attack?.weapons || []).concat([{ name: '', atkMod: 0, dmg: '', special: '' }, { name: '', atkMod: 0, dmg: '', special: '' }]).slice(0, 4).map((weapon, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-stone-950/40 p-3 rounded-xl border border-white/5 hover:border-primary-500/20 hover:bg-stone-900/40 transition-all group">
                                    <div className="col-span-4 relative">
                                        <input // Keep input for manual entry or search
                                            list={`weapons-list-${idx}`}
                                            type="text"
                                            className="w-full bg-stone-900/50 border border-stone-800 rounded px-2 py-1 text-sm font-bold text-white outline-none focus:border-primary-500/50 placeholder:text-stone-700"
                                            placeholder="Nom de l'arme..."
                                            value={weapon.name}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const newWeapons = [...(character.data?.attack?.weapons || [])];
                                                if (!newWeapons[idx]) newWeapons[idx] = { name: '', atkMod: 0, dmg: '', special: '' };
                                                newWeapons[idx].name = val;

                                                // Auto-fill if match found
                                                const found = allWeapons.find(w => w.name === val);
                                                if (found) {
                                                    newWeapons[idx].dmg = found.damage;
                                                    newWeapons[idx].special = `${found.range ? `Portée ${found.range}, ` : ''}${found.critical ? `Crit ${found.critical}` : ''}`;
                                                }

                                                setCharacter(prev => ({ ...prev, data: { ...prev.data!, attack: { ...prev.data!.attack!, weapons: newWeapons } } }));
                                            }}
                                        />
                                        <datalist id={`weapons-list-${idx}`}>
                                            {allWeapons.map((w: any) => (
                                                <option key={w.id} value={w.name}>{w.type} - {w.damage}</option>
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-center">
                                        <div className="flex items-center bg-stone-900 border border-stone-800 rounded px-2 py-1 shadow-inner">
                                            <span className="text-stone-600 font-bold text-xs mr-1">+</span>
                                            <input
                                                type="number"
                                                className="w-8 bg-transparent text-center font-mono font-bold text-primary-400 outline-none"
                                                value={weapon.atkMod || 0}
                                                onChange={(e) => {
                                                    const newWeapons = [...(character.data?.attack?.weapons || [])];
                                                    if (!newWeapons[idx]) newWeapons[idx] = { name: '', atkMod: 0, dmg: '', special: '' };
                                                    newWeapons[idx].atkMod = parseInt(e.target.value);
                                                    setCharacter(prev => ({ ...prev, data: { ...prev.data!, attack: { ...prev.data!.attack!, weapons: newWeapons } } }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent text-center border-none outline-none text-stone-300 font-mono placeholder:text-stone-800"
                                            placeholder="1d8"
                                            value={weapon.dmg}
                                            onChange={(e) => {
                                                const newWeapons = [...(character.data?.attack?.weapons || [])];
                                                if (!newWeapons[idx]) newWeapons[idx] = { name: '', atkMod: 0, dmg: '', special: '' };
                                                newWeapons[idx].dmg = e.target.value;
                                                setCharacter(prev => ({ ...prev, data: { ...prev.data!, attack: { ...prev.data!.attack!, weapons: newWeapons } } }));
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-none outline-none text-[11px] text-stone-500 italic placeholder:text-stone-800"
                                            placeholder="Critique, portée..."
                                            value={weapon.special}
                                            onChange={(e) => {
                                                const newWeapons = [...(character.data?.attack?.weapons || [])];
                                                if (!newWeapons[idx]) newWeapons[idx] = { name: '', atkMod: 0, dmg: '', special: '' };
                                                newWeapons[idx].special = e.target.value;
                                                setCharacter(prev => ({ ...prev, data: { ...prev.data!, attack: { ...prev.data!.attack!, weapons: newWeapons } } }));
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Equipment Section */}
                    <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-4">
                        <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em] border-b border-white/5 pb-2">Inventaire & Sac à Dos</h3>
                        <textarea
                            className="w-full bg-stone-950/30 border border-stone-800/50 rounded-xl p-5 text-stone-400 min-h-[180px] outline-none focus:border-primary-500/20 focus:bg-stone-900/30 transition-all resize-y font-body text-sm leading-relaxed placeholder:text-stone-800"
                            placeholder="Vos richesses et vos fardeaux..."
                            value={character.data?.equipment?.join('\n') || ''}
                            onChange={(e) => {
                                const lines = e.target.value.split('\n');
                                setCharacter(prev => ({ ...prev, data: { ...prev.data!, equipment: lines } }));
                            }}
                        />
                    </div>

                    {/* Voies Section (Page 2 style) */}
                    <div className="space-y-6 pt-8 border-t border-white/10 overflow-visible">
                        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center justify-between">
                            <span>Voies & Progression</span>
                            {character.level === 0 && (
                                <span className={`text-base px-3 py-1 rounded-full border ${spentPoints > maxStartingPoints ? 'bg-red-900/30 border-red-500 text-red-200' :
                                    spentPoints === maxStartingPoints ? 'bg-green-900/30 border-green-500 text-green-200' :
                                        'bg-primary-900/30 border-primary-500 text-primary-200'
                                    }`}>
                                    Points à répartir : {maxStartingPoints - spentPoints} / {maxStartingPoints}
                                </span>
                            )}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible">
                            {/* Racial Voie */}
                            <div className="glass-panel p-5 rounded-2xl border-primary-500/20 bg-stone-900/10 hover:border-primary-500/30 transition-all group/voie overflow-visible relative">
                                {isMageFamily && mageReplacedRaceVoie && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent pointer-events-none rounded-tr-2xl" />
                                )}
                                <div className="mb-5 space-y-2">
                                    <h3 className="text-primary-600/70 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">
                                        {mageReplacedRaceVoie ? 'Voie du Mage' : 'Héritage Racial'}
                                    </h3>
                                    {character.level === 0 && isMageFamily && (
                                        <div className="flex justify-end mb-1">
                                            <button
                                                onClick={() => setMageReplacedRaceVoie(!mageReplacedRaceVoie)}
                                                className={`text-[9px] uppercase font-bold py-1 px-2 rounded border transition-all ${mageReplacedRaceVoie
                                                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                                    : 'bg-stone-950 border-stone-700 text-stone-400 hover:text-white'
                                                    }`}
                                            >
                                                {mageReplacedRaceVoie ? 'Rétablir Racial' : 'Remplacer (Mage)'}
                                            </button>
                                        </div>
                                    )}
                                    {isMageFamily && mageReplacedRaceVoie ? (
                                        <div className="w-full bg-stone-950/30 border border-purple-500/50 rounded-lg px-4 py-2 text-lg font-display font-bold text-purple-300 shadow-inner">
                                            Voie du Mage
                                        </div>
                                    ) : (
                                        racialVoieOptions.length > 1 ? (
                                            <select
                                                className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-2 text-lg font-display font-bold text-white outline-none focus:border-primary-500/50 focus:bg-stone-900/50 transition-all cursor-pointer appearance-none shadow-inner"
                                                value={selectedVoies[2]}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setSelectedVoies(prev => [prev[0], prev[1], val]);
                                                }}
                                            >
                                                <option value="">-- Choisir héritage --</option>
                                                {racialVoieOptions.map((v: any, idx: number) => (
                                                    <option key={idx} value={v.name}>{v.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-2 text-lg font-display font-bold text-white shadow-inner">
                                                {racialVoieOptions[0]?.name || '...'}
                                            </div>
                                        )
                                    )}
                                </div>
                                <div className="space-y-2.5 overflow-visible">
                                    {/* Mage Passive Bonus Display */}
                                    {isMageFamily && mageReplacedRaceVoie && (
                                        <div className="text-[10px] text-purple-300/70 italic px-2 pb-2">
                                            Bonus Passif : {racialVoieOptions[0]?.name} (Rang 1) conservé !
                                        </div>
                                    )}

                                    {[1, 2, 3, 4, 5].map(rank => {
                                        const displayedVoieName = mageReplacedRaceVoie ? "Voie du Mage" : selectedVoies[2];
                                        const cap = getCapabilityName(displayedVoieName, rank);
                                        const isActive = character.data?.voies?.racial?.ranks?.[rank - 1] || false;

                                        return (
                                            <div key={rank} className="relative">
                                                {/* Connecting Line */}
                                                {rank < 5 && (
                                                    <div className={`absolute left-[22px] top-10 bottom-0 w-0.5 z-0 transition-colors duration-500 ${isActive && (character.data?.voies?.racial?.ranks?.[rank] || false) ? 'bg-primary-500/30' : 'bg-stone-800/30'}`} />
                                                )}

                                                <Tooltip content={cap ? { name: cap.name, description: cap.description } : { name: `Rang ${rank}`, description: '' }} theme="primary">
                                                    <label className={`relative z-10 flex items-start gap-4 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${isActive
                                                        ? 'bg-primary-950/20 border-primary-500/40 shadow-[0_0_20px_-5px_rgba(234,179,8,0.2)]'
                                                        : 'bg-stone-950/40 border-white/5 hover:bg-stone-900/60 hover:border-white/10'
                                                        }`}>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={isActive}
                                                            onChange={e => {
                                                                if (character.level === 0 && rank === 1) return; // Locked / Free / Auto

                                                                // Mage Bonus Point for Rank 2
                                                                // Handled by generic point calculation check below
                                                                if (character.level === 0 && rank === 2 && isMageFamily) {
                                                                    // Allow if not already taken or if we have points
                                                                    // But we need to check limit.
                                                                    // Calculate effective cost:
                                                                    let cost = 1;
                                                                    // Check if we ALREADY have a Rank 2 somewhere else (excluding this one if we are unchecking? No, unchecking is always allowed)
                                                                    // If checking:
                                                                    if (e.target.checked) {
                                                                        let hasRank2 = false;

                                                                        // Check Profile
                                                                        if (character.data?.voies?.profile) {
                                                                            character.data.voies.profile.forEach(p => {
                                                                                if (p.ranks?.[1]) hasRank2 = true;
                                                                            });
                                                                        }

                                                                        // If this is the FIRST Rank 2, cost is 0
                                                                        if (!hasRank2) cost = 0;
                                                                    }

                                                                    if (spentPoints + cost > maxStartingPoints) {
                                                                        alert(`Vous avez déjà dépensé vos ${maxStartingPoints} points !`);
                                                                        return;
                                                                    }
                                                                } else if (character.level === 0 && rank !== 1) {
                                                                    // Normal check for non-mage rank 2 or other ranks
                                                                    if (spentPoints >= maxStartingPoints && e.target.checked) {
                                                                        alert(`Vous avez déjà dépensé vos ${maxStartingPoints} points !`);
                                                                        return;
                                                                    }
                                                                }

                                                                const newRanks = [...(character.data?.voies?.racial?.ranks || [])];

                                                                // Rule: Prerequisite
                                                                if (e.target.checked && rank > 1 && !newRanks[rank - 2]) {
                                                                    alert("Vous devez posséder le rang précédent !");
                                                                    return;
                                                                }

                                                                newRanks[rank - 1] = e.target.checked;
                                                                setCharacter(prev => ({
                                                                    ...prev,
                                                                    data: {
                                                                        ...prev.data!,
                                                                        voies: {
                                                                            ...prev.data!.voies!,
                                                                            racial: { ...prev.data!.voies!.racial!, ranks: newRanks }
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                        />

                                                        {/* Custom Checkbox UI */}
                                                        <div className={`mt-0.5 w-5 h-5 rounded-full border transition-all duration-300 flex items-center justify-center ${isActive
                                                            ? 'bg-gradient-to-br from-primary-400 to-primary-600 border-primary-300 shadow-[0_0_15px_rgba(234,179,8,0.6)]'
                                                            : 'bg-stone-900 border-stone-600 hover:border-primary-500/50'
                                                            }`}>
                                                            {isActive && <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] animate-pulse" />}
                                                        </div>

                                                        <div className="flex flex-col leading-tight pt-0.5">
                                                            <span className={`font-bold text-[10px] uppercase tracking-[0.1em] ${isActive ? 'text-primary-400' : 'text-stone-500'}`}>
                                                                Rang {rank}
                                                                {/* Mage Free Rank 2 Badge */}
                                                                {isMageFamily && rank === 2 && character.level === 0 && (
                                                                    (() => {
                                                                        const hasOtherRank2 = character.data?.voies?.profile?.some(p => p.ranks?.[1]);
                                                                        const isThisSelected = isActive;
                                                                        // Show badge if:
                                                                        // 1. This is selected (it IS the free one)
                                                                        // 2. OR No other rank 2 is selected (it COULD be the free one) AND Rank 1 is selected
                                                                        if (isThisSelected || (!hasOtherRank2 && character.data?.voies?.racial?.ranks?.[0])) {
                                                                            return <span className="text-green-400 ml-2 animate-pulse">(Gratuit)</span>;
                                                                        }
                                                                        return null;
                                                                    })()
                                                                )}
                                                            </span>
                                                            {cap && <span className={`font-display text-sm transition-colors duration-300 ${isActive ? 'text-white text-shadow-md' : 'text-stone-400'}`}>{cap.name}</span>}
                                                        </div>
                                                    </label>
                                                </Tooltip>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Profile Voies */}
                            {[0, 1, 2, 3, 4].map((vIdx) => {
                                const voie = character.data?.voies?.profile?.[vIdx] || { name: '', ranks: [] };
                                const isCreation = character.level === 0;

                                // Fetch Profile and available voies logic removed as we display all
                                // const profileId = ... (removed)
                                // const profile = ... (removed)

                                return (
                                    <div key={vIdx} className={`glass-panel p-5 rounded-2xl border-primary-500/10 bg-stone-900/10 transition-all group/voie overflow-visible ${isCreation ? '' : 'hover:border-primary-500/20'}`}>
                                        <div className="mb-5 space-y-2">
                                            <h3 className="text-stone-600/70 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">Voie de Profil {vIdx + 1}</h3>
                                            <div className="flex gap-2 items-center">
                                                <div className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-2 text-lg font-display font-bold text-white shadow-inner">
                                                    {voie.name || '...'}
                                                </div>

                                                {!isCreation && (
                                                    <Tooltip content={{ name: "Remplacer par une Voie de Prestige", description: "Cliquez pour choisir une voie de prestige à la place de cette voie." }} theme="primary">
                                                        <button
                                                            className={`p-2 rounded-lg border transition-all ${showPrestigeSelector[vIdx] ? 'bg-amber-900/20 border-amber-500/50 text-amber-500' : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-amber-500 hover:border-amber-500/50'}`}
                                                            onClick={() => setShowPrestigeSelector(prev => ({ ...prev, [vIdx]: !prev[vIdx] }))}
                                                        >
                                                            <RefreshCw size={18} />
                                                        </button>
                                                    </Tooltip>
                                                )}
                                            </div>
                                            {showPrestigeSelector[vIdx] && (
                                                <select
                                                    className="w-full bg-stone-950/50 border border-amber-900/30 rounded px-3 py-2 text-xs text-amber-500 outline-none focus:border-amber-500/50 transition-all animate-in fade-in slide-in-from-top-1"
                                                    onChange={(e) => {
                                                        if (!e.target.value) return;
                                                        const confirmReplace = confirm("Remplacer la voie actuelle par la voie de prestige sélectionnée ? La progression sera réinitialisée.");
                                                        if (confirmReplace) {
                                                            const newProfileVoies = [...(character.data?.voies?.profile || [])];
                                                            newProfileVoies[vIdx] = { name: e.target.value, ranks: [false, false, false, false, false] };
                                                            setCharacter(prev => ({
                                                                ...prev,
                                                                data: {
                                                                    ...prev.data!,
                                                                    voies: { ...prev.data!.voies!, profile: newProfileVoies }
                                                                }
                                                            }));
                                                            setShowPrestigeSelector(prev => ({ ...prev, [vIdx]: false }));
                                                        }
                                                        e.target.value = "";
                                                    }}
                                                >
                                                    <option value="">-- Sélectionner une Voie de Prestige --</option>
                                                    {prestigePaths.map((p: any) => (
                                                        <option key={p.id} value={p.name}>{p.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div className="space-y-2.5 overflow-visible">
                                            {[1, 2, 3, 4, 5].map(rank => {
                                                const cap = getCapabilityName(voie.name, rank);
                                                const isActive = voie.ranks?.[rank - 1] || false;

                                                return (
                                                    <div key={rank} className="relative">
                                                        {/* Connecting Line */}
                                                        {rank < 5 && (
                                                            <div className={`absolute left-[22px] top-10 bottom-0 w-0.5 z-0 transition-colors duration-500 ${isActive && (voie.ranks?.[rank] || false) ? 'bg-primary-500/30' : 'bg-stone-800/30'}`} />
                                                        )}

                                                        <Tooltip content={cap ? { name: cap.name, description: cap.description } : { name: `Rang ${rank}`, description: '' }} theme="primary">
                                                            <label className={`relative z-10 flex items-start gap-4 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${isActive
                                                                ? 'bg-primary-950/20 border-primary-500/40 shadow-[0_0_20px_-5px_rgba(234,179,8,0.2)]'
                                                                : 'bg-stone-950/40 border-white/5 hover:bg-stone-900/60 hover:border-white/10'
                                                                }`}>
                                                                <input
                                                                    type="checkbox"
                                                                    className="hidden"
                                                                    checked={isActive}
                                                                    onChange={e => {
                                                                        const newProfileVoies = [...(character.data?.voies?.profile || [])];
                                                                        const newRanks = [...(newProfileVoies[vIdx].ranks || [])];

                                                                        // Level 0 Logic
                                                                        if (character.level === 0) {
                                                                            // Only Rank 1 and 2 allowed
                                                                            if (rank > 2) {
                                                                                alert("Au niveau 0, seuls les Rangs 1 et 2 sont accessibles.");
                                                                                return;
                                                                            }

                                                                            if (e.target.checked) {
                                                                                // Check limits
                                                                                let cost = 1;

                                                                                // Mage Free Rank 2 Logic
                                                                                if (rank === 2 && isMageFamily) {
                                                                                    let hasRank2 = false;
                                                                                    // Check Racial
                                                                                    if (character.data?.voies?.racial?.ranks?.[1]) hasRank2 = true;

                                                                                    // Check Profiles (excluding this one? No, current state doesn't have it yet)
                                                                                    if (!hasRank2 && character.data?.voies?.profile) {
                                                                                        character.data.voies.profile.forEach((p, idx) => {
                                                                                            if (idx !== vIdx && p.ranks?.[1]) hasRank2 = true;
                                                                                        });
                                                                                    }
                                                                                    if (!hasRank2) cost = 0;
                                                                                }

                                                                                if (spentPoints + cost > maxStartingPoints) {
                                                                                    alert(`Vous avez déjà dépensé vos ${maxStartingPoints} points !`);
                                                                                    return;
                                                                                }
                                                                                // Prerequisite constraint for Rank 2
                                                                                if (rank === 2 && !newRanks[0]) {
                                                                                    alert("Vous devez prendre le Rang 1 avant le Rang 2.");
                                                                                    return;
                                                                                }
                                                                            } else {
                                                                                // Deselecting
                                                                                // If deselecting Rank 1, must deselect Rank 2 if present
                                                                                if (rank === 1 && newRanks[1]) {
                                                                                    newRanks[1] = false;
                                                                                }
                                                                            }

                                                                        } else {
                                                                            // Normal Play
                                                                            if (e.target.checked && rank > 1 && !newRanks[rank - 2]) {
                                                                                alert("Vous devez posséder le rang précédent !");
                                                                                return;
                                                                            }
                                                                        }

                                                                        newRanks[rank - 1] = e.target.checked;
                                                                        newProfileVoies[vIdx].ranks = newRanks;

                                                                        setCharacter(prev => ({
                                                                            ...prev,
                                                                            data: {
                                                                                ...prev.data!,
                                                                                voies: { ...prev.data!.voies!, profile: newProfileVoies }
                                                                            }
                                                                        }));
                                                                    }}
                                                                />

                                                                {/* Custom Checkbox UI (Gem Node) */}
                                                                <div className={`mt-0.5 w-5 h-5 rounded rotate-45 border transition-all duration-300 flex items-center justify-center ${isActive
                                                                    ? 'bg-gradient-to-br from-primary-400 to-primary-600 border-primary-300 shadow-[0_0_15px_rgba(234,179,8,0.6)]'
                                                                    : 'bg-stone-900 border-stone-600 hover:border-primary-500/50'
                                                                    }`}>
                                                                    {isActive && <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] animate-pulse" />}
                                                                </div>

                                                                <div className="flex flex-col leading-tight pt-0.5">
                                                                    <span className={`font-bold text-[10px] uppercase tracking-[0.1em] ${isActive ? 'text-primary-400' : 'text-stone-500'}`}>
                                                                        Rang {rank}
                                                                        {/* Mage Free Rank 2 Badge */}
                                                                        {isMageFamily && rank === 2 && character.level === 0 && (
                                                                            (() => {
                                                                                // Check if Racial has Rank 2
                                                                                const racialHasRank2 = character.data?.voies?.racial?.ranks?.[1];
                                                                                // Check if any OTHER Profile has Rank 2
                                                                                const otherProfileHasRank2 = character.data?.voies?.profile?.some((p, idx) => idx !== vIdx && p.ranks?.[1]);

                                                                                const hasOtherRank2 = racialHasRank2 || otherProfileHasRank2;
                                                                                const isThisSelected = isActive;
                                                                                const isRank1Selected = voie.ranks?.[0];

                                                                                // Show badge if:
                                                                                // 1. This is selected (it IS the free one)
                                                                                // 2. OR No other rank 2 is selected (it COULD be the free one) AND Rank 1 is selected
                                                                                if (isThisSelected || (!hasOtherRank2 && isRank1Selected)) {
                                                                                    return <span className="text-green-400 ml-2 animate-pulse">(Gratuit)</span>;
                                                                                }
                                                                                return null;
                                                                            })()
                                                                        )}
                                                                    </span>
                                                                    {cap && <span className={`font-display text-sm transition-colors duration-300 ${isActive ? 'text-white text-shadow-md' : 'text-stone-400'}`}>{cap.name}</span>}
                                                                </div>
                                                            </label>
                                                        </Tooltip>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Prestige Voies - Separate Section */}
                        {(character.data?.voies?.prestige && character.data.voies.prestige.length > 0) && (
                            <div className="space-y-4 overflow-visible">
                                <h3 className="text-xl font-display font-bold text-amber-400/80 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    Voies de Prestige
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible">
                                    {character.data.voies.prestige.map((voie, vIdx) => (
                                        <div key={`prestige-${vIdx}`} className="glass-panel p-5 rounded-2xl border-amber-500/20 bg-stone-900/10 hover:border-amber-500/30 transition-all group/voie overflow-visible">
                                            <div className="mb-5 space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <h3 className="text-amber-600/70 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">Voie de Prestige</h3>
                                                    <button
                                                        onClick={() => {
                                                            const newPrestige = (character.data?.voies?.prestige || []).filter((_, i) => i !== vIdx);
                                                            setCharacter(prev => ({
                                                                ...prev,
                                                                data: { ...prev.data!, voies: { ...prev.data!.voies!, prestige: newPrestige } }
                                                            }));
                                                        }}
                                                        className="text-stone-600 hover:text-red-500 transition-colors p-1"
                                                        title="Supprimer cette voie"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-2 text-lg font-display font-bold text-amber-500 outline-none focus:border-amber-500/50 transition-all shadow-inner"
                                                    placeholder="Nom de la voie de prestige"
                                                    value={voie.name}
                                                    onChange={e => {
                                                        const newPrestige = [...(character.data?.voies?.prestige || [])];
                                                        newPrestige[vIdx] = { ...newPrestige[vIdx], name: e.target.value };
                                                        setCharacter(prev => ({
                                                            ...prev,
                                                            data: { ...prev.data!, voies: { ...prev.data!.voies!, prestige: newPrestige } }
                                                        }));
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2.5 overflow-visible">
                                                {[1, 2, 3, 4, 5].map(rank => {
                                                    const cap = getCapabilityName(voie.name, rank);
                                                    const isActive = voie.ranks?.[rank - 1] || false;

                                                    return (
                                                        <div key={rank} className="relative">
                                                            {/* Connecting Line */}
                                                            {rank < 5 && (
                                                                <div className={`absolute left-[22px] top-10 bottom-0 w-0.5 z-0 transition-colors duration-500 ${isActive && (voie.ranks?.[rank] || false) ? 'bg-amber-500/30' : 'bg-stone-800/30'}`} />
                                                            )}

                                                            <Tooltip content={cap ? { name: cap.name, description: cap.description } : { name: `Rang ${rank}`, description: '' }} theme="amber">
                                                                <label className={`relative z-10 flex items-start gap-4 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${isActive
                                                                    ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]'
                                                                    : 'bg-stone-950/40 border-white/5 hover:bg-stone-900/60 hover:border-white/10'
                                                                    }`}>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="hidden"
                                                                        checked={isActive}
                                                                        onChange={e => {
                                                                            const newPrestige = [...(character.data?.voies?.prestige || [])];
                                                                            const newRanks = [...(newPrestige[vIdx].ranks || [false, false, false, false, false])];
                                                                            newRanks[rank - 1] = e.target.checked;
                                                                            newPrestige[vIdx].ranks = newRanks;
                                                                            setCharacter(prev => ({
                                                                                ...prev,
                                                                                data: { ...prev.data!, voies: { ...prev.data!.voies!, prestige: newPrestige } }
                                                                            }));
                                                                        }}
                                                                    />
                                                                    {/* Custom Checkbox UI (Gem Node) */}
                                                                    <div className={`mt-0.5 w-5 h-5 rounded rotate-45 border transition-all duration-300 flex items-center justify-center ${isActive
                                                                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                                                                        : 'bg-stone-900 border-stone-600 hover:border-amber-500/50'
                                                                        }`}>
                                                                        {isActive && <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] animate-pulse" />}
                                                                    </div>
                                                                    <div className="flex flex-col leading-tight pt-0.5">
                                                                        <span className={`font-bold text-[10px] uppercase tracking-[0.1em] ${isActive ? 'text-amber-400' : 'text-stone-500'}`}>
                                                                            Rang {rank}
                                                                        </span>
                                                                        {cap && <span className={`font-display text-sm transition-colors duration-300 ${isActive ? 'text-white text-shadow-md' : 'text-stone-400'}`}>{cap.name}</span>}
                                                                    </div>
                                                                </label>
                                                            </Tooltip>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add Prestige Voie Button */}
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => {
                                    const newPrestige = [...(character.data?.voies?.prestige || [])];
                                    newPrestige.push({ name: '', ranks: [false, false, false, false, false] });
                                    setCharacter(prev => ({
                                        ...prev,
                                        data: { ...prev.data!, voies: { ...prev.data!.voies!, prestige: newPrestige } }
                                    }));
                                }}
                                className="flex items-center gap-2 px-6 py-3 rounded-full bg-stone-900/50 border border-amber-500/30 text-amber-500/70 hover:text-amber-400 hover:border-amber-500/50 hover:bg-stone-900 transition-all group font-display font-bold uppercase text-[10px] tracking-[0.2em]"
                            >
                                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                Ajouter une Voie de Prestige
                            </button>
                        </div>
                    </div>
                </div>
                {/* Equipment Choice Modal */}
                <EquipmentChoiceModal
                    isOpen={showEquipmentModal}
                    title={`Votre profil vous offre un choix d'équipement (${currentChoiceIndex + 1}/${equipmentChoiceQueue.length}) :`}
                    choices={equipmentChoiceQueue[currentChoiceIndex] || []}
                    onSelect={(choice) => {
                        // Add selected item
                        const newData = { ...character.data! };
                        addEquipmentItem(choice, newData);

                        setCharacter(prev => ({
                            ...prev,
                            data: newData
                        }));

                        // Advance queue
                        const nextIndex = currentChoiceIndex + 1;
                        if (nextIndex < equipmentChoiceQueue.length) {
                            setCurrentChoiceIndex(nextIndex);
                        } else {
                            setShowEquipmentModal(false);
                            setEquipmentChoiceQueue([]);
                            setCurrentChoiceIndex(0);
                        }
                    }}
                />
            </div>
        </div >
    );
};
