import React, { useState, useEffect, useMemo } from 'react';
import { Sword, RefreshCw, Trash2, Shield } from 'lucide-react';
import type { Combatant } from '../types/campaign';
import type { TrackerState } from '../domain/combatTracker';
import { sortByInitiative, nextTurn, removeById, applyHp, enregistrerTentative, resistancesAcquises, bonusResistance } from '../domain/combatTracker';
import { PanneauResistance } from '../components/creature/PanneauResistance';
import { effetsCumules, defEffective } from '../domain/rules/etatsCombat';
import { dommagesSubis } from '../domain/rules/dommages';
import { lancerAttaque } from '../domain/rules/test';
import { DataService } from '../services/dataService';
import { ApiService } from '../services/api';
import { getMonsters } from '../services/monsterService';
import type { Armor, Capacity, Creature, CustomCreature, HarmfulState, Voie, Weapon } from '../types/normalized';
import { CombatantCapabilities } from '../components/creature/CombatantCapabilities';
import { capacitesDuCombattant, capacitesDuPersonnage, type SourcesInvocation } from '../domain/capabilityRefs';
import type { Character } from '../types/character';

/** Préfixe distinguant un monstre « maison » d'une créature SRD dans le sélecteur d'import. */
const CUSTOM_PREFIX = 'custom-';

const STORAGE_KEY = 'co_combat_tracker';

/** 1d20 stocké par combattant pour le départage final COF2 (stable entre les rendus). */
const rollTiebreak = (): number => Math.floor(Math.random() * 20) + 1;

const loadState = (): TrackerState => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved) as TrackerState;
            // Compat : d'anciens combattants persistés peuvent manquer de per/tiebreak/states.
            parsed.combatants = (parsed.combatants ?? []).map(c => ({
                ...c,
                states: Array.isArray(c.states) ? c.states : [],
                per: typeof c.per === 'number' ? c.per : 0,
                tiebreak: typeof c.tiebreak === 'number' ? c.tiebreak : rollTiebreak(),
            }));
            return parsed;
        }
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
    const [per, setPer] = useState('');
    const [rdSaisie, setRdSaisie] = useState('');
    const [type, setType] = useState<'player' | 'monster'>('monster');

    // Import bestiaire / PJ
    const [creatures, setCreatures] = useState<Creature[]>([]);
    const [customMonsters, setCustomMonsters] = useState<CustomCreature[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [creatureId, setCreatureId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [characterId, setCharacterId] = useState('');

    const [harmfulStates, setHarmfulStates] = useState<HarmfulState[]>([]);
    const [armes, setArmes] = useState<Weapon[]>([]);
    const [armures, setArmures] = useState<Armor[]>([]);
    const [capacites, setCapacites] = useState<Capacity[]>([]);
    const [voies, setVoies] = useState<Voie[]>([]);
    // Pose d'état en cours : la capacité a désigné l'état, le MJ choisit encore la cible.
    // État en cours de pose, avec la capacité qui le pose.
    const [poseEnCours, setPoseEnCours] = useState<{ etat: string; capacite: string } | null>(null);
    // Dernier jet d'attaque, affiché en bandeau : le suivi n'avait aucun endroit où rendre
    // compte d'un jet, alors qu'il connaît déjà l'attaquant (le tour actif) et la cible.
    // Le dernier jet d'attaque garde de quoi enchaîner sur les dommages : sa cible, s'il a
    // touché, et s'il était critique — le critique double les DM, et cette information se
    // perdait dès que le bandeau était lu.
    const [dernierJet, setDernierJet] = useState<{ texte: string; cibleId: string; touche: boolean; critique: boolean } | null>(null);
    const [formuleDm, setFormuleDm] = useState('');

    useEffect(() => {
        DataService.getCreatures().then(setCreatures).catch(() => setCreatures([]));
        getMonsters().then(setCustomMonsters).catch(() => setCustomMonsters([]));
        ApiService.getAll<Character>('characters').then(setCharacters).catch(() => setCharacters([]));
    }, []);

    useEffect(() => {
        DataService.getStates().then(setHarmfulStates).catch(() => setHarmfulStates([]));
        // Un échec de chargement prive des liens d'invocation, jamais des capacités.
        DataService.getWeapons().then(setArmes).catch(() => setArmes([]));
        DataService.getArmors().then(setArmures).catch(() => setArmures([]));
        // Capacités du compendium : nécessaires pour résoudre celles d'un personnage joueur.
        // Un échec de chargement prive du panneau, jamais du suivi de combat.
        DataService.getCapabilities().then(setCapacites).catch(() => setCapacites([]));
        // Nomme la voie d'origine de chaque capacité de personnage.
        DataService.getVoies().then(setVoies).catch(() => setVoies([]));
    }, []);

    const sources: SourcesInvocation = useMemo(
        () => ({ creatures, monstresMaison: customMonsters, armes, armures, communautaire: [] }),
        [creatures, customMonsters, armes, armures],
    );

    /** Ajoute une créature invoquée aux combattants, par le même chemin que l'ajout depuis
     *  le bestiaire, pour que son initiative et son départage suivent les mêmes règles. */
    const ajouterInvocation = (
        creature: Creature | CustomCreature,
        quantite: number,
        refOrigine: string,
    ) => {
        const nb = Math.max(1, quantite);
        const ajouts: Combatant[] = Array.from({ length: nb }, (_, i) => ({
            id: crypto.randomUUID(),
            name: nb > 1 ? `${creature.name} ${i + 1}` : creature.name,
            type: 'monster' as const,
            initiative: creature.init,
            hp: { current: creature.hp, max: creature.hp },
            def: creature.def,
            level: creature.nc ?? 0,
            per: creature.stats?.PER ?? 0,
            caracs: creature.stats as unknown as Record<string, number> | undefined,
            caracsSuperieures: creature.statsSuperior,
            tiebreak: rollTiebreak(),
            states: [],
            source: 'bestiary' as const,
            // La référence d'origine dit déjà de quel espace vient la créature : un monstre
            // maison porte le préfixe, une créature officielle est nommée.
            referenceId: refOrigine.startsWith(CUSTOM_PREFIX) ? refOrigine : String(creature.id),
        }));
        setState(s => ({ ...s, combatants: [...s.combatants, ...ajouts] }));
    };

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
            per: parseInt(per) || 0,
            tiebreak: rollTiebreak(),
            states: [],
            rd: parseInt(rdSaisie) || undefined,
            source: 'manual',
        });
        setName(''); setInit(''); setHp(''); setDef(''); setPer(''); setRdSaisie('');
    };

    const addFromBestiary = () => {
        // Une créature SRD (bestiaire) ou un monstre « maison » (préfixe custom-).
        const isCustom = creatureId.startsWith(CUSTOM_PREFIX);
        const creature = isCustom
            ? customMonsters.find(c => `${CUSTOM_PREFIX}${c.id}` === creatureId)
            : creatures.find(c => String(c.id) === creatureId);
        if (!creature) return;
        const qty = Math.max(1, parseInt(quantity) || 1);
        const additions: Combatant[] = Array.from({ length: qty }, () => ({
            id: crypto.randomUUID(),
            name: qty > 1 ? '' : creature.name, // numéroté juste après
            type: 'monster' as const,
            initiative: creature.init,
            hp: { current: creature.hp, max: creature.hp },
            def: creature.def,
            level: creature.nc ?? 0, // NC de la créature — départage d'initiative COF2
            per: creature.stats?.PER ?? 0,
            caracs: creature.stats as unknown as Record<string, number> | undefined,
            caracsSuperieures: creature.statsSuperior,
            tiebreak: rollTiebreak(),
            states: [],
            source: 'bestiary' as const,
            referenceId: creatureId,
        }));
        // Numérotation : « Gobelin 1 », « Gobelin 2 » si quantité > 1, sinon nom brut
        additions.forEach((c, i) => { c.name = qty > 1 ? `${creature.name} ${i + 1}` : creature.name; });
        setState(s => ({ ...s, combatants: [...s.combatants, ...additions] }));
        setQuantity('1');
    };

    const addFromCharacter = () => {
        const character = characters.find(c => String(c.id) === characterId);
        if (!character) return;
        const caracs = character.caracs ?? ({} as Record<string, number>);
        const ps = character.playState;
        const per = caracs.PER ?? 0;
        // Dérivations légères de parité (Phase 2) : Init/DEF de base. Les bonus de
        // capacités/voies et les PV max par niveau sont dérivés en Phase 3.
        const init = 10 + per;
        const def = 10 + (caracs.AGI ?? 0) + (ps?.protection?.armor?.def ?? 0) + (ps?.protection?.shield?.def ?? 0);
        const currentHp = ps?.hp?.current ?? 0;
        addCombatant({
            id: crypto.randomUUID(),
            name: character.name,
            type: 'player',
            initiative: init,
            hp: { current: currentHp, max: currentHp },
            def,
            level: character.level ?? 0, // niveau du PJ — départage d'initiative COF2
            per,
            // Un PJ teste ses caractéristiques comme une créature. Aucune n'est déclarée
            // supérieure : les dés bonus d'un PJ viennent de ses capacités et de la
            // situation, que le suivi ne connaît pas — le panneau laisse donc le MJ
            // l'ajouter à la main plutôt que de le deviner.
            caracs,
            tiebreak: rollTiebreak(),
            states: [],
            source: 'character',
            referenceId: String(character.id),
        });
    };

    const handleNext = () => setState(s => nextTurn(s));
    const handleRemove = (id: string) => {
        setState(s => removeById(s, id));
        setHpInputs(prev => {
            if (!(id in prev)) return prev;
            const rest = { ...prev };
            delete rest[id];
            return rest;
        });
    };
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

    /**
     * Attaque : l'attaquant est le combattant dont c'est le tour, la difficulté est la DEF
     * EFFECTIVE de la cible (états compris), et le dé malus vient des états de l'attaquant
     * — Immobilisé impose un dé malus aux tests d'attaque, Affaibli à tous les tests.
     */
    const attaquer = (cible: Combatant) => {
        const attaquant = state.combatants.find(c => c.id === state.activeId);
        if (!attaquant) return;

        const effetsAttaquant = effetsCumules(attaquant.states, harmfulStates);
        const effetsCible = effetsCumules(cible.states, harmfulStates);
        const def = defEffective(cible.def, effetsCible);

        const jet = lancerAttaque({
            valeurAttaque: (attaquant.atk ?? 0) + effetsAttaquant.attaque,
            defCible: def,
            deMalus: effetsAttaquant.deMalusTests || effetsAttaquant.deMalusAttaque ? 1 : 0,
        });

        const des = jet.des.length > 1 ? `(${jet.des.join(' / ')} → ${jet.conserve})` : `(${jet.conserve})`;
        setDernierJet({
            texte: `${attaquant.name} attaque ${cible.name} : ${des} + ${(attaquant.atk ?? 0) + effetsAttaquant.attaque}`
                + ` = ${jet.total} contre DEF ${def} — ${jet.reussi ? 'TOUCHÉ' : 'raté'}`
                + `${jet.dmDoubles ? ' · critique, DM doublés' : ''}`,
            cibleId: cible.id,
            touche: jet.reussi === true,
            critique: jet.dmDoubles,
        });
    };

    /**
     * Enchaîne les dommages sur la cible du dernier jet : la formule est jetée, la RD de la
     * cible retranchée, le critique double les DM et le minimum d'un point s'applique. Les
     * PV sont retirés dans la foulée — c'est ce qui fermait le round à la main jusqu'ici.
     */
    const infligerDm = () => {
        if (!dernierJet?.touche) return;
        const cible = state.combatants.find(c => c.id === dernierJet.cibleId);
        const match = formuleDm.trim().match(/^(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
        if (!cible || !match) return;

        const nombre = match[1] ? parseInt(match[1]) : 1;
        const faces = parseInt(match[2]);
        const modificateur = (match[3] === '-' ? -1 : 1) * (match[4] ? parseInt(match[4]) : 0);
        const des: number[] = [];
        for (let i = 0; i < nombre; i++) des.push(Math.floor(Math.random() * faces) + 1);
        const brut = des.reduce((t, d) => t + d, 0) + modificateur;

        const { infliges, detail } = dommagesSubis({ brut, rd: cible.rd ?? 0, critique: dernierJet.critique });
        changeHp(cible.id, -infliges);
        setDernierJet(j => (j ? {
            ...j,
            // Les étapes de réduction portent déjà le résultat : ne le répéter qu'en
            // l'absence d'étape, sinon la ligne se terminait par « → 7 → 7 PV ».
            texte: `${j.texte} · DM (${des.join('+')})${modificateur ? (modificateur > 0 ? `+${modificateur}` : modificateur) : ''} = ${brut}`
                + (detail.length > 1 ? ` · ${detail.slice(1).join(' · ')} PV` : ` → ${infliges} PV`),
            touche: false,
        } : j));
    };

    const changeAtk = (id: string, valeur: number) =>
        setState(s => ({
            ...s,
            combatants: s.combatants.map(c => (c.id === id ? { ...c, atk: valeur || undefined } : c)),
        }));

    const changeRd = (id: string, valeur: number) =>
        setState(s => ({
            ...s,
            combatants: s.combatants.map(c => (c.id === id ? { ...c, rd: valeur || undefined } : c)),
        }));

    const removeState = (id: string, stateName: string) =>
        setState(s => ({
            ...s,
            combatants: s.combatants.map(c =>
                c.id === id ? { ...c, states: c.states.filter(n => n !== stateName) } : c),
        }));

    const applyInput = (id: string, sign: 1 | -1) => {
        const amount = parseInt(hpInputs[id] || '');
        if (!amount) return;
        const cible = state.combatants.find(c => c.id === id);
        // Des dégâts passent par la règle : la RD de la cible est retranchée, et une attaque
        // qui touche inflige toujours au moins 1 DM. Un soin n'a rien à voir avec tout ça.
        const valeur = sign === -1
            ? dommagesSubis({ brut: Math.abs(amount), rd: cible?.rd ?? 0 }).infliges
            : Math.abs(amount);
        changeHp(id, sign * valeur);
        setHpInputs(prev => ({ ...prev, [id]: '' }));
    };

    const resetCombat = () => {
        if (state.combatants.length && !window.confirm('Vider le combat en cours ?')) return;
        // Le rendement décroissant vaut « durant un combat » : vider le combat l'oublie.
        setState({ round: 1, activeId: null, combatants: [], tentatives: {} });
        setHpInputs({});
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                    <h1 className="text-3xl font-display font-bold text-primary-400 flex items-center gap-3 drop-shadow-md">
                        <Sword className="text-primary-600" size={32} /> Suivi de combat
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

            {dernierJet && (
                <div className="glass-panel px-4 py-2 rounded-xl border-primary-500/30 bg-primary-950/10 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-stone-200 font-mono flex-1 min-w-[240px]">{dernierJet.texte}</p>
                    {dernierJet.touche && (
                        <div className="flex items-center gap-2 shrink-0">
                            <input
                                type="text"
                                aria-label="Formule de dommages"
                                value={formuleDm}
                                onChange={e => setFormuleDm(e.target.value)}
                                placeholder="1d8+3"
                                onKeyDown={e => e.key === 'Enter' && infligerDm()}
                                className="w-24 bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs font-mono placeholder-stone-600 focus:outline-none focus:border-primary-500/50"
                            />
                            <button
                                onClick={infligerDm}
                                disabled={!formuleDm}
                                className="px-3 py-1 rounded bg-red-900/50 hover:bg-red-800/70 disabled:opacity-40 text-red-100 font-bold text-[11px] uppercase tracking-wider transition-colors"
                            >
                                Infliger
                            </button>
                        </div>
                    )}
                    <button onClick={() => setDernierJet(null)} aria-label="Effacer le dernier jet"
                        className="text-stone-400 hover:text-stone-200 text-xs shrink-0">✕</button>
                </div>
            )}

            {/* Ajout manuel — un intitulé au-dessus de chaque champ : un nombre saisi efface
                son propre indicateur quand le libellé ne vit que dans le placeholder. */}
            <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-3 shadow-lg items-end">
                <label className="flex-1 min-w-[160px] flex flex-col gap-1">
                    <span className="text-[11px] uppercase font-bold text-stone-400 tracking-wider">Combattant</span>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Nom du combattant"
                        className="w-full bg-black/40 border border-white/10 text-stone-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600"
                        onKeyDown={e => e.key === 'Enter' && addManual()} />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase font-bold text-stone-400 tracking-wider">Init</span>
                    <input type="number" value={init} onChange={e => setInit(e.target.value)}
                        className="w-20 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase font-bold text-stone-400 tracking-wider">PV</span>
                    <input type="number" value={hp} onChange={e => setHp(e.target.value)}
                        className="w-20 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase font-bold text-stone-400 tracking-wider">DEF</span>
                    <input type="number" value={def} onChange={e => setDef(e.target.value)}
                        className="w-20 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                </label>
                <label className="flex flex-col gap-1">
                    {/* Saisie, jamais devinée : le bestiaire ne porte sa RD qu'en toutes
                        lettres dans ses capacités. */}
                    <span className="text-[11px] uppercase font-bold text-stone-400 tracking-wider">RD</span>
                    <input type="number" value={rdSaisie} onChange={e => setRdSaisie(e.target.value)}
                        className="w-16 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                </label>
                <label className="flex flex-col gap-1" title="Perception — départage à initiative égale">
                    <span className="text-[11px] uppercase font-bold text-stone-400 tracking-wider">PER</span>
                    <input type="number" value={per} onChange={e => setPer(e.target.value)}
                        className="w-20 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-stone-600" />
                </label>
                <select aria-label="Camp du combattant" value={type} onChange={e => setType(e.target.value as 'player' | 'monster')}
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
                    <div className="text-xs text-stone-400 uppercase font-bold w-full">Créatures</div>
                    <select aria-label="Créature à ajouter" value={creatureId} onChange={e => setCreatureId(e.target.value)}
                        className="flex-1 min-w-[140px] bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="">— Créature —</option>
                        {customMonsters.length > 0 && (
                            <optgroup label="Mes créatures">
                                {customMonsters.map(c => (
                                    <option key={`${CUSTOM_PREFIX}${c.id}`} value={`${CUSTOM_PREFIX}${c.id}`}>{c.name}</option>
                                ))}
                            </optgroup>
                        )}
                        {creatures.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                    <input type="number" min="1" aria-label="Nombre d’exemplaires" value={quantity} onChange={e => setQuantity(e.target.value)}
                        className="w-16 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    <button onClick={addFromBestiary}
                        className="bg-red-900/40 hover:bg-red-800/60 text-red-200 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/30 transition-colors">+ Monstre</button>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-2 items-end shadow-lg">
                    <div className="text-xs text-stone-400 uppercase font-bold w-full">Personnages</div>
                    <select aria-label="Personnage à ajouter" value={characterId} onChange={e => setCharacterId(e.target.value)}
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
                {poseEnCours && (
                    <PanneauResistance
                        etat={poseEnCours.etat}
                        capacite={poseEnCours.capacite}
                        combattants={state.combatants}
                        bonusPour={id => bonusResistance(state, id, poseEnCours.capacite)}
                        onPoser={id => addState(id, poseEnCours.etat)}
                        onTentative={id => setState(s => enregistrerTentative(s, id, poseEnCours.capacite))}
                        onAnnuler={() => setPoseEnCours(null)}
                    />
                )}

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
                            <span className="text-[11px] text-stone-400 uppercase block font-bold mb-0.5">INIT</span>
                            <div className="text-2xl font-display font-bold text-stone-300 border-2 border-white/10 rounded-lg py-1 bg-black/20">{c.initiative}</div>
                        </div>

                        <div className="flex-1 min-w-[120px]">
                            <div className={`font-bold text-lg font-display ${c.type === 'player' ? 'text-blue-300' : 'text-red-300'}`}>{c.name}</div>
                            {(() => {
                                // Les états étaient listés mais jamais cumulés : la DEF affichée
                                // restait celle de la fiche, à charge du MJ de faire la somme.
                                const effets = effetsCumules(c.states, harmfulStates);
                                const def = defEffective(c.def, effets);
                                const mentions = [
                                    effets.attaque !== 0 ? `ATT ${effets.attaque}` : '',
                                    effets.deMalusTests ? 'dé malus à tous les tests' : '',
                                    effets.deMalusAttaque ? 'dé malus en attaque' : '',
                                    effets.sansAction ? 'aucune action' : '',
                                    effets.sansDeplacement ? 'pas de déplacement' : '',
                                    effets.deplacementMax !== undefined ? `déplacement ${effets.deplacementMax} m` : '',
                                ].filter(Boolean);
                                return (
                                    <>
                                        <div className="text-xs text-stone-400 flex flex-wrap items-center gap-2 mt-1">
                                            <span className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                                <Shield size={12} className="text-stone-400" />
                                                <span className={`font-mono font-bold ${effets.def !== 0 ? 'text-amber-300' : 'text-stone-300'}`}>DEF {def}</span>
                                                {effets.def !== 0 && <span className="text-stone-400 text-[11px]">({c.def} {effets.def})</span>}
                                            </span>
                                            <label className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/5" title="Valeur d'attaque — niveau (max 10) + caractéristique">
                                                <span className="text-stone-400 text-[11px] uppercase font-bold">ATT</span>
                                                <input
                                                    type="number"
                                                    aria-label={`Valeur d'attaque de ${c.name}`}
                                                    value={c.atk ?? ''}
                                                    onChange={e => changeAtk(c.id, parseInt(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="w-10 bg-transparent text-stone-300 font-mono font-bold text-center focus:outline-none focus:text-primary-300 placeholder-stone-600"
                                                />
                                            </label>
                                            <label className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/5" title="Réduction des dommages — à saisir : le bestiaire ne la donne qu'en toutes lettres">
                                                <span className="text-stone-400 text-[11px] uppercase font-bold">RD</span>
                                                <input
                                                    type="number"
                                                    aria-label={`Réduction des dommages de ${c.name}`}
                                                    value={c.rd ?? ''}
                                                    onChange={e => changeRd(c.id, parseInt(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="w-10 bg-transparent text-stone-300 font-mono font-bold text-center focus:outline-none focus:text-primary-300 placeholder-stone-600"
                                                />
                                            </label>
                                            {effets.sansAction && (
                                                <span className="text-[11px] uppercase tracking-wide bg-red-950/50 text-red-200 px-2 py-0.5 rounded border border-red-500/30">
                                                    Ne peut pas agir
                                                </span>
                                            )}
                                        </div>
                                        {mentions.length > 0 && (
                                            <p className="text-[11px] text-amber-200/70 mt-1 leading-snug">{mentions.join(' · ')}</p>
                                        )}
                                        {/* Rendement décroissant : ce que la cible a déjà
                                            subi lui donne +5 par répétition pour résister. */}
                                        {resistancesAcquises(state, c.id).map(r => (
                                            <p key={r.capacite} className="text-[11px] text-purple-200/80 leading-snug">
                                                +{r.bonus} pour résister à « {r.capacite} »
                                            </p>
                                        ))}
                                    </>
                                );
                            })()}
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                {c.states.map(stateName => (
                                    <button key={stateName} onClick={() => removeState(c.id, stateName)}
                                        title="Retirer l'état"
                                        className="text-[11px] uppercase tracking-wide bg-purple-900/40 hover:bg-red-900/50 text-purple-200 hover:text-red-200 px-2 py-0.5 rounded border border-purple-500/30 transition-colors">
                                        {stateName} ✕
                                    </button>
                                ))}
                                <select value="" onChange={e => { addState(c.id, e.target.value); e.target.value = ''; }}
                                    className="text-[11px] bg-black/40 border border-white/10 text-stone-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500">
                                    <option value="">+ État</option>
                                    {harmfulStates.map(hs => <option key={hs.id} value={hs.name}>{hs.name}</option>)}
                                </select>
                            </div>

                            {(() => {
                                // Deux chemins : le bestiaire d'abord, le personnage ensuite.
                                // Aucun ne répond pour un combattant ajouté à la main.
                                const capacitesDuBestiaire = capacitesDuCombattant(c, creatures, customMonsters);
                                const capacitesAcquises = capacitesDuBestiaire ?? capacitesDuPersonnage(c, characters, capacites, voies);
                                if (!capacitesAcquises) return null;
                                return (
                                    <CombatantCapabilities
                                        capacites={capacitesAcquises}
                                        etatsConnus={harmfulStates}
                                        sources={sources}
                                        onPoserEtat={(etat, capacite) => setPoseEnCours({ etat, capacite })}
                                        onInvoquer={ajouterInvocation}
                                    />
                                );
                            })()}
                        </div>

                        {/* Attaquer : l'attaquant est le combattant dont c'est le tour. */}
                        {state.activeId && state.activeId !== c.id && (
                            <button
                                onClick={() => attaquer(c)}
                                title={`Attaquer ${c.name} avec le combattant actif`}
                                className="self-center px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-200 text-[11px] font-bold uppercase tracking-wider border border-red-500/30 transition-colors whitespace-nowrap"
                            >
                                Attaquer
                            </button>
                        )}

                        {/* PV : ±1 rapides + saisie libre dégâts/soins */}
                        <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                            <div className="flex flex-col items-center w-16">
                                <span className="text-[11px] text-stone-400 uppercase font-bold mb-0.5">PV</span>
                                {/* Étiquette accessible : le compteur n'annonçait qu'une paire
                                    de nombres, sans dire de qui ni de quoi il s'agissait. */}
                                <div
                                    aria-label={`Points de vie de ${c.name}`}
                                    className={`font-mono text-xl font-bold ${c.hp.current < c.hp.max / 2 ? 'text-red-500' : 'text-green-500'}`}
                                >
                                    {c.hp.current}<span className="text-xs text-stone-400 font-normal ml-0.5">/{c.hp.max}</span>
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
                                    <button onClick={() => applyInput(c.id, -1)} className="flex-1 bg-red-900/40 hover:bg-red-800/60 text-red-200 rounded text-[11px] font-bold py-0.5 border border-red-500/30">Dég.</button>
                                    <button onClick={() => applyInput(c.id, 1)} className="flex-1 bg-green-900/40 hover:bg-green-800/60 text-green-200 rounded text-[11px] font-bold py-0.5 border border-green-500/30">Soin</button>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => handleRemove(c.id)} className="text-stone-400 hover:text-red-500 p-2 rounded-full hover:bg-stone-900/50 transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {ordered.length === 0 && (
                    <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-stone-800/50 bg-stone-900/20 backdrop-blur-sm">
                        <Sword size={48} className="mx-auto mb-4 text-stone-700 opacity-50" />
                        <p className="text-stone-400 font-display text-lg">Le champ de bataille est vide.</p>
                        <p className="text-stone-400 text-sm mt-1">Ajoutez des combattants pour commencer.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
