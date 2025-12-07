import React, { useState, useEffect } from 'react';
import { getCampaigns, createCampaign, deleteCampaign } from '../utils/campaignService';
import type { Campaign as CampaignType } from '../types/campaign';
import { Plus, Trash2, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Campaign: React.FC = () => {
    const [campaigns, setCampaigns] = useState<CampaignType[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newCampaignDesc, setNewCampaignDesc] = useState('');

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = () => {
        setCampaigns(getCampaigns());
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCampaignName.trim()) return;
        createCampaign(newCampaignName, newCampaignDesc);
        setNewCampaignName('');
        setNewCampaignDesc('');
        setShowCreateForm(false);
        loadCampaigns();
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
            deleteCampaign(id);
            loadCampaigns();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-4xl font-display font-bold text-primary-400 drop-shadow-lg tracking-wide">Campagnes</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-stone-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-primary-500/20 active:scale-95"
                >
                    <Plus size={20} strokeWidth={3} /> <span className="hidden md:inline">Nouvelle</span>
                </button>
            </div>

            {showCreateForm && (
                <div className="glass-panel p-6 rounded-2xl mb-8 animate-fade-in border-primary-500/30">
                    <h3 className="text-xl font-display font-bold text-primary-300 mb-4 border-b border-white/5 pb-2">Nouvelle Aventure</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-xs text-primary-400/80 uppercase font-bold mb-1 tracking-wider">Titre de la campagne</label>
                            <input
                                type="text"
                                value={newCampaignName}
                                onChange={e => setNewCampaignName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-stone-100 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-display placeholder-stone-600"
                                placeholder="La Légende de..."
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-primary-400/80 uppercase font-bold mb-1 tracking-wider">Synopsis</label>
                            <textarea
                                value={newCampaignDesc}
                                onChange={e => setNewCampaignDesc(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-stone-200 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all h-24 placeholder-stone-600 resize-none"
                                placeholder="Dans un monde ravagé par..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 text-stone-400 hover:text-stone-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold px-6 py-2 rounded-lg transition-all shadow-md"
                            >
                                Commencer l'aventure
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {campaigns.length === 0 ? (
                <div className="text-center py-20 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-sm">
                    <div className="bg-stone-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <Users size={40} className="text-stone-600 opacity-50" />
                    </div>
                    <p className="text-stone-400 text-lg mb-2 font-display">Aucune campagne active.</p>
                    <p className="text-stone-600 text-sm">Le monde attend que vous écriviez son histoire.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {campaigns.map(campaign => (
                        <Link
                            key={campaign.id}
                            to={`/campaign/${campaign.id}`}
                            className="glass-panel p-6 rounded-2xl hover:border-primary-500/40 hover:scale-[1.01] transition-all duration-300 group relative overflow-hidden shadow-lg"
                        >
                            {/* Decorative Background Glow */}
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl group-hover:bg-primary-600/10 transition-colors duration-500"></div>

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex-1 pr-12">
                                    <h3 className="text-2xl font-display font-bold text-stone-200 group-hover:text-primary-400 transition-colors mb-2">{campaign.name}</h3>
                                    <p className="text-stone-400 text-sm line-clamp-2 leading-relaxed max-w-2xl">{campaign.description || <span className="italic opacity-50">Pas de description...</span>}</p>

                                    <div className="flex flex-wrap gap-4 mt-6">
                                        <div className="flex items-center gap-2 text-xs font-mono text-primary-400/80 bg-primary-950/30 px-3 py-1.5 rounded-full border border-primary-500/10">
                                            <Users size={14} />
                                            <span>{campaign.characters?.length || 0} JOUEURS</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono text-primary-400/80 bg-primary-950/30 px-3 py-1.5 rounded-full border border-primary-500/10">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            <span>Active depuis le {new Date(campaign.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 p-4">
                                    <button
                                        onClick={(e) => handleDelete(campaign.id, e)}
                                        className="text-stone-600 hover:text-red-400 p-2 rounded-full hover:bg-stone-900/50 transition-colors"
                                        title="Supprimer la campagne"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="absolute bottom-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-300">
                                    <ChevronRight className="text-primary-500" size={24} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};
