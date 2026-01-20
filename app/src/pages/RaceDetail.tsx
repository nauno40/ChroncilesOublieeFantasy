import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Race, Voie, Capacity } from '../types/normalized';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { DataService } from '../services/dataService';

const DynamicDetailsRenderer = ({ details }: { details: any }) => {
    if (!details) return null;

    return (
        <div className="space-y-4 mt-4">
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
                        <div key={key} className="p-3 bg-yellow-900/10 border border-yellow-700/20 rounded-lg flex gap-3">
                            <div className="shrink-0 pt-0.5">
                                <HelpCircle className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div>
                                <span className="text-stone-300 text-sm italic">
                                    {String(value)}
                                </span>
                            </div>
                        </div>
                    );
                }

                if (key === 'choix_capacite' || key.startsWith('choix_')) {
                    return (
                        <div key={key} className="bg-primary-950/20 rounded-lg p-3 border border-primary-500/10 text-sm">
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
                        <div key={key} className="bg-stone-900/40 rounded-lg p-3 border border-white/5 text-sm">
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
                    <div key={key} className="text-xs text-stone-500 border-l-2 border-white/10 pl-2">
                        <span className="font-bold uppercase mr-1">{key.replace(/_/g, ' ')}:</span>
                        <span className="italic">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                );
            })}
        </div>
    );
};

export const RaceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [race, setRace] = useState<Race | null>(null);
    const [raceVoies, setRaceVoies] = useState<Voie[]>([]);
    const [raceCapacities, setRaceCapacities] = useState<Capacity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'lore' | 'rules'>('lore');

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

                const foundRace = races.find(r => String(r.id) === id);
                setRace(foundRace || null);

                // Process available Voies (New Logic)
                if (foundRace && foundRace.availableVoies && foundRace.availableVoies.length > 0) {
                    const voieIds = foundRace.availableVoies.map(iri => {
                        // Handle IRI string "/api/voies/123" or object
                        if (typeof iri === 'string') {
                            const parts = iri.split('/');
                            return parts[parts.length - 1];
                        }
                        return String((iri as Voie).id);
                    });

                    const foundVoies = voies.filter(v => voieIds.includes(String(v.id)));
                    setRaceVoies(foundVoies);

                    // Collect capabilities for all found voies
                    // Normalize capability voie reference to ID string
                    const allCaps = capacities.filter(c => {
                        const capVoieRef = c.voie || c.voieId; // Handle potential IRI in 'voie' or ID in 'voieId'
                        if (!capVoieRef) return false;

                        const capVoieId = String(capVoieRef).split('/').pop();
                        return foundVoies.some(v => String(v.id) === capVoieId);
                    }).sort((a, b) => (a.rank || 0) - (b.rank || 0));

                    setRaceCapacities(allCaps);
                }
                // Fallback to legacy field logic if no availableVoies
                else if (foundRace && foundRace.voieId) {
                    const foundVoie = voies.find(v => String(v.id) === foundRace.voieId);
                    if (foundVoie) {
                        setRaceVoies([foundVoie]);
                        const filteredCapacities = capacities
                            .filter(c => {
                                const capVoieRef = c.voie || c.voieId;
                                if (!capVoieRef) return false;
                                const capVoieId = String(capVoieRef).split('/').pop();
                                return String(capVoieId) === String(foundVoie.id);
                            })
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

    if (loading) return <div className="min-h-screen flex items-center justify-center text-primary-200">Chargement...</div>;

    if (!race) {
        return <div className="p-8 text-center text-red-400">Race introuvable</div>;
    }

    const raceImageName = race.image || `/assets/races/${race.name.toLowerCase()}.png.webp`;

    return (
        <div className="min-h-screen pb-12 relative">

            {/* Background Banner (Decorative) */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
                <img
                    src={raceImageName}
                    alt={race.name}
                    className="w-full h-full object-cover object-top opacity-30"
                />
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="container mx-auto px-4 relative z-10 pt-6">

                {/* Header Section */}
                <div className="mb-8">
                    <Link to="/races" className="inline-flex items-center text-stone-400 hover:text-white transition-colors group mb-6">
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-display font-medium tracking-wide text-sm uppercase">Retour aux Races</span>
                    </Link>

                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white drop-shadow-xl">
                        {race.name}
                    </h1>
                </div>

                {/* Content Grid */}
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Sidebar (33%) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Portrait Card */}
                        <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                            <div className="aspect-[3/4] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-60 z-10"></div>
                                <img
                                    src={raceImageName}
                                    alt={race.name}
                                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        </div>

                        {/* Vital Stats */}
                        <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl">
                            <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-stone-700"></span>
                                Statistiques Vitales
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-stone-400">Âge de départ</span>
                                    <span className="font-display text-xl text-primary-200">{race.startingAge} ans</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-stone-400">Espérance de vie</span>
                                    <span className="font-display text-xl text-primary-200">{race.lifeExpectancy} ans</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-stone-400">Taille</span>
                                    <span className="font-display text-xl text-primary-200">{race.minHeight / 100}m - {race.maxHeight / 100}m</span>
                                </div>
                                <div className="flex justify-between items-center pb-2">
                                    <span className="text-stone-400">Poids</span>
                                    <span className="font-display text-xl text-primary-200">{race.minWeight} - {race.maxWeight} kg</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Content (66%) */}
                    <div className="lg:col-span-8">

                        {/* Tabs Navigation */}
                        <div className="flex items-center gap-8 border-b border-white/10 mb-8 px-2">
                            <button
                                onClick={() => setActiveTab('lore')}
                                className={`pb-4 text-lg font-display font-bold tracking-wide transition-all relative ${activeTab === 'lore'
                                    ? 'text-white'
                                    : 'text-stone-500 hover:text-stone-300'
                                    }`}
                            >
                                Légendes & Culture
                                {activeTab === 'lore' && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('rules')}
                                className={`pb-4 text-lg font-display font-bold tracking-wide transition-all relative ${activeTab === 'rules'
                                    ? 'text-white'
                                    : 'text-stone-500 hover:text-stone-300'
                                    }`}
                            >
                                Règles & Capacités
                                {activeTab === 'rules' && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                )}
                            </button>
                        </div>

                        {/* TAB CONTENT: Lore */}
                        {activeTab === 'lore' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Description */}
                                <div className="prose prose-invert prose-lg max-w-none">
                                    <div className="bg-gradient-to-b from-white/5 to-transparent p-8 rounded-2xl border border-white/5">
                                        <p className="lead text-xl text-primary-100 not-italic mb-6 leading-relaxed">
                                            {race.description}
                                        </p>
                                        <p className="text-stone-300">
                                            {race.detailedDescription}
                                        </p>
                                    </div>
                                </div>

                                {/* Physical Traits */}
                                <div className="bg-stone-900/60 p-8 rounded-2xl border border-white/5">
                                    <h3 className="text-xl font-display font-bold text-white mb-4">Traits Physiques</h3>
                                    <p className="text-stone-300 leading-relaxed">
                                        {race.physicalTraits}
                                    </p>
                                </div>

                                {/* Roleplay & Culture Grid */}
                                <div className="space-y-6">
                                    {race.publicPerception && (
                                        <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                                            <h4 className="text-primary-400 font-bold mb-3 uppercase text-sm tracking-wider">Réputation</h4>
                                            <p className="text-stone-400 text-sm italic">
                                                "{race.publicPerception}"
                                            </p>
                                        </div>
                                    )}
                                    {race.roleplay && (
                                        <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                                            <h4 className="text-primary-400 font-bold mb-3 uppercase text-sm tracking-wider">Interprétation</h4>
                                            <p className="text-stone-400 text-sm italic">
                                                "{race.roleplay}"
                                            </p>
                                        </div>
                                    )}
                                    {race.typicalNames && (
                                        <div className="bg-stone-900/40 p-6 rounded-xl border border-white/5">
                                            <h4 className="text-stone-500 font-bold mb-3 uppercase text-sm tracking-wider flex items-center gap-2">
                                                <span className="w-8 h-[1px] bg-stone-700"></span>
                                                Noms Typiques
                                            </h4>
                                            <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line">
                                                {race.typicalNames}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT: Rules */}
                        {activeTab === 'rules' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Base Racial Abilities */}
                                <div className="relative">
                                    <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                        <div className="size-2 rounded-full bg-primary-500/50"></div>
                                        Traits Raciaux
                                    </h3>

                                    <div className="bg-stone-900/60 rounded-2xl p-8 border border-white/5 relative overflow-hidden backdrop-blur-sm">

                                        {/* Modifiers Badges Block (Moved here) */}
                                        <div className="mb-6">
                                            <h4 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-3">Caractéristiques</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {/* Static Char string fallback */}
                                                {!race.modifiers && race.characteristics && (
                                                    <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-stone-100 font-mono text-sm">
                                                        {race.characteristics}
                                                    </div>
                                                )}

                                                {/* Modifiers Badges */}
                                                {race.modifiers?.map((mod, i) => (
                                                    <div key={i} className="px-4 py-2 rounded-lg bg-primary-600/20 border border-primary-500/30 text-primary-100 font-mono text-sm flex items-center gap-2">
                                                        {mod.description ? (
                                                            <span>{mod.description}</span>
                                                        ) : (
                                                            <>
                                                                <span className={`font-bold ${mod.value > 0 ? 'text-primary-300' : 'text-red-300'}`}>
                                                                    {mod.value > 0 ? '+' : ''}{mod.value}
                                                                </span>
                                                                <span className="uppercase tracking-wider opacity-90">
                                                                    {mod.type === 'choice' ? mod.options?.join(' / ') : mod.stat}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="absolute top-0 right-0 p-32 bg-primary-900/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                        <p className="text-stone-300 leading-relaxed whitespace-pre-line relative z-10 text-lg">
                                            {race.abilities}
                                        </p>
                                    </div>
                                </div>

                                {/* Voies & Capacities */}
                                {raceVoies.length > 0 && (
                                    <div className="relative">
                                        <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                            <div className="size-2 rounded-full bg-primary-500/50"></div>
                                            Voies & Évolution
                                        </h3>

                                        <div className="space-y-12">
                                            {raceVoies.map(voie => (
                                                <div key={voie.id} className="space-y-6">
                                                    <div className="flex items-baseline gap-4 border-b border-white/10 pb-4">
                                                        <h4 className="text-3xl font-display font-bold text-primary-200">
                                                            {voie.name}
                                                        </h4>
                                                        <span className="text-stone-500 text-sm font-mono uppercase tracking-wider">Voie Raciale</span>
                                                    </div>

                                                    {/* Voie Details */}
                                                    <DynamicDetailsRenderer details={voie.details} />

                                                    <div className="grid gap-4">
                                                        {raceCapacities
                                                            .filter(c => {
                                                                const capVoieRef = c.voie || c.voieId;
                                                                if (!capVoieRef) return false;
                                                                const capVoieId = String(capVoieRef).split('/').pop();
                                                                return String(capVoieId) === String(voie.id);
                                                            })
                                                            .map((cap) => (
                                                                <div key={cap.id} className="group relative bg-stone-900/80 hover:bg-stone-800 transition-colors p-6 rounded-xl border border-white/5 hover:border-primary-500/30">
                                                                    <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="flex items-center justify-center size-6 rounded bg-primary-950 text-primary-500 text-xs font-bold border border-primary-500/20">
                                                                                {cap.rank}
                                                                            </span>
                                                                            <h5 className="text-lg font-bold text-stone-100 group-hover:text-primary-300 transition-colors">
                                                                                {cap.name}
                                                                            </h5>
                                                                        </div>
                                                                        <div className="h-[1px] flex-1 bg-white/5 mx-4 hidden md:block"></div>
                                                                    </div>
                                                                    <p className="text-stone-400 text-sm leading-relaxed pl-9">
                                                                        {cap.description}
                                                                    </p>
                                                                    {/* Capability Details */}
                                                                    <div className="pl-9">
                                                                        <DynamicDetailsRenderer details={cap.details} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};
