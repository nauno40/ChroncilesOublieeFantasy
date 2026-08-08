import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Swords, Scroll, ChevronRight, Users, Play, Loader2, Sparkles, UserPlus, PlusCircle, Wand2, ArrowRight } from 'lucide-react';
import { getCampaigns } from '../services/campaignService';
import { ApiService } from '../services/api';
import { HomebrewService, categoryLabel, type HomebrewEntry } from '../services/homebrewService';
import { useAuth } from '../context/AuthContext';
import { AuthorTag } from '../components/common';
import type { Character } from '../types/character';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const myId = user?.id;
    const [campaigns, setCampaigns] = useState<{ id: string | number; name: string; updated_at?: number }[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [homebrew, setHomebrew] = useState<HomebrewEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getCampaigns().catch(() => []),
            ApiService.getAll<Character>('characters').catch(() => []),
            HomebrewService.getAll().catch(() => []),
        ]).then(([c, ch, hb]) => {
            setCampaigns(c as never[]);
            setCharacters(ch);
            setHomebrew(hb);
        }).finally(() => setLoading(false));
    }, []);

    const myCreations = useMemo(() => homebrew.filter(h => h.authorId === myId), [homebrew, myId]);
    const community = useMemo(
        () => homebrew.filter(h => h.visibility === 'public' && h.authorId !== myId)
            .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
        [homebrew, myId],
    );
    const recentChars = useMemo(() => characters.slice(0, 3), [characters]);
    const lastCampaign = useMemo(() => (campaigns.length ? [...campaigns].sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))[0] : null), [campaigns]);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Hero */}
            <div className="glass-panel rounded-3xl p-8 md:p-10 border-primary-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl group-hover:bg-primary-600/20 transition-colors duration-1000 transform translate-x-12 -translate-y-12"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 mb-4 tracking-tight drop-shadow-sm">
                        Bienvenue à la table
                    </h2>
                    <p className="text-stone-300 max-w-2xl text-lg leading-relaxed mb-8">
                        Gérez vos campagnes et vos héros, et piochez dans un compendium enrichi par toute une communauté — races, classes, sorts, créatures…
                    </p>
                    <div className="flex flex-wrap gap-4">
                        {loading ? (
                            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/5">
                                <Loader2 className="animate-spin text-primary-500" size={20} />
                                <span className="text-stone-400">Chargement…</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate(lastCampaign ? `/campaign/${lastCampaign.id}` : '/campaign')}
                                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-stone-950 font-bold px-6 py-3 rounded-xl flex items-center gap-3 transition-all shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5"
                            >
                                <Play size={20} strokeWidth={3} />
                                <span>{lastCampaign ? `Reprendre : ${lastCampaign.name}` : 'Nouvelle aventure'}</span>
                            </button>
                        )}
                        <Link to="/creatures" className="bg-white/5 hover:bg-white/10 text-stone-200 font-bold px-6 py-3 rounded-xl flex items-center gap-3 transition-all border border-white/5 hover:border-white/10">
                            <Sparkles size={20} /> <span>Explorer le compendium</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats perso + communauté (cliquables) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard label="Mes personnages" value={characters.length} icon={Users} onClick={() => navigate('/characters')} />
                <StatsCard label="Mes campagnes" value={campaigns.length} icon={Scroll} onClick={() => navigate('/campaign')} />
                <StatsCard label="Mes créations" value={myCreations.length} icon={Wand2} onClick={() => navigate('/bibliotheque')} />
                <StatsCard label="Partagé par la communauté" value={community.length} icon={Sparkles} onClick={() => navigate('/bibliotheque')} />
            </div>

            {/* Deux colonnes : mes persos récents + nouveautés communauté */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Section title="Mes personnages" to="/characters" toLabel="Tout voir">
                    {recentChars.length === 0 ? (
                        <EmptyMini text="Aucun personnage — créez votre premier héros." to="/characters/new" cta="Nouveau personnage" />
                    ) : (
                        <div className="space-y-3">
                            {recentChars.map(ch => (
                                <button key={ch.id} onClick={() => navigate(`/characters/${ch.id}`)} className="w-full text-left glass-panel rounded-xl border border-white/5 hover:border-primary-500/30 transition-all p-4 flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-full bg-primary-900/30 border border-primary-500/20 flex items-center justify-center text-primary-400 shrink-0"><Users size={20} /></div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-display font-bold text-stone-100 group-hover:text-primary-300 truncate">{ch.name}</div>
                                        <div className="text-xs text-stone-400">Niveau {ch.level}</div>
                                    </div>
                                    <ChevronRight size={18} className="text-stone-400 group-hover:text-primary-400 shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                </Section>

                <Section title="Nouveautés de la communauté" to="/creatures" toLabel="Découvrir">
                    {community.length === 0 ? (
                        <EmptyMini text="Rien de partagé pour l'instant." />
                    ) : (
                        <div className="space-y-3">
                            {community.slice(0, 4).map(e => (
                                <button key={e.id} onClick={() => navigate(`/homebrew/${e.id}`, { state: { retour: '/', retourLabel: 'Retour au tableau de bord' } })} className="w-full text-left glass-panel rounded-xl border border-white/5 hover:border-primary-500/30 transition-all p-4 flex items-center gap-3 group">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[11px] uppercase font-bold tracking-wider text-primary-400/80 border border-primary-500/30 rounded px-1.5 py-0.5">{categoryLabel(e.category)}</span>
                                        </div>
                                        <div className="font-display font-bold text-stone-100 group-hover:text-primary-300 truncate">{e.name}</div>
                                        <div className="mt-1"><AuthorTag pseudo={e.authorPseudo} /></div>
                                    </div>
                                    <ChevronRight size={18} className="text-stone-400 group-hover:text-primary-400 shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                </Section>
            </div>

            {/* Actions rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickAction to="/characters/new" title="Nouveau personnage" icon={UserPlus} />
                <QuickAction to="/campaign" title="Nouvelle campagne" icon={Scroll} />
                <QuickAction to="/bibliotheque" title="Créer du contenu" icon={PlusCircle} />
                <QuickAction to="/tools/tracker" title="Suivi de combat" icon={Swords} />
            </div>
        </div>
    );
};

const StatsCard: React.FC<{ label: string; value: number; icon: React.ElementType; onClick: () => void }> = ({ label, value, icon: Icon, onClick }) => (
    <button onClick={onClick} className="glass-panel p-5 rounded-2xl border-white/5 flex items-center gap-4 hover:border-primary-500/30 transition-all hover:-translate-y-1 group text-left">
        <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-stone-950 transition-colors duration-300 shrink-0">
            <Icon size={24} />
        </div>
        <div className="min-w-0">
            <span className="block text-2xl font-display font-bold text-stone-200 group-hover:text-primary-400 transition-colors">{value}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-primary-500/70 transition-colors">{label}</span>
        </div>
    </button>
);

const Section: React.FC<{ title: string; to: string; toLabel: string; children: React.ReactNode }> = ({ title, to, toLabel, children }) => (
    <div className="glass-panel rounded-2xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-stone-100">{title}</h3>
            <Link to={to} className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 uppercase tracking-wider">{toLabel} <ArrowRight size={13} /></Link>
        </div>
        {children}
    </div>
);

const EmptyMini: React.FC<{ text: string; to?: string; cta?: string }> = ({ text, to, cta }) => (
    <div className="text-center py-8 text-stone-400 text-sm">
        <p>{text}</p>
        {to && cta && <Link to={to} className="text-primary-400 hover:text-primary-300 underline mt-2 inline-block">{cta}</Link>}
    </div>
);

const QuickAction: React.FC<{ to: string; title: string; icon: React.ElementType }> = ({ to, title, icon: Icon }) => (
    <Link to={to} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-primary-500/30 hover:-translate-y-0.5 transition-all group flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-950/40 border border-white/5 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-stone-900 transition-all shrink-0">
            <Icon size={20} />
        </div>
        <span className="font-display font-bold text-stone-200 group-hover:text-primary-300 transition-colors text-sm leading-tight">{title}</span>
    </Link>
);
