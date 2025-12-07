import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import capacitesData from '../data/Capacités.json';
import type { Capability } from '../types';
import { Search, Filter, X } from 'lucide-react';

const capacites = capacitesData as Capability[];

export const Capacites: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedProfile, setSelectedProfile] = useState('');
    const [selectedVoie, setSelectedVoie] = useState('');

    // Get unique profiles and voies for filters
    const profiles = useMemo(() => {
        const uniqueProfiles = Array.from(new Set(capacites.map(c => c.Profile).filter(Boolean)));
        return uniqueProfiles.sort();
    }, []);

    const voies = useMemo(() => {
        const uniqueVoies = Array.from(new Set(capacites.map(c => c.Voie).filter(Boolean)));
        return uniqueVoies.sort();
    }, []);

    const filteredCapacites = useMemo(() => {
        return capacites.filter(cap => {
            const matchesSearch = cap.Nom.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProfile = !selectedProfile || cap.Profile === selectedProfile;
            const matchesVoie = !selectedVoie || cap.Voie === selectedVoie;
            return matchesSearch && matchesProfile && matchesVoie;
        });
    }, [searchTerm, selectedProfile, selectedVoie]);

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedProfile('');
        setSelectedVoie('');
    };

    const hasActiveFilters = searchTerm || selectedProfile || selectedVoie;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-primary-500/20 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500">
                        Capacités
                    </h1>
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-3 py-2 bg-red-900/30 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-900/50 transition-all text-sm"
                        >
                            <X size={16} />
                            Tout effacer
                        </button>
                    )}
                </div>

                {/* Search and Filters */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher une capacité..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-stone-900/50 border border-primary-500/20 rounded-xl text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-all"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
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

                        <div className="flex items-center gap-3">
                            <Filter size={18} className="text-stone-400" />
                            <select
                                value={selectedVoie}
                                onChange={(e) => setSelectedVoie(e.target.value)}
                                className="flex-1 px-4 py-2 bg-stone-900/50 border border-primary-500/20 rounded-lg text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
                            >
                                <option value="">Toutes les voies</option>
                                {voies.map(voie => (
                                    <option key={voie} value={voie}>{voie}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-sm text-stone-400">
                    {filteredCapacites.length} capacité{filteredCapacites.length > 1 ? 's' : ''} trouvée{filteredCapacites.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Capacités List */}
            <div className="space-y-3">
                {filteredCapacites.map((cap, index) => (
                    <Link
                        key={index}
                        to={`/capacites/${index}`}
                        className="glass-panel p-5 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/10 group block"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-display font-bold text-primary-300 group-hover:text-primary-200 transition-colors flex-1">
                                {cap.Nom}
                            </h3>
                            {cap.rang && (
                                <span className="text-xs bg-primary-950/50 text-primary-400 px-2 py-1 rounded border border-primary-500/30">
                                    Rang {cap.rang}
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2 mb-3">
                            {cap.Profile && (
                                <span className="text-xs bg-stone-900/50 text-stone-400 px-2 py-1 rounded">
                                    {cap.Profile}
                                </span>
                            )}
                            {cap.Voie && (
                                <span className="text-xs bg-stone-900/50 text-stone-400 px-2 py-1 rounded">
                                    {cap.Voie}
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-stone-400 leading-relaxed line-clamp-2">
                            {cap.Desc}
                        </p>
                    </Link>
                ))}
            </div>

            {filteredCapacites.length === 0 && (
                <div className="glass-panel p-12 rounded-xl text-center">
                    <p className="text-stone-400 text-lg">Aucune capacité trouvée</p>
                </div>
            )}
        </div>
    );
};
