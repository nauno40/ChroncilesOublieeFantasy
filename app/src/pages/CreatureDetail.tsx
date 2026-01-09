import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Creature } from '../types';
import { getCreatureCategory, getCreatureEnvironment, getCreatureArchetype, getCreatureSize, getCreatureImage } from '../utils/creature';
import { ArrowLeft, Shield, Sword, Heart } from 'lucide-react';
import { DataService } from '../services/dataService';

export const CreatureDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [creature, setCreature] = useState<Creature | null>(null);
    const [families, setFamilies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch creature and metadata
                // Note: getCreatureById assumes ID compatibility
                const [creatureData, familiesData] = await Promise.all([
                    DataService.getCreatureById(id),
                    DataService.getFamilies()
                ]);
                setCreature(creatureData);
                setFamilies(familiesData);
            } catch (e) {
                console.error("Failed to fetch creature details:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-primary-200">Chargement...</div>;

    if (!creature) {
        return <div>Créature introuvable</div>;
    }

    const familyName = creature.family?.name;
    // Helper to find family desc
    const familyDesc = familyName ? families.find(f => f.Famille === familyName || f.name === familyName)?.description : null;

    // Mapping stats to display
    const statsConfig = [
        { label: 'FOR', key: 'FOR' as const },
        { label: 'DEX', key: 'DEX' as const },
        { label: 'CON', key: 'CON' as const },
        { label: 'INT', key: 'INT' as const },
        { label: 'SAG', key: 'SAG' as const }, // Assuming SAG for per_mod/wis
        { label: 'CHA', key: 'CHA' as const },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <Link to="/bestiary" className="inline-flex items-center text-stone-400 hover:text-primary-400 transition-colors group mb-2">
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> <span className="font-display font-medium">Retour au Bestiaire</span>
            </Link>

            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border-primary-500/20 relative">
                {/* Decorative top border */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>

                {/* Header */}
                <div className="bg-stone-900/40 p-8 backdrop-blur-sm relative overflow-hidden">
                    {/* Background Token Blur */}
                    {creature.picture && (
                        <div className="absolute top-0 right-0 w-96 h-96 opacity-10 bg-no-repeat bg-contain bg-center pointer-events-none blur-3xl transform translate-x-1/3 -translate-y-1/3" style={{ backgroundImage: `url(${creature.picture})` }}></div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">{creature.name}</h1>

                            {/* Main Characteristics Badges */}
                            <div className="flex flex-wrap gap-2 text-sm mb-6">
                                <span className="bg-primary-950/80 px-4 py-1.5 rounded-lg border border-primary-500/40 text-primary-300 font-bold tracking-wider shadow-lg shadow-black/20">NC {creature.nc}</span>
                                {familyName && <span className="bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 italic">{familyName}</span>}
                            </div>

                            {/* Stats Line (Condensed) */}
                            {/* Stats Line (Condensed) - Updated with Category, Env, Archetype, Size */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                <div>
                                    <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">Catégorie</div>
                                    <div className="text-stone-300 font-medium">{getCreatureCategory(creature) || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">Milieu</div>
                                    <div className="text-stone-300 font-medium">{getCreatureEnvironment(creature) || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">Archétype</div>
                                    <div className="text-stone-300 font-medium">{getCreatureArchetype(creature) || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">Taille</div>
                                    <div className="text-stone-300 font-medium">{getCreatureSize(creature) || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Token Image */}
                        {creature.picture && (
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-20"></div>
                                <img
                                    src={creature.picture}
                                    alt={creature.name}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-primary-500/30 object-cover bg-stone-950 shadow-2xl relative z-10"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Block */}
                <div className="grid grid-cols-3 divide-x divide-white/5 border-y border-white/5 bg-black/20 backdrop-blur-md">
                    <div className="py-6 text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center text-stone-500 mb-2 gap-2 text-xs uppercase tracking-widest font-bold">
                            <Shield size={14} /> Défense
                        </div>
                        <div className="text-3xl font-display font-bold text-stone-200">{creature.def || '-'}</div>
                    </div>
                    <div className="py-6 text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center text-stone-500 mb-2 gap-2 text-xs uppercase tracking-widest font-bold">
                            <Heart size={14} className="text-green-500/70" /> PV
                        </div>
                        <div className="text-3xl font-display font-bold text-green-500">{creature.hp || '-'}</div>
                    </div>
                    <div className="py-6 text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center text-stone-500 mb-2 gap-2 text-xs uppercase tracking-widest font-bold">
                            <Sword size={14} className="text-amber-600/70" /> Init
                        </div>
                        <div className="text-3xl font-display font-bold text-amber-500">{creature.init || '-'}</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-6 md:p-8 space-y-8 bg-gradient-to-b from-stone-900/30 to-transparent">

                    {/* Attributes */}
                    {creature.stats && (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
                            {statsConfig.map(attr => (
                                <div key={attr.label} className="bg-black/20 rounded-lg p-3 border border-white/5 text-center hover:border-primary-500/30 transition-colors">
                                    <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">{attr.label}</div>
                                    <div className="font-display font-bold text-xl text-stone-200">
                                        {creature.stats![attr.key] ?? '0'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid gap-8">
                        {/* 1. Family Description */}
                        {familyDesc && (
                            <div className="glass-panel p-6 rounded-xl border-white/5 bg-primary-950/20">
                                <h3 className="text-xl font-display font-bold text-primary-300 mb-4 border-b border-primary-500/20 pb-2 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Famille : {familyName}
                                </h3>
                                <p className="text-stone-300 leading-relaxed text-sm italic">{familyDesc}</p>
                            </div>
                        )}

                        {/* 2. Creature Description */}
                        {creature.description && creature.description.replace(/<[^>]*>/g, '').trim().length > 0 && (
                            <div className="glass-panel p-6 rounded-xl border-white/5">
                                <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">Description</h3>
                                <div
                                    className="prose prose-invert prose-stone max-w-none text-sm space-y-3 [&_p]:leading-relaxed text-stone-300/90"
                                    dangerouslySetInnerHTML={{ __html: creature.description }}
                                />
                            </div>
                        )}

                        {/* 2b. Special Abilities (Text) */}
                        {creature.specialAbilities?.text && (
                            <div className="glass-panel p-6 rounded-xl border-white/5">
                                <h3 className="text-xl font-display font-bold text-primary-300 mb-4 border-b border-white/10 pb-2">Capacités Spéciales</h3>
                                <div
                                    className="prose prose-invert prose-stone max-w-none text-sm space-y-3 [&_p]:leading-relaxed text-stone-300/90"
                                    dangerouslySetInnerHTML={{ __html: creature.specialAbilities.text }}
                                />
                            </div>
                        )}

                        {/* 3. Attacks - Conditional if present */}
                        {creature.attacks && creature.attacks.length > 0 && (
                            <div>
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Attaques
                                </h3>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {creature.attacks.map((attack: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-2 bg-stone-900/40 p-4 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all hover:bg-stone-900/60">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                                <span className="font-bold text-stone-200 text-lg">{attack.name}</span>
                                                <div className="flex gap-4 text-sm bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 self-start sm:self-auto mt-2 sm:mt-0 items-center">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Test</span>
                                                        <span className="text-primary-400 font-mono font-bold">{attack.test || attack.atk || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 pl-4 border-l border-white/10">
                                                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">DM</span>
                                                        <span className="text-stone-300 font-mono font-bold">{attack.dm || attack.dmg || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {attack.special && (
                                                <div className="text-sm text-stone-400 italic border-t border-white/5 pt-2 mt-1">
                                                    <span className="text-primary-500/70 font-semibold text-xs uppercase tracking-wider mr-2">Spécial:</span>
                                                    {attack.special}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Capabilities from JSON list if any */}
                        {creature.capabilities && creature.capabilities.length > 0 && (
                            <div>
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Autres Capacités
                                </h3>
                                <div className="space-y-4">
                                    {creature.capabilities.map((cap: any, i: number) => (
                                        <div key={i} className="bg-stone-900/40 p-4 rounded-xl border border-white/5">
                                            <div className="font-bold text-primary-300 mb-1">
                                                {typeof cap === 'string' ? cap : (cap.label || cap.name)}
                                                {cap.rank && <span className="text-stone-500 font-normal ml-2 text-sm">(Rang {cap.rank})</span>}
                                            </div>
                                            {typeof cap !== 'string' && cap.description && (
                                                <div className="text-sm text-stone-300 leading-relaxed opacity-90 whitespace-pre-line">
                                                    {cap.description}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Full Illustration at Bottom */}
                        <div className="mt-8 relative group perspective-1000 flex justify-center">
                            <div className="absolute inset-0 bg-primary-500 rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
                            <img
                                src={getCreatureImage(creature)}
                                alt={`Illustration de ${creature.name}`}
                                className="max-w-full md:max-w-lg h-auto rounded-xl border-2 border-primary-500/30 object-contain bg-stone-950/50 shadow-2xl relative z-10"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none'; // Hide if no image found
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
