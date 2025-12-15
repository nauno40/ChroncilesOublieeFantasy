import React from 'react';
import { useParams, Link } from 'react-router-dom';
import profilesData from '../data/profiles.json';
import voiesData from '../data/voies.json';
import type { Profile, Voie } from '../types/normalized';
import { ArrowLeft } from 'lucide-react';

import weaponsData from '../data/weapons.json';
import armorsData from '../data/armors.json';
import materialsData from '../data/materials.json';

const profiles = profilesData as Profile[];
const voies = voiesData as Voie[];

// Map to find items easily
const allItemsMap = new Map([
    ...weaponsData.map(w => [w.id, { ...w, tab: 'weapons' }] as [string, any]),
    ...armorsData.map(a => [a.id, { ...a, tab: 'armors' }] as [string, any]),
    ...materialsData.map(m => [m.id, { ...m, tab: 'materials' }] as [string, any]),
]);

const LinkifiedEquipment: React.FC<{ items: any[] }> = ({ items }) => {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item, index) => {
                const equipment = allItemsMap.get(item.id);

                if (equipment) {
                    const label = item.label || equipment.name;
                    const quantity = item.quantity && item.quantity > 1 ? `${item.quantity}x ` : '';

                    return (
                        <Link
                            key={index}
                            to={`/equipment?tab=${equipment.tab}&q=${encodeURIComponent(equipment.name)}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-stone-800/50 border border-primary-500/30 text-primary-300 hover:bg-primary-500/20 hover:border-primary-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wide shadow-lg shadow-black/20 backdrop-blur-sm"
                        >
                            {quantity}{label}
                        </Link>
                    );
                }

                // Fallback if item ID not found (should not happen if data is correct)
                return (
                    <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wide">
                        {item.id} (Manquant)
                    </span>
                );
            })}
        </div>
    );
};


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

                    {/* Caractéristiques de classe */}
                    <div className="grid md:grid-cols-2 gap-4">


                        {/* Modificateur Magique */}
                        {profile.magicModifier && (
                            <div className="glass-panel p-6 rounded-xl border-white/5 bg-purple-950/20 flex flex-col justify-center">
                                <h4 className="text-sm font-display font-bold text-purple-400 mb-1 uppercase tracking-wider">
                                    Modificateur Magique
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                        </svg>
                                    </div>
                                    <span className="text-2xl font-bold text-white font-mono">{profile.magicModifier}</span>
                                </div>
                            </div>
                        )}

                        {/* Dé de récupération */}
                        {profile.recoveryDie && (
                            <div className="glass-panel p-6 rounded-xl border-white/5 bg-green-950/20 flex flex-col justify-center">
                                <h4 className="text-sm font-display font-bold text-green-400 mb-1 uppercase tracking-wider">
                                    Dé de récupération
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                    </div>
                                    <span className="text-2xl font-bold text-white font-mono">{profile.recoveryDie}</span>
                                </div>
                            </div>
                        )}

                        {/* Dé de Vigueur */}
                        {profile.vigorPoints && (
                            <div className="glass-panel p-6 rounded-xl border-white/5 bg-red-950/20 flex flex-col justify-center">
                                <h4 className="text-sm font-display font-bold text-red-400 mb-1 uppercase tracking-wider">
                                    Dé de Vigueur
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-2xl font-bold text-white font-mono">{profile.vigorPoints} / niveau</span>
                                </div>
                            </div>
                        )}

                        {/* Points de chance */}
                        {profile.luckPoints && (
                            <div className="glass-panel p-6 rounded-xl border-white/5 bg-yellow-950/20 flex flex-col justify-center">
                                <h4 className="text-sm font-display font-bold text-yellow-400 mb-1 uppercase tracking-wider">
                                    Points de Chance
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                                        <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-2xl font-bold text-white font-mono">+{profile.luckPoints}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Armes et armures */}
                        {profile.weaponsAndArmor && (
                            <div className="glass-panel p-6 rounded-xl border-white/5">
                                <h3 className="text-lg font-display font-bold text-stone-300 mb-3 border-b border-white/10 pb-2">
                                    Armes et armures
                                </h3>
                                <p className="text-stone-300 text-sm leading-relaxed">{profile.weaponsAndArmor}</p>
                            </div>
                        )}

                        {/* Equipement de départ */}
                        {profile.startingEquipment && (
                            <div className="glass-panel p-6 rounded-xl border-white/5">
                                <h3 className="text-lg font-display font-bold text-stone-300 mb-3 border-b border-white/10 pb-2">
                                    Équipement de départ
                                </h3>
                                <LinkifiedEquipment items={profile.startingEquipment} />
                            </div>
                        )}
                    </div>

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
                </div>
            </div>
        </div>
    );
};
