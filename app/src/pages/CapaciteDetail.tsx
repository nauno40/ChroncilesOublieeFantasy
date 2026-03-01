import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Capacity, Profile, Voie } from '../types/normalized';
import { Badge, DynamicDetailsRenderer } from '../components/common';
import { ArrowLeft } from 'lucide-react';
import { DataService } from '../services/dataService';

export const CapaciteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [capacite, setCapacite] = useState<Capacity | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [voie, setVoie] = useState<Voie | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch the specific capability directly
                const foundCapacite = await DataService.getCapabilityById(id);
                setCapacite(foundCapacite);

                // Then fetch related data if relationships exist
                const [profiles, voies] = await Promise.all([
                    DataService.getProfiles(),
                    DataService.getVoies()
                ]);

                if (foundCapacite) {
                    const foundProfile = foundCapacite.profileId ? profiles.find(p => String(p.id) === String(foundCapacite.profileId)) : null;
                    const foundVoie = foundCapacite.voieId ? voies.find(v => String(v.id) === String(foundCapacite.voieId)) : null;
                    setProfile(foundProfile || null);
                    setVoie(foundVoie || null);
                }
            } catch (error) {
                console.error("Failed to fetch capacity details", error);
                setCapacite(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-primary-200">Chargement...</div>;

    if (!capacite) {
        return <div className="p-8 text-center text-red-400">Capacité introuvable</div>;
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
                    {(() => {
                        let displayName = capacite.name;

                        // Clean asterisks
                        displayName = displayName.replace(/\*/g, '');

                        if (displayName.includes('(L)')) {
                            displayName = displayName.replace('(L)', '').trim();
                        } else if (displayName.endsWith(' L')) {
                            displayName = displayName.slice(0, -2).trim();
                        }

                        return (
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">
                                {displayName}
                            </h1>
                        );
                    })()}
                    <div className="flex flex-wrap gap-2">
                        {(() => {
                            let isLimited = false;
                            if (capacite.name.includes('(L)') || capacite.name.endsWith(' L')) {
                                isLimited = true;
                            }

                            return (
                                <>
                                    {isLimited && (
                                        <Badge variant="danger" size="lg">
                                            Limité
                                        </Badge>
                                    )}
                                    {capacite.active ? (
                                        <Badge variant="warning" size="lg">
                                            Actif
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" size="lg">
                                            Passif
                                        </Badge>
                                    )}
                                </>
                            );
                        })()}

                        {capacite.rank && (
                            <Badge variant="primary" size="lg">
                                Rang {capacite.rank}
                            </Badge>
                        )}
                        {profile && (
                            <Link
                                to={`/classes/${profile.id}`}
                                className="inline-block"
                            >
                                <Badge variant="secondary" size="lg" className="hover:border-primary-500/30 hover:text-primary-300 transition-all">
                                    {profile.name}
                                </Badge>
                            </Link>
                        )}
                        {voie && (
                            <Link
                                to={`/voies/${voie.id}`}
                                className="inline-block"
                            >
                                <Badge variant="secondary" size="lg" className="hover:border-primary-500/30 hover:text-primary-300 transition-all">
                                    {voie.name}
                                </Badge>
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
                        <div className="prose prose-invert max-w-none">
                            <p className="text-stone-300 leading-relaxed whitespace-pre-line">
                                {capacite.description}
                            </p>
                        </div>

                        {/* Dynamic Details Renderer */}
                        <DynamicDetailsRenderer details={capacite.details} />
                    </div>
                </div>
            </div>
        </div>
    );
};
