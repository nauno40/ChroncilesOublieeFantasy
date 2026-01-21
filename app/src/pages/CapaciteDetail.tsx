import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Capacity, Profile, Voie } from '../types/normalized';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Badge } from '../components/common';
import { DataService } from '../services/dataService';

const DynamicDetailsRenderer = ({ details }: { details: any }) => {
    if (!details) return null;

    return (
        <div className="space-y-4 mt-8 pt-6 border-t border-white/5">
            {Object.entries(details).map(([key, value]: [string, any]) => {
                if (key.startsWith('statistiques_')) {
                    const title = key.replace('statistiques_', '').replace(/_/g, ' ');
                    return (
                        <div key={key} className="bg-black/40 rounded-lg p-4 border border-white/10 text-sm">
                            <strong className="block text-primary-400 uppercase tracking-wider text-xs font-bold mb-3 border-b border-primary-500/20 pb-1">
                                Statistiques : {title}
                            </strong>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                {Object.entries(value).map(([statKey, statValue]: [string, any]) => (
                                    <div key={statKey} className="flex flex-col border-b border-white/5 pb-1">
                                        <span className="text-stone-500 text-[10px] uppercase font-bold">{statKey.replace(/_/g, ' ')}</span>
                                        <span className="text-stone-300 font-medium">{String(statValue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }

                if (key === 'note_speciale' || key === 'note') {
                    return (
                        <div key={key} className="p-4 bg-yellow-900/10 border border-yellow-700/20 rounded-lg flex gap-3">
                            <div className="shrink-0 pt-0.5">
                                <HelpCircle className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <h4 className="text-yellow-500 font-bold text-xs uppercase tracking-wider mb-1">Note Spéciale</h4>
                                <span className="text-stone-300 text-sm italic">
                                    {String(value)}
                                </span>
                            </div>
                        </div>
                    );
                }

                if (key === 'choix_capacite' || key.startsWith('choix_')) {
                    return (
                        <div key={key} className="bg-primary-950/20 rounded-lg p-4 border border-primary-500/10 text-sm">
                            <strong className="block text-primary-300 mb-2 font-display text-xs uppercase tracking-wider">
                                {key.replace(/_/g, ' ')}
                            </strong>
                            {Array.isArray(value) ? (
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                    {value.map((v: any, i: number) => <li key={i} className="text-stone-300">{String(v)}</li>)}
                                </ul>
                            ) : (
                                <span className="text-stone-300 italic">{String(value)}</span>
                            )}
                        </div>
                    );
                }

                if (key === 'options_origines' || key.startsWith('options_')) {
                    return (
                        <div key={key} className="bg-stone-900/40 rounded-lg p-4 border border-white/5 text-sm">
                            <strong className="block text-stone-400 mb-2 font-display text-xs uppercase tracking-wider">
                                {key.replace('options_', '').replace(/_/g, ' ')}
                            </strong>
                            <ul className="space-y-1">
                                {Array.isArray(value) ? value.map((v: any, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-stone-300">
                                        <div className="w-1 h-1 rounded-full bg-primary-500 mt-2 shrink-0"></div>
                                        <span>{String(v)}</span>
                                    </li>
                                )) : <span className="text-stone-300">{String(value)}</span>}
                            </ul>
                        </div>
                    );
                }

                return (
                    <div key={key} className="text-sm text-stone-400 border-l-2 border-white/10 pl-3 py-1">
                        <span className="font-bold uppercase text-xs mr-2 text-stone-500">{key.replace(/_/g, ' ')}</span>
                        <span className="italic text-stone-300">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                );
            })}
        </div>
    );
};

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
