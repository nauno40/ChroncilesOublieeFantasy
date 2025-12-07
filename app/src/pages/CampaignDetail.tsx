import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCampaigns } from '../utils/campaignService';
import { ArrowLeft, Users, Sword } from 'lucide-react';

export const CampaignDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const campaigns = getCampaigns();
    const campaign = campaigns.find(c => c.id === id);

    if (!campaign) {
        return <div>Campagne introuvable</div>;
    }

    return (
        <div className="space-y-6">
            <header className="mb-6 animate-fade-in text-center md:text-left">
                <Link to="/campaign" className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors mb-4 group font-display text-sm uppercase tracking-widest">
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Retour aux campagnes
                </Link>
                <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-400 drop-shadow-lg mb-2">{campaign.name}</h1>
                <p className="text-stone-400 text-lg max-w-2xl leading-relaxed">{campaign.description}</p>
            </header>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-2xl border-primary-500/20 hover:border-primary-500/40 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary-900/30 p-3 rounded-xl border border-primary-500/20 group-hover:bg-primary-900/50 transition-colors">
                                <Users size={24} className="text-primary-400" />
                            </div>
                            <h3 className="font-display font-bold text-xl text-stone-200">Personnages</h3>
                        </div>
                        <span className="text-3xl font-display font-bold text-stone-200">{campaign.characters?.length || 0}</span>
                    </div>
                    <div className="h-px w-full bg-white/5 mb-4"></div>
                    <button className="w-full py-2 rounded-lg border border-dashed border-stone-700 text-stone-500 hover:border-primary-500 hover:text-primary-400 transition-all text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                        + Ajouter un PJ
                    </button>
                </div>

                <div className="glass-panel p-6 rounded-2xl border-primary-500/20 hover:border-primary-500/40 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20 group-hover:bg-red-900/30 transition-colors">
                                <Sword size={24} className="text-red-400" />
                            </div>
                            <h3 className="font-display font-bold text-xl text-stone-200">Rencontres</h3>
                        </div>
                        <span className="text-3xl font-display font-bold text-stone-200">{campaign.encounters?.length || 0}</span>
                    </div>
                    <div className="h-px w-full bg-white/5 mb-4"></div>
                    <button className="w-full py-2 rounded-lg border border-dashed border-stone-700 text-stone-500 hover:border-red-500 hover:text-red-400 transition-all text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                        + Créer une rencontre
                    </button>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl border-white/5 text-center">
                <div className="bg-stone-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Sword size={24} className="text-stone-600" />
                </div>
                <p className="text-stone-400 italic">Des fonctionnalités avancées de gestion de campagne (fiches de personnages, journal de quête...) arrivent bientôt.</p>
            </div>
        </div>
    );
};
