import React, { useState, useMemo } from 'react';
import etatsData from '../data/Etats.json';
import type { HarmfulState } from '../types';
import { Search } from 'lucide-react';

const etats = etatsData as HarmfulState[];

export const States: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStates = useMemo(() => {
        return etats.filter(e =>
            e.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.Description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-primary-500/20 sticky top-0 z-10 backdrop-blur-md">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 mb-6">
                    États Préjudiciables
                </h1>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher un état..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-stone-900/50 border border-primary-500/20 rounded-xl text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-all"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {filteredStates.map((state, i) => (
                    <div key={i} className="glass-panel p-6 rounded-xl border-white/5 hover:border-primary-500/30 transition-all group">
                        <div className="flex items-start gap-4">
                            {state.Image && (
                                <div className="w-16 h-16 flex-shrink-0 bg-stone-900/50 rounded-xl p-3 border border-white/5 group-hover:border-primary-500/30 transition-colors">
                                    <img src={state.Image} alt={state.Name} className="w-full h-full object-contain opacity-70" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-display font-bold text-primary-300 mb-2 flex items-center gap-2">
                                    {state.Name}
                                </h3>
                                <p className="text-stone-300 text-sm leading-relaxed">{state.Description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
