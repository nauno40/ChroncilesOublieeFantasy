import React from 'react';
import { useParams, Link } from 'react-router-dom';
import profilesData from '../data/Profils.json';
import voiesData from '../data/Voies.json';
import type { Profile, Path } from '../types';
import { ArrowLeft } from 'lucide-react';

const profiles = profilesData as Profile[];
const voies = voiesData as Path[];

export const ClassDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const index = parseInt(id || '0', 10);
    const profile = profiles[index];

    if (!profile) {
        return <div>Classe introuvable</div>;
    }

    const profileVoies = [
        profile.Voie1,
        profile.Voie2,
        profile.Voie3,
        profile.Voie4,
        profile.Voie5
    ].filter(Boolean);

    // Helper to find voie index by name
    const getVoieIndex = (voieName: string) => {
        return voies.findIndex(v => v.Voie === voieName);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <Link to="/classes" className="inline-flex items-center text-stone-400 hover:text-primary-400 transition-colors group mb-2">
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-display font-medium">Retour aux Classes</span>
            </Link>

            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border-primary-500/20 relative">
                {/* Decorative top border */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>

                {/* Header */}
                <div className="bg-stone-900/40 p-8 backdrop-blur-sm relative overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0 opacity-20">
                        <img
                            src={`/assets/profils/${profile.Profil}.jpg`}
                            alt={profile.Profil}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                            className="w-full h-full object-cover object-top blur-sm"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/80 to-stone-900"></div>
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">
                            {profile.Profil}
                        </h1>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-stone-900/30 to-transparent">
                    {/* Illustration */}
                    <div>
                        <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Illustration
                        </h3>
                        <div className="w-fit mx-auto bg-white rounded-xl overflow-hidden shadow-2xl border-2 border-primary-500/20 group relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                            <img
                                src={`/assets/profils/${profile.Profil}.jpg`}
                                onError={(e) => {
                                    e.currentTarget.parentElement!.style.display = 'none';
                                }}
                                alt={profile.Profil}
                                className="block max-w-full h-auto max-h-[600px] object-contain transform transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="glass-panel p-6 rounded-xl border-white/5">
                        <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                            Description
                        </h3>
                        <p className="text-stone-300 leading-relaxed">{profile.Description}</p>
                    </div>

                    {/* Game Mechanics */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Dé de vie */}
                        {profile["Dé de vie"] && (
                            <div className="glass-panel p-6 rounded-xl border-white/5 bg-primary-950/20">
                                <h4 className="text-sm font-display font-bold text-primary-300 mb-2">
                                    Dé de vie
                                </h4>
                                <p className="text-stone-300 font-mono text-lg">{profile["Dé de vie"]}</p>
                            </div>
                        )}

                        {/* Armes et armures */}
                        {profile["Armes et armures"] && (
                            <div className="glass-panel p-6 rounded-xl border-white/5">
                                <h4 className="text-sm font-display font-bold text-stone-300 mb-2">
                                    Armes et armures
                                </h4>
                                <p className="text-stone-300 text-sm leading-relaxed">{profile["Armes et armures"]}</p>
                            </div>
                        )}
                    </div>

                    {/* Equipement de départ */}
                    {profile["Equipement de départ"] && (
                        <div className="glass-panel p-6 rounded-xl border-white/5">
                            <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                                Équipement de départ
                            </h3>
                            <p className="text-stone-300 leading-relaxed">{profile["Equipement de départ"]}</p>
                        </div>
                    )}

                    {/* Voies */}
                    {profileVoies.length > 0 && (
                        <div>
                            <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Voies
                            </h3>
                            <div className="grid md:grid-cols-2 gap-3">
                                {profileVoies.map((voieName, i) => {
                                    const voieIndex = getVoieIndex(voieName);
                                    return (
                                        <Link
                                            key={i}
                                            to={voieIndex >= 0 ? `/voies/${voieIndex}` : `/voies?search=${encodeURIComponent(voieName)}`}
                                            className="bg-stone-900/40 p-4 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all hover:bg-stone-900/60 group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-stone-200 group-hover:text-primary-300 transition-colors">{voieName}</span>
                                                <span className="text-xs text-stone-500 bg-black/30 px-2 py-1 rounded">Rang {i + 1}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Mod (if present) */}
                    {profile.Mod && (
                        <div className="glass-panel p-6 rounded-xl border-white/5 bg-primary-950/20">
                            <h3 className="text-xl font-display font-bold text-primary-300 mb-3 border-b border-primary-500/20 pb-2">
                                Modificateurs
                            </h3>
                            <p className="text-stone-300">{profile.Mod}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
