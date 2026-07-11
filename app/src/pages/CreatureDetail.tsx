import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Creature } from '../types';
import { getCreatureCategory, getCreatureEnvironment, getCreatureArchetype, getCreatureSize, getCreatureImage } from '../utils/creature';
import { ArrowLeft, Shield, Sword, Heart, Crown, Zap } from 'lucide-react';
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

    if (loading) return <div className="min-h-screen flex items-center justify-center text-primary-200">Chargement...</div>;

    if (!creature) {
        return <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Créature introuvable</h2>
            <Link to="/bestiary" className="text-primary-400 hover:text-primary-300 flex items-center justify-center gap-2">
                <ArrowLeft size={20} /> Retour au Bestiaire
            </Link>
        </div>;
    }

    const familyName = creature.family?.name;
    const familyDesc = familyName ? families.find(f => f.Famille === familyName || f.name === familyName)?.description : null;
    const creatureImage = getCreatureImage(creature);

    // Mapping stats to display
    const statsConfig = [
        { label: 'AGI', key: 'AGI' as const },
        { label: 'CON', key: 'CON' as const },
        { label: 'FOR', key: 'FOR' as const },
        { label: 'PER', key: 'PER' as const },
        { label: 'CHA', key: 'CHA' as const },
        { label: 'INT', key: 'INT' as const },
        { label: 'VOL', key: 'VOL' as const },
    ];

    return (
        <div className="min-h-screen pb-12 relative">

            {/* Background Banner (Decorative) */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
                <img
                    src={creatureImage}
                    alt={creature.name}
                    className="w-full h-full object-cover object-top opacity-30 blur-sm"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                <div className="absolute inset-0 bg-stone-950/60 mix-blend-multiply"></div>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="container mx-auto px-4 relative z-10 pt-6">

                {/* Header Section */}
                <div className="mb-8">
                    <Link to="/bestiary" className="inline-flex items-center text-stone-400 hover:text-white transition-colors group mb-6">
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-display font-medium tracking-wide text-sm uppercase">Retour au Bestiaire</span>
                    </Link>

                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white drop-shadow-xl mb-4">
                        {creature.name}
                    </h1>

                    <div className="flex flex-wrap gap-3 items-center">
                        <span className="bg-primary-950/80 px-4 py-1.5 rounded-lg border border-primary-500/40 text-primary-300 font-bold tracking-wider shadow-lg shadow-black/20 text-sm">
                            NC {creature.nc}
                        </span>
                        {familyName && (
                            <span className="bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 italic text-sm">
                                {familyName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Sidebar (33%) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Portrait Card */}
                        <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                            <div className="aspect-[3/4] relative overflow-hidden flex items-center justify-center bg-stone-950">
                                {/* Token Image Effect */}
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-60 z-10"></div>
                                <img
                                    src={creatureImage}
                                    alt={creature.name}
                                    className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        </div>

                        {/* Vital Stats */}
                        <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl">
                            <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-stone-700"></span>
                                Informations
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-stone-400">Catégorie</span>
                                    <span className="font-display text-lg text-primary-200">{getCreatureCategory(creature) || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-stone-400">Milieu</span>
                                    <span className="font-display text-lg text-primary-200">{getCreatureEnvironment(creature) || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-stone-400">Archétype</span>
                                    <span className="font-display text-lg text-primary-200">{getCreatureArchetype(creature) || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2">
                                    <span className="text-stone-400">Taille</span>
                                    <span className="font-display text-lg text-primary-200">{getCreatureSize(creature) || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Combat Stats */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-stone-900/80 p-4 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center hover:border-white/20 transition-colors">
                                <Shield className="mb-2 text-stone-400" size={20} />
                                <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Défense</div>
                                <div className="text-2xl font-display font-bold text-stone-200">{creature.def || '-'}</div>
                            </div>
                            <div className="bg-stone-900/80 p-4 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center hover:border-green-500/30 transition-colors group">
                                <Heart className="mb-2 text-green-900 group-hover:text-green-500 transition-colors" size={20} />
                                <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">PV</div>
                                <div className="text-2xl font-display font-bold text-green-500">{creature.hp || '-'}</div>
                            </div>
                            <div className="bg-stone-900/80 p-4 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center hover:border-amber-500/30 transition-colors group">
                                <Sword className="mb-2 text-amber-900 group-hover:text-amber-500 transition-colors" size={20} />
                                <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Init</div>
                                <div className="text-2xl font-display font-bold text-amber-500">{creature.init || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Content (66%) */}
                    <div className="lg:col-span-8">

                        {/* Char Stats Row */}
                        {creature.stats && (
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
                                {statsConfig.map(attr => (
                                    <div key={attr.label} className="bg-stone-900/60 rounded-xl p-3 border border-white/5 text-center hover:border-primary-500/30 transition-colors">
                                        <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">{attr.label}</div>
                                        <div className="font-display font-bold text-xl text-stone-200">
                                            {creature.stats![attr.key] ?? '0'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Attacks Section */}
                        {creature.attacks && creature.attacks.length > 0 && (
                            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                    <Sword size={20} /> Attaques
                                </h3>
                                <div className="grid gap-4">
                                    {creature.attacks.map((attack: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-3 bg-stone-900/60 p-5 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all hover:bg-stone-900/80">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
                                                <span className="font-bold text-stone-100 text-lg flex items-center gap-2">
                                                    {attack.name}
                                                </span>
                                                <div className="flex gap-4 text-sm items-center self-start sm:self-auto">
                                                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                                                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Test</span>
                                                        <span className="text-primary-400 font-mono font-bold">{attack.test || attack.atk || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                                                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">DM</span>
                                                        <span className="text-stone-300 font-mono font-bold">{attack.dm || attack.dmg || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {attack.special && (
                                                <div className="text-sm text-stone-400 flex gap-2 items-start mt-1 pl-2 border-l-2 border-primary-500/30">
                                                    <span className="italic">{attack.special}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Abilities Section */}
                        {((creature.capabilities && creature.capabilities.length > 0) || creature.specialAbilities?.text) && (
                            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                    <Zap size={20} /> Capacités
                                </h3>
                                <div className="space-y-4">
                                    {/* Text-based Special Abilities */}
                                    {creature.specialAbilities?.text && (
                                        <div className="bg-stone-900/40 p-6 rounded-xl border border-white/5">
                                            <div
                                                className="prose prose-invert prose-stone max-w-none text-sm space-y-3 [&_p]:leading-relaxed text-stone-300/90"
                                                dangerouslySetInnerHTML={{ __html: creature.specialAbilities.text }}
                                            />
                                        </div>
                                    )}

                                    {/* Structured Capabilities */}
                                    {creature.capabilities?.map((cap: any, i: number) => (
                                        <div key={i} className="bg-stone-900/60 p-5 rounded-xl border border-white/5 hover:border-primary-500/30 transition-colors">
                                            <div className="font-bold text-primary-300 mb-2 flex items-baseline gap-2">
                                                {typeof cap === 'string' ? cap : (cap.label || cap.name)}
                                                {cap.rank && <span className="text-stone-500 font-normal text-xs bg-black/30 px-2 py-0.5 rounded border border-white/5">Rang {cap.rank}</span>}
                                            </div>
                                            {typeof cap !== 'string' && cap.description && (
                                                <div className="text-sm text-stone-300 leading-relaxed opacity-90 whitespace-pre-line pl-2 border-l-2 border-white/10">
                                                    {cap.description}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description / Lore */}
                        {(creature.description || familyDesc) && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                                <h3 className="text-xl font-display font-bold text-stone-300 mb-4 flex items-center gap-2">
                                    <Crown size={20} /> Description & Comportement
                                </h3>

                                <div className="space-y-6">
                                    {familyDesc && (
                                        <div className="bg-primary-950/10 p-6 rounded-xl border border-primary-500/10">
                                            <h4 className="text-primary-400 font-bold mb-3 uppercase text-xs tracking-wider flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                                                Famille : {familyName}
                                            </h4>
                                            <p className="text-stone-300 italic text-sm leading-relaxed">
                                                {familyDesc}
                                            </p>
                                        </div>
                                    )}

                                    {creature.description && creature.description.replace(/<[^>]*>/g, '').trim().length > 0 && (
                                        <div className="bg-stone-900/20 p-6 rounded-xl border border-white/5">
                                            <div
                                                className="prose prose-invert prose-stone max-w-none text-sm space-y-3 [&_p]:leading-relaxed text-stone-300/90"
                                                dangerouslySetInnerHTML={{ __html: creature.description }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
