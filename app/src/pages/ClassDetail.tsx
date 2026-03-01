import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DataService } from '../services/dataService';
import type { Profile, Voie, Family } from '../types/normalized';
import { DynamicDetailsRenderer } from '../components/common';
import { Loader2, ArrowLeft, Shield, Crown, HelpCircle as HelpIcon, Heart, Activity } from 'lucide-react';

const ClassDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [family, setFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'lore' | 'voies'>('lore');

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [profiles, families] = await Promise.all([
                    DataService.getProfiles(),
                    DataService.getProfileFamilies()
                ]);

                const foundProfile = profiles.find(p => String(p.id) === id);
                setProfile(foundProfile || null);

                if (foundProfile) {
                    if (foundProfile.family) {
                        if (typeof foundProfile.family === 'object' && 'id' in foundProfile.family) {
                            setFamily(foundProfile.family as Family);
                        } else if (typeof foundProfile.family === 'string') {
                            const famIdOrIri = foundProfile.family as string;
                            const famId = famIdOrIri.split('/').pop();
                            const matched = families.find((f: any) => String(f.id) === famId);
                            if (matched) setFamily(matched);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch class details", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const formatLoreKey = (key: string): string => {
        return key
            .replace(/_/g, ' ')
            .replace(/\b([a-z])/, (match) => match.toUpperCase())
            .replace(/ D /g, " d'")
            .replace(/ L /g, " l'")
            .replace(/d osgild/i, "d'Osgild");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-primary-200">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }


    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Classe introuvable</h2>
                <Link to="/classes" className="text-primary-400 hover:text-primary-300 flex items-center justify-center gap-2">
                    <ArrowLeft size={20} /> Retour aux classes
                </Link>
            </div>
        );
    }

    const loreEntries = profile.lore ? Object.entries(profile.lore) : [];

    // Logic to avoid "Famille des Famille des..."
    const familySubtitle = family
        ? (family.name.startsWith('Famille') ? family.name : `Famille des ${family.name}`)
        : undefined;

    return (
        <div className="min-h-screen pb-12 relative">

            {/* Background Banner (Decorative) */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
                <img
                    src={profile.imageUrl || `/assets/profils/${profile.name}.jpg`}
                    alt={profile.name}
                    className="w-full h-full object-cover object-top opacity-30"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/classes/default.jpg';
                    }}
                />
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="container mx-auto px-4 relative z-10 pt-6">

                {/* Header Section */}
                <div className="mb-8">
                    <Link to="/classes" className="inline-flex items-center text-stone-400 hover:text-white transition-colors group mb-6">
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-display font-medium tracking-wide text-sm uppercase">Retour aux Classes</span>
                    </Link>

                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white drop-shadow-xl mb-2">
                        {profile.name}
                    </h1>
                    {familySubtitle && (
                        <h2 className="text-xl md:text-2xl font-display text-primary-400 italic opacity-90">
                            {familySubtitle}
                        </h2>
                    )}
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
                                    src={profile.imageUrl || `/assets/profils/${profile.name}.jpg`}
                                    alt={profile.name}
                                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/assets/classes/default.jpg';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Vital Stats */}
                        <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl transition-all hover:border-primary-500/20">
                            <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-stone-700"></span>
                                {profile.stats?.profileType || "Statistiques Vitales"}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <div className="flex items-center gap-2 text-stone-400">
                                        <Heart size={16} className="text-red-900" />
                                        <span>Dé de Vie</span>
                                    </div>
                                    <span className="font-display text-xl text-primary-200">{profile.hitDie}</span>
                                </div>

                                {/* Extra Stats */}
                                {profile.stats && Object.entries(profile.stats)
                                    .filter(([key]) => key !== 'profileType' && key !== 'hpPerLevel' && key !== 'hitDie' && key !== 'magicStat')
                                    .map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2 text-stone-400">
                                                <Activity size={16} className="text-primary-600/60" />
                                                <span>{key}</span>
                                            </div>
                                            <span className="font-display text-lg text-primary-200 text-right max-w-[60%]">{String(value)}</span>
                                        </div>
                                    ))}

                                {family && (
                                    <>
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2 text-stone-400">
                                                <Activity size={16} className="text-green-900" />
                                                <span>PV / Niveau</span>
                                            </div>
                                            <span className="font-display text-xl text-primary-200">{family.baseHp}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2 text-stone-400">
                                                <Shield size={16} className="text-blue-900" />
                                                <span>Récupération</span>
                                            </div>
                                            <span className="font-display text-xl text-primary-200">{family.recoveryDie}</span>
                                        </div>
                                        {family.luckPoints !== undefined && family.luckPoints > 0 && (
                                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                <div className="flex items-center gap-2 text-stone-400">
                                                    <Crown size={16} className="text-yellow-600" />
                                                    <span>Points de Chance</span>
                                                </div>
                                                <span className="font-display text-xl text-primary-200">{family.luckPoints}</span>
                                            </div>
                                        )}
                                        {family.manaStat && (
                                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                <div className="flex items-center gap-2 text-stone-400">
                                                    <Activity size={16} className="text-purple-500" />
                                                    <span>Carac. Magique</span>
                                                </div>
                                                <span className="font-display text-xl text-primary-200">{family.manaStat}</span>
                                            </div>
                                        )}
                                        {family.specials && (
                                            <div className="pt-2">
                                                <div className="flex items-center gap-2 text-stone-400 mb-1">
                                                    <Crown size={14} className="text-primary-400" />
                                                    <span className="text-xs uppercase tracking-wider font-bold">Bonus de Famille</span>
                                                </div>
                                                <p className="text-sm text-primary-100 italic leading-snug">
                                                    {family.specials}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Masteries */}
                        {(profile.masteries || profile.weaponsAndArmor) && (
                            <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl hover:border-primary-500/20">
                                <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-stone-700"></span>
                                    Maîtrises
                                </h3>
                                <div className="space-y-6">
                                    {profile.masteries ? (
                                        <>
                                            {profile.masteries.weapons && (
                                                <div>
                                                    <strong className="text-primary-400 block mb-2 font-display text-sm uppercase tracking-wide">Armes</strong>
                                                    <p className="text-stone-300 text-sm leading-relaxed">{profile.masteries.weapons}</p>
                                                </div>
                                            )}
                                            {profile.masteries.armors && (
                                                <div>
                                                    <strong className="text-primary-400 block mb-2 font-display text-sm uppercase tracking-wide">Armures</strong>
                                                    <p className="text-stone-300 text-sm leading-relaxed">{profile.masteries.armors}</p>
                                                </div>
                                            )}
                                            {profile.masteries.shields && (
                                                <div>
                                                    <strong className="text-primary-400 block mb-2 font-display text-sm uppercase tracking-wide">Boucliers</strong>
                                                    <p className="text-stone-300 text-sm leading-relaxed">{profile.masteries.shields}</p>
                                                </div>
                                            )}
                                            {profile.masteries.constraints && (
                                                <div>
                                                    <strong className="text-primary-400 block mb-2 font-display text-sm uppercase tracking-wide">Contraintes</strong>
                                                    <p className="text-stone-300 text-sm leading-relaxed">{profile.masteries.constraints}</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div>
                                            <p className="text-stone-300 text-sm leading-relaxed">{profile.weaponsAndArmor}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Starting Equipment */}
                        {profile.startingEquipment && (Array.isArray(profile.startingEquipment) && profile.startingEquipment.length > 0) && (
                            <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl hover:border-primary-500/20">
                                <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-stone-700"></span>
                                    Équipement de départ
                                </h3>
                                <div className="text-sm text-stone-300">
                                    {(() => {
                                        const renderItem = (item: any, idx: number, level = 0) => {
                                            // Handle string items (legacy or simple)
                                            if (typeof item === 'string') {
                                                return (
                                                    <div key={idx} className="flex items-start gap-3 mb-3">
                                                        <div className={`w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0 ${level > 0 ? 'bg-primary-500/50' : ''}`}></div>
                                                        <span className="leading-relaxed">{item}</span>
                                                    </div>
                                                );
                                            }

                                            // Handle 'choice' (Choice between multiple options)
                                            if (item.choice) {
                                                return (
                                                    <div key={idx} className="mb-4 pl-0">
                                                        <div className="flex items-center gap-2 mb-2 text-primary-300/80 text-xs uppercase tracking-wider font-bold">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500/30"></div>
                                                            Au choix :
                                                        </div>
                                                        <div className="pl-4 border-l border-white/10 space-y-2">
                                                            {item.choice.map((choice: any, cIdx: number) => (
                                                                <div key={cIdx}>
                                                                    {cIdx > 0 && <div className="text-[10px] text-stone-500 uppercase font-bold my-1">OU</div>}
                                                                    {renderItem(choice, cIdx, level + 1)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Handle 'set' (Group of items together)
                                            if (item.set) {
                                                return (
                                                    <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                        <span className="text-xs text-stone-400 block mb-2 uppercase tracking-wide font-bold">Ensemble :</span>
                                                        {item.set.map((subItem: any, sIdx: number) => renderItem(subItem, sIdx, level + 1))}
                                                    </div>
                                                );
                                            }

                                            // Handle standard object { item, stats }
                                            return (
                                                <div key={idx} className="flex items-start gap-3 mb-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0 ${level > 0 ? 'bg-primary-500/50' : ''}`}></div>
                                                    <span>
                                                        <strong className="text-stone-200">{item.item || item.id}</strong>
                                                        {item.stats && <span className="text-primary-400/80 ml-1">({item.stats})</span>}
                                                        {item.examples && <span className="text-stone-500 italic ml-1">- ex: {item.examples}</span>}
                                                    </span>
                                                </div>
                                            );
                                        };

                                        return (
                                            <div className="space-y-1">
                                                {profile.startingEquipment.map((item: any, idx: number) => renderItem(item, idx))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Content (66%) */}
                    <div className="lg:col-span-8">

                        {/* Tabs Navigation */}
                        <div className="flex items-center gap-8 border-b border-white/10 mb-8 px-2 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('lore')}
                                className={`pb-4 text-lg font-display font-bold tracking-wide transition-all relative ${activeTab === 'lore'
                                    ? 'text-white'
                                    : 'text-stone-500 hover:text-stone-300'
                                    }`}
                            >
                                Légendes & Histoire
                                {activeTab === 'lore' && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('voies')}
                                className={`pb-4 text-lg font-display font-bold tracking-wide transition-all relative ${activeTab === 'voies'
                                    ? 'text-white'
                                    : 'text-stone-500 hover:text-stone-300'
                                    }`}
                            >
                                Voies & Capacités
                                {activeTab === 'voies' && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                )}
                            </button>
                        </div>

                        {/* TAB CONTENT: Lore */}
                        {activeTab === 'lore' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Description Quote */}
                                <div className="bg-gradient-to-b from-white/5 to-transparent p-8 rounded-2xl border border-white/5">
                                    <p className="lead text-xl text-primary-100 italic font-serif mb-6 leading-relaxed">
                                        &ldquo;{profile.description}&rdquo;
                                    </p>

                                    {/* Note */}
                                    {profile.note && (
                                        <div className="mt-6 pt-6 border-t border-white/10">
                                            <h4 className="flex items-center gap-2 text-primary-400 font-bold mb-2 uppercase text-xs tracking-wider">
                                                <HelpIcon size={14} /> Note
                                            </h4>
                                            <div className="text-stone-300 whitespace-pre-line leading-relaxed">
                                                {profile.note}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Lore Entries */}
                                {loreEntries.length > 0 && (
                                    <div className="grid gap-6">
                                        {loreEntries.map(([key, value]) => (
                                            <div key={key} className="bg-stone-900/60 p-8 rounded-2xl border border-white/5">
                                                <h3 className="text-xl font-display font-bold text-white mb-4 border-b border-primary-500/20 pb-2 inline-block">
                                                    {formatLoreKey(key)}
                                                </h3>
                                                <div className="text-stone-300 leading-relaxed">
                                                    {Array.isArray(value) ? (
                                                        <ul className="list-disc list-inside space-y-2 pl-2">
                                                            {value.map((v: any, i: number) => <li key={i}>{String(v)}</li>)}
                                                        </ul>
                                                    ) : typeof value === 'object' && value !== null ? (
                                                        <div className="space-y-4">
                                                            {Object.entries(value).map(([k, v]) => (
                                                                <div key={k} className="bg-black/20 p-4 rounded-lg border border-white/5">
                                                                    <strong className="text-primary-200 block mb-1 font-display">{formatLoreKey(k)}</strong>
                                                                    <span className="text-stone-400">{String(v)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="whitespace-pre-line">{String(value)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Family Info */}
                                {family && family.description && (
                                    <div className="glass-panel p-8 rounded-xl border border-primary-500/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <Crown size={150} />
                                        </div>
                                        <h3 className="text-2xl font-display font-bold text-primary-300 mb-6 flex items-center gap-3 relative z-10">
                                            <Crown size={24} className="text-primary-400" />
                                            A propos de la {familySubtitle}
                                        </h3>
                                        <p className="text-lg text-stone-300 leading-relaxed relative z-10">
                                            {family.description}
                                        </p>

                                        {family.specials && (
                                            <div className="mt-6 pt-6 border-t border-primary-500/20 relative z-10">
                                                <h4 className="flex items-center gap-2 text-primary-400 font-bold mb-2 uppercase text-xs tracking-wider">
                                                    <Crown size={14} /> Bonus de Famille
                                                </h4>
                                                <p className="text-stone-300 italic">
                                                    {family.specials}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB CONTENT: Voies */}
                        {activeTab === 'voies' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <VoiesDisplay profile={profile} />
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

const VoiesDisplay = ({ profile }: { profile: Profile }) => {
    const [voies, setVoies] = useState<Voie[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const loadVoies = async () => {
            setLoading(true);
            try {
                const fetchedVoies = await DataService.getVoiesByProfile(profile.id);
                setVoies(fetchedVoies);
            } catch (e) {
                console.error("Error loading voies", e);
            } finally {
                setLoading(false);
            }
        };
        if (profile?.id) {
            loadVoies();
        }
    }, [profile]);

    if (loading) {
        return <div className="text-center py-20 text-stone-500 animate-pulse font-display text-xl">Chargement des voies...</div>;
    }

    return (
        <div className="space-y-12">
            {voies.map(voie => (
                <div key={voie.id} className="space-y-6">
                    <div className="flex items-baseline gap-4 border-b border-white/10 pb-4">
                        <h4 className="text-3xl font-display font-bold text-primary-200">
                            {voie.name}
                        </h4>
                        <span className="text-stone-500 text-sm font-mono uppercase tracking-wider">Voie de Classe</span>
                    </div>

                    {/* Dynamic Details (Notes, Stats, Mechanics) */}
                    <DynamicDetailsRenderer details={voie.details} />

                    <div className="grid gap-4">
                        <CapabilitiesList voieId={voie.id} />
                    </div>
                </div>
            ))}

            {voies.length === 0 && (
                <div className="text-center py-20 px-4 border border-dashed border-stone-800 rounded-2xl bg-black/20">
                    <HelpIcon className="mx-auto h-12 w-12 text-stone-700 mb-4" />
                    <h3 className="text-xl font-display text-stone-400">Aucune voie trouvée</h3>
                    <p className="text-stone-500 mt-2 max-w-md mx-auto">
                        Il semble que les voies pour cette classe ne soient pas encore référencées.
                    </p>
                </div>
            )}
        </div>
    );
};

const CapabilitiesList = ({ voieId }: { voieId: string | number }) => {
    const [caps, setCaps] = useState<any[]>([]);

    React.useEffect(() => {
        const load = async () => {
            try {
                const filtered = await DataService.getCapabilitiesByVoie(voieId);
                filtered.sort((a: any, b: any) => a.rank - b.rank);
                setCaps(filtered);
            } catch (e) {
                console.error("Error loading capabilities", e);
            }
        };
        if (voieId) {
            load();
        }
    }, [voieId]);

    return (
        <>
            {caps.map(cap => (
                <div key={cap.id} className="group relative bg-stone-900/80 hover:bg-stone-800 transition-colors p-6 rounded-xl border border-white/5 hover:border-primary-500/30">
                    <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center size-6 rounded bg-primary-950 text-primary-500 text-xs font-bold border border-primary-500/20">
                                {cap.rank}
                            </span>
                            <h5 className="text-lg font-bold text-stone-100 group-hover:text-primary-300 transition-colors">
                                {cap.name}
                            </h5>
                            {cap.limited && <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-red-900/20 text-red-400 rounded border border-red-500/20">L</span>}
                            {cap.isSpell && <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-900/20 text-blue-400 rounded border border-blue-500/20">Sort</span>}
                        </div>
                        <div className="h-[1px] flex-1 bg-white/5 mx-4 hidden md:block"></div>
                    </div>
                    <p className="text-stone-400 text-sm leading-relaxed pl-9">
                        {cap.description}
                    </p>
                    {cap.details && (
                        <div className="pl-9">
                            <DynamicDetailsRenderer details={cap.details} />
                        </div>
                    )}
                </div>
            ))}
        </>
    );
}

export default ClassDetail;
