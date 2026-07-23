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
import { PhysicalBlock } from '../components/character/PhysicalBlock';
import { RoleplaySection } from '../components/character/RoleplaySection';
import { LanguagesTalentsPanel } from '../components/character/LanguagesTalentsPanel';
import { ProtectionSection } from '../components/character/ProtectionSection';
import { WeaponsSection } from '../components/character/WeaponsSection';
import { MasteriesBlock } from '../components/character/MasteriesBlock';
import { MagicItemsPanel } from '../components/character/MagicItemsPanel';
import { UsagesPanel } from '../components/character/UsagesPanel';
import { CompanionsPanel } from '../components/character/CompanionsPanel';
import { CaracSubstitutionsPanel } from '../components/character/CaracSubstitutionsPanel';
import { ActiveStatesPanel } from '../components/character/ActiveStatesPanel';
import { TransformationPanel } from '../components/character/TransformationPanel';
import { RestPanel } from '../components/character/RestPanel';
import { ChoicesPanel } from '../components/character/ChoicesPanel';
import { RacialGrantPanel } from '../components/character/RacialGrantPanel';
import { Section } from '../components/character/Section';
import { InventorySection } from '../components/character/InventorySection';
import { VoiesTree } from '../components/character/VoiesTree';
import { HpByLevelEditor } from '../components/character/HpByLevelEditor';

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
        maxHp, baseMaxHp, mainFamily, damageReduction, luckPoints, manaPoints, recoveryDieString, recoveryInfo, bonuses, armorCap, caracTestBonuses, racialGrant,
        spentPoints, maxStartingPoints,
        selectedVoies, setSelectedVoies,
        selectedProfileType, setSelectedProfileType,
        racialBonusChoices, setRacialBonusChoices,
        racialVoieOptions,
        isMageFamily,
        mageReplacedRaceVoie, setMageReplacedRaceVoie,
        showEquipmentModal, setShowEquipmentModal,
        equipmentChoiceQueue, setEquipmentChoiceQueue,
        currentChoiceIndex, setCurrentChoiceIndex,
        profileValues,
        handleSave, updateStat, getCapabilityName, getVoieName, getResolvedDice, addEquipmentItem,
    } = useCharacterSheet({ races, profiles, allVoies, id, isNew, navigate, campaignId });

    // Voies groupées par profil (IRI + nom), pour permettre le choix de voies hors profil
    // principal (profils hybrides, COF2 chap. 9). La progression suit chaque voie choisie.
    const voieOptionsByProfile = (profiles as any[])
        .map(p => ({
            profile: p.name as string,
            voies: ((p.voies || []) as any[])
                .map(v => ({ iri: (v['@id'] || '') as string, name: (v.name || '') as string }))
                .filter(v => v.iri && v.name),
        }))
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
                        caracTestBonuses={caracTestBonuses}
                    />


                    {/* Main Stats Row - Moved to Left Column */}
                    <MainStatsPanel
                        character={character}
                        setCharacter={setCharacter}
                        combatStats={combatStats}
                        mods={mods}
                        evolutiveDie={evolutiveDie}
                        maxHp={maxHp}
                        damageReduction={damageReduction}
                        luckMax={luckPoints}
                        manaMax={manaPoints}
                        recoveryDie={recoveryDieString}
                        attackBonus={bonuses.attaque}
                        dmBonus={bonuses.dm}
                    />

                    <HpByLevelEditor character={character} setCharacter={setCharacter} mainFamily={mainFamily} />
                </div>


                {/* Center/Right Column: Identity & Combat (75%) — regroupée en sections repliables */}
                <div className="lg:col-span-9 space-y-8">

                    <Section title="Identité">
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
                        <PhysicalBlock character={character} setCharacter={setCharacter} races={races} />
                    </Section>

                    <Section title="Rôleplay & langues">
                        <RoleplaySection character={character} setCharacter={setCharacter} />
                        <LanguagesTalentsPanel character={character} setCharacter={setCharacter} intMod={mods.INT} races={races} />
                    </Section>

                    <Section title="Équipement">
                        <ProtectionSection
                            character={character}
                            setCharacter={setCharacter}
                            allArmors={allArmors}
                            armorCap={armorCap}
                        />
                        <WeaponsSection character={character} setCharacter={setCharacter} allWeapons={allWeapons} />
                        <MasteriesBlock character={character} profiles={profiles} />
                        <InventorySection character={character} setCharacter={setCharacter} />
                        <MagicItemsPanel character={character} setCharacter={setCharacter} />
                    </Section>

                    <Section title="Voies & Progression">
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
                            getVoieName={getVoieName}
                            getResolvedDice={getResolvedDice}
                            prestigePaths={prestigePaths}
                            voieOptionsByProfile={voieOptionsByProfile}
                        />
                        <ChoicesPanel character={character} setCharacter={setCharacter} races={races} profiles={profiles} allVoies={allVoies} />
                        {racialGrant && <RacialGrantPanel character={character} setCharacter={setCharacter} profiles={profiles} grant={racialGrant} />}
                    </Section>

                    <Section title="En jeu (aide de table)">
                        <RestPanel character={character} setCharacter={setCharacter} maxHp={baseMaxHp} maxMana={manaPoints} recovery={recoveryInfo} />
                        <UsagesPanel character={character} setCharacter={setCharacter} />
                        <ActiveStatesPanel character={character} setCharacter={setCharacter} />
                        <CompanionsPanel character={character} setCharacter={setCharacter} />
                        <TransformationPanel character={character} setCharacter={setCharacter} />
                        <CaracSubstitutionsPanel character={character} setCharacter={setCharacter} />
                    </Section>
                </div>
                {/* Equipment Choice Modal */}
                <EquipmentChoiceModal
                    isOpen={showEquipmentModal}
                    title={`Votre profil vous offre un choix d'équipement (${currentChoiceIndex + 1}/${equipmentChoiceQueue.length}) :`}
                    choices={equipmentChoiceQueue[currentChoiceIndex] || []}
                    onSelect={(choice) => {
                        // Add selected item to the play state
                        const nextPlayState = { ...character.playState! };
                        addEquipmentItem(choice, nextPlayState);

                        setCharacter(prev => ({
                            ...prev,
                            playState: nextPlayState
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
