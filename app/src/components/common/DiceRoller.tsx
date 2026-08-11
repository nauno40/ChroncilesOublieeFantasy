import React, { useState, useRef, useEffect } from 'react';
import { Dices, Eraser, ChevronRight } from 'lucide-react';
import { LEXIQUE } from '../../domain/lexique';
import { lancerTest, lancerAttaque, DIFFICULTES, qualificatifDifficulte, bonusRendementDecroissant, NOTE_RENDEMENT_DECROISSANT } from '../../domain/rules/test';
import { CONDITIONS_TIR, malusTir } from '../../domain/rules/tirADistance';
import { OPTIONS_TACTIQUES, MANOEUVRES, optionTactique, NOTE_TAILLE } from '../../domain/rules/optionsTactiques';
import { dommagesSubis } from '../../domain/rules/dommages';

interface RollResult {
    id: string;
    description: string;
    result: number;
    details: string;
    timestamp: number;
    isCritSuccess?: boolean;
    isCritFail?: boolean;
    /** Verdict d'un test COF2 face à sa difficulté. Absent pour un jet libre. */
    reussi?: boolean;
}

interface DiceRollerProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'popup' | 'inline';
}

/**
 * Effectue un jet et construit son résultat. Défini hors du composant : la fonction
 * appelle Math.random / Date.now / crypto.randomUUID, impurs et donc interdits dans
 * le corps d'un composant (react-hooks/purity) — même appelés depuis un gestionnaire.
 */
const performRoll = (sides: number, count: number, modifier: number): RollResult => {
    let total = 0;
    const rolls: number[] = [];
    let isCritSuccess = false;
    let isCritFail = false;

    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        rolls.push(roll);
        total += roll;

        if (sides === 20 && count === 1) {
            if (roll === 20) isCritSuccess = true;
            if (roll === 1) isCritFail = true;
        }
    }

    total += modifier;

    const suffix = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : String(modifier)) : '';
    const details = count > 1 || modifier !== 0 ? `(${rolls.join('+')})${suffix}` : '';

    return {
        id: crypto.randomUUID(),
        description: `${count}d${sides}${suffix}`,
        result: total,
        details,
        timestamp: Date.now(),
        isCritSuccess,
        isCritFail,
    };
};

/**
 * Test COF2 : d20 + carac + modificateur, avec dé bonus / dé malus et difficulté.
 * Impure comme `performRoll`, donc définie hors du composant.
 */
const performTest = (carac: number, difficulte: number | undefined, avantage: 'bonus' | 'malus' | 'aucun', repetitions: number): RollResult => {
    const rendement = bonusRendementDecroissant(repetitions);
    const r = lancerTest({
        carac,
        modificateur: rendement,
        difficulte,
        deBonus: avantage === 'bonus' ? 1 : 0,
        deMalus: avantage === 'malus' ? 1 : 0,
    });
    const signe = carac > 0 ? `+${carac}` : carac < 0 ? String(carac) : '';
    const mention = avantage === 'bonus' ? ' dé bonus' : avantage === 'malus' ? ' dé malus' : '';
    const qualificatif = difficulte !== undefined ? qualificatifDifficulte(difficulte) : undefined;
    return {
        id: crypto.randomUUID(),
        description: `Test d20${signe}${mention}${rendement > 0 ? ` · rendement +${rendement}` : ''}${difficulte !== undefined ? ` · DIF ${difficulte}${qualificatif ? ` (${qualificatif.toLowerCase()})` : ''}` : ''}`,
        result: r.total,
        details: `(${r.des.join(' / ')})${signe}${rendement > 0 ? ` +${rendement}` : ''}`,
        timestamp: Date.now(),
        isCritSuccess: r.critique,
        isCritFail: r.echecCritique,
        reussi: r.reussi,
    };
};

/**
 * Test d'attaque COF2 : d20 + valeur d'attaque contre la DEF de la cible. Distinct du test
 * de caractéristique — pas d'échec critique automatique, et un critique double les DM.
 */
const performAttaque = (valeurAttaque: number, defCible: number | undefined, avantage: 'bonus' | 'malus' | 'aucun', conditions: string[], optionId: string): RollResult => {
    const tir = malusTir(conditions);
    const option = optionTactique(optionId);
    // Une manœuvre se joue en test opposé : la DEF de la cible ne s'applique pas, et il n'y
    // a donc pas de verdict à rendre — c'est le jet de la cible qui tranchera.
    const defRetenue = option?.testOppose ? undefined : defCible;
    const r = lancerAttaque({
        valeurAttaque,
        defCible: defRetenue,
        modificateur: tir.modificateur + (option?.attaque ?? 0),
        deBonus: avantage === 'bonus' ? 1 : 0,
        // Le dé malus des conditions de tir rejoint celui de la situation : ils ne se
        // cumulent pas, `lancerTest` n'en retient qu'un.
        deMalus: avantage === 'malus' || tir.deMalus ? 1 : 0,
    });
    // La valeur d'attaque et le malus de situation restent SÉPARÉS à l'affichage : agrégés,
    // une attaque +5 sous un couvert -5 s'annonçait « Attaque d20 », sans plus rien montrer
    // de ce qui la compose.
    const signe = valeurAttaque > 0 ? `+${valeurAttaque}` : valeurAttaque < 0 ? String(valeurAttaque) : '';
    const mention = avantage === 'bonus' && !tir.deMalus ? ' dé bonus'
        : (avantage === 'malus' || tir.deMalus) && avantage !== 'bonus' ? ' dé malus' : '';
    const mentionOption = option ? ` · ${option.label}` : '';
    return {
        id: crypto.randomUUID(),
        description: `Attaque d20${signe}${mention}${mentionOption}${option?.testOppose ? ' · test opposé' : defCible !== undefined ? ` · DEF ${defCible}` : ''}${r.dmDoubles && !option?.testOppose ? ' · DM DOUBLÉS' : ''}`,
        result: r.total,
        details: [
            `(${r.des.join(' / ')})${signe}`,
            tir.modificateur !== 0 ? `tir ${tir.modificateur}` : '',
            option?.attaque ? `option ${option.attaque > 0 ? '+' : ''}${option.attaque}` : '',
            option?.attaqueCarac ? `+${option.attaqueCarac} à ajouter` : '',
            option?.effet ?? '',
        ].filter(Boolean).join(' · '),
        timestamp: Date.now(),
        isCritSuccess: r.critique && !option?.testOppose,
        // Pas d'échec critique en combat : un 1 n'est pas automatiquement raté.
        isCritFail: false,
        reussi: r.reussi,
    };
};

/**
 * Jet de dommages : les dés de l'arme, puis tout ce que la cible leur oppose. Le lanceur
 * jetait les dés sans jamais appliquer la RD, la résistance ni le minimum d'un point.
 */
const performDommages = (formule: string, rd: number, resistance: boolean, temporaire: boolean, forCible: number, critique: boolean): RollResult | null => {
    const match = formule.trim().match(/^(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
    if (!match) return null;

    const nombre = match[1] ? parseInt(match[1]) : 1;
    const faces = parseInt(match[2]);
    const modificateur = (match[3] === '-' ? -1 : 1) * (match[4] ? parseInt(match[4]) : 0);

    const des: number[] = [];
    for (let i = 0; i < nombre; i++) des.push(Math.floor(Math.random() * faces) + 1);
    const brut = des.reduce((t, d) => t + d, 0) + modificateur;

    const { infliges, detail } = dommagesSubis({ brut, rd, resistance, temporaire, forCible, critique });
    const signe = modificateur !== 0 ? (modificateur > 0 ? `+${modificateur}` : String(modificateur)) : '';

    return {
        id: crypto.randomUUID(),
        description: `DM ${nombre}d${faces}${signe}${critique ? ' · critique' : ''}${temporaire ? ' · temporaires' : ''}`,
        result: infliges,
        details: `(${des.join('+')})${signe} · ${detail.slice(1).join(' · ') || 'aucune réduction'}`,
        timestamp: Date.now(),
    };
};

export const DiceRoller: React.FC<DiceRollerProps> = ({ isOpen, mode = 'popup' }) => {
    const [history, setHistory] = useState<RollResult[]>([]);
    const [customFormula, setCustomFormula] = useState('');
    // Paramètres du test COF2 : la caractéristique concernée, la difficulté visée, et le
    // dé bonus / malus. Ils vivent ici parce qu'on enchaîne souvent plusieurs jets dans
    // les mêmes conditions.
    const [carac, setCarac] = useState(0);
    const [difficulte, setDifficulte] = useState<number | ''>('');
    const [avantage, setAvantage] = useState<'bonus' | 'malus' | 'aucun'>('aucun');
    // Le test de caractéristique et le test d'attaque ne suivent pas les mêmes règles :
    // le second n'a pas d'échec critique automatique et double les DM sur un critique.
    const [genre, setGenre] = useState<'carac' | 'attaque'>('carac');
    // Rendement décroissant : la cible résiste mieux à ce qu'on lui répète. Réservé au test
    // de caractéristique — le livre l'exclut des attaques contre la DEF.
    const [repetitions, setRepetitions] = useState(0);
    // Conditions de tir cochées : ce sont les modificateurs les plus souvent oubliés, et
    // ils dépendent de la situation, pas de la feuille — d'où leur place ici.
    const [conditions, setConditions] = useState<string[]>([]);
    const [conditionsOuvertes, setConditionsOuvertes] = useState(false);
    // Une seule option tactique ou manœuvre à la fois : le livre ne prévoit pas de les
    // combiner, et une attaque assurée doublée d'une attaque violente n'aurait pas de sens.
    const [option, setOption] = useState('');
    // Jet de dommages : la formule de l'arme et ce que la cible leur oppose.
    const [formuleDm, setFormuleDm] = useState('');
    const [rd, setRd] = useState(0);
    const [resistance, setResistance] = useState(false);
    const [dmTemporaires, setDmTemporaires] = useState(false);
    const [forCible, setForCible] = useState(0);
    const [dmCritique, setDmCritique] = useState(false);
    const historyListRef = useRef<HTMLDivElement>(null);

    // Défilement automatique vers le dernier jet. On défile le conteneur lui-même :
    // scrollIntoView() entraînait aussi la fenêtre, si bien que la page des dés
    // s'auto-défilait au chargement (titre poussé hors écran). Rien à faire tant
    // qu'aucun jet n'a été lancé.
    useEffect(() => {
        if (!history.length) return;
        const list = historyListRef.current;
        if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    }, [history, isOpen]);

    const rollDice = (sides: number, count: number = 1, modifier: number = 0) => {
        setHistory(prev => [...prev, performRoll(sides, count, modifier)]);
    };

    const handleCustomRoll = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic parser for "XdY+Z" format
        const regex = /^(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?$/i;
        const match = customFormula.trim().match(regex);

        if (match) {
            const count = match[1] ? parseInt(match[1]) : 1;
            const sides = parseInt(match[2]);
            const operator = match[3];
            const modifier = match[4] ? parseInt(match[4]) : 0;
            // Fix: correctly apply sign to modifier
            const finalModifier = operator === '-' ? -modifier : modifier;

            rollDice(sides, count, finalModifier);
            setCustomFormula('');
        } else {
            // Handle simple numbers as modifiers or just error out silently for now
            // Or try to evaluate simple math if we wanted to be fancy, but stick to dice syntax
        }
    };

    const rollTest = () => setHistory(h => [
        genre === 'attaque'
            ? performAttaque(carac, difficulte === '' ? undefined : difficulte, avantage, conditions, option)
            : performTest(carac, difficulte === '' ? undefined : difficulte, avantage, repetitions),
        ...h,
    ].slice(0, 50));

    const rollDommages = () => {
        const jet = performDommages(formuleDm, rd, resistance, dmTemporaires, forCible, dmCritique);
        if (jet) setHistory(h => [jet, ...h].slice(0, 50));
    };

    const clearHistory = () => setHistory([]);

    if (!isOpen && mode === 'popup') return null;

    // In popup mode (draggable window), we just fill 100%. In inline, we might have minimums.
    const containerClasses = mode === 'popup'
        ? "w-full h-full flex flex-col"
        : "w-full h-full min-h-[500px] glass-panel rounded-2xl flex flex-col border-primary-500/30";

    return (
        <div className={containerClasses}>
            {/* Header: Only show if INLINE. If popup, DraggableWindow handles the header. */}
            {mode === 'inline' && (
                <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/20 rounded-t-2xl">
                    <div className="flex items-center gap-2 text-primary-400">
                        <Dices size={20} />
                        <h3 className="font-display font-bold text-lg">{LEXIQUE.des}</h3>
                    </div>
                </div>
            )}

            {/* Controls (Title only in popup if needed, or just Action bar) */}
            {mode === 'popup' && (
                <div className="p-2 flex justify-end border-b border-white/5 bg-black/10">
                    <button
                        onClick={clearHistory}
                        className="text-[11px] uppercase font-bold text-stone-400 hover:text-stone-300 flex items-center gap-1 transition-colors"
                        title="Effacer l'historique"
                    >
                        <Eraser size={12} /> Effacer
                    </button>
                </div>
            )}


            {/* History Area */}
            <div ref={historyListRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[100px] scrollbar-thin scrollbar-thumb-primary-900 scrollbar-track-transparent">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2 opacity-50 py-4">
                        <Dices size={32} />
                        <p className="text-xs">Lancez les dés...</p>
                    </div>
                ) : (
                    history.map(roll => (
                        <div key={roll.id} className="glass-panel p-2 rounded-lg border-white/5 bg-black/20 flex justify-between items-center animate-in slide-in-from-right-2 fade-in duration-300">
                            <div>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">{roll.description}</span>
                                {roll.details && <div className="text-[11px] text-stone-400 font-mono">{roll.details}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                                {roll.reussi !== undefined && (
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${roll.reussi
                                        ? 'text-green-300 border-green-500/40 bg-green-950/30'
                                        : 'text-red-300 border-red-500/40 bg-red-950/30'}`}>
                                        {roll.reussi ? 'Réussi' : 'Échoué'}
                                    </span>
                                )}
                                <div className={`text-xl font-bold font-display ${roll.isCritSuccess ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' :
                                    roll.isCritFail ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]' :
                                        'text-stone-200'
                                    }`}>
                                    {roll.result}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Controls */}
            <div className="p-3 border-t border-white/10 bg-black/20 space-y-3">
                {/* Test COF2 : d20 + carac, dé bonus / malus, difficulté. Les états
                    préjudiciables déclarent un dé malus depuis le compendium ; il n'y avait
                    jusqu'ici aucun endroit pour le jeter. */}
                <div className="space-y-2 pb-3 border-b border-white/10">
                    <div role="radiogroup" aria-label="Type de test" className="flex gap-1">
                        {([['carac', 'Caractéristique'], ['attaque', 'Attaque']] as const).map(([id, label]) => (
                            <button
                                key={id}
                                role="radio"
                                aria-checked={genre === id}
                                onClick={() => setGenre(id)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${genre === id
                                    ? 'bg-primary-500/20 text-primary-300 border-primary-500/40'
                                    : 'bg-white/5 text-stone-400 border-white/5 hover:text-stone-300'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 shrink-0">{genre === 'attaque' ? 'Att.' : 'Carac.'}</label>
                        <input
                            type="number"
                            aria-label={genre === 'attaque' ? "Valeur d'attaque" : 'Valeur de caractéristique'}
                            value={carac}
                            onChange={e => setCarac(parseInt(e.target.value) || 0)}
                            className="w-14 bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs font-mono focus:outline-none focus:border-primary-500/50"
                        />
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 shrink-0 ml-1">{genre === 'attaque' ? 'DEF' : 'DIF'}</label>
                        {genre === 'attaque' ? (
                            <input
                                type="number"
                                aria-label="DEF de la cible"
                                value={difficulte}
                                onChange={e => setDifficulte(e.target.value === '' ? '' : parseInt(e.target.value))}
                                placeholder="—"
                                className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs font-mono focus:outline-none focus:border-primary-500/50"
                            />
                        ) : (
                            <select
                                aria-label="Difficulté"
                                value={difficulte}
                                onChange={e => setDifficulte(e.target.value === '' ? '' : parseInt(e.target.value))}
                                className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs focus:outline-none focus:border-primary-500/50"
                            >
                                <option value="">— libre —</option>
                                {DIFFICULTES.map(d => <option key={d.valeur} value={d.valeur}>{d.label} ({d.valeur})</option>)}
                            </select>
                        )}
                    </div>
                    {genre === 'attaque' && (
                        <div className="space-y-1">
                            <select
                                aria-label="Option tactique"
                                value={option}
                                onChange={e => setOption(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs focus:outline-none focus:border-primary-500/50"
                            >
                                <option value="">— Attaque simple —</option>
                                <optgroup label="Options tactiques">
                                    {OPTIONS_TACTIQUES.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.label} ({o.action}){o.attaque ? ` ${o.attaque > 0 ? '+' : ''}${o.attaque}` : ''}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Manœuvres (test opposé)">
                                    {MANOEUVRES.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.label}{o.attaque ? ` ${o.attaque}` : o.attaqueCarac ? ` +${o.attaqueCarac}` : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                            {option && (
                                <p className="text-[10px] text-stone-400 leading-snug px-0.5">
                                    {optionTactique(option)?.effet}
                                    {optionTactique(option)?.modifieParTaille && <span className="block text-stone-500">{NOTE_TAILLE}</span>}
                                </p>
                            )}
                        </div>
                    )}

                    {genre === 'attaque' && (
                        <div className="rounded border border-white/5 bg-black/20">
                            <button
                                onClick={() => setConditionsOuvertes(o => !o)}
                                aria-expanded={conditionsOuvertes}
                                className="w-full flex items-center justify-between px-2 py-1 text-[10px] uppercase tracking-wider text-stone-400 hover:text-stone-300 transition-colors"
                            >
                                <span>Conditions de tir</span>
                                <span className="font-mono text-primary-300">
                                    {conditions.length > 0 ? `${conditions.length} cochée${conditions.length > 1 ? 's' : ''}` : '—'}
                                </span>
                            </button>
                            {conditionsOuvertes && (
                                <div className="px-2 pb-2 space-y-0.5 max-h-40 overflow-y-auto">
                                    {CONDITIONS_TIR.map(c => (
                                        <label key={c.id} className="flex items-start gap-2 text-[11px] text-stone-300 cursor-pointer hover:text-stone-100">
                                            <input
                                                type="checkbox"
                                                checked={conditions.includes(c.id)}
                                                onChange={e => setConditions(liste => e.target.checked
                                                    ? [...liste, c.id]
                                                    : liste.filter(x => x !== c.id))}
                                                className="mt-0.5 accent-primary-500"
                                            />
                                            <span className="flex-1 min-w-0">
                                                {c.label}
                                                <span className="text-stone-400">
                                                    {c.modificateur !== undefined ? ` ${c.modificateur}` : c.deMalus ? ' · dé malus' : ' · spécial'}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {genre === 'carac' && (
                        <label className="flex items-center gap-1.5" title={NOTE_RENDEMENT_DECROISSANT}>
                            <span className="text-[10px] uppercase tracking-wider text-stone-400 shrink-0">Répétitions</span>
                            <input
                                type="number"
                                aria-label="Répétitions de la même capacité"
                                value={repetitions}
                                min={0}
                                onChange={e => setRepetitions(parseInt(e.target.value) || 0)}
                                className="w-12 bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs font-mono focus:outline-none focus:border-primary-500/50"
                            />
                            <span className="text-[10px] text-stone-400">
                                {repetitions > 0 ? `+${bonusRendementDecroissant(repetitions)} pour résister` : 'rendement décroissant'}
                            </span>
                        </label>
                    )}

                    <div className="flex items-center gap-1.5">
                        <div role="radiogroup" aria-label="Dé bonus ou malus" className="flex gap-1 flex-1">
                            {([['malus', 'Dé malus'], ['aucun', 'Normal'], ['bonus', 'Dé bonus']] as const).map(([id, label]) => (
                                <button
                                    key={id}
                                    role="radio"
                                    aria-checked={avantage === id}
                                    onClick={() => setAvantage(id)}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${avantage === id
                                        ? 'bg-primary-500/20 text-primary-300 border-primary-500/40'
                                        : 'bg-white/5 text-stone-400 border-white/5 hover:text-stone-300'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={rollTest}
                            className="px-3 py-1 rounded bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-[11px] uppercase tracking-wider transition-all"
                        >
                            Tester
                        </button>
                    </div>
                </div>

                {/* Dommages : la RD, la résistance et le minimum d'un point ne s'appliquaient
                    nulle part, alors que la RD est calculée sur la fiche depuis longtemps. */}
                <div className="space-y-2 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                        <input
                            type="text"
                            aria-label="Formule de dommages"
                            value={formuleDm}
                            onChange={e => setFormuleDm(e.target.value)}
                            placeholder="DM — ex. 1d8+3"
                            className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs font-mono placeholder-stone-600 focus:outline-none focus:border-primary-500/50"
                        />
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 shrink-0">RD</label>
                        <input
                            type="number"
                            aria-label="Réduction des dommages de la cible"
                            value={rd}
                            onChange={e => setRd(parseInt(e.target.value) || 0)}
                            className="w-12 bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs font-mono focus:outline-none focus:border-primary-500/50"
                        />
                        <button
                            onClick={rollDommages}
                            disabled={!formuleDm}
                            className="px-3 py-1 rounded bg-red-900/60 hover:bg-red-800/70 disabled:opacity-40 text-red-100 font-bold text-[11px] uppercase tracking-wider transition-all"
                        >
                            DM
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-stone-400">
                        <label className="flex items-center gap-1 cursor-pointer hover:text-stone-300">
                            <input type="checkbox" checked={dmCritique} onChange={e => setDmCritique(e.target.checked)} className="accent-primary-500" />
                            Critique (×2)
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer hover:text-stone-300">
                            <input type="checkbox" checked={resistance} onChange={e => setResistance(e.target.checked)} className="accent-primary-500" />
                            Résistance (÷2)
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer hover:text-stone-300">
                            <input type="checkbox" checked={dmTemporaires} onChange={e => setDmTemporaires(e.target.checked)} className="accent-primary-500" />
                            Temporaires
                        </label>
                        {dmTemporaires && (
                            <label className="flex items-center gap-1">
                                FOR de la cible
                                <input
                                    type="number"
                                    aria-label="FOR de la cible"
                                    value={forCible}
                                    onChange={e => setForCible(parseInt(e.target.value) || 0)}
                                    className="w-10 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-stone-200 font-mono focus:outline-none focus:border-primary-500/50"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Standard Dice Grid */}
                <div className="grid grid-cols-4 gap-1.5">
                    {[4, 6, 8, 10, 12, 20, 100].map(die => (
                        <button
                            key={die}
                            onClick={() => rollDice(die)}
                            className={`
                                py-1.5 rounded font-bold font-display text-xs transition-all
                                ${die === 20
                                    ? 'col-span-2 bg-primary-600 hover:bg-primary-500 text-stone-950 shadow-lg hover:shadow-primary-500/20'
                                    : 'bg-white/5 hover:bg-white/10 text-stone-300 border border-white/5 hover:border-primary-500/30'
                                }
                            `}
                        >
                            d{die}
                        </button>
                    ))}
                </div>

                {/* Custom Formula Input */}
                <form onSubmit={handleCustomRoll} className="relative">
                    <input
                        type="text"
                        value={customFormula}
                        onChange={(e) => setCustomFormula(e.target.value)}
                        aria-label="Jet libre (ex. 2d6+4)"
                        placeholder="Ex: 2d6+4"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-stone-300 placeholder-stone-600 focus:outline-none focus:border-primary-500/50 text-xs font-mono"
                    />
                    <button
                        type="submit"
                        disabled={!customFormula}
                        className="absolute right-1 top-1 bottom-1 px-2 text-stone-400 hover:text-primary-400 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
};
