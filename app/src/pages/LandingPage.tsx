import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Swords, Shield, Scroll, Play, ChevronRight, Sparkles, Zap, Users } from 'lucide-react';
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
                            Virtual TableTop Next-Gen
                        </div>

                        <h1 className="text-6xl md:text-7xl font-display font-extrabold leading-[1.1] tracking-tight">
                            Vivez vos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Légendes</span> <br />
                            Comme Jamais.
                        </h1>

                        <p className="text-xl text-stone-400 leading-relaxed max-w-xl">
                            Le compagnon ultime pour Chroniques Oubliées. Gérez vos fiches, vos monstres et vos campagnes dans une interface fluide et immersive.
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
                                <div className="text-xs text-stone-500 font-bold uppercase tracking-widest">Créatures</div>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div>
                                <div className="text-2xl font-bold font-display">50+</div>
                                <div className="text-xs text-stone-500 font-bold uppercase tracking-widest">Profils</div>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div>
                                <div className="text-2xl font-bold font-display">∞</div>
                                <div className="text-xs text-stone-500 font-bold uppercase tracking-widest">Histoires</div>
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
                            <img
                                src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop"
                                alt="Application Preview"
                                className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                            />
                            {/* Overlay UI elements */}
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
                            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                                <div className="p-4 bg-stone-900/80 backdrop-blur rounded-xl border border-white/10 max-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="size-2 rounded-full bg-primary-500 animate-ping"></div>
                                        <span className="text-[10px] uppercase font-bold text-stone-500">Combat Actif</span>
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
                    <h2 className="text-4xl font-display font-bold">Un arsenal de MJ complet</h2>
                    <p className="text-stone-400 max-w-2xl mx-auto">Tout ce dont vous avez besoin pour animer vos parties, concentré dans un outil moderne et performant.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={Shield}
                        title="Gestion de Fiches"
                        description="Calculs automatisés des modificateurs, parsing des capacités et inventaire dynamique."
                    />
                    <FeatureCard
                        icon={Swords}
                        title="Tracking de Combat"
                        description="Gérez l'initiative, les PV et les états préjudiciables de vos monstres et joueurs."
                    />
                    <FeatureCard
                        icon={Scroll}
                        title="Campagnes Persistantes"
                        description="Scénarios, quêtes, indices et notes partagées, sauvegardés en temps réel sur le cloud."
                    />
                    <FeatureCard
                        icon={BookOpen}
                        title="Bestiaire SRD"
                        description="Une encyclopédie complète avec des centaines de créatures prêtes à l'emploi."
                    />
                    <FeatureCard
                        icon={Zap}
                        title="Lancer de Dés"
                        description="Système de lancer intégré avec modificateurs automatiques directement depuis la fiche."
                    />
                    <FeatureCard
                        icon={Users}
                        title="Mode Multijoueur"
                        description="Multi-joueurs et synchronisation en temps réel (Bientôt disponible)."
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

                    <div className="flex items-center gap-8 text-sm text-stone-500 font-medium">
                        <a href="#" className="hover:text-primary-400 transition-colors">Mentions Légales</a>
                        <a href="#" className="hover:text-primary-400 transition-colors">Contact</a>
                        <a href="#" className="hover:text-primary-400 transition-colors">Taverne des Joueurs</a>
                    </div>

                    <div className="text-xs text-stone-600">
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
