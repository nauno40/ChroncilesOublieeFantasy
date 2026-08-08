import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Swords, Shield, Scroll, Play, ChevronRight, Sparkles, Zap, Users, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-primary-500/30">
            {/* Header / Nav */}
            <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-stone-950/50 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="size-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
                        <Scroll size={24} className="text-stone-950" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-display font-bold tracking-tight">Chroniques<span className="text-primary-500">Oubliées</span></span>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 rounded-full font-bold bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
                    >
                        Connexion
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        className="px-6 py-2.5 rounded-full font-bold bg-primary-600 hover:bg-primary-500 text-stone-950 shadow-lg shadow-primary-500/20 transition-all text-sm"
                    >
                        Créer un compte
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] -z-10 opacity-50"></div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold tracking-widest uppercase">
                            <Sparkles size={14} />
                            Compagnon COF2 · Joueurs &amp; Meneurs
                        </div>

                        <h1 className="text-6xl md:text-7xl font-display font-extrabold leading-[1.1] tracking-tight">
                            Vivez vos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Légendes</span> <br />
                            Ensemble.
                        </h1>

                        <p className="text-xl text-stone-400 leading-relaxed max-w-xl">
                            Le compagnon des joueurs et meneurs de Chroniques Oubliées Fantasy : gérez vos fiches et vos parties, et puisez dans un compendium enrichi par la communauté.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="px-8 py-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-lg flex items-center gap-3 shadow-2xl shadow-primary-500/30 transition-all hover:-translate-y-1"
                            >
                                <Play size={20} fill="currentColor" />
                                Commencer l'Aventure
                            </button>
                            <button
                                onClick={() => navigate('/rules')}
                                className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-100 font-bold text-lg border border-white/10 transition-all flex items-center gap-3"
                            >
                                <BookOpen size={20} />
                                Découvrir les Règles
                            </button>
                        </div>

                        <div className="flex items-center gap-8 pt-8 border-t border-white/5">
                            <div>
                                <div className="text-2xl font-bold font-display">1000+</div>
                                <div className="text-xs text-stone-400 font-bold uppercase tracking-widest">Créatures</div>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div>
                                <div className="text-2xl font-bold font-display">14</div>
                                <div className="text-xs text-stone-400 font-bold uppercase tracking-widest">Profils</div>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div>
                                <div className="text-2xl font-bold font-display">∞</div>
                                <div className="text-xs text-stone-400 font-bold uppercase tracking-widest">Créations</div>
                            </div>
                        </div>
                    </div>

                    <div className="relative group animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
                        {/* Mockup Frame */}
                        <div className="relative z-10 glass-panel border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
                            <div className="h-6 bg-stone-900 border-b border-white/5 flex items-center px-4 gap-1.5">
                                <div className="size-2 rounded-full bg-red-500/50"></div>
                                <div className="size-2 rounded-full bg-amber-500/50"></div>
                                <div className="size-2 rounded-full bg-green-500/50"></div>
                            </div>
                            {/* Aperçu composé (autonome, sans image externe) : un mini
                                suivi de combat évoquant l'aide de table. */}
                            <div className="relative h-[420px] bg-gradient-to-br from-stone-900 via-stone-950 to-black overflow-hidden">
                                <div className="absolute -top-16 -right-16 w-72 h-72 bg-primary-600/15 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary-900/20 rounded-full blur-3xl"></div>

                                <div className="relative p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] uppercase tracking-widest text-stone-400 font-bold">Suivi de combat</div>
                                            <div className="text-lg font-display font-bold text-stone-100">Les Ombres de Val-Gelé</div>
                                        </div>
                                        <div className="text-xs font-mono text-primary-400/80 bg-primary-950/40 px-3 py-1.5 rounded-full border border-primary-500/20">Round 3</div>
                                    </div>

                                    {[
                                        { name: 'Lhagva', init: 21, hp: 100, tone: 'primary', active: true },
                                        { name: 'Gobelin éclaireur', init: 17, hp: 45, tone: 'red', active: false },
                                        { name: 'Ionas', init: 14, hp: 80, tone: 'primary', active: false },
                                        { name: 'Loup des glaces', init: 9, hp: 30, tone: 'red', active: false },
                                    ].map((c) => (
                                        <div
                                            key={c.name}
                                            className={`flex items-center gap-3 rounded-xl p-3 border ${c.active ? 'bg-primary-500/10 border-primary-500/30' : 'bg-stone-900/60 border-white/5'}`}
                                        >
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-sm ${c.active ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-black/30 text-stone-400 border border-white/5'}`}>
                                                {c.init}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-stone-200 truncate">{c.name}</div>
                                                <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${c.tone === 'red' ? 'bg-red-500/70' : 'bg-primary-500/70'}`} style={{ width: `${c.hp}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Dégradé de fondu vers le bas pour asseoir les cartes flottantes */}
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent pointer-events-none"></div>
                            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                                <div className="p-4 bg-stone-900/80 backdrop-blur rounded-xl border border-white/10 max-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="size-2 rounded-full bg-primary-500 animate-ping"></div>
                                        <span className="text-[11px] uppercase font-bold text-stone-400">Combat Actif</span>
                                    </div>
                                    <div className="text-sm font-bold truncate">Dragon Rouge Ancien</div>
                                    <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-[75%]"></div>
                                    </div>
                                </div>
                                <div className="size-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/40">
                                    <Swords size={32} className="text-stone-950" />
                                </div>
                            </div>
                        </div>
                        {/* Glow effect */}
                        <div className="absolute -inset-4 bg-primary-600/20 rounded-[40px] blur-3xl -z-10 group-hover:bg-primary-600/30 transition-colors duration-700"></div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center space-y-4 mb-20">
                    <h2 className="text-4xl font-display font-bold">Pensé pour toute la table</h2>
                    <p className="text-stone-400 max-w-2xl mx-auto">Des outils pour le meneur, des fiches pour les joueurs, et un compendium enrichi par la communauté.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={Users}
                        title="Compendium communautaire"
                        description="Races, classes, voies, sorts et créatures officiels — enrichis par les créations partagées de la communauté."
                    />
                    <FeatureCard
                        icon={Share2}
                        title="Partage MJ ⇄ joueurs"
                        description="Diffusez résumés de séance, quêtes et fiches à votre table. Un partage asynchrone, sans contrainte de temps réel."
                    />
                    <FeatureCard
                        icon={Shield}
                        title="Fiches auto-calculées"
                        description="PV, DEF, initiative, attaques : les règles de Chroniques Oubliées appliquées automatiquement à vos personnages."
                    />
                    <FeatureCard
                        icon={Swords}
                        title="Aide de combat"
                        description="Suivez l'initiative, les points de vie et les états préjudiciables de vos créatures et joueurs."
                    />
                    <FeatureCard
                        icon={BookOpen}
                        title="Bestiaire & règles"
                        description="Le SRD complet à portée de main : créatures, équipement, objets magiques et texte intégral des règles."
                    />
                    <FeatureCard
                        icon={Zap}
                        title="Dés & ambiances"
                        description="Lanceur de dés et table de mixage sonore pour immerger votre groupe dans l'aventure."
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="size-8 bg-primary-600/20 rounded-lg flex items-center justify-center text-primary-500">
                            <Scroll size={18} />
                        </div>
                        <span className="font-display font-bold">ChroniquesOubliées</span>
                    </div>

                    <div className="text-xs text-stone-400">
                        &copy; 2026 Chroniques Oubliées. Basé sur les règles ORC de Black Book Editions.
                    </div>
                </div>
            </footer>
        </div>
    );
};

interface FeatureCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
    <div className="glass-panel p-8 rounded-3xl border-white/5 hover:border-primary-500/30 transition-all hover:-translate-y-1 group">
        <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-stone-300 group-hover:bg-primary-600 group-hover:text-stone-950 transition-all duration-300">
            <Icon size={28} />
        </div>
        <h3 className="text-xl font-display font-bold mb-3 group-hover:text-primary-400 transition-colors">{title}</h3>
        <p className="text-stone-400 text-sm leading-relaxed">{description}</p>

        <div className="mt-6 flex items-center gap-2 text-primary-500 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            En savoir plus <ChevronRight size={14} />
        </div>
    </div>
);
