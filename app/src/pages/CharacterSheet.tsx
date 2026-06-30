import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Tooltip } from '../components/common';
import { EquipmentChoiceModal } from '../components/EquipmentChoiceModal';
import { useCharacterData } from '../hooks/useCharacterData';
import { useCharacterSheet } from '../hooks/useCharacterSheet';
import { CharacterToolbar } from '../components/character/CharacterToolbar';
import { AttributesPanel } from '../components/character/AttributesPanel';
import { MainStatsPanel } from '../components/character/MainStatsPanel';
import { IdentityBlock } from '../components/character/IdentityBlock';
import { RoleplaySection } from '../components/character/RoleplaySection';
import { ProtectionSection } from '../components/character/ProtectionSection';
import { WeaponsSection } from '../components/character/WeaponsSection';
import { InventorySection } from '../components/character/InventorySection';

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
            <CharacterToolbar
                name={character.name || ''}
                isNew={isNew}
                saving={saving}
                onBack={() => navigate('/characters')}
                onSave={handleSave}
                onDelete={async () => {
                    if (confirm("Bannir ce héros définitivement ?")) {
                        await ApiService.delete('characters', id!);
                        navigate('/characters');
                    }
                }}
            />

            {/* Main Sheet Layout - Mimicking the PDF */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Attributes (25%) */}
                <div className="lg:col-span-3 space-y-4">
                    <AttributesPanel
                        character={character}
                        selectedProfileType={selectedProfileType}
                        setSelectedProfileType={setSelectedProfileType}
                        profileValues={profileValues}
                        stats={stats}
                        races={races}
                        racialBonusChoices={racialBonusChoices}
                        setRacialBonusChoices={setRacialBonusChoices}
                        finalStats={finalStats}
                        updateStat={updateStat}
                    />


                    {/* Main Stats Row - Moved to Left Column */}
                    <MainStatsPanel
                        character={character}
                        setCharacter={setCharacter}
                        combatStats={combatStats}
                        mods={mods}
                    />
                </div>


                {/* Center/Right Column: Identity & Combat (75%) */}
                <div className="lg:col-span-9 space-y-6">

                    {/* Identity Block */}
                    <IdentityBlock
                        character={character}
                        setCharacter={setCharacter}
                        races={races}
                        profiles={profiles}
                        addEquipmentItem={addEquipmentItem}
                        setEquipmentChoiceQueue={setEquipmentChoiceQueue}
                        setCurrentChoiceIndex={setCurrentChoiceIndex}
                        setShowEquipmentModal={setShowEquipmentModal}
                    />



                    {/* Roleplay Section */}
                    <RoleplaySection character={character} setCharacter={setCharacter} />


                    {/* Protection Section */}
                    <ProtectionSection
                        character={character}
                        setCharacter={setCharacter}
                        allArmors={allArmors}
                        profiles={profiles}
                    />

                    {/* Weapons Section */}
                    <WeaponsSection character={character} setCharacter={setCharacter} allWeapons={allWeapons} />

                    {/* Equipment Section */}
                    <InventorySection character={character} setCharacter={setCharacter} />

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
