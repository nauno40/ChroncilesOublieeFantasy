import React from 'react';
import { useParams, Link } from 'react-router-dom';
import profilesData from '../data/profiles.json';
import voiesData from '../data/voies.json';
import type { Profile, Voie } from '../types/normalized';
import { ArrowLeft } from 'lucide-react';

const profiles = profilesData as Profile[];
const voies = voiesData as Voie[];

export const ClassDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const profile = profiles.find(p => p.id === id);

    if (!profile) {
        return <div>Classe introuvable</div>;
    }

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
                            src={`/assets/profils/${profile.name}.jpg`}
                            alt={profile.name}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                            className="w-full h-full object-cover object-top blur-sm"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/80 to-stone-900"></div>
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">
                            {profile.name}
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
                                src={`/assets/profils/${profile.name}.jpg`}
                                onError={(e) => {
                                    e.currentTarget.parentElement!.style.display = 'none';
                                }}
                                alt={profile.name}
                                className="block max-w-full h-auto max-h-[600px] object-contain transform transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="glass-panel p-6 rounded-xl border-white/5">
                        <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                            Description
                        </h3>
                        <p className="text-stone-300 leading-relaxed">{profile.description}</p>
                    </div>

                    {/* Game Mechanics */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Dé de vie */}
                        {profile.hitDie && (
                            <div className="glass-panel p-6 rounded-xl border-white/5 bg-primary-950/20">
                                <h4 className="text-sm font-display font-bold text-primary-300 mb-2">
                                    Dé de vie
                                </h4>
                                <p className="text-stone-300 font-mono text-lg">{profile.hitDie}</p>
                            </div>
                        )}

                        {/* Armes et armures */}
                        {profile.weaponsAndArmor && (
                            <div className="glass-panel p-6 rounded-xl border-white/5">
                                <h4 className="text-sm font-display font-bold text-stone-300 mb-2">
                                    Armes et armures
                                </h4>
                                <p className="text-stone-300 text-sm leading-relaxed">{profile.weaponsAndArmor}</p>
                            </div>
                        )}
                    </div>

                    {/* Equipement de départ */}
                    {profile.startingEquipment && (
                        <div className="glass-panel p-6 rounded-xl border-white/5">
                            <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                                Équipement de départ
                            </h3>
                            <p className="text-stone-300 leading-relaxed">{profile.startingEquipment}</p>
                        </div>
                    )}

                    {/* Voies */}
                    {profile.voies && profile.voies.length > 0 && (
                        <div>
                            <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Voies
                            </h3>
                            <div className="space-y-3">
                                {profile.voies.map((voieId, index) => {
                                    const voie = voies.find(v => v.id === voieId);
                                    if (!voie) return null;

                                    return (
                                        <Link
                                            key={voieId}
                                            to={`/voies/${voieId}`}
                                            className="glass-panel p-5 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all duration-300 group flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-3xl font-display font-bold text-primary-500/50 group-hover:text-primary-400 transition-colors min-w-[3rem] text-center">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <h4 className="text-lg font-medium text-stone-200 group-hover:text-primary-300 transition-colors">
                                                        {voie.name}
                                                    </h4>
                                                    <p className="text-sm text-stone-500">{voie.type}</p>
                                                </div>
                                            </div>
                                            <svg className="w-6 h-6 text-stone-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Magic Modifier */}
                    {profile.magicModifier && (
                        <div>
                            <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Modificateur Magique
                            </h3>
                            <p className="text-stone-300">{profile.magicModifier}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
