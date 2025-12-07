import React, { useState, useMemo } from 'react';
import monturesData from '../data/Montures.json';
import type { Mount } from '../types';
import { Search } from 'lucide-react';

const montures = monturesData as Mount[];

export const Mounts: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMounts = useMemo(() => {
        return montures.filter(m => m.Nom.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-primary-500/20 sticky top-0 z-10 backdrop-blur-md">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 mb-6">
                    Montures & Véhicules
                </h1>

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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMounts.map((mount, i) => (
                    <div key={i} className="glass-panel p-6 rounded-xl border-white/5 hover:border-primary-500/30 transition-all">
                        <h3 className="text-lg font-display font-bold text-stone-200 mb-2">{mount.Nom}</h3>
                        <p className="text-primary-400 font-mono">{mount.Prix}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
