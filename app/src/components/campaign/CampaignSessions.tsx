import React, { useState } from 'react';
import { FileText, Plus, X, Trophy, Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import { saveCampaign } from '../../utils/campaignService';
import type { Campaign, Session } from '../../types/campaign';

interface Props {
    campaign: Campaign;
    onCampaignSaved: (campaign: Campaign) => void;
}

const emptySession = (): Partial<Session> => ({
    id: undefined, title: '', date: new Date().toISOString().split('T')[0], duration: '', level: '', summary: '',
});

const formatDateSafe = (dateStr: string | number | undefined) => {
    if (!dateStr) return 'Date inconnue';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Date invalide';
    return d.toLocaleDateString();
};

/**
 * Journal de séances de la campagne (extrait de CampaignDetail) : formulaire de
 * création/édition (titre, date, durée, niveau, résumé) et liste triée par date.
 */
export const CampaignSessions: React.FC<Props> = ({ campaign, onCampaignSaved }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newSession, setNewSession] = useState<Partial<Session>>(emptySession());

    const handleEdit = (session: Session) => {
        setNewSession({ ...session });
        setEditingId(session.id);
        setShowForm(true);
    };

    const handleDelete = async (sessionId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return;
        const updated = (campaign.sessions || []).filter((s: Session) => s.id !== sessionId);
        onCampaignSaved(await saveCampaign({ ...campaign, sessions: updated }));
    };

    const handleSave = async () => {
        if (!newSession.title) return;
        let updated = [...(campaign.sessions || [])];
        if (editingId) {
            updated = updated.map((s: Session) => (s.id === editingId ? { ...s, ...newSession as Session, id: editingId } : s));
        } else {
            updated = [{
                id: '',
                title: newSession.title || 'Session sans titre',
                date: newSession.date || new Date().toISOString().split('T')[0],
                duration: newSession.duration || '',
                level: newSession.level || '',
                summary: newSession.summary || '',
            }, ...updated];
        }
        onCampaignSaved(await saveCampaign({ ...campaign, sessions: updated }));
        setShowForm(false);
        setEditingId(null);
        setNewSession(emptySession());
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setNewSession(emptySession());
    };

    const sortedSessions = (campaign.sessions || []).slice().sort((a: Session, b: Session) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-display font-bold text-stone-200 flex items-center gap-2">
                    <FileText size={20} className="text-primary-400" /> Journal de séances
                </h2>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-sm bg-primary-600 hover:bg-primary-500 text-stone-950 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Nouvelle Session
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-panel p-6 rounded-xl border-primary-500/30 animate-in slide-in-from-top-4 fade-in duration-200 space-y-4 bg-stone-900/80">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-stone-300">{editingId ? 'Modifier la session' : 'Nouvelle session'}</h3>
                        <button onClick={handleCancel} className="text-stone-500 hover:text-white"><X size={16} /></button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase">Titre de la session</label>
                            <input
                                type="text"
                                className="w-full bg-stone-950/50 border border-white/10 rounded-lg px-4 py-2 text-stone-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                placeholder="ex: L'attaque des Gobelins"
                                value={newSession.title}
                                onChange={e => setNewSession({ ...newSession, title: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase">Date</label>
                            <input
                                type="date"
                                className="w-full bg-stone-950/50 border border-white/10 rounded-lg px-4 py-2 text-stone-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                value={newSession.date}
                                onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase">Durée (approx)</label>
                            <input
                                type="text"
                                className="w-full bg-stone-950/50 border border-white/10 rounded-lg px-4 py-2 text-stone-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                placeholder="ex: 4h"
                                value={newSession.duration}
                                onChange={e => setNewSession({ ...newSession, duration: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase">Niveau moyen</label>
                            <input
                                type="text"
                                className="w-full bg-stone-950/50 border border-white/10 rounded-lg px-4 py-2 text-stone-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                placeholder="ex: 3"
                                value={newSession.level}
                                onChange={e => setNewSession({ ...newSession, level: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase">Résumé</label>
                        <textarea
                            className="w-full bg-stone-950/50 border border-white/10 rounded-lg px-4 py-2 text-stone-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none min-h-[100px]"
                            placeholder="Que s'est-il passé ?"
                            value={newSession.summary}
                            onChange={e => setNewSession({ ...newSession, summary: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={handleCancel} className="px-4 py-2 rounded-lg font-bold text-stone-500 hover:bg-white/5 transition-colors">Annuler</button>
                        <button
                            onClick={handleSave}
                            disabled={!newSession.title}
                            className="bg-primary-600 hover:bg-primary-500 text-stone-950 px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingId ? 'Mettre à jour' : 'Enregistrer la session'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {sortedSessions.length === 0 ? (
                    <div className="glass-panel p-8 text-center border-dashed border-white/10">
                        <FileText className="mx-auto text-stone-600 mb-2" size={32} />
                        <p className="text-stone-500">Aucune session enregistrée pour le moment.</p>
                    </div>
                ) : (
                    sortedSessions.map((session: Session) => (
                        <div key={session.id} className="glass-panel p-4 rounded-xl border-white/5 hover:border-primary-500/30 transition-colors group relative">
                            <div className="mb-2 pr-20">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="font-bold text-lg text-stone-200 group-hover:text-primary-400 transition-colors">{session.title}</h3>
                                    {session.level && (
                                        <span className="text-xs font-mono text-primary-500/60 bg-primary-900/10 px-2 py-1 rounded flex items-center gap-1">
                                            <Trophy size={10} /> Niv {session.level}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-stone-500 flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1 bg-stone-900/50 px-2 py-0.5 rounded border border-white/5">
                                        <Calendar size={12} /> {formatDateSafe(session.date)}
                                    </span>
                                    {session.duration && (
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {session.duration}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-stone-400 text-sm line-clamp-3 whitespace-pre-line">{session.summary}</p>

                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 rounded-lg p-1 border border-white/10 shadow-xl backdrop-blur-sm z-10">
                                <button onClick={() => handleEdit(session)} className="p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-primary-600 transition-colors" title="Modifier">
                                    <Edit size={14} />
                                </button>
                                <button onClick={() => handleDelete(session.id)} className="p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-red-600 transition-colors" title="Supprimer">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
