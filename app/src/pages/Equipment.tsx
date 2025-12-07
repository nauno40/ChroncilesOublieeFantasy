import React, { useState, useMemo } from 'react';
import armesData from '../data/Armes.json';
import armuresData from '../data/Armures.json';
import materielsData from '../data/Materiels.json';
import type { Weapon, Armor, Material } from '../types';
import { Search, Package } from 'lucide-react';

const armes = armesData as Weapon[];
const armures = armuresData as Armor[];
const materiels = materielsData as Material[];

type Tab = 'weapons' | 'armor' | 'materials';

export const Equipment: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('weapons');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredWeapons = useMemo(() => {
        return armes.filter(w => w.Nom.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    const filteredArmor = useMemo(() => {
        return armures.filter(a => a.Nom.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    const filteredMaterials = useMemo(() => {
        return materiels.filter(m => m.Nom.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-primary-500/20 sticky top-0 z-10 backdrop-blur-md">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 mb-6">
                    Équipement
                </h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    <button
                        onClick={() => { setActiveTab('weapons'); setSearchTerm(''); }}
                        className={`px-6 py-3 rounded-xl font-display font-bold transition-all ${activeTab === 'weapons'
                                ? 'bg-primary-500/20 text-primary-300 border-2 border-primary-500/50'
                                : 'bg-stone-900/40 text-stone-400 border border-white/5 hover:border-primary-500/30'
                            }`}
                    >
                        Armes ({armes.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('armor'); setSearchTerm(''); }}
                        className={`px-6 py-3 rounded-xl font-display font-bold transition-all ${activeTab === 'armor'
                                ? 'bg-primary-500/20 text-primary-300 border-2 border-primary-500/50'
                                : 'bg-stone-900/40 text-stone-400 border border-white/5 hover:border-primary-500/30'
                            }`}
                    >
                        Armures ({armures.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('materials'); setSearchTerm(''); }}
                        className={`px-6 py-3 rounded-xl font-display font-bold transition-all ${activeTab === 'materials'
                                ? 'bg-primary-500/20 text-primary-300 border-2 border-primary-500/50'
                                : 'bg-stone-900/40 text-stone-400 border border-white/5 hover:border-primary-500/30'
                            }`}
                    >
                        Matériel ({materiels.length})
                    </button>
                </div>

                {/* Search */}
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

            {/* Content */}
            {activeTab === 'weapons' && (
                <div className="glass-panel p-6 rounded-xl border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-primary-300 font-display">Nom</th>
                                    <th className="text-left p-3 text-primary-300 font-display">Type</th>
                                    <th className="text-left p-3 text-primary-300 font-display">Dégâts</th>
                                    <th className="text-left p-3 text-primary-300 font-display">Portée</th>
                                    <th className="text-left p-3 text-primary-300 font-display">Critique</th>
                                    <th className="text-left p-3 text-primary-300 font-display">Prix</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWeapons.map((weapon, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-stone-900/30 transition-colors">
                                        <td className="p-3 text-stone-200 font-semibold">{weapon.Nom}</td>
                                        <td className="p-3 text-stone-400">{weapon.Type}</td>
                                        <td className="p-3 text-primary-400 font-mono">{weapon.Dégâts}</td>
                                        <td className="p-3 text-stone-400">{weapon.Portée}</td>
                                        <td className="p-3 text-stone-400">{weapon.Critique}</td>
                                        <td className="p-3 text-stone-300">{weapon.Prix}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'armor' && (
                <div className="glass-panel p-6 rounded-xl border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-primary-300 font-display">Nom</th>
                                    <th className="text-left p-3 text-primary-300 font-display">Type</th>
                                    <th className="text-left p-3 text-primary-300 font-display">DEF</th>
                                    <th className="text-left p-3 text-primary-300 font-display">Prix</th>
                                    <th className="text-left p-3 text-primary-300 font-display">Commentaires</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredArmor.map((armor, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-stone-900/30 transition-colors">
                                        <td className="p-3 text-stone-200 font-semibold">{armor.Nom}</td>
                                        <td className="p-3 text-stone-400">{armor.Type}</td>
                                        <td className="p-3 text-primary-400 font-mono">{armor.DEF}</td>
                                        <td className="p-3 text-stone-300">{armor.Prix}</td>
                                        <td className="p-3 text-stone-400 text-xs">{armor.Comments}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'materials' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMaterials.map((material, i) => (
                        <div key={i} className="glass-panel p-4 rounded-xl border-white/5 hover:border-primary-500/30 transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-stone-200 font-semibold mb-1">{material.Nom}</h3>
                                    <p className="text-primary-400 font-mono text-sm">{material.Prix}</p>
                                </div>
                                <Package size={20} className="text-stone-600" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
