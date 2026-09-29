import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { EquipmentChoiceModal } from '../components/EquipmentChoiceModal';
import { useCharacterData } from '../hooks/useCharacterData';
import { useCharacterSheet } from '../hooks/useCharacterSheet';
import { useWizardStep } from '../hooks/useWizardStep';
import { WizardStepBar } from '../components/character/wizard/WizardStepBar';
import { WizardSummaryDrawer } from '../components/character/wizard/WizardSummaryDrawer';
import { WizardCharacterSheetOverlay } from '../components/character/wizard/WizardCharacterSheetOverlay';
import { StepWelcome } from '../components/character/wizard/steps/StepWelcome';
import { StepRace } from '../components/character/wizard/steps/StepRace';
import { StepProfile } from '../components/character/wizard/steps/StepProfile';
import { StepVoies } from '../components/character/wizard/steps/StepVoies';
import { StepAttributes } from '../components/character/wizard/steps/StepAttributes';
import { StepEquipment } from '../components/character/wizard/steps/StepEquipment';
import { StepRoleplay } from '../components/character/wizard/steps/StepRoleplay';
import { StepReview } from '../components/character/wizard/steps/StepReview';

const STEP_LABELS = ['Bienvenue', 'Race', 'Profil', 'Voies', 'Caractéristiques', 'Équipement', 'Rôleplay', 'Résumé'];

const iriOf = (v: unknown): string => (typeof v === 'string' ? v : (v as { '@id'?: string })?.['@id'] || '');

/**
 * Création de personnage guidée, pas à pas — voir le plan
 * `characters/new` uniquement (édition : `CharacterSheet.tsx`, inchangée). Appelle
 * `useCharacterSheet` UNE SEULE fois, exactement comme la fiche classique, et répartit
 * son retour entre les étapes : ce hook (le plus complexe et le plus fragile de l'appli,
 * cf. son historique de régression documenté) n'est pas modifié.
 */
export const CharacterCreationWizard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const campaignParam = searchParams.get('campaign');
    const campaignId = campaignParam ? Number(campaignParam) : undefined;

    const { races, profiles, allArmors, allVoies } = useCharacterData();

    const {
        character, setCharacter,
        saving,
        stats, finalStats, combatStats, maxHp, damageReduction, racialGrant,
        armorCap, armorImpacts, recoveryDieString, luckPoints, manaPoints,
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
        profileValues, caracTestBonuses,
        mods,
        handleSave, updateStat, getCapabilityName, getVoieName, getResolvedDice, addEquipmentItem,
    } = useCharacterSheet({ races, profiles, allVoies, id: undefined, isNew: true, navigate, campaignId });

    const { step, goNext, goBack, goTo } = useWizardStep(STEP_LABELS.length);
    const [showSheet, setShowSheet] = useState(false);

    // Garde-fous : une étape n'est débloquée que si son prérequis est rempli.
    const maxUnlocked = useMemo(() => {
        if (!character.name?.trim()) return 1;
        if (!iriOf(character.race)) return 2;
        if (!iriOf(character.profile)) return 3;
        return STEP_LABELS.length;
    }, [character.name, character.race, character.profile]);

    useEffect(() => {
        if (step > maxUnlocked) goTo(maxUnlocked);
    }, [step, maxUnlocked, goTo]);

    const onSave = async () => {
        await handleSave();
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <StepWelcome character={character} setCharacter={setCharacter} onNext={goNext} />;
            case 2:
                return <StepRace character={character} setCharacter={setCharacter} races={races} onBack={goBack} onNext={goNext} />;
            case 3:
                return (
                    <StepProfile
                        character={character}
                        setCharacter={setCharacter}
                        profiles={profiles}
                        addEquipmentItem={addEquipmentItem}
                        setEquipmentChoiceQueue={setEquipmentChoiceQueue}
                        setCurrentChoiceIndex={setCurrentChoiceIndex}
                        setShowEquipmentModal={setShowEquipmentModal}
                        onBack={goBack}
                        onNext={goNext}
                    />
                );
            case 4:
                return (
                    <StepVoies
                        character={character}
                        setCharacter={setCharacter}
                        races={races}
                        profiles={profiles}
                        allVoies={allVoies}
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
                        racialGrant={racialGrant}
                        onBack={goBack}
                        onNext={goNext}
                    />
                );
            case 5:
                return (
                    <StepAttributes
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
                        onBack={goBack}
                        onNext={goNext}
                    />
                );
            case 6:
                return (
                    <StepEquipment
                        character={character}
                        setCharacter={setCharacter}
                        allArmors={allArmors}
                        profiles={profiles}
                        armorCap={armorCap}
                        armorImpacts={armorImpacts}
                        finalStats={finalStats}
                        onBack={goBack}
                        onNext={goNext}
                    />
                );
            case 7:
                return (
                    <StepRoleplay
                        character={character}
                        setCharacter={setCharacter}
                        races={races}
                        intMod={mods.INT}
                        onBack={goBack}
                        onNext={goNext}
                        nextLabel="Voir le résumé"
                    />
                );
            case 8:
                return (
                    <StepReview
                        character={character}
                        races={races}
                        profiles={profiles}
                        finalStats={finalStats}
                        maxHp={maxHp}
                        combatStats={combatStats}
                        luckPoints={luckPoints}
                        manaPoints={manaPoints}
                        recoveryDieString={recoveryDieString}
                        damageReduction={damageReduction}
                        onBack={goBack}
                        onSave={onSave}
                        saving={saving}
                    />
                );
            default:
                return null;
        }
    };

    const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

    return (
        <div className="min-h-screen w-full animate-fade-in">
            <div className="max-w-2xl mx-auto px-5 md:px-8 py-8 pb-24 space-y-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/characters')}
                        aria-label="Retour à la liste des personnages"
                        className="text-stone-400 hover:text-stone-200 transition-colors -ml-1 p-1"
                    >
                        <ArrowLeft size={18} className="hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex-1 text-center">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500 whitespace-nowrap">
                            Livret du héros · Chapitre {ROMAN[step - 1] ?? step}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowSheet(true)}
                        aria-label="Voir ma fiche de personnage"
                        className="text-stone-400 hover:text-stone-200 transition-colors p-1"
                    >
                        <ScrollText size={18} />
                    </button>
                </div>

                <WizardStepBar labels={STEP_LABELS} current={step} maxUnlocked={maxUnlocked} onJump={goTo} />

                {renderStep()}

                <WizardCharacterSheetOverlay isOpen={showSheet} onClose={() => setShowSheet(false)}>
                    <WizardSummaryDrawer
                        character={character}
                        races={races}
                        profiles={profiles}
                        finalStats={finalStats}
                        maxHp={maxHp}
                        combatStats={combatStats}
                        luckPoints={luckPoints}
                        manaPoints={manaPoints}
                        spentPoints={spentPoints}
                        maxStartingPoints={maxStartingPoints}
                    />
                </WizardCharacterSheetOverlay>

                <EquipmentChoiceModal
                    isOpen={showEquipmentModal}
                    title={`Votre profil vous offre un choix d'équipement (${currentChoiceIndex + 1}/${equipmentChoiceQueue.length}) :`}
                    choices={equipmentChoiceQueue[currentChoiceIndex] || []}
                    onSelect={(choice) => {
                        const nextPlayState = { ...character.playState! };
                        addEquipmentItem(choice, nextPlayState);
                        setCharacter(prev => ({ ...prev, playState: nextPlayState }));

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
        </div>
    );
};
