import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DataService } from '../services/dataService';
import type { Profile, Voie, Family } from '../types/normalized';
import { Loader2, ArrowLeft, Shield, Crown, HelpCircle as HelpIcon, Hammer, Backpack } from 'lucide-react';
import { PageContainer, PageHeader, Badge } from '../components/common';
import clsx from 'clsx';

const ClassDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [family, setFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'lore' | 'voies'>('general');

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
            <PageContainer>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
                </div>
            </PageContainer>
        );
    }

    if (!profile) {
        return (
            <PageContainer>
                <div className="text-center p-8 glass-panel rounded-xl">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Classe introuvable</h2>
                    <Link to="/classes" className="text-primary-400 hover:text-primary-300 flex items-center justify-center gap-2">
                        <ArrowLeft size={20} /> Retour aux classes
                    </Link>
                </div>
            </PageContainer>
        );
    }

    const loreEntries = profile.lore ? Object.entries(profile.lore) : [];

    // Logic to avoid "Famille des Famille des..."
    const familySubtitle = family
        ? (family.name.startsWith('Famille') ? family.name : `Famille des ${family.name}`)
        : undefined;

    return (
        <PageContainer>
            <PageHeader
                title={profile.name}
                subtitle={familySubtitle}
                className="mb-8"
            />

            {/* HERO IMAGE SECTION - Full Image on Light Gray Block */}
            <div className="relative w-full h-[400px] md:h-[600px] rounded-2xl overflow-hidden mb-10 shadow-2xl border border-primary-500/20 bg-neutral-100 flex items-center justify-center group">
                <img
                    src={profile.imageUrl || `/assets/profils/${profile.name}.jpg`}
                    alt={profile.name}
                    className="max-w-full max-h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/classes/default.jpg';
                    }}
                />
            </div>

            {/* Description */}
            <div className="glass-panel p-8 rounded-2xl mb-10 border border-primary-500/20 bg-black/40">
                <p className="text-xl md:text-2xl text-stone-200 italic font-serif leading-relaxed text-center max-w-4xl mx-auto">
                    &ldquo;{profile.description}&rdquo;
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-primary-500/30 mb-8 overflow-x-auto justify-center">
                <button
                    onClick={() => setActiveTab('general')}
                    className={clsx(
                        "px-8 py-4 font-display text-xl transition-all border-b-2 whitespace-nowrap",
                        activeTab === 'general' ? "border-primary-500 text-primary-400 bg-primary-500/5" : "border-transparent text-stone-500 hover:text-stone-300 hover:bg-white/5"
                    )}
                >
                    Général
                </button>
                {loreEntries.length > 0 && (
                    <button
                        onClick={() => setActiveTab('lore')}
                        className={clsx(
                            "px-8 py-4 font-display text-xl transition-all border-b-2 whitespace-nowrap",
                            activeTab === 'lore' ? "border-primary-500 text-primary-400 bg-primary-500/5" : "border-transparent text-stone-500 hover:text-stone-300 hover:bg-white/5"
                        )}
                    >
                        Lore & Histoire
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('voies')}
                    className={clsx(
                        "px-8 py-4 font-display text-xl transition-all border-b-2 whitespace-nowrap",
                        activeTab === 'voies' ? "border-primary-500 text-primary-400 bg-primary-500/5" : "border-transparent text-stone-500 hover:text-stone-300 hover:bg-white/5"
                    )}
                >
                    Voies & Capacités
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[500px] max-w-5xl mx-auto">
                {activeTab === 'general' && (
                    <div className="space-y-8 fade-in">

                        {/* 1. Statistics Section */}
                        <div className="glass-panel p-6 rounded-xl border border-primary-500/20">
                            <h3 className="text-2xl font-display font-bold text-primary-300 mb-6 flex items-center gap-3">
                                <Shield size={28} className="text-primary-400" />
                                Statistiques
                            </h3>
                            <div className="flex flex-wrap gap-6">
                                <Badge variant="outline" className="flex items-center gap-3 px-6 py-3 border-primary-500/50 bg-black/40 text-primary-100 text-lg">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs uppercase text-primary-400 font-bold tracking-wider">Dé de Vie</span>
                                        <strong className="text-2xl">{profile.hitDie}</strong>
                                    </div>
                                </Badge>
                                {family && (
                                    <>
                                        <Badge variant="outline" className="flex items-center gap-3 px-6 py-3 border-primary-500/50 bg-black/40 text-primary-100 text-lg">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs uppercase text-primary-400 font-bold tracking-wider">PV / Niveau</span>
                                                <strong className="text-2xl">{family.baseHp}</strong>
                                            </div>
                                        </Badge>
                                        <Badge variant="outline" className="flex items-center gap-3 px-6 py-3 border-primary-500/50 bg-black/40 text-primary-100 text-lg">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs uppercase text-primary-400 font-bold tracking-wider">Récupération</span>
                                                <strong className="text-2xl">{family.recoveryDie}</strong>
                                            </div>
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 2. Masteries & Notes */}
                        {(profile.masteries || profile.note || profile.weaponsAndArmor) && (
                            <div className="glass-panel p-8 rounded-xl border border-primary-500/20">
                                <h3 className="text-2xl font-display font-bold text-primary-300 mb-6 flex items-center gap-3">
                                    <Hammer size={28} className="text-primary-400" />
                                    Maitrises et Notes
                                </h3>
                                <div className="space-y-6">
                                    {/* New Masteries Display */}
                                    {profile.masteries ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {profile.masteries.armes && (
                                                <div className="bg-black/20 p-4 rounded-lg border border-primary-500/10">
                                                    <strong className="text-primary-200 block mb-2 font-display text-lg">Armes</strong>
                                                    <p className="text-lg text-stone-300 leading-relaxed">{profile.masteries.armes}</p>
                                                </div>
                                            )}
                                            {profile.masteries.armures && (
                                                <div className="bg-black/20 p-4 rounded-lg border border-primary-500/10">
                                                    <strong className="text-primary-200 block mb-2 font-display text-lg">Armures</strong>
                                                    <p className="text-lg text-stone-300 leading-relaxed">{profile.masteries.armures}</p>
                                                </div>
                                            )}
                                            {profile.masteries.boucliers && (
                                                <div className="bg-black/20 p-4 rounded-lg border border-primary-500/10">
                                                    <strong className="text-primary-200 block mb-2 font-display text-lg">Boucliers</strong>
                                                    <p className="text-lg text-stone-300 leading-relaxed">{profile.masteries.boucliers}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Fallback for Profiles without structured Masteries */
                                        <div>
                                            {profile.weaponsAndArmor && (
                                                <div className="bg-black/20 p-4 rounded-lg border border-primary-500/10 mb-4">
                                                    <strong className="text-primary-200 block mb-2 font-display text-lg">Armes et Armures</strong>
                                                    <p className="text-lg text-stone-300 leading-relaxed">{profile.weaponsAndArmor}</p>
                                                </div>
                                            )}
                                            {profile.note && (
                                                <div className="prose prose-xl prose-invert max-w-none text-stone-300 whitespace-pre-line leading-loose">
                                                    {profile.note}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. Starting Equipment */}
                        {profile.startingEquipment && (Array.isArray(profile.startingEquipment) && profile.startingEquipment.length > 0) && (
                            <div className="glass-panel p-8 rounded-xl border border-primary-500/20">
                                <h3 className="text-2xl font-display font-bold text-primary-300 mb-6 flex items-center gap-3">
                                    <Backpack size={28} className="text-primary-400" />
                                    Équipement de départ
                                </h3>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profile.startingEquipment.map((item: any, idx: number) => (
                                        <li key={idx} className="bg-black/20 p-4 rounded-lg border border-primary-500/10 flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                            <div className="text-lg text-stone-200">
                                                {typeof item === 'string' ? item : (
                                                    <span>
                                                        <strong className="text-primary-200">{item.objet || item.id}</strong>
                                                        {item.stats && <span className="text-stone-400 text-sm ml-2">({item.stats})</span>}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 4. Family Info */}
                        {family && family.description && (
                            <div className="glass-panel p-8 rounded-xl border border-primary-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Crown size={150} />
                                </div>
                                <h3 className="text-2xl font-display font-bold text-primary-300 mb-6 flex items-center gap-3 relative z-10">
                                    <Crown size={28} className="text-primary-400" />
                                    A propos de la {familySubtitle}
                                </h3>
                                <p className="text-lg text-stone-300 leading-relaxed relative z-10">
                                    {family.description}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'lore' && (
                    <div className="grid grid-cols-1 gap-8 fade-in">
                        {loreEntries.map(([key, value]) => (
                            <div key={key} className="glass-panel p-8 rounded-xl border border-primary-500/20">
                                <h3 className="text-2xl font-display text-primary-300 mb-4 border-b border-primary-500/20 pb-2">
                                    {formatLoreKey(key)}
                                </h3>
                                {Array.isArray(value) ? (
                                    <ul className="list-disc list-inside text-lg text-stone-300 space-y-2 pl-4">
                                        {value.map((v: any, i: number) => <li key={i}>{String(v)}</li>)}
                                    </ul>
                                ) : typeof value === 'object' && value !== null ? (
                                    <div className="space-y-4">
                                        {Object.entries(value).map(([k, v]) => (
                                            <div key={k} className="bg-black/20 p-4 rounded-lg border border-primary-500/10">
                                                <strong className="text-primary-200 block mb-2 font-display text-lg">{formatLoreKey(k)}</strong>
                                                <span className="text-lg text-stone-300">{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-lg text-stone-300 leading-relaxed">
                                        {String(value)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'voies' && (
                    <div className="space-y-10 fade-in">
                        <VoiesDisplay profile={profile} />
                    </div>
                )}
            </div>
        </PageContainer>
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
        <div className="grid grid-cols-1 gap-10">
            {voies.map(voie => (
                <div key={voie.id} className="glass-panel p-8 rounded-2xl border border-primary-500/20 relative overflow-hidden group hover:border-primary-500/40 transition-colors shadow-lg">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Shield size={120} className="text-primary-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-display font-bold text-primary-300 mb-3">{voie.name}</h3>
                        <p className="text-base text-stone-400 italic mb-6 border-l-4 border-primary-500/30 pl-6 py-1">
                            {voie.description || "Aucune description disponible."}
                        </p>

                        {/* Note Speciale Display */}
                        {voie.note_speciale && (
                            <div className="mb-8 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg flex gap-3">
                                <div className="shrink-0 pt-1">
                                    <HelpIcon className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div>
                                    <strong className="text-yellow-500 block mb-1 font-display text-sm tracking-wide uppercase">Note Spéciale</strong>
                                    <p className="text-stone-300 text-sm leading-relaxed">
                                        {voie.note_speciale}
                                    </p>
                                </div>
                            </div>
                        )}

                        <CapabilitiesList voieId={voie.id} />
                    </div>
                </div>
            ))}
            {voies.length === 0 && (
                <div className="text-center py-20 px-4 border-2 border-dashed border-stone-800 rounded-2xl bg-black/20">
                    <HelpIcon className="mx-auto h-16 w-16 text-stone-700 mb-6" />
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
        <div className="space-y-4">
            {caps.map(cap => (
                <div key={cap.id} className="flex gap-5 p-4 rounded-xl bg-black/20 hover:bg-white/5 transition-all border border-transparent hover:border-primary-500/20 group/cap shadow-inner">
                    <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-900/40 text-primary-400 font-bold font-display border border-primary-500/30 group-hover/cap:bg-primary-500 group-hover/cap:text-black transition-all text-lg shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                        {cap.rank}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold text-stone-100 group-hover/cap:text-primary-200 transition-colors">{cap.name}</h4>
                            {cap.limited && <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-red-900/40 text-red-300 rounded border border-red-500/30">L</span>}
                            {cap.isSpell && <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-900/40 text-blue-300 rounded border border-blue-500/30">Sort</span>}
                        </div>
                        <p className="text-base text-stone-400 leading-relaxed">{cap.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ClassDetail;
