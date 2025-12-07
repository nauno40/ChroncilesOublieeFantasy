import React from 'react';
import { useParams, Link } from 'react-router-dom';
import capacitesData from '../data/capacites.json';
import profilesData from '../data/profiles.json';
import voiesData from '../data/voies.json';
import type { Capacity, Profile, Voie } from '../types/normalized';
import { ArrowLeft } from 'lucide-react';

const capacites = capacitesData as Capacity[];
const profiles = profilesData as Profile[];
const voies = voiesData as Voie[];

export const CapaciteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    // Using ID directly
    const capacite = capacites.find(c => c.id === id);

    if (!capacite) {
        return <div>Capacité introuvable</div>;
    }

    // Find related profile and voie
    const profile = capacite.profileId ? profiles.find(p => p.id === capacite.profileId) : null;
    const voie = capacite.voieId ? voies.find(v => v.id === capacite.voieId) : null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <Link to="/capacites" className="inline-flex items-center text-stone-400 hover:text-primary-400 transition-colors group mb-2">
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-display font-medium">Retour aux Capacités</span>
            </Link>

            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border-primary-500/20 relative">
                {/* Decorative top border */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>

                {/* Header */}
                <div className="bg-stone-900/40 p-8 backdrop-blur-sm">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">
                        {capacite.name}
                    </h1>
                    <div className="flex flex-wrap gap-3">
                        {capacite.rank && (
                            <span className="px-4 py-2 rounded-full bg-primary-500/20 text-primary-300 text-sm font-bold border border-primary-500/30">
                                Rang {capacite.rank}
                            </span>
                        )}
                        {profile && (
                            <Link
                                to={`/classes/${profile.id}`}
                                className="px-4 py-2 rounded-full bg-stone-700/50 text-stone-300 text-sm font-medium border border-stone-600/50 hover:border-primary-500/30 hover:text-primary-300 transition-all"
                            >
                                {profile.name}
                            </Link>
                        )}
                        {voie && (
                            <Link
                                to={`/voies/${voie.id}`}
                                className="px-4 py-2 rounded-full bg-stone-700/50 text-stone-300 text-sm font-medium border border-stone-600/50 hover:border-primary-500/30 hover:text-primary-300 transition-all"
                            >
                                {voie.name}
                            </Link>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-stone-900/30 to-transparent">
                    <div>
                        <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Description
                        </h3>
                        <p className="text-stone-300 leading-relaxed whitespace-pre-line">
                            {capacite.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
