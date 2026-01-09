import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Race, Voie, Capacity } from '../types/normalized';
import { ArrowLeft } from 'lucide-react';
import { DataService } from '../services/dataService';

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
    const [race, setRace] = useState<Race | null>(null);
    const [raceVoie, setRaceVoie] = useState<Voie | null>(null);
    const [raceCapacities, setRaceCapacities] = useState<Capacity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch all and filter client side
                const [races, voies, capacities] = await Promise.all([
                    DataService.getRaces(),
                    DataService.getVoies(),
                    DataService.getCapabilities()
                ]);

                console.log('RaceDetail Debug:', {
                    idToFind: id,
                    racesIsArray: Array.isArray(races),
                    racesCount: Array.isArray(races) ? races.length : 'Not Array',
                    firstRace: Array.isArray(races) && races.length > 0 ? races[0] : null
                });

                const foundRace = races.find(r => String(r.id) === id);
                console.log('Found Race:', foundRace);

                setRace(foundRace || null);

                if (foundRace && foundRace.voieId) {
                    const foundVoie = voies.find(v => String(v.id) === foundRace.voieId);
                    setRaceVoie(foundVoie || null);

                    if (foundVoie) {
                        const filteredCapacities = capacities
                            .filter(c => String(c.voieId) === String(foundVoie.id))
                            .sort((a, b) => (a.rank || 0) - (b.rank || 0));
                        setRaceCapacities(filteredCapacities);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch race details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-primary-200">Chargement...</div>;

    if (!race) {
        return <div>Race introuvable</div>;
    }

    const raceImageName = race.image ? race.image.split('/').pop() : getRaceImageName(race.name);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
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
                            alt={race.name}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                            className="w-full h-full object-cover object-top blur-sm"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/80 to-stone-900"></div>
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">
                            {race.name}
                        </h1>

                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-black/20 border-y border-white/5">
                    <div className="text-center">
                        <div className="text-stone-500 text-xs uppercase tracking-wider mb-1">Âge de départ</div>
                        <div className="text-2xl font-display font-bold text-primary-400">{race.startingAge} ans</div>
                    </div>
                    <div className="text-center">
                        <div className="text-stone-500 text-xs uppercase tracking-wider mb-1">Espérance de vie</div>
                        <div className="text-2xl font-display font-bold text-primary-400">{race.lifeExpectancy} ans</div>
                    </div>
                    <div className="text-center md:col-span-2">
                        <div className="text-stone-500 text-xs uppercase tracking-wider mb-1">Taille</div>
                        <div className="text-2xl font-display font-bold text-primary-400">
                            {race.minHeight / 100}m - {race.maxHeight / 100}m
                        </div>
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
                                alt={race.name}
                                className="block max-w-full h-auto max-h-[600px] object-contain transform transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>

                    {/* Characteristics */}
                    <div className="glass-panel p-6 rounded-xl border-white/5 bg-primary-950/20">
                        <h3 className="text-xl font-display font-bold text-primary-300 mb-3 border-b border-primary-500/20 pb-2">
                            Caractéristiques
                        </h3>
                        {race.characteristics ? (
                            <p className="text-stone-300 font-mono text-lg">{race.characteristics}</p>
                        ) : (
                            <div className="text-stone-300 font-mono text-lg space-y-1">
                                {race.modifiers?.map((mod, i) => (
                                    <div key={i}>
                                        {mod.description
                                            ? mod.description
                                            : mod.type === 'choice'
                                                ? `${mod.value > 0 ? '+' : ''}${mod.value} ${mod.options?.join(' ou ')}`
                                                : `${mod.value > 0 ? '+' : ''}${mod.value} ${mod.stat}`
                                        }
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desc - Short description */}
                    {race.description && (
                        <div className="glass-panel p-6 rounded-xl border-white/5">
                            <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                                Présentation
                            </h3>
                            <p className="text-stone-300 leading-relaxed">{race.description}</p>
                        </div>
                    )}

                    {/* Desc2 - Cultural description */}
                    {race.publicPerception && (
                        <div className="glass-panel p-6 rounded-xl border-white/5 bg-stone-900/30">
                            <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                                Culture & Réputation
                            </h3>
                            <p className="text-stone-300 leading-relaxed italic">{race.publicPerception}</p>
                        </div>
                    )}

                    {/* Roleplay - Interprétation (Desc2 replacement in new logic) */}
                    {race.roleplay && (
                        <div className="glass-panel p-6 rounded-xl border-white/5 bg-stone-900/30">
                            <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                                Interprétation
                            </h3>
                            <p className="text-stone-300 leading-relaxed italic">{race.roleplay}</p>
                        </div>
                    )}

                    {/* Description - Main description (Desc3) */}
                    <div className="glass-panel p-6 rounded-xl border-white/5">
                        <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                            Description détaillée
                        </h3>
                        <p className="text-stone-300 leading-relaxed">{race.detailedDescription}</p>
                    </div>

                    {/* Capacités raciales */}
                    {(race.abilities || raceCapacities.length > 0) && (
                        <div className="glass-panel p-6 rounded-xl border-white/5 bg-primary-950/20">
                            <h3 className="text-xl font-display font-bold text-primary-300 mb-4 border-b border-primary-500/20 pb-2">
                                Capacités raciales {raceVoie ? `(${raceVoie.name})` : ''}
                            </h3>

                            {raceCapacities.length > 0 ? (
                                <div className="space-y-4">
                                    {raceCapacities.map((cap) => (
                                        <div key={cap.id} className="relative pl-4 border-l-2 border-primary-500/30">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">Rang {cap.rank}</span>
                                                <h4 className="font-bold text-stone-200">{cap.name}</h4>
                                            </div>
                                            <p className="text-stone-300 text-sm leading-relaxed">{cap.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-stone-300 leading-relaxed whitespace-pre-line">{race.abilities}</p>
                            )}
                        </div>
                    )}

                    {/* Physical attributes */}
                    <div className="glass-panel p-6 rounded-xl border-white/5">
                        <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                            Attributs physiques
                        </h3>
                        <div className="mb-4">
                            <p className="text-stone-300 italic"><span className="font-bold not-italic text-primary-400">Traits distinctifs : </span>{race.physicalTraits}</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-stone-300">
                            <div>
                                <span className="text-stone-500 text-sm">Taille :</span>
                                <p className="font-semibold">{race.minHeight} cm - {race.maxHeight} cm</p>
                            </div>
                            <div>
                                <span className="text-stone-500 text-sm">Poids :</span>
                                <p className="font-semibold">{race.minWeight} kg - {race.maxWeight} kg</p>
                            </div>
                            <div>
                                <span className="text-stone-500 text-sm">Âge de départ :</span>
                                <p className="font-semibold">{race.startingAge} ans</p>
                            </div>
                            <div>
                                <span className="text-stone-500 text-sm">Espérance de vie :</span>
                                <p className="font-semibold">{race.lifeExpectancy} ans</p>
                            </div>
                        </div>
                    </div>

                    {/* Typical Names */}
                    <div className="glass-panel p-6 rounded-xl border-white/5">
                        <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                            Noms typiques
                        </h3>
                        <p className="text-stone-300 leading-relaxed text-sm">{race.typicalNames}</p>
                    </div>
                </div>
            </div>
        </div >
    );
};
