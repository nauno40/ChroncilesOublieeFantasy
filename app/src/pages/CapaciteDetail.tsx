import React from 'react';
import { useParams, Link } from 'react-router-dom';
import capacitesData from '../data/Capacités.json';
import type { Capability } from '../types';
import { ArrowLeft } from 'lucide-react';

const capacites = capacitesData as Capability[];

export const CapaciteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const index = parseInt(id || '0', 10);
    const capacite = capacites[index];

    if (!capacite) {
        return <div>Capacité introuvable</div>;
    }

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
                        {capacite.Nom}
                    </h1>
                    <div className="flex gap-3 flex-wrap">
                        {capacite.Profile && (
                            <span className="bg-primary-950/50 text-primary-300 px-4 py-2 rounded-lg border border-primary-500/30 font-medium">
                                {capacite.Profile}
                            </span>
                        )}
                        {capacite.Voie && (
                            <span className="bg-stone-900/60 text-stone-300 px-4 py-2 rounded-lg border border-stone-700">
                                {capacite.Voie}
                            </span>
                        )}
                        {capacite.rang && (
                            <span className="bg-stone-900/60 text-primary-400 px-4 py-2 rounded-lg border border-primary-500/30 font-bold">
                                Rang {capacite.rang}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-stone-900/30 to-transparent">
                    {/* Description */}
                    <div className="glass-panel p-6 rounded-xl border-white/5">
                        <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                            Description
                        </h3>
                        <p className="text-stone-300 leading-relaxed">{capacite.Desc}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
