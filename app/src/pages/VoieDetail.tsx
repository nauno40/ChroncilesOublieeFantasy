import React from 'react';
import { useParams, Link } from 'react-router-dom';
import voiesData from '../data/voies.json';
import capacitesData from '../data/capacites.json';
import type { Voie, Capacity } from '../types/normalized';
import { ArrowLeft } from 'lucide-react';

const voies = voiesData as Voie[];
const capacites = capacitesData as Capacity[];

export const VoieDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const voie = voies.find(v => v.id === id);

    if (!voie) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="glass-panel p-8 rounded-2xl text-center">
                    <h2 className="text-2xl font-display font-bold text-primary-400 mb-4">Voie introuvable</h2>
                    <p className="text-stone-400 mb-6">La voie demandée n'existe pas.</p>
                    <Link to="/voies" className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors">
                        <ArrowLeft size={18} className="mr-2" />
                        Retour aux Voies
                    </Link>
                </div>
            </div>
        );
    }

    // Get all capacities for this voie
    const voieCapacities = capacites
        .filter(cap => cap.voieId === voie.id)
        .sort((a, b) => (a.rank || 0) - (b.rank || 0));

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <Link to="/voies" className="inline-flex items-center text-stone-400 hover:text-primary-400 transition-colors group mb-2">
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-display font-medium">Retour aux Voies</span>
            </Link>

            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border-primary-500/20 relative">
                {/* Decorative top border */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>

                {/* Header */}
                <div className="bg-stone-900/40 p-8 backdrop-blur-sm">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">
                        {voie.name}
                    </h1>
                    <div className="flex gap-3">
                        <span className="px-4 py-2 rounded-full bg-primary-500/20 text-primary-300 text-sm font-medium border border-primary-500/30">
                            {voie.type}
                        </span>
                        {voie.profileId && (
                            <span className="px-4 py-2 rounded-full bg-stone-700/50 text-stone-300 text-sm font-medium border border-stone-600/50">
                                {voie.profileId}
                            </span>
                        )}
                    </div>
                </div>

                {/* Capacities */}
                <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-stone-900/30 to-transparent">
                    {voieCapacities.length > 0 ? (
                        <>
                            <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
                                Capacités ({voieCapacities.length})
                            </h3>

                            <div className="space-y-4">
                                {voieCapacities.map((capacity) => {
                                    let displayName = capacity.name;
                                    let isLimited = false;

                                    // Clean asterisks
                                    displayName = displayName.replace(/\*/g, '');

                                    if (displayName.includes('(L)')) {
                                        isLimited = true;
                                        displayName = displayName.replace('(L)', '').trim();
                                    } else if (displayName.endsWith(' L')) {
                                        isLimited = true;
                                        displayName = displayName.slice(0, -2).trim();
                                    }

                                    return (
                                        <div
                                            key={capacity.id}
                                            className="glass-panel p-6 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <h4 className="text-lg font-display font-bold text-primary-300 flex items-center gap-2 flex-wrap">
                                                    {displayName}
                                                </h4>
                                                <div className="flex gap-2">
                                                    {isLimited && (
                                                        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">
                                                            Limité
                                                        </span>
                                                    )}
                                                    {capacity.rank && (
                                                        <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-bold border border-primary-500/30">
                                                            Rang {capacity.rank}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-stone-300 leading-relaxed whitespace-pre-line">
                                                {capacity.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-stone-400 text-lg">
                                Aucune capacité disponible pour cette voie.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
