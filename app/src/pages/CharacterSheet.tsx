import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiService } from '../services/api';
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
import { VoiesTree } from '../components/character/VoiesTree';

export const CharacterSheet: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isNew = !id;
    // Créée depuis « Ajouter un PJ » d'une campagne → on rattache la fiche à sa création.
    const campaignParam = searchParams.get('campaign');
    const campaignId = campaignParam ? Number(campaignParam) : undefined;

    // Compendium reference data (races/profiles/equipment/voies)
    const { races, profiles, allWeapons, allArmors, allVoies, prestigePaths } = useCharacterData();

    // Form state, derived values (cofRules) and sync effects
    const {
        character, setCharacter,
        loading, saving,
        stats, mods, finalStats, combatStats, evolutiveDie,
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
    } = useCharacterSheet({ races, profiles, allVoies, id, isNew, navigate, campaignId });

    // Voies groupées par profil, pour permettre le choix de voies hors profil principal
    // (profils hybrides, COF2 chap. 9). La progression et les PV suivent chaque voie choisie.
    const voieOptionsByProfile = (profiles as any[])
        .map(p => ({ profile: p.name as string, voies: ((p.voies || []) as any[]).map(v => v.name).filter(Boolean) as string[] }))
        .filter(g => g.profile && g.voies.length > 0)
        .sort((a, b) => a.profile.localeCompare(b.profile));

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
                        evolutiveDie={evolutiveDie}
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
                    <VoiesTree
                        character={character}
                        setCharacter={setCharacter}
                        spentPoints={spentPoints}
                        maxStartingPoints={maxStartingPoints}
                        isMageFamily={isMageFamily}
                        mageReplacedRaceVoie={mageReplacedRaceVoie}
                        setMageReplacedRaceVoie={setMageReplacedRaceVoie}
                        racialVoieOptions={racialVoieOptions}
                        selectedVoies={selectedVoies}
                        setSelectedVoies={setSelectedVoies}
                        getCapabilityName={getCapabilityName}
                        showPrestigeSelector={showPrestigeSelector}
                        setShowPrestigeSelector={setShowPrestigeSelector}
                        prestigePaths={prestigePaths}
                        voieOptionsByProfile={voieOptionsByProfile}
                    />
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
