import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Search, X, Plus, HelpCircle, MapPin } from 'lucide-react';
import { saveCampaign } from '../../utils/campaignService';
import type { Campaign, Clue } from '../../types/campaign';

interface Props {
    campaign: Campaign;
    onCampaignSaved: (campaign: Campaign) => void;
}

const formatDateSafe = (dateStr: string | number | undefined) => {
    if (!dateStr) return 'Date inconnue';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Date invalide';
    return d.toLocaleDateString();
};

/**
 * Panneau « Indices & Rumeurs » de la campagne (extrait de CampaignDetail) : ajout,
 * résolution, édition en place et suppression. Ne dépend de la campagne que via ses indices.
 */
export const CampaignClues: React.FC<Props> = ({ campaign, onCampaignSaved }) => {
    const [newClue, setNewClue] = useState('');
    const [showClueForm, setShowClueForm] = useState(false);
    const [editingClueId, setEditingClueId] = useState<string | null>(null);
    const [editClueText, setEditClueText] = useState('');

    const handleAddClue = async () => {
        if (!newClue) return;
        const clue: Clue = { id: '', content: newClue, status: 'unsolved', found_at: new Date().toISOString().split('T')[0] };
        const saved = await saveCampaign({ ...campaign, clues: [...(campaign.clues || []), clue] });
        onCampaignSaved(saved);
        setNewClue('');
        setShowClueForm(false);
    };

    const handleToggleClue = async (clueId: string) => {
        const updatedClues = (campaign.clues || []).map((c: Clue) =>
            c.id === clueId ? { ...c, status: (c.status === 'solved' ? 'unsolved' : 'solved') } as Clue : c
        );
        onCampaignSaved(await saveCampaign({ ...campaign, clues: updatedClues }));
    };

    const handleDeleteClue = async (clueId: string) => {
        const updatedClues = (campaign.clues || []).filter((c: Clue) => c.id !== clueId);
        onCampaignSaved(await saveCampaign({ ...campaign, clues: updatedClues }));
    };

    const startEditClue = (clue: Clue) => {
        setEditingClueId(clue.id);
        setEditClueText(clue.content);
    };

    const handleSaveClueEdit = async () => {
        if (!editingClueId || !editClueText.trim()) return;
        const updatedClues = (campaign.clues || []).map((c: Clue) =>
            c.id === editingClueId ? { ...c, content: editClueText.trim() } : c
        );
        onCampaignSaved(await saveCampaign({ ...campaign, clues: updatedClues }));
        setEditingClueId(null);
    };

    return (
        <div className="bg-stone-900/30 border border-white/5 rounded-xl p-5 flex flex-col relative group">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                    <Search size={16} /> Indices & Rumeurs
                </h3>
                <button
                    onClick={() => setShowClueForm(!showClueForm)}
                    title={showClueForm ? "Fermer" : "Ajouter un indice"}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-1 rounded-lg transition-colors"
                >
                    {showClueForm ? <X size={14} /> : <Plus size={14} />}
                </button>
            </div>

            {showClueForm && (
                <div className="mb-4">
                    <textarea
                        className="w-full bg-stone-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-stone-200 focus:border-stone-500 outline-none min-h-[60px] mb-2"
                        placeholder="Nouvelle rumeur..."
                        value={newClue}
                        onChange={e => setNewClue(e.target.value)}
                        autoFocus
                    />
                    <button onClick={handleAddClue} disabled={!newClue} className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 py-1.5 rounded text-xs font-bold uppercase disabled:opacity-50">Ajouter</button>
                </div>
            )}

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[280px]">
                {(campaign.clues || []).length === 0 && (
                    <div className="text-center py-8 text-stone-600 text-sm">
                        <HelpCircle className="mx-auto mb-2 opacity-50" size={24} />
                        Rien à signaler...
                    </div>
                )}
                {(campaign.clues || []).map((clue: Clue) => (
                    <div key={clue.id} className={clsx("p-3 rounded-lg border text-sm relative group/clue", clue.status === 'solved' ? "bg-green-900/10 border-green-500/20" : "bg-stone-900/50 border-white/5")}>
                        {editingClueId === clue.id ? (
                            <div className="mb-2 flex flex-col gap-1.5">
                                <textarea
                                    autoFocus
                                    value={editClueText}
                                    onChange={e => setEditClueText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Escape') setEditingClueId(null); }}
                                    className="w-full bg-stone-950 border border-stone-500 rounded px-2 py-1 text-stone-200 outline-none focus:border-stone-400 min-h-[50px]"
                                />
                                <div className="flex gap-3 justify-end text-[10px] font-bold uppercase">
                                    <button onClick={handleSaveClueEdit} className="text-green-500 hover:text-green-400">Enregistrer</button>
                                    <button onClick={() => setEditingClueId(null)} className="text-stone-500 hover:text-white">Annuler</button>
                                </div>
                            </div>
                        ) : (
                            <p className={clsx("mb-2", clue.status === 'solved' ? "text-stone-500 line-through" : "text-stone-300")}>{clue.content}</p>
                        )}
                        <div className="flex justify-between items-center text-[10px] text-stone-600">
                            <span className="flex items-center gap-1"><MapPin size={10} /> Trouvé le {formatDateSafe(clue.found_at)}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleToggleClue(clue.id)} className={clsx("hover:underline", clue.status === 'solved' ? "text-stone-500" : "text-green-600")}>
                                    {clue.status === 'solved' ? "Rouvrir" : "Résoudre"}
                                </button>
                                {editingClueId !== clue.id && (
                                    <button onClick={() => startEditClue(clue)} className="text-stone-600 hover:text-stone-300 opacity-0 group-hover/clue:opacity-100 transition-opacity">Modifier</button>
                                )}
                                <button onClick={() => handleDeleteClue(clue.id)} className="text-stone-600 hover:text-red-500 opacity-0 group-hover/clue:opacity-100 transition-opacity">Suppr.</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
