import React, { useState } from 'react';
import { Sword, RefreshCw, Trash2, Shield } from 'lucide-react';
import type { Combatant } from '../types/campaign';

// Mock data generator
const generateCombatant = (type: 'player' | 'monster', name: string): Combatant => ({
    id: crypto.randomUUID(),
    name,
    type,
    initiative: Math.floor(Math.random() * 20) + 1,
    hp: { current: type === 'player' ? 30 : 50, max: type === 'player' ? 30 : 50 },
    ac: 15
});

export const CombatTracker: React.FC = () => {
    const [combatants, setCombatants] = useState<Combatant[]>([]);
    const [round, setRound] = useState(1);
    const [activeTurn, setActiveTurn] = useState(0);
    const [newItemName, setNewItemName] = useState('');

    const addCombatant = (type: 'player' | 'monster') => {
        if (!newItemName) return;
        const newC = generateCombatant(type, newItemName);
        setCombatants(prev => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
        setNewItemName('');
    };

    const nextTurn = () => {
        if (activeTurn >= combatants.length - 1) {
            setActiveTurn(0);
            setRound(r => r + 1);
        } else {
            setActiveTurn(t => t + 1);
        }
    };

    const removeCombatant = (id: string) => {
        setCombatants(prev => prev.filter(c => c.id !== id));
        if (activeTurn >= combatants.length - 1) {
            setActiveTurn(0);
        }
    };

    const updateHp = (id: string, delta: number) => {
        setCombatants(prev => prev.map(c => {
            if (c.id === id) {
                return { ...c, hp: { ...c.hp, current: Math.max(0, c.hp.current + delta) } };
            }
            return c;
        }));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                    <h1 className="text-3xl font-display font-bold text-primary-400 flex items-center gap-3 drop-shadow-md">
                        <Sword className="text-primary-600" size={32} /> Suivi de Combat
                    </h1>
                    <div className="text-stone-400 font-mono text-sm mt-1 ml-1">ROUND <span className="text-primary-300 font-bold text-lg">{round}</span></div>
                </div>
                <button
                    onClick={nextTurn}
                    className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-stone-950 px-6 py-2 rounded-xl flex items-center gap-2 font-bold cursor-pointer transition-all shadow-lg hover:shadow-primary-500/20 active:scale-95"
                >
                    <RefreshCw size={20} className={activeTurn === 0 ? "animate-spin-slow" : ""} /> Tour Suivant
                </button>
            </header>

            {/* Add Controls */}
            <div className="glass-panel p-4 rounded-xl flex gap-3 shadow-lg">
                <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Nom du combattant (ex: Goblin, Aragorn)"
                    className="flex-1 bg-black/40 border border-white/10 text-stone-100 rounded-lg px-4 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-stone-600"
                    onKeyDown={(e) => e.key === 'Enter' && addCombatant('monster')}
                />
                <button onClick={() => addCombatant('player')} className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 px-4 py-2 rounded-lg text-sm font-bold border border-blue-500/30 transition-colors uppercase tracking-wide">
                    + PJ
                </button>
                <button onClick={() => addCombatant('monster')} className="bg-red-900/40 hover:bg-red-800/60 text-red-200 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/30 transition-colors uppercase tracking-wide">
                    + Monstre
                </button>
            </div>

            {/* List */}
            <div className="space-y-3">
                {combatants.map((c, idx) => (
                    <div
                        key={c.id}
                        className={`
                            relative flex items-center p-4 rounded-xl border transition-all duration-300 backdrop-blur-md
                            ${idx === activeTurn
                                ? 'bg-primary-900/20 border-primary-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.02] z-10'
                                : 'bg-stone-900/40 border-white/5 opacity-80 hover:opacity-100 hover:bg-stone-800/60'}
                        `}
                    >
                        {idx === activeTurn && (
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary-500 rounded-r shadow-[0_0_10px_#f59e0b]"></div>
                        )}

                        {/* Initiative */}
                        <div className="w-14 text-center mr-4">
                            <span className="text-[10px] text-stone-500 uppercase block font-bold mb-0.5">INIT</span>
                            <div className="text-2xl font-display font-bold text-stone-300 border-2 border-white/10 rounded-lg py-1 bg-black/20">
                                {c.initiative}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className={`font-bold text-lg font-display ${c.type === 'player' ? 'text-blue-300 drop-shadow-sm' : 'text-red-300 drop-shadow-sm'}`}>
                                {c.name}
                            </div>
                            <div className="text-xs text-stone-500 flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                    <Shield size={12} className="text-stone-400" /> <span className="text-stone-300 font-mono font-bold">AC {c.ac}</span>
                                </span>
                                <span className="uppercase tracking-widest text-[9px] opacity-60">{c.type === 'player' ? 'Personnage' : 'Adversaire'}</span>
                            </div>
                        </div>

                        {/* HP Control */}
                        <div className="flex items-center gap-4 bg-black/20 p-2 rounded-lg border border-white/5 mx-4">
                            <div className="flex flex-col items-center w-16">
                                <span className="text-[9px] text-stone-500 uppercase font-bold mb-0.5">PV</span>
                                <div className={`font-mono text-xl font-bold ${c.hp.current < c.hp.max / 2 ? 'text-red-500' : 'text-green-500'}`}>
                                    {c.hp.current}
                                    <span className="text-xs text-stone-600 font-normal ml-0.5">/{c.hp.max}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button onClick={() => updateHp(c.id, 1)} className="bg-stone-800 hover:bg-green-900/50 text-green-500 w-8 h-6 rounded flex items-center justify-center text-xs border border-stone-700 hover:border-green-500/50 transition-all active:scale-95">+</button>
                                <button onClick={() => updateHp(c.id, -1)} className="bg-stone-800 hover:bg-red-900/50 text-red-500 w-8 h-6 rounded flex items-center justify-center text-xs border border-stone-700 hover:border-red-500/50 transition-all active:scale-95">-</button>
                            </div>
                        </div>

                        <button onClick={() => removeCombatant(c.id)} className="text-stone-600 hover:text-red-500 p-2 rounded-full hover:bg-stone-900/50 transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {combatants.length === 0 && (
                    <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-stone-800/50 bg-stone-900/20 backdrop-blur-sm">
                        <Sword size={48} className="mx-auto mb-4 text-stone-700 opacity-50" />
                        <p className="text-stone-400 font-display text-lg">Le champ de bataille est vide.</p>
                        <p className="text-stone-600 text-sm mt-1">Préparez-vous à l'affrontement.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
