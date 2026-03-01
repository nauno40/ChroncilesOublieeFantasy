import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Voie, Capacity } from '../types/normalized';
import { ArrowLeft } from 'lucide-react';
import { DynamicDetailsRenderer } from '../components/common';
import { DataService } from '../services/dataService';

export const VoieDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [voie, setVoie] = useState<Voie | null>(null);
    const [voieCapacities, setVoieCapacities] = useState<Capacity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch specific voie and its capabilities
                const [voieData, capabilities] = await Promise.all([
                    DataService.getVoieById(id),
                    DataService.getCapabilitiesByVoie(id)
                ]);

                // Normalize voie data if needed (similar to list view)
                const normalizedVoie = {
                    ...voieData,
                    profileId: voieData.profileId || ((voieData as any).profile ? String((voieData as any).profile).split('/').pop() : null) || null,
                    id: String(voieData.id)
                };

                setVoie(normalizedVoie);

                if (capabilities) {
                    setVoieCapacities(capabilities.sort((a, b) => (a.rank || 0) - (b.rank || 0)));
                }
            } catch (error) {
                console.error("Failed to fetch voie details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-primary-200">Chargement...</div>;

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
                    {voie ? (
                        <>
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">
                                {voie.name}
                            </h1>

                        </>
                    ) : (
                        <div className="text-stone-400">Voie non trouvée</div>
                    )}
                </div>

                {/* Capacities */}
                <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-stone-900/30 to-transparent">
                    {voieCapacities.length > 0 ? (
                        <>
                            <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
                                Détails & Mécaniques
                            </h3>
                            {voie && voie.details && <DynamicDetailsRenderer details={voie.details} className="mb-8" />}

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
                                            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center size-6 rounded bg-primary-950 text-primary-500 text-xs font-bold border border-primary-500/20">
                                                        {capacity.rank}
                                                    </span>
                                                    <h4 className="text-lg font-bold text-stone-100 group-hover:text-primary-300 transition-colors">
                                                        {displayName}
                                                    </h4>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {isLimited && (
                                                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-red-900/20 text-red-400 rounded border border-red-500/20">
                                                                Limité
                                                            </span>
                                                        )}
                                                        {capacity.isSpell && (
                                                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-900/20 text-blue-400 rounded border border-blue-500/20">
                                                                Sort
                                                            </span>
                                                        )}
                                                        {capacity.active && (
                                                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-900/20 text-amber-400 rounded border border-amber-500/20">
                                                                Actif
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-[1px] flex-1 bg-white/5 mx-4 hidden md:block"></div>
                                            </div>
                                            <p className="text-stone-300 leading-relaxed whitespace-pre-line pl-9">
                                                {capacity.description}
                                            </p>
                                            <DynamicDetailsRenderer details={capacity.details} className="pl-9 mt-4" />
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
