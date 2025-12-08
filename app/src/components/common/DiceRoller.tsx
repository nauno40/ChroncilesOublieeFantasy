import React, { useState, useRef, useEffect } from 'react';
import { Dices, X, Eraser, ChevronRight } from 'lucide-react';

interface RollResult {
    id: string;
    description: string;
    result: number;
    details: string;
    timestamp: number;
    isCritSuccess?: boolean;
    isCritFail?: boolean;
}

interface DiceRollerProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'popup' | 'inline';
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ isOpen, onClose, mode = 'popup' }) => {
    const [history, setHistory] = useState<RollResult[]>([]);
    const [customFormula, setCustomFormula] = useState('');
    const historyEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of history
    useEffect(() => {
        if (historyEndRef.current) {
            historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history, isOpen]);

    const rollDice = (sides: number, count: number = 1, modifier: number = 0) => {
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

        const details = count > 1 || modifier !== 0
            ? `(${rolls.join('+')})${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`
            : '';

        const newResult: RollResult = {
            id: crypto.randomUUID(),
            description: `${count}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`,
            result: total,
            details,
            timestamp: Date.now(),
            isCritSuccess,
            isCritFail
        };

        setHistory(prev => [...prev, newResult]);
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

    const clearHistory = () => setHistory([]);

    if (!isOpen && mode === 'popup') return null;

    const containerClasses = mode === 'popup'
        ? "fixed bottom-24 right-4 md:right-8 w-80 md:w-96 glass-panel rounded-2xl shadow-2xl z-50 flex flex-col max-h-[600px] border-primary-500/30 animate-in slide-in-from-bottom-10 fade-in duration-200"
        : "w-full h-full min-h-[500px] glass-panel rounded-2xl flex flex-col border-primary-500/30";

    return (
        <div className={containerClasses}>
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/20 rounded-t-2xl">
                <div className="flex items-center gap-2 text-primary-400">
                    <Dices size={20} />
                    <h3 className="font-display font-bold text-lg">Lanceur de Dés</h3>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={clearHistory}
                        className="p-2 hover:bg-white/5 rounded-lg text-stone-500 hover:text-stone-300 transition-colors"
                        title="Effacer l'historique"
                    >
                        <Eraser size={16} />
                    </button>
                    {mode === 'popup' && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg text-stone-500 hover:text-stone-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] scrollbar-thin scrollbar-thumb-primary-900 scrollbar-track-transparent">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-600 space-y-2 opacity-50 py-10">
                        <Dices size={48} />
                        <p className="text-sm">Lancez les dés pour voir le résultat...</p>
                    </div>
                ) : (
                    history.map(roll => (
                        <div key={roll.id} className="glass-panel p-3 rounded-xl border-white/5 bg-black/20 flex justify-between items-center animate-in slide-in-from-right-4 fade-in duration-300">
                            <div>
                                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{roll.description}</span>
                                {roll.details && <div className="text-xs text-stone-600 font-mono mt-0.5">{roll.details}</div>}
                            </div>
                            <div className={`text-2xl font-bold font-display ${roll.isCritSuccess ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' :
                                roll.isCritFail ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]' :
                                    'text-stone-200'
                                }`}>
                                {roll.result}
                            </div>
                        </div>
                    ))
                )}
                <div ref={historyEndRef} />
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-white/10 bg-black/20 rounded-b-2xl space-y-4">
                {/* Standard Dice Grid */}
                <div className="grid grid-cols-4 gap-2">
                    {[4, 6, 8, 10, 12, 20, 100].map(die => (
                        <button
                            key={die}
                            onClick={() => rollDice(die)}
                            className={`
                                py-2 rounded-lg font-bold font-display text-sm transition-all
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
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-stone-300 placeholder-stone-600 focus:outline-none focus:border-primary-500/50 text-sm font-mono"
                    />
                    <button
                        type="submit"
                        disabled={!customFormula}
                        className="absolute right-1 top-1 bottom-1 px-2 text-stone-500 hover:text-primary-400 disabled:opacity-30 disabled:hover:text-stone-500 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};
