import React, { useState, useRef, useEffect } from 'react';
import { Dices, Eraser, ChevronRight } from 'lucide-react';
import { LEXIQUE } from '../../domain/lexique';
import { lancerTest, DIFFICULTES, qualificatifDifficulte } from '../../domain/rules/test';

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
const performTest = (carac: number, difficulte: number | undefined, avantage: 'bonus' | 'malus' | 'aucun'): RollResult => {
    const r = lancerTest({
        carac,
        difficulte,
        deBonus: avantage === 'bonus' ? 1 : 0,
        deMalus: avantage === 'malus' ? 1 : 0,
    });
    const signe = carac > 0 ? `+${carac}` : carac < 0 ? String(carac) : '';
    const mention = avantage === 'bonus' ? ' dé bonus' : avantage === 'malus' ? ' dé malus' : '';
    const qualificatif = difficulte !== undefined ? qualificatifDifficulte(difficulte) : undefined;
    return {
        id: crypto.randomUUID(),
        description: `Test d20${signe}${mention}${difficulte !== undefined ? ` · DIF ${difficulte}${qualificatif ? ` (${qualificatif.toLowerCase()})` : ''}` : ''}`,
        result: r.total,
        details: `(${r.des.join(' / ')})${signe}`,
        timestamp: Date.now(),
        isCritSuccess: r.critique,
        isCritFail: r.echecCritique,
        reussi: r.reussi,
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

    const rollTest = () => setHistory(h => [performTest(carac, difficulte === '' ? undefined : difficulte, avantage), ...h].slice(0, 50));

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
                    <div className="flex items-center gap-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 shrink-0">Carac.</label>
                        <input
                            type="number"
                            aria-label="Valeur de caractéristique"
                            value={carac}
                            onChange={e => setCarac(parseInt(e.target.value) || 0)}
                            className="w-14 bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs font-mono focus:outline-none focus:border-primary-500/50"
                        />
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 shrink-0 ml-1">DIF</label>
                        <select
                            aria-label="Difficulté"
                            value={difficulte}
                            onChange={e => setDifficulte(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs focus:outline-none focus:border-primary-500/50"
                        >
                            <option value="">— libre —</option>
                            {DIFFICULTES.map(d => <option key={d.valeur} value={d.valeur}>{d.label} ({d.valeur})</option>)}
                        </select>
                    </div>
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
