import React from 'react';
import { useParams, Link } from 'react-router-dom';
import racesData from '../data/Races.json';
import type { Race } from '../types';
import { ArrowLeft } from 'lucide-react';

const races = racesData as Race[];

// Map French race names to English image filenames
const getRaceImageName = (raceName: string): string => {
    const mapping: Record<string, string> = {
        'Demi-elfe': 'elf_half.png.webp',
        'Elfe, haut': 'elf_high.png.webp',
        'Elfe, sylvain': 'elf_wood.png.webp',
        'Nain': 'dwarf.png.webp',
        'Halfelin': 'halfling.png.webp',
        'Humain': 'human.png.webp',
        'Gnome': 'gnome.png.webp',
        'Demi-orque': 'orc_half.png.webp'
    };
    return mapping[raceName] || `${raceName}.jpg`;
};

export const RaceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const index = parseInt(id || '0', 10);
    const race = races[index];

    if (!race) {
        return <div>Race introuvable</div>;
    }

    const raceImageName = getRaceImageName(race.Title);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <Link to="/races" className="inline-flex items-center text-stone-400 hover:text-primary-400 transition-colors group mb-2">
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-display font-medium">Retour aux Races</span>
            </Link>

            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border-primary-500/20 relative">
                {/* Decorative top border */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>

                {/* Header */}
                <div className="bg-stone-900/40 p-8 backdrop-blur-sm relative overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0 opacity-20">
                        <img
                            src={`/assets/races/${raceImageName}`}
                            alt={race.Title}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                            className="w-full h-full object-cover object-top blur-sm"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/80 to-stone-900"></div>
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">
                            {race.Title}
                        </h1>
                        <p className="text-stone-400 italic">{race.Repères}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-black/20 border-y border-white/5">
                    <div className="text-center">
                        <div className="text-stone-500 text-xs uppercase tracking-wider mb-1">Âge de départ</div>
                        <div className="text-2xl font-display font-bold text-primary-400">{race["Âge de départ"]} ans</div>
                    </div>
                    <div className="text-center">
                        <div className="text-stone-500 text-xs uppercase tracking-wider mb-1">Espérance de vie</div>
                        <div className="text-2xl font-display font-bold text-primary-400">{race["Espérance de vie"]} ans</div>
                    </div>
                    <div className="text-center md:col-span-2">
                        <div className="text-stone-500 text-xs uppercase tracking-wider mb-1">Taille</div>
                        <div className="text-2xl font-display font-bold text-primary-400">{race["Taille Min"]} - {race["Taille Max"]}</div>
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
                                src={`/assets/races/${raceImageName}`}
                                onError={(e) => {
                                    e.currentTarget.parentElement!.style.display = 'none';
                                }}
                                alt={race.Title}
                                className="block max-w-full h-auto max-h-[600px] object-contain transform transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>

                    {/* Characteristics */}
                    <div className="glass-panel p-6 rounded-xl border-white/5 bg-primary-950/20">
                        <h3 className="text-xl font-display font-bold text-primary-300 mb-3 border-b border-primary-500/20 pb-2">
                            Caractéristiques
                        </h3>
                        <p className="text-stone-300 font-mono text-lg">{race.Caractéristiques}</p>
                    </div>

                    {/* Desc - Short description */}
                    {race.Desc && (
                        <div className="glass-panel p-6 rounded-xl border-white/5">
                            <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                                Présentation
                            </h3>
                            <p className="text-stone-300 leading-relaxed">{race.Desc}</p>
                        </div>
                    )}

                    {/* Desc2 - Cultural description */}
                    {race.Desc2 && (
                        <div className="glass-panel p-6 rounded-xl border-white/5 bg-stone-900/30">
                            <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                                Culture & Réputation
                            </h3>
                            <p className="text-stone-300 leading-relaxed italic">{race.Desc2}</p>
                        </div>
                    )}

                    {/* Description - Main description (Desc3) */}
                    <div className="glass-panel p-6 rounded-xl border-white/5">
                        <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                            Description détaillée
                        </h3>
                        <p className="text-stone-300 leading-relaxed">{race.Desc3}</p>
                    </div>

                    {/* Capacités raciales */}
                    {race.Capacités && (
                        <div className="glass-panel p-6 rounded-xl border-white/5 bg-primary-950/20">
                            <h3 className="text-xl font-display font-bold text-primary-300 mb-4 border-b border-primary-500/20 pb-2">
                                Capacités raciales
                            </h3>
                            <p className="text-stone-300 leading-relaxed whitespace-pre-line">{race.Capacités}</p>
                        </div>
                    )}

                    {/* Physical attributes */}
                    <div className="glass-panel p-6 rounded-xl border-white/5">
                        <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                            Attributs physiques
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4 text-stone-300">
                            <div>
                                <span className="text-stone-500 text-sm">Taille :</span>
                                <p className="font-semibold">{race["Taille Min"]} - {race["Taille Max"]}</p>
                            </div>
                            <div>
                                <span className="text-stone-500 text-sm">Poids :</span>
                                <p className="font-semibold">{race["Poids Min"]} - {race["Poids Max"]}</p>
                            </div>
                            <div>
                                <span className="text-stone-500 text-sm">Âge de départ :</span>
                                <p className="font-semibold">{race["Âge de départ"]} ans</p>
                            </div>
                            <div>
                                <span className="text-stone-500 text-sm">Espérance de vie :</span>
                                <p className="font-semibold">{race["Espérance de vie"]} ans</p>
                            </div>
                        </div>
                    </div>

                    {/* Typical Names */}
                    <div className="glass-panel p-6 rounded-xl border-white/5">
                        <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                            Noms typiques
                        </h3>
                        <p className="text-stone-300 leading-relaxed text-sm">{race["Noms typiques"]}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
