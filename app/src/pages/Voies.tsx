import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import voiesData from '../data/Voies.json';
import type { Path } from '../types';
import { Search, Filter } from 'lucide-react';

const voies = voiesData as Path[];

export const Voies: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedProfile, setSelectedProfile] = useState('');

    // Get unique profiles for filter
    const profiles = useMemo(() => {
        const uniqueProfiles = Array.from(new Set(voies.map(v => v.profil).filter(Boolean)));
        return uniqueProfiles.sort();
    }, []);

    const filteredVoies = useMemo(() => {
        return voies.filter(voie => {
            const matchesSearch = voie.Voie.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProfile = !selectedProfile || voie.profil === selectedProfile;
            return matchesSearch && matchesProfile;
        });
    }, [searchTerm, selectedProfile]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-primary-500/20 sticky top-0 z-10 backdrop-blur-md">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 mb-6">
                    Voies
                </h1>

                {/* Search and Filter */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher une voie..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-stone-900/50 border border-primary-500/20 rounded-xl text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-stone-400" />
                        <select
                            value={selectedProfile}
                            onChange={(e) => setSelectedProfile(e.target.value)}
                            className="flex-1 px-4 py-2 bg-stone-900/50 border border-primary-500/20 rounded-lg text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
                        >
                            <option value="">Tous les profils</option>
                            {profiles.map(profile => (
                                <option key={profile} value={profile}>{profile}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 text-sm text-stone-400">
                    {filteredVoies.length} voie{filteredVoies.length > 1 ? 's' : ''} trouvée{filteredVoies.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Voies Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {filteredVoies.map((voie, index) => (
                    <Link
                        key={index}
                        to={`/voies/${index}`}
                        className="glass-panel p-6 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/10 group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xl font-display font-bold text-primary-300 group-hover:text-primary-200 transition-colors flex-1">
                                {voie.Voie}
                            </h3>
                            {voie.profil && (
                                <span className="text-xs bg-primary-950/50 text-primary-400 px-2 py-1 rounded border border-primary-500/30">
                                    {voie.profil}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-stone-500">
                            <span className="bg-stone-900/50 px-2 py-1 rounded">{voie.Type}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredVoies.length === 0 && (
                <div className="glass-panel p-12 rounded-xl text-center">
                    <p className="text-stone-400 text-lg">Aucune voie trouvée</p>
                </div>
            )}
        </div>
    );
};
