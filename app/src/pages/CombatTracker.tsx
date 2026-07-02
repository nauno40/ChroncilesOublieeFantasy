import React, { useState, useEffect } from 'react';
import { Sword, RefreshCw, Trash2, Shield } from 'lucide-react';
import type { Combatant } from '../types/campaign';
import type { TrackerState } from '../utils/combatTracker';
import { sortByInitiative, nextTurn, removeById, applyHp } from '../utils/combatTracker';
import { DataService } from '../services/dataService';
import { ApiService } from '../services/api';
import type { Creature, HarmfulState } from '../types/normalized';
import type { Character } from '../types/character';

const STORAGE_KEY = 'co_combat_tracker';

const loadState = (): TrackerState => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved) as TrackerState;
    } catch {
        // stockage corrompu : on repart propre
    }
    return { round: 1, activeId: null, combatants: [] };
};

export const CombatTracker: React.FC = () => {
    const [state, setState] = useState<TrackerState>(loadState);
    const [hpInputs, setHpInputs] = useState<Record<string, string>>({});

    // Formulaire d'ajout manuel
    const [name, setName] = useState('');
    const [init, setInit] = useState('');
    const [hp, setHp] = useState('');
    const [def, setDef] = useState('');
    const [type, setType] = useState<'player' | 'monster'>('monster');

    // Import bestiaire / PJ
    const [creatures, setCreatures] = useState<Creature[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [creatureId, setCreatureId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [characterId, setCharacterId] = useState('');

    const [harmfulStates, setHarmfulStates] = useState<HarmfulState[]>([]);

    useEffect(() => {
        DataService.getCreatures().then(setCreatures).catch(() => setCreatures([]));
        ApiService.getAll<Character>('characters').then(setCharacters).catch(() => setCharacters([]));
    }, []);

    useEffect(() => {
        DataService.getStates().then(setHarmfulStates).catch(() => setHarmfulStates([]));
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const ordered = sortByInitiative(state.combatants);

    const addCombatant = (c: Combatant) =>
        setState(s => ({ ...s, combatants: [...s.combatants, c] }));

    const addManual = () => {
        if (!name.trim()) return;
        const maxHp = parseInt(hp) || 0;
        addCombatant({
            id: crypto.randomUUID(),
            name: name.trim(),
            type,
            initiative: parseInt(init) || 0,
            hp: { current: maxHp, max: maxHp },
            def: parseInt(def) || 0,
            states: [],
            source: 'manual',
        });
        setName(''); setInit(''); setHp(''); setDef('');
    };

    const addFromBestiary = () => {
        const creature = creatures.find(c => String(c.id) === creatureId);
        if (!creature) return;
        const qty = Math.max(1, parseInt(quantity) || 1);
        const additions: Combatant[] = Array.from({ length: qty }, () => ({
            id: crypto.randomUUID(),
            name: qty > 1 ? '' : creature.name, // numéroté juste après
            type: 'monster' as const,
            initiative: creature.init,
            hp: { current: creature.hp, max: creature.hp },
            def: creature.def,
            states: [],
            source: 'bestiary' as const,
            referenceId: String(creature.id),
        }));
        // Numérotation : « Gobelin 1 », « Gobelin 2 » si quantité > 1, sinon nom brut
        additions.forEach((c, i) => { c.name = qty > 1 ? `${creature.name} ${i + 1}` : creature.name; });
        setState(s => ({ ...s, combatants: [...s.combatants, ...additions] }));
        setQuantity('1');
    };

    const addFromCharacter = () => {
        const character = characters.find(c => String(c.id) === characterId);
        if (!character) return;
        addCombatant({
            id: crypto.randomUUID(),
            name: character.name,
            type: 'player',
            initiative: character.data.init,
            hp: { current: character.data.hp.current, max: character.data.hp.max },
            def: character.data.def,
            states: [],
            source: 'character',
            referenceId: String(character.id),
        });
    };

    const handleNext = () => setState(s => nextTurn(s));
    const handleRemove = (id: string) => setState(s => removeById(s, id));
    const changeHp = (id: string, delta: number) =>
        setState(s => ({ ...s, combatants: applyHp(s.combatants, id, delta) }));

    const addState = (id: string, stateName: string) => {
        if (!stateName) return;
        setState(s => ({
            ...s,
            combatants: s.combatants.map(c =>
                c.id === id && !c.states.includes(stateName)
                    ? { ...c, states: [...c.states, stateName] } : c),
        }));
    };

    const removeState = (id: string, stateName: string) =>
        setState(s => ({
            ...s,
            combatants: s.combatants.map(c =>
                c.id === id ? { ...c, states: c.states.filter(n => n !== stateName) } : c),
        }));

    const applyInput = (id: string, sign: 1 | -1) => {
        const amount = parseInt(hpInputs[id] || '');
        if (!amount) return;
        changeHp(id, sign * Math.abs(amount));
        setHpInputs(prev => ({ ...prev, [id]: '' }));
    };

    const resetCombat = () => {
        if (state.combatants.length && !window.confirm('Vider le combat en cours ?')) return;
        setState({ round: 1, activeId: null, combatants: [] });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                    <h1 className="text-3xl font-display font-bold text-primary-400 flex items-center gap-3 drop-shadow-md">
                        <Sword className="text-primary-600" size={32} /> Suivi de Combat
                    </h1>
                    <div className="text-stone-400 font-mono text-sm mt-1 ml-1">
                        ROUND <span className="text-primary-300 font-bold text-lg">{state.round}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={resetCombat}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded-xl text-sm font-bold border border-white/10 transition-colors">
                        Réinitialiser
                    </button>
                    <button onClick={handleNext}
                        className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-stone-950 px-6 py-2 rounded-xl flex items-center gap-2 font-bold cursor-pointer transition-all shadow-lg hover:shadow-primary-500/20 active:scale-95">
                        <RefreshCw size={20} /> Tour Suivant
                    </button>
                </div>
            </header>

            {/* Ajout manuel */}
            <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-3 shadow-lg items-end">
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Nom du combattant"
                    className="flex-1 min-w-[160px] bg-black/40 border border-white/10 text-stone-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600"
                    onKeyDown={e => e.key === 'Enter' && addManual()} />
                <input type="number" value={init} onChange={e => setInit(e.target.value)} placeholder="INIT"
                    className="w-20 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                <input type="number" value={hp} onChange={e => setHp(e.target.value)} placeholder="PV"
                    className="w-20 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                <input type="number" value={def} onChange={e => setDef(e.target.value)} placeholder="DEF"
                    className="w-20 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                <select value={type} onChange={e => setType(e.target.value as 'player' | 'monster')}
                    className="bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="monster">Adversaire</option>
                    <option value="player">Personnage</option>
                </select>
                <button onClick={addManual}
                    className="bg-primary-900/40 hover:bg-primary-800/60 text-primary-200 px-4 py-2 rounded-lg text-sm font-bold border border-primary-500/30 transition-colors uppercase tracking-wide">
                    + Ajouter
                </button>
            </div>

            {/* Import bestiaire / PJ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-2 items-end shadow-lg">
                    <div className="text-xs text-stone-400 uppercase font-bold w-full">Bestiaire</div>
                    <select value={creatureId} onChange={e => setCreatureId(e.target.value)}
                        className="flex-1 min-w-[140px] bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="">— Créature —</option>
                        {creatures.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                    <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
                        className="w-16 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    <button onClick={addFromBestiary}
                        className="bg-red-900/40 hover:bg-red-800/60 text-red-200 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/30 transition-colors">+ Monstre</button>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-2 items-end shadow-lg">
                    <div className="text-xs text-stone-400 uppercase font-bold w-full">Personnages</div>
                    <select value={characterId} onChange={e => setCharacterId(e.target.value)}
                        className="flex-1 min-w-[140px] bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="">— Personnage —</option>
                        {characters.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                    <button onClick={addFromCharacter}
                        className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 px-4 py-2 rounded-lg text-sm font-bold border border-blue-500/30 transition-colors">+ PJ</button>
                </div>
            </div>

            {/* Liste */}
            <div className="space-y-3">
                {ordered.map(c => (
                    <div key={c.id}
                        className={`relative flex flex-wrap items-center gap-3 p-4 rounded-xl border transition-all duration-300 backdrop-blur-md ${
                            c.id === state.activeId
                                ? 'bg-primary-900/20 border-primary-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.02] z-10'
                                : 'bg-stone-900/40 border-white/5 opacity-80 hover:opacity-100 hover:bg-stone-800/60'
                        }`}>
                        {c.id === state.activeId && (
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary-500 rounded-r shadow-[0_0_10px_#f59e0b]" />
                        )}

                        <div className="w-14 text-center">
                            <span className="text-[10px] text-stone-500 uppercase block font-bold mb-0.5">INIT</span>
                            <div className="text-2xl font-display font-bold text-stone-300 border-2 border-white/10 rounded-lg py-1 bg-black/20">{c.initiative}</div>
                        </div>

                        <div className="flex-1 min-w-[120px]">
                            <div className={`font-bold text-lg font-display ${c.type === 'player' ? 'text-blue-300' : 'text-red-300'}`}>{c.name}</div>
                            <div className="text-xs text-stone-500 flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                    <Shield size={12} className="text-stone-400" /> <span className="text-stone-300 font-mono font-bold">DEF {c.def}</span>
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                {c.states.map(stateName => (
                                    <button key={stateName} onClick={() => removeState(c.id, stateName)}
                                        title="Retirer l'état"
                                        className="text-[10px] uppercase tracking-wide bg-purple-900/40 hover:bg-red-900/50 text-purple-200 hover:text-red-200 px-2 py-0.5 rounded border border-purple-500/30 transition-colors">
                                        {stateName} ✕
                                    </button>
                                ))}
                                <select value="" onChange={e => { addState(c.id, e.target.value); e.target.value = ''; }}
                                    className="text-[10px] bg-black/40 border border-white/10 text-stone-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500">
                                    <option value="">+ État</option>
                                    {harmfulStates.map(hs => <option key={hs.id} value={hs.name}>{hs.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* PV : ±1 rapides + saisie libre dégâts/soins */}
                        <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                            <div className="flex flex-col items-center w-16">
                                <span className="text-[9px] text-stone-500 uppercase font-bold mb-0.5">PV</span>
                                <div className={`font-mono text-xl font-bold ${c.hp.current < c.hp.max / 2 ? 'text-red-500' : 'text-green-500'}`}>
                                    {c.hp.current}<span className="text-xs text-stone-600 font-normal ml-0.5">/{c.hp.max}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button onClick={() => changeHp(c.id, 1)} className="bg-stone-800 hover:bg-green-900/50 text-green-500 w-8 h-6 rounded flex items-center justify-center text-xs border border-stone-700 transition-all active:scale-95">+</button>
                                <button onClick={() => changeHp(c.id, -1)} className="bg-stone-800 hover:bg-red-900/50 text-red-500 w-8 h-6 rounded flex items-center justify-center text-xs border border-stone-700 transition-all active:scale-95">-</button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <input type="number" value={hpInputs[c.id] || ''}
                                    onChange={e => setHpInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                                    placeholder="±"
                                    className="w-14 bg-black/40 border border-white/10 text-stone-100 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                                <div className="flex gap-1">
                                    <button onClick={() => applyInput(c.id, -1)} className="flex-1 bg-red-900/40 hover:bg-red-800/60 text-red-200 rounded text-[10px] font-bold py-0.5 border border-red-500/30">Dég.</button>
                                    <button onClick={() => applyInput(c.id, 1)} className="flex-1 bg-green-900/40 hover:bg-green-800/60 text-green-200 rounded text-[10px] font-bold py-0.5 border border-green-500/30">Soin</button>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => handleRemove(c.id)} className="text-stone-600 hover:text-red-500 p-2 rounded-full hover:bg-stone-900/50 transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {ordered.length === 0 && (
                    <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-stone-800/50 bg-stone-900/20 backdrop-blur-sm">
                        <Sword size={48} className="mx-auto mb-4 text-stone-700 opacity-50" />
                        <p className="text-stone-400 font-display text-lg">Le champ de bataille est vide.</p>
                        <p className="text-stone-600 text-sm mt-1">Ajoutez des combattants pour commencer.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
