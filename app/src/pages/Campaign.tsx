import React, { useState, useEffect } from 'react';
import { getCampaigns, createCampaign, deleteCampaign } from '../utils/campaignService';
import type { Campaign as CampaignType } from '../types/campaign';
import { ApiService } from '../services/api';
import { SharingService, type SharedCampaign } from '../services/sharingService';
import { Plus, Trash2, ChevronRight, Users, KeyRound, AlertCircle, Loader2, BookOpen, Calendar, UserPlus, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

// Forme brute d'une fiche de personnage du joueur, utilisée uniquement pour le
// rattachement à une campagne rejointe. `campaign` est l'IRI de la campagne
// actuellement rattachée (ou null) ; on la compare à `/api/campaigns/{id}` pour
// savoir si une fiche est déjà rattachée à une campagne rejointe donnée. Voir
// CampaignDetail.tsx pour le même motif côté MJ.
interface PlayerCharacter {
    id: number;
    name: string;
    level: number;
    campaign: string | null;
}

export const Campaign: React.FC = () => {
    const [campaigns, setCampaigns] = useState<CampaignType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newCampaignDesc, setNewCampaignDesc] = useState('');

    // --- Écran joueur : rejoindre une campagne par code + campagnes rejointes ---
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [sharedCampaigns, setSharedCampaigns] = useState<SharedCampaign[]>([]);
    const [loadingShared, setLoadingShared] = useState(true);
    const [myCharacters, setMyCharacters] = useState<PlayerCharacter[]>([]);
    const [selectedCharacterByCampaign, setSelectedCharacterByCampaign] = useState<Record<number, string>>({});
    const [attachingCampaignId, setAttachingCampaignId] = useState<number | null>(null);
    const [attachError, setAttachError] = useState<string | null>(null);

    useEffect(() => {
        loadCampaigns();
        loadSharedCampaigns();
        loadMyCharacters();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        const data = await getCampaigns();
        setCampaigns(data);
        setLoading(false);
    };

    const loadSharedCampaigns = async () => {
        setLoadingShared(true);
        try {
            const data = await SharingService.getSharedCampaigns();
            setSharedCampaigns(data);
        } catch (error) {
            console.error('Failed to load shared campaigns', error);
        } finally {
            setLoadingShared(false);
        }
    };

    const loadMyCharacters = async () => {
        try {
            const data = await ApiService.getAll<PlayerCharacter>('characters');
            setMyCharacters(data);
        } catch (error) {
            console.error('Failed to load characters', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCampaignName.trim()) return;
        await createCampaign(newCampaignName, newCampaignDesc);
        setNewCampaignName('');
        setNewCampaignDesc('');
        setShowCreateForm(false);
        loadCampaigns();
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
            await deleteCampaign(id);
            loadCampaigns();
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        setJoining(true);
        setJoinError(null);
        try {
            const shared = await SharingService.joinCampaign(joinCode.trim());
            setSharedCampaigns(prev => (prev.some(c => c.id === shared.id) ? prev : [...prev, shared]));
            setJoinCode('');
        } catch (error) {
            setJoinError(error instanceof Error ? error.message : 'Impossible de rejoindre cette campagne.');
        } finally {
            setJoining(false);
        }
    };

    const handleAttachCharacter = async (sharedCampaignId: number) => {
        const characterId = selectedCharacterByCampaign[sharedCampaignId];
        if (!characterId) return;
        setAttachError(null);
        setAttachingCampaignId(sharedCampaignId);
        try {
            await ApiService.patch('characters', characterId, { campaignId: sharedCampaignId });
            await loadMyCharacters();
            setSelectedCharacterByCampaign(prev => ({ ...prev, [sharedCampaignId]: '' }));
        } catch (error) {
            setAttachError(error instanceof Error ? error.message : 'Impossible de rattacher cette fiche.');
        } finally {
            setAttachingCampaignId(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
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

            {/* Rejoindre une campagne par code d'invitation */}
            <div className="glass-panel p-6 rounded-2xl border-primary-500/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary-900/30 p-3 rounded-xl border border-primary-500/20">
                        <KeyRound size={24} className="text-primary-400" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-stone-200">Rejoindre une campagne</h3>
                </div>
                <form onSubmit={handleJoin} className="flex flex-wrap items-center gap-3">
                    <input
                        type="text"
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value)}
                        className="flex-1 min-w-[200px] bg-black/40 border border-white/10 text-stone-100 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono tracking-widest placeholder-stone-600"
                        placeholder="Code d'invitation"
                    />
                    <button
                        type="submit"
                        disabled={joining || !joinCode.trim()}
                        className="bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold px-6 py-3 rounded-lg transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                        {joining ? <Loader2 size={18} className="animate-spin" /> : null} Rejoindre
                    </button>
                </form>
                {joinError && (
                    <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{joinError}</span>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            ) : campaigns.length === 0 ? (
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

            {/* Campagnes rejointes : vue joueur en lecture seule (résumés de séance) */}
            <div className="pt-6">
                <h2 className="text-2xl font-display font-bold text-stone-200 mb-4 flex items-center gap-2">
                    <BookOpen size={22} className="text-primary-400" /> Campagnes rejointes
                </h2>

                {attachError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{attachError}</span>
                    </div>
                )}

                {loadingShared ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                ) : sharedCampaigns.length === 0 ? (
                    <div className="text-center py-12 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-sm">
                        <p className="text-stone-400 font-display">Vous n'avez rejoint aucune campagne.</p>
                        <p className="text-stone-600 text-sm">Demandez un code d'invitation à votre meneur de jeu.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {sharedCampaigns.map(shared => {
                            const campaignIri = `/api/campaigns/${shared.id}`;
                            const attachableCharacters = myCharacters.filter(c => c.campaign !== campaignIri);
                            const selectedCharacterId = selectedCharacterByCampaign[shared.id] || '';
                            return (
                                <div key={shared.id} className="glass-panel p-6 rounded-2xl border-primary-500/20">
                                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                                        <div>
                                            <h3 className="text-2xl font-display font-bold text-stone-200">{shared.name}</h3>
                                            <p className="text-stone-500 text-sm">MJ : <span className="text-primary-400 font-bold">{shared.gameMaster}</span></p>
                                        </div>
                                    </div>

                                    {/* Rattacher une fiche */}
                                    <div className="flex flex-wrap items-center gap-2 mb-6 bg-stone-900/50 p-3 rounded-xl border border-white/5">
                                        <UserPlus size={16} className="text-stone-500 shrink-0" />
                                        <select
                                            value={selectedCharacterId}
                                            onChange={e => setSelectedCharacterByCampaign(prev => ({ ...prev, [shared.id]: e.target.value }))}
                                            className="flex-1 min-w-[160px] bg-stone-950 border border-white/10 text-stone-200 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none"
                                        >
                                            <option value="">Choisir une fiche à rattacher...</option>
                                            {attachableCharacters.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} (Niv {c.level})</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleAttachCharacter(shared.id)}
                                            disabled={!selectedCharacterId || attachingCampaignId === shared.id}
                                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 disabled:opacity-50 transition-colors"
                                        >
                                            {attachingCampaignId === shared.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Rattacher
                                        </button>
                                    </div>

                                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Séances</h4>
                                    {shared.sessions.length === 0 ? (
                                        <p className="text-stone-600 text-sm italic">Aucune séance enregistrée pour le moment.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {shared.sessions.map(session => (
                                                <div key={session.id} className="bg-stone-900/50 p-4 rounded-xl border border-white/5">
                                                    <div className="flex flex-wrap items-center gap-3 mb-1">
                                                        <span className="font-bold text-stone-200">{session.title}</span>
                                                        {session.date && (
                                                            <span className="flex items-center gap-1 text-xs text-stone-500">
                                                                <Calendar size={12} /> {new Date(session.date).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {session.summary && (
                                                        <p className="text-stone-400 text-sm whitespace-pre-line">{session.summary}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
