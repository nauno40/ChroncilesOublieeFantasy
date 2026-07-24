import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Scroll, X, Plus, CheckSquare, Square, Check, Edit } from 'lucide-react';
import { saveCampaign } from '../../services/campaignService';
import type { Campaign, Quest } from '../../types/campaign';

interface Props {
    campaign: Campaign;
    onCampaignSaved: (campaign: Campaign) => void;
}

/**
 * Journal de quêtes de la campagne (extrait de CampaignDetail) : ajout, bascule
 * terminé/actif, édition en place et suppression, pour les quêtes principales et
 * secondaires. Ne dépend de la campagne que via ses quêtes.
 */
export const CampaignQuests: React.FC<Props> = ({ campaign, onCampaignSaved }) => {
    const [newQuest, setNewQuest] = useState({ title: '', type: 'main' as 'main' | 'secondary' });
    const [showQuestForm, setShowQuestForm] = useState(false);
    const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
    const [editQuestTitle, setEditQuestTitle] = useState('');

    const handleAddQuest = async () => {
        if (!newQuest.title) return;
        const quest: Quest = { id: '', title: newQuest.title, type: newQuest.type, status: 'active' };
        const saved = await saveCampaign({ ...campaign, quests: [...(campaign.quests || []), quest] });
        onCampaignSaved(saved);
        setNewQuest({ title: '', type: 'main' });
        setShowQuestForm(false);
    };

    const handleToggleQuest = async (questId: string) => {
        const updatedQuests = (campaign.quests || []).map((q: Quest) =>
            q.id === questId ? { ...q, status: (q.status === 'completed' ? 'active' : 'completed') } as Quest : q
        );
        onCampaignSaved(await saveCampaign({ ...campaign, quests: updatedQuests }));
    };

    const handleDeleteQuest = async (questId: string) => {
        const updatedQuests = (campaign.quests || []).filter((q: Quest) => q.id !== questId);
        onCampaignSaved(await saveCampaign({ ...campaign, quests: updatedQuests }));
    };

    const startEditQuest = (quest: Quest) => {
        setEditingQuestId(quest.id);
        setEditQuestTitle(quest.title);
    };

    const handleSaveQuestEdit = async () => {
        if (!editingQuestId || !editQuestTitle.trim()) return;
        const updatedQuests = (campaign.quests || []).map((q: Quest) =>
            q.id === editingQuestId ? { ...q, title: editQuestTitle.trim() } : q
        );
        onCampaignSaved(await saveCampaign({ ...campaign, quests: updatedQuests }));
        setEditingQuestId(null);
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border-primary-500/20 relative group">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-900/30 p-2 rounded-lg border border-amber-500/20">
                        <Scroll size={20} className="text-amber-400" />
                    </div>
                    <h2 className="text-xl font-display font-bold text-stone-200">Journal de Quêtes</h2>
                </div>
                <button
                    onClick={() => setShowQuestForm(!showQuestForm)}
                    title={showQuestForm ? "Fermer" : "Ajouter une quête"}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-1.5 rounded-lg transition-colors"
                >
                    {showQuestForm ? <X size={16} /> : <Plus size={16} />}
                </button>
            </div>

            {showQuestForm && (
                <div className="mb-6 bg-stone-900/50 p-4 rounded-xl border border-white/5 animate-in slide-in-from-top-2">
                    <input
                        type="text"
                        placeholder="Nouvel objectif..."
                        className="w-full bg-stone-950 border border-white/10 rounded-lg px-3 py-2 text-stone-200 mb-2 focus:border-amber-500 outline-none"
                        value={newQuest.title}
                        onChange={e => setNewQuest({ ...newQuest, title: e.target.value })}
                        autoFocus
                    />
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNewQuest({ ...newQuest, type: 'main' })}
                                className={clsx("px-2 py-1 rounded text-xs font-bold uppercase", newQuest.type === 'main' ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-500")}
                            >
                                Principale
                            </button>
                            <button
                                onClick={() => setNewQuest({ ...newQuest, type: 'secondary' })}
                                className={clsx("px-2 py-1 rounded text-xs font-bold uppercase", newQuest.type === 'secondary' ? "bg-stone-600 text-stone-200" : "bg-stone-800 text-stone-500")}
                            >
                                Secondaire
                            </button>
                        </div>
                        <button onClick={handleAddQuest} disabled={!newQuest.title} className="text-amber-500 font-bold text-sm hover:text-amber-400 disabled:opacity-50">Ajouter</button>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* Quêtes principales */}
                <div>
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <div className="h-px bg-amber-500/50 flex-1"></div> Quête Principale <div className="h-px bg-amber-500/50 flex-1"></div>
                    </h3>
                    <div className="space-y-2">
                        {(campaign.quests || []).filter((q: Quest) => q.type === 'main').length === 0 && (
                            <p className="text-stone-600 text-sm text-center italic">Aucun objectif principal.</p>
                        )}
                        {(campaign.quests || []).filter((q: Quest) => q.type === 'main').map((quest: Quest) => (
                            <div key={quest.id} className={clsx("flex items-start gap-3 p-3 rounded-lg border transition-all", quest.status === 'completed' ? "bg-stone-900/30 border-transparent opacity-60" : "bg-stone-900/80 border-amber-500/20")}>
                                <button onClick={() => handleToggleQuest(quest.id)} className="mt-0.5 text-stone-500 hover:text-amber-500 transition-colors">
                                    {quest.status === 'completed' ? <CheckSquare size={18} /> : <Square size={18} />}
                                </button>
                                {editingQuestId === quest.id ? (
                                    <>
                                        <input
                                            autoFocus
                                            value={editQuestTitle}
                                            onChange={e => setEditQuestTitle(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleSaveQuestEdit(); if (e.key === 'Escape') setEditingQuestId(null); }}
                                            className="flex-1 bg-stone-950 border border-amber-500/40 rounded px-2 py-1 text-stone-200 outline-none focus:border-amber-500"
                                        />
                                        <button onClick={handleSaveQuestEdit} title="Enregistrer" className="text-green-500 hover:text-green-400"><Check size={16} /></button>
                                        <button onClick={() => setEditingQuestId(null)} title="Annuler" className="text-stone-500 hover:text-white"><X size={16} /></button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1">
                                            <p className={clsx("text-stone-200 leading-snug", quest.status === 'completed' && "line-through text-stone-500")}>{quest.title}</p>
                                        </div>
                                        <button onClick={() => startEditQuest(quest)} title="Modifier" className="text-stone-600 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={13} /></button>
                                        <button onClick={() => handleDeleteQuest(quest.id)} title="Supprimer" className="text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quêtes secondaires */}
                <div>
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <div className="h-px bg-stone-700 flex-1"></div> Secondaire <div className="h-px bg-stone-700 flex-1"></div>
                    </h3>
                    <div className="space-y-2">
                        {(campaign.quests || []).filter((q: Quest) => q.type === 'secondary').map((quest: Quest) => (
                            <div key={quest.id} className={clsx("flex items-start gap-3 p-2 rounded-lg border transition-all", quest.status === 'completed' ? "bg-stone-900/30 border-transparent opacity-60" : "bg-stone-900/50 border-white/5")}>
                                <button onClick={() => handleToggleQuest(quest.id)} className="mt-0.5 text-stone-600 hover:text-stone-400 transition-colors">
                                    {quest.status === 'completed' ? <CheckSquare size={16} /> : <Square size={16} />}
                                </button>
                                {editingQuestId === quest.id ? (
                                    <>
                                        <input
                                            autoFocus
                                            value={editQuestTitle}
                                            onChange={e => setEditQuestTitle(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleSaveQuestEdit(); if (e.key === 'Escape') setEditingQuestId(null); }}
                                            className="flex-1 bg-stone-950 border border-stone-600 rounded px-2 py-1 text-sm text-stone-300 outline-none focus:border-stone-400"
                                        />
                                        <button onClick={handleSaveQuestEdit} title="Enregistrer" className="text-green-500 hover:text-green-400"><Check size={14} /></button>
                                        <button onClick={() => setEditingQuestId(null)} title="Annuler" className="text-stone-500 hover:text-white"><X size={14} /></button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1">
                                            <p className={clsx("text-sm text-stone-300 leading-snug", quest.status === 'completed' && "line-through text-stone-600")}>{quest.title}</p>
                                        </div>
                                        <button onClick={() => startEditQuest(quest)} title="Modifier" className="text-stone-600 hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={12} /></button>
                                        <button onClick={() => handleDeleteQuest(quest.id)} title="Supprimer" className="text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
