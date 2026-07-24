import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Sword, Plus, X, Edit, Trash2, Play, Sparkles } from 'lucide-react';
import { saveCampaign } from '../../services/campaignService';
import {
    loadEncounterIntoTracker, trackerHasCombat, generateEncounter, threatLabel,
    DIFFICULTIES, type EncounterDifficulty, type GeneratorCreature,
} from '../../utils/encounters';
import type { Campaign, Encounter, EncounterCombatant } from '../../types/campaign';
import type { Creature, CustomCreature } from '../../types/normalized';

const CUSTOM_PREFIX = 'custom-';

interface Props {
    campaign: Campaign;
    partySize: number;
    partyAvgLevel: number;
    creatures: Creature[];
    customMonsters: CustomCreature[];
    /** Appelé avec la campagne renvoyée par l'API après sauvegarde d'un roster. */
    onCampaignSaved: (campaign: Campaign) => void;
}

/**
 * Section « Rencontres » de la fiche de campagne (extraite de CampaignDetail) :
 * liste des rencontres préparées, générateur calibré sur le groupe, éditeur de roster
 * et lancement dans le Suivi de Combat. Ne connaît de la campagne que ses rencontres.
 */
export const CampaignEncounters: React.FC<Props> = ({
    campaign, partySize, partyAvgLevel, creatures, customMonsters, onCampaignSaved,
}) => {
    const navigate = useNavigate();
    const encounters = campaign.encounters || [];

    const [showEncounterModal, setShowEncounterModal] = useState(false);
    const [editingEncounterId, setEditingEncounterId] = useState<string | null>(null);
    const [encounterName, setEncounterName] = useState('');
    const [encounterRoster, setEncounterRoster] = useState<EncounterCombatant[]>([]);
    const [pickerId, setPickerId] = useState('');
    const [pickerQty, setPickerQty] = useState('1');
    const [genEnv, setGenEnv] = useState('');
    const [genDifficulty, setGenDifficulty] = useState<EncounterDifficulty>('normale');
    const [genPartySize, setGenPartySize] = useState('');
    const [genAvgLevel, setGenAvgLevel] = useState('');

    const availableEnvironments = Array.from(
        new Set(creatures.map(c => c.environment).filter((e): e is string => !!e && e.trim() !== '')),
    ).sort((a, b) => a.localeCompare(b));

    const creaturePool: GeneratorCreature[] = [
        ...creatures.map(c => ({
            referenceId: String(c.id), name: c.name, source: 'bestiary' as const,
            nc: c.nc, hp: c.hp, def: c.def, init: c.init, per: c.stats?.PER ?? 0, environment: c.environment,
        })),
        ...customMonsters.map(c => ({
            referenceId: `${CUSTOM_PREFIX}${c.id}`, name: c.name, source: 'custom' as const,
            nc: c.nc, hp: c.hp, def: c.def, init: c.init, per: c.stats?.PER ?? 0, environment: c.environment,
        })),
    ];

    // Base groupe effective (saisie du générateur, sinon défaut campagne).
    const effPartySize = Math.max(1, parseInt(genPartySize) || partySize || 4);
    const effAvgLevel = Math.max(1, parseInt(genAvgLevel) || partyAvgLevel || 1);

    const openCreateEncounter = () => {
        setEditingEncounterId(null);
        setEncounterName('');
        setEncounterRoster([]);
        setPickerId('');
        setPickerQty('1');
        setGenPartySize(partySize > 0 ? String(partySize) : '');
        setGenAvgLevel(partyAvgLevel > 0 ? String(partyAvgLevel) : '');
        setGenEnv(availableEnvironments[0] || '');
        setGenDifficulty('normale');
        setShowEncounterModal(true);
    };

    const handleGenerate = () => {
        if (!genEnv) return;
        const roster = generateEncounter({
            pool: creaturePool,
            environment: genEnv,
            difficulty: genDifficulty,
            partySize: effPartySize,
            avgLevel: effAvgLevel,
        });
        if (roster.length === 0) {
            alert("Aucune créature de cet environnement ne rentre dans le budget. Essaie une autre difficulté ou un autre environnement.");
            return;
        }
        setEncounterRoster(roster);
        if (!encounterName.trim()) setEncounterName(`Rencontre — ${genEnv} (${genDifficulty})`);
    };

    const openEditEncounter = (enc: Encounter) => {
        setEditingEncounterId(enc.id);
        setEncounterName(enc.name);
        setEncounterRoster(enc.combatants.map(c => ({ ...c })));
        setShowEncounterModal(true);
    };

    // Ajoute une créature (SRD ou monstre custom) au roster, avec sa quantité.
    const addRosterEntry = () => {
        const isCustom = pickerId.startsWith(CUSTOM_PREFIX);
        const source: EncounterCombatant['source'] = isCustom ? 'custom' : 'bestiary';
        const creature = isCustom
            ? customMonsters.find(c => `${CUSTOM_PREFIX}${c.id}` === pickerId)
            : creatures.find(c => String(c.id) === pickerId);
        if (!creature) return;
        const qty = Math.max(1, parseInt(pickerQty) || 1);
        setEncounterRoster(prev => [...prev, {
            name: creature.name,
            source,
            referenceId: pickerId,
            quantity: qty,
            initiative: creature.init,
            hp: creature.hp,
            def: creature.def,
            per: creature.stats?.PER ?? 0,
            nc: creature.nc,
        }]);
        setPickerId('');
        setPickerQty('1');
    };

    const removeRosterEntry = (index: number) =>
        setEncounterRoster(prev => prev.filter((_, i) => i !== index));

    const handleSaveEncounter = async () => {
        if (!encounterName.trim() || encounterRoster.length === 0) return;
        const encounter: Encounter = {
            id: editingEncounterId || crypto.randomUUID(),
            name: encounterName.trim(),
            combatants: encounterRoster,
        };
        const updated = editingEncounterId
            ? encounters.map(e => (e.id === editingEncounterId ? encounter : e))
            : [...encounters, encounter];
        const saved = await saveCampaign({ ...campaign, encounters: updated });
        onCampaignSaved(saved);
        setShowEncounterModal(false);
    };

    const handleDeleteEncounter = async (encounterId: string) => {
        if (!confirm('Supprimer cette rencontre ?')) return;
        const updated = encounters.filter(e => e.id !== encounterId);
        const saved = await saveCampaign({ ...campaign, encounters: updated });
        onCampaignSaved(saved);
    };

    const handleLaunchEncounter = (enc: Encounter) => {
        if (trackerHasCombat() && !confirm('Un combat est déjà en cours dans le Suivi de Combat. Le remplacer par cette rencontre ?')) return;
        loadEncounterIntoTracker(enc);
        navigate('/tools/tracker');
    };

    return (
        <>
            {/* Rencontres */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Sword size={16} className="text-red-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400">Rencontres</h3>
                    <span className="text-xs text-stone-600">{encounters.length}</span>
                </div>
                {encounters.length > 0 && (
                    <ul className="space-y-2 mb-3">
                        {encounters.map(enc => {
                            const total = enc.combatants.reduce((n, c) => n + (c.quantity || 1), 0);
                            const threat = threatLabel(enc.combatants, partySize, partyAvgLevel);
                            return (
                                <li key={enc.id} className="bg-black/20 rounded-lg px-3 py-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="truncate text-stone-200 font-medium">{enc.name}</span>
                                                {threat && (
                                                    <span className={clsx("text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border", threat.tone)}>
                                                        {threat.label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {enc.combatants.map((cb, i) => (
                                                    <span key={i} className="text-[11px] text-stone-400 bg-stone-800/60 rounded px-1.5 py-0.5">
                                                        {cb.quantity > 1 && <span className="text-red-300 font-bold">{cb.quantity}× </span>}{cb.name}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-[10px] text-stone-600 mt-1">{total} créature{total > 1 ? 's' : ''}</div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => handleLaunchEncounter(enc)} className="p-1.5 text-red-300 hover:text-red-200 hover:bg-red-900/30 rounded-lg transition-colors" title="Lancer dans le Suivi de Combat">
                                                <Play size={16} />
                                            </button>
                                            <button onClick={() => openEditEncounter(enc)} className="p-1.5 text-stone-400 hover:text-primary-400 transition-colors" title="Modifier">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteEncounter(enc.id)} className="p-1.5 text-stone-500 hover:text-red-400 transition-colors" title="Supprimer">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <button
                    onClick={openCreateEncounter}
                    className="w-full py-2 rounded-lg border border-dashed border-stone-700 text-stone-500 hover:border-red-500 hover:text-red-400 transition-all text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Créer une rencontre
                </button>
            </div>

            {/* Modale « Créer / modifier une rencontre » */}
            {showEncounterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowEncounterModal(false)}>
                    <div className="glass-panel rounded-2xl border border-white/10 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <h3 className="font-display font-bold text-lg text-stone-100">{editingEncounterId ? 'Modifier la rencontre' : 'Créer une rencontre'}</h3>
                            <button onClick={() => setShowEncounterModal(false)} className="text-stone-400 hover:text-stone-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-1">Nom de la rencontre</label>
                                <input
                                    value={encounterName}
                                    onChange={e => setEncounterName(e.target.value)}
                                    placeholder="Embuscade sur la route du col"
                                    className="w-full bg-black/40 border border-white/10 text-stone-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                            </div>

                            {/* ⚡ Générateur : environnement + difficulté, calibré sur le groupe */}
                            <div className="rounded-lg border border-primary-500/20 bg-primary-900/10 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-primary-300">
                                    <Sparkles size={16} /> Générer une rencontre
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="text-xs text-stone-400">
                                        Taille du groupe
                                        <input
                                            type="number" min="1" value={genPartySize}
                                            onChange={e => setGenPartySize(e.target.value)}
                                            placeholder={partySize > 0 ? String(partySize) : '4'}
                                            className="mt-1 w-full bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                    </label>
                                    <label className="text-xs text-stone-400">
                                        Niveau moyen
                                        <input
                                            type="number" min="1" value={genAvgLevel}
                                            onChange={e => setGenAvgLevel(e.target.value)}
                                            placeholder={partyAvgLevel > 0 ? String(partyAvgLevel) : '1'}
                                            className="mt-1 w-full bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                    </label>
                                </div>
                                <label className="block text-xs text-stone-400">
                                    Environnement
                                    <select
                                        value={genEnv}
                                        onChange={e => setGenEnv(e.target.value)}
                                        className="mt-1 w-full bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    >
                                        {availableEnvironments.length === 0 && <option value="">—</option>}
                                        {availableEnvironments.map(env => <option key={env} value={env}>{env}</option>)}
                                    </select>
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {DIFFICULTIES.map(d => (
                                        <button
                                            key={d} type="button" onClick={() => setGenDifficulty(d)}
                                            className={clsx(
                                                "px-2.5 py-1 rounded-lg text-xs font-bold capitalize border transition-colors",
                                                genDifficulty === d ? "bg-primary-600 text-stone-950 border-primary-500" : "bg-stone-800/60 text-stone-400 border-white/10 hover:text-stone-200",
                                            )}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button" onClick={handleGenerate} disabled={!genEnv}
                                    className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-bold rounded-lg px-4 py-2 transition-colors"
                                >
                                    <Sparkles size={16} /> Générer{encounterRoster.length > 0 ? ' (remplace le roster)' : ''}
                                </button>
                            </div>

                            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-stone-500">
                                <div className="h-px flex-1 bg-white/10" /> ou composer à la main <div className="h-px flex-1 bg-white/10" />
                            </div>

                            {/* Sélecteur de créature + quantité */}
                            <div className="flex flex-wrap gap-2 items-end">
                                <select
                                    value={pickerId}
                                    onChange={e => setPickerId(e.target.value)}
                                    className="flex-1 min-w-[160px] bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                >
                                    <option value="">— Créature —</option>
                                    {customMonsters.length > 0 && (
                                        <optgroup label="Mes monstres">
                                            {customMonsters.map(c => (
                                                <option key={`${CUSTOM_PREFIX}${c.id}`} value={`${CUSTOM_PREFIX}${c.id}`}>{c.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {creatures.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                                </select>
                                <input
                                    type="number" min="1" value={pickerQty}
                                    onChange={e => setPickerQty(e.target.value)}
                                    className="w-16 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                                <button
                                    onClick={addRosterEntry}
                                    disabled={!pickerId}
                                    className="bg-red-900/40 hover:bg-red-800/60 disabled:opacity-40 disabled:cursor-not-allowed text-red-200 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/30 transition-colors"
                                >
                                    + Ajouter
                                </button>
                            </div>

                            {/* Roster */}
                            {encounterRoster.length === 0 ? (
                                <p className="text-stone-500 text-sm italic">Ajoute des créatures au roster.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {encounterRoster.map((entry, i) => (
                                        <li key={i} className="flex items-center justify-between gap-2 bg-black/30 border border-white/5 rounded-lg px-3 py-2">
                                            <span className="text-stone-200">
                                                {entry.quantity > 1 && <span className="text-red-300 font-bold">{entry.quantity}× </span>}
                                                {entry.name}
                                                <span className="text-stone-500 text-sm"> · PV {entry.hp} · DEF {entry.def} · INIT {entry.initiative}</span>
                                            </span>
                                            <button onClick={() => removeRosterEntry(i)} className="shrink-0 text-stone-400 hover:text-red-400" aria-label="Retirer">
                                                <X size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
                            <button onClick={() => setShowEncounterModal(false)} className="border border-white/10 text-stone-300 hover:bg-white/5 rounded-lg px-4 py-2 transition-colors">
                                Annuler
                            </button>
                            <button
                                onClick={handleSaveEncounter}
                                disabled={!encounterName.trim() || encounterRoster.length === 0}
                                className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold rounded-lg px-4 py-2 transition-colors"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
