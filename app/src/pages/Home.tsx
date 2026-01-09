import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Swords, Scroll, Skull, ChevronRight, Users, Play } from 'lucide-react';
import { getCampaigns } from '../utils/campaignService';
import { DataService } from '../services/dataService';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ creatures: 0, voies: 0, profiles: 0 });

    useEffect(() => {
        Promise.all([
            DataService.getCreatures(),
            DataService.getVoies(),
            DataService.getProfiles()
        ]).then(([c, v, p]) => {
            setStats({
                creatures: c.length,
                voies: v.length,
                profiles: p.length
            });
        }).catch(console.error);
    }, []);

    // Load data
    const campaigns = useMemo(() => getCampaigns(), []);
    const creaturesCount = stats.creatures;
    const voiesCount = stats.voies;
    const profilesCount = stats.profiles;

    // Determine the most recent campaign to resume
    const lastCampaign = useMemo(() => {
        if (campaigns.length === 0) return null;
        return [...campaigns].sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))[0];
    }, [campaigns]);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="glass-panel rounded-3xl p-8 md:p-10 border-primary-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl group-hover:bg-primary-600/20 transition-colors duration-1000 transform translate-x-12 -translate-y-12"></div>

                <div className="relative z-10">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 mb-4 tracking-tight drop-shadow-sm">
                        Bienvenue, Maître de Jeu
                    </h2>
                    <p className="text-stone-300 max-w-xl text-lg leading-relaxed mb-8">
                        Vos chroniques commencent ici. Gérez vos campagnes, consultez le bestiaire et lancez des combats épiques avec style.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        {lastCampaign ? (
                            <button
                                onClick={() => navigate(`/campaign/${lastCampaign.id}`)}
                                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-stone-950 font-bold px-6 py-3 rounded-xl flex items-center gap-3 transition-all shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5"
                            >
                                <Play size={20} strokeWidth={3} />
                                <span>Reprendre : {lastCampaign.name}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/campaign')}
                                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-stone-950 font-bold px-6 py-3 rounded-xl flex items-center gap-3 transition-all shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5"
                            >
                                <Play size={20} strokeWidth={3} />
                                <span>Nouvelle Aventure</span>
                            </button>
                        )}

                        <Link
                            to="/bestiary"
                            className="bg-white/5 hover:bg-white/10 text-stone-200 font-bold px-6 py-3 rounded-xl flex items-center gap-3 transition-all border border-white/5 hover:border-white/10"
                        >
                            <BookOpen size={20} />
                            <span>Consulter le Bestiaire</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                    label="Campagnes Actives"
                    value={campaigns.length}
                    icon={Scroll}
                    delay={0}
                />
                <StatsCard
                    label="Créatures"
                    value={creaturesCount}
                    icon={Skull}
                    delay={100}
                />
                <StatsCard
                    label="Classes"
                    value={profilesCount}
                    icon={Users}
                    delay={200}
                />
                <StatsCard
                    label="Voies"
                    value={voiesCount}
                    icon={BookOpen}
                    delay={300}
                />
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
                <QuickActionCard
                    to="/combat"
                    title="Combat Tracker"
                    description="Gérez l'initiative et les PV en temps réel."
                    icon={Swords}
                />
                <QuickActionCard
                    to="/bestiary"
                    title="Bestiaire"
                    description="Accédez aux stats de plus de 1000 créatures."
                    icon={Skull}
                />
                <QuickActionCard
                    to="/campaign"
                    title="Mes Campagnes"
                    description="Organisez vos scénarios et suivez vos joueurs."
                    icon={Scroll}
                />
            </div>
        </div>
    );
};

interface StatsCardProps {
    label: string;
    value: number | string;
    icon: React.ElementType;
    delay: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon: Icon, delay }) => (
    <div
        className="glass-panel p-5 rounded-2xl border-white/5 flex items-center gap-4 hover:border-primary-500/30 transition-all hover:-translate-y-1 group"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-stone-950 transition-colors duration-300">
            <Icon size={24} />
        </div>
        <div>
            <span className="block text-2xl font-display font-bold text-stone-200 group-hover:text-primary-400 transition-colors">
                {value}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 group-hover:text-primary-500/70 transition-colors">
                {label}
            </span>
        </div>
    </div>
);

interface QuickActionCardProps {
    to: string;
    title: string;
    description: string;
    icon: React.ElementType;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ to, title, description, icon: Icon }) => (
    <Link
        to={to}
        className="glass-panel p-6 rounded-2xl group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-primary-500/30 block h-full select-none"
    >
        {/* Subtle Gradient Blob */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-600/10 rounded-full blur-3xl group-hover:bg-primary-600/20 transition-colors duration-500"></div>

        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-950/40 border border-white/5 flex items-center justify-center text-primary-400 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-stone-900 transition-all duration-300 shadow-inner">
                    <Icon size={24} />
                </div>

                <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-primary-500">
                    <ChevronRight size={20} />
                </div>
            </div>

            <div>
                <h3 className="text-xl font-display font-bold text-stone-200 group-hover:text-primary-300 transition-colors mb-2">
                    {title}
                </h3>
                <p className="text-sm text-stone-400 leading-relaxed group-hover:text-stone-300 transition-colors">
                    {description}
                </p>
            </div>
        </div>
    </Link>
);
