import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import racesData from '../data/Races.json';
import type { Race } from '../types';
import { Search } from 'lucide-react';

const races = racesData as Race[];

// Map French race names to English image filenames
const getRaceImageName = (raceName: string): string => {
    const mapping: Record<string, string> = {
        'Demi-elfe': 'elf_half.png.webp',
        'Elfe, haut': 'elf_high.png.webp',
        'Elfe, sylvain': 'elf_wood.png.webp',
        'Nain': 'dwarf.png.webp',
        'Halfelin': 'halfling.png.webp',
        'Humain': 'human.png.webp',
        'Gnome': 'gnome.png.webp',
        'Demi-orque': 'orc_half.png.webp'
    };
    return mapping[raceName] || `${raceName}.jpg`;
};

export const Races: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRaces = useMemo(() => {
        return races.filter(race =>
            race.Title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-primary-500/20 sticky top-0 z-10 backdrop-blur-md">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 mb-6">
                    Races
                </h1>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher une race..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-stone-900/50 border border-primary-500/20 rounded-xl text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-all"
                    />
                </div>

                <div className="mt-4 text-sm text-stone-400">
                    {filteredRaces.length} race{filteredRaces.length > 1 ? 's' : ''} trouvée{filteredRaces.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Races Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRaces.map((race, index) => (
                    <Link
                        key={index}
                        to={`/races/${index}`}
                        className="glass-panel rounded-xl border border-white/5 hover:border-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/10 group overflow-hidden"
                    >
                        {/* Race Image */}
                        <div className="relative h-48 overflow-hidden bg-stone-900/50">
                            <img
                                src={`/assets/races/${getRaceImageName(race.Title)}`}
                                alt={race.Title}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/50 to-transparent"></div>
                        </div>

                        <div className="p-6 relative -mt-8">
                            <h3 className="text-xl font-display font-bold text-primary-300 mb-3 group-hover:text-primary-200 transition-colors">
                                {race.Title}
                            </h3>

                            <div className="space-y-2 text-sm text-stone-400">
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Taille:</span>
                                    <span className="text-stone-300">{race["Taille Min"]} - {race["Taille Max"]}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Espérance de vie:</span>
                                    <span className="text-stone-300">{race["Espérance de vie"]} ans</span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/5">
                                    <span className="text-stone-500 text-xs">Caractéristiques:</span>
                                    <p className="text-primary-400 font-mono text-xs mt-1">{race.Caractéristiques}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredRaces.length === 0 && (
                <div className="glass-panel p-12 rounded-xl text-center">
                    <p className="text-stone-400 text-lg">Aucune race trouvée</p>
                </div>
            )}
        </div>
    );
};
