import React, { useState, useMemo } from 'react';
import nourritureData from '../data/Nourriture.json';
import logementsData from '../data/Logements.json';
import type { Food, Lodging } from '../types';
import { Search } from 'lucide-react';

const nourriture = nourritureData as Food[];
const logements = logementsData as Lodging[];

type Tab = 'food' | 'lodging';

export const Provisions: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('food');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFood = useMemo(() => {
        return nourriture.filter(f => f.Nom.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    const filteredLodging = useMemo(() => {
        return logements.filter(l => l.Nom.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-primary-500/20 sticky top-0 z-10 backdrop-blur-md">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 mb-6">
                    Provisions
                </h1>

                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => { setActiveTab('food'); setSearchTerm(''); }}
                        className={`px-6 py-3 rounded-xl font-display font-bold transition-all ${activeTab === 'food'
                                ? 'bg-primary-500/20 text-primary-300 border-2 border-primary-500/50'
                                : 'bg-stone-900/40 text-stone-400 border border-white/5 hover:border-primary-500/30'
                            }`}
                    >
                        Nourriture ({nourriture.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('lodging'); setSearchTerm(''); }}
                        className={`px-6 py-3 rounded-xl font-display font-bold transition-all ${activeTab === 'lodging'
                                ? 'bg-primary-500/20 text-primary-300 border-2 border-primary-500/50'
                                : 'bg-stone-900/40 text-stone-400 border border-white/5 hover:border-primary-500/30'
                            }`}
                    >
                        Logement ({logements.length})
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-stone-900/50 border border-primary-500/20 rounded-xl text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-all"
                    />
                </div>
            </div>

            {activeTab === 'food' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFood.map((food, i) => (
                        <div key={i} className="glass-panel p-4 rounded-xl border-white/5 hover:border-primary-500/30 transition-all">
                            <h3 className="text-stone-200 font-semibold mb-1">{food.Nom}</h3>
                            <p className="text-primary-400 font-mono text-sm">{food.Prix}</p>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'lodging' && (
                <div className="grid md:grid-cols-2 gap-4">
                    {filteredLodging.map((lodging, i) => (
                        <div key={i} className="glass-panel p-6 rounded-xl border-white/5 hover:border-primary-500/30 transition-all">
                            <h3 className="text-lg font-display font-bold text-stone-200 mb-2">{lodging.Nom}</h3>
                            <p className="text-primary-400 font-mono">{lodging.Prix}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
