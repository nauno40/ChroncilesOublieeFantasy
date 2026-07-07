import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCampaign, saveCampaign } from '../utils/campaignService';
import { ApiService } from '../services/api';
import { SharingService, type Membership } from '../services/sharingService';
import { ArrowLeft, Users, Sword, Plus, X, Calendar, Clock, Trophy, FileText, Check, Edit, Trash2, Scroll, HelpCircle, CheckSquare, Square, Search, MapPin, Loader2, KeyRound, Copy, RefreshCw, UserX } from 'lucide-react';
import type { Campaign, Session, Quest, Clue } from '../types/campaign';
import { clsx } from 'clsx';

// Formes brutes (non re-mappées par campaignService) utilisées uniquement pour le
// partage MJ : inviteCode/owner sur Campaign et owner sur Character ne font pas partie
// des types applicatifs `Campaign`/`Character` (voir types/campaign.ts), donc on les
// lit directement via ApiService sous forme JSON-LD brute (relations = IRI string).
interface RawCampaign {
    id: number;
    inviteCode: string | null;
    owner: string; // IRI, ex: /api/users/5
}

interface RawCharacter {
    id: number;
    name: string;
    level: number;
    campaign: string | null; // IRI
    owner: string | null; // IRI
}

// Extrait l'identifiant numérique final d'une IRI API Platform (ex: /api/users/5 -> 5).
const idFromIri = (iri: string): number => Number(iri.split('/').pop());

export const CampaignDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);

    // State for sharing (invite code + members + their character sheets)
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [memberCharacters, setMemberCharacters] = useState<RawCharacter[]>([]);
    // Tous les persos visibles + IRI du propriétaire (MJ) : pour lister les PJ rattachés
    // à la campagne et proposer d'y rattacher un perso existant du MJ.
    const [allCharacters, setAllCharacters] = useState<RawCharacter[]>([]);
    const [campaignOwnerIri, setCampaignOwnerIri] = useState<string | null>(null);
    // UI « Ajouter un PJ » : une seule modale (créer un nouveau / rattacher un existant).
    const [showAddPjModal, setShowAddPjModal] = useState(false);
    const [inviteCopied, setInviteCopied] = useState(false);
    const [regeneratingInvite, setRegeneratingInvite] = useState(false);

    // State for Notes
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // State for Sessions
    const [showSessionForm, setShowSessionForm] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [newSession, setNewSession] = useState<Partial<Session>>({
        id: undefined, // Add id to newSession state
        title: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        level: '',
        summary: ''
    });

    // Initial load of data
    useEffect(() => {
        const load = async () => {
            if (id) {
                const data = await getCampaign(id);
                setCampaign(data);
                if (data) {
                    setNotes(data.notes || '');
                }
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // Load sharing data: invite code, members (memberships) and the character
    // sheets belonging to players (i.e. not owned by the GM). Fetched separately
    // via ApiService/SharingService since campaignService's mapped `Campaign`
    // does not expose `inviteCode`/`owner` (see RawCampaign/RawCharacter above).
    const loadSharingData = useCallback(async () => {
        if (!id) return;
        try {
            const campaignIri = `/api/campaigns/${id}`;
            const [rawCampaign, allMemberships, characters] = await Promise.all([
                ApiService.getOne<RawCampaign>('campaigns', id),
                SharingService.getMemberships(),
                ApiService.getAll<RawCharacter>('characters'),
            ]);

            setInviteCode(rawCampaign.inviteCode);
            setCampaignOwnerIri(rawCampaign.owner);
            setAllCharacters(characters);
            setMemberships(allMemberships.filter(m => m.campaign === campaignIri));
            setMemberCharacters(
                characters.filter(c => c.campaign === campaignIri && !!c.owner && c.owner !== rawCampaign.owner)
            );
        } catch (error) {
            console.error('Failed to load sharing data', error);
        }
    }, [id]);

    useEffect(() => {
        loadSharingData();
    }, [loadSharingData]);

    const getPlayerId = (m: Membership): number | null =>
        typeof m.player === 'string' ? idFromIri(m.player) : m.player.id;

    const getPlayerPseudo = (m: Membership): string =>
        typeof m.player === 'string' ? m.player : m.player.pseudo;

    const charactersForMember = (m: Membership): RawCharacter[] => {
        const playerId = getPlayerId(m);
        return memberCharacters.filter(c => c.owner && idFromIri(c.owner) === playerId);
    };

    const handleCopyInvite = async () => {
        if (!inviteCode) return;
        try {
            await navigator.clipboard.writeText(inviteCode);
            setInviteCopied(true);
            setTimeout(() => setInviteCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy invite code', error);
        }
    };

    const handleRegenerateInvite = async () => {
        if (!campaign) return;
        setRegeneratingInvite(true);
        try {
            const { inviteCode: newCode } = await SharingService.regenerateInvite(Number(campaign.id));
            setInviteCode(newCode);
        } catch (error) {
            console.error('Failed to regenerate invite code', error);
        } finally {
            setRegeneratingInvite(false);
        }
    };

    const handleRemoveMembership = async (membershipId: number) => {
        if (!confirm('Exclure ce joueur de la campagne ?')) return;
        try {
            await SharingService.deleteMembership(membershipId);
            setMemberships(prev => prev.filter(m => m.id !== membershipId));
        } catch (error) {
            console.error('Failed to delete membership', error);
        }
    };

    // --- Personnages rattachés à la campagne ---
    const campaignIri = `/api/campaigns/${id}`;
    // Tous les persos de la campagne (MJ + joueurs), pour la liste du panneau Personnages.
    const campaignCharacters = allCharacters.filter(c => c.campaign === campaignIri);
    // Persos du MJ pas encore rattachés à cette campagne → candidats au rattachement.
    const attachCandidates = allCharacters.filter(
        c => c.campaign !== campaignIri && !!c.owner && c.owner === campaignOwnerIri,
    );

    const reloadCampaign = async () => {
        if (!id) return;
        const data = await getCampaign(id);
        setCampaign(data);
    };

    const handleCreateNewPj = () => {
        setShowAddPjModal(false);
        navigate(`/characters/new?campaign=${id}`);
    };

    const handleAttachCharacter = async (characterId: number) => {
        if (!id) return;
        try {
            await ApiService.patch('characters', characterId, { campaignId: Number(id) });
            setShowAddPjModal(false);
            await Promise.all([loadSharingData(), reloadCampaign()]);
        } catch (error) {
            console.error('Failed to attach character', error);
            alert("Impossible de rattacher ce personnage.");
        }
    };

    const handleDetachCharacter = async (characterId: number) => {
        if (!confirm('Détacher ce personnage de la campagne ?')) return;
        try {
            // campaignId (write-only) ignore null ; on remet la relation `campaign` à null.
            await ApiService.patch('characters', characterId, { campaign: null });
            await Promise.all([loadSharingData(), reloadCampaign()]);
        } catch (error) {
            console.error('Failed to detach character', error);
            alert("Impossible de détacher ce personnage.");
        }
    };

    // Auto-save Notes logic
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setNotes(newValue);
        setIsSavingNotes(true);

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            if (campaign) {
                const updatedCampaign = { ...campaign, notes: newValue };
                await saveCampaign(updatedCampaign);
                setIsSavingNotes(false);
            }
        }, 1000);
    };

    const handleEditSession = (session: Session) => {
        setNewSession({ ...session });
        setEditingSessionId(session.id);
        setShowSessionForm(true);
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!campaign) return;
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return;

        const updatedSessions = (campaign.sessions || []).filter((s: Session) => s.id !== sessionId);
        const updatedCampaign = { ...campaign, sessions: updatedSessions };
        const saved = await saveCampaign(updatedCampaign);
        setCampaign(saved);
    };

    // --- Quest Logic ---
    const [newQuest, setNewQuest] = useState({ title: '', type: 'main' as 'main' | 'secondary' });
    const [showQuestForm, setShowQuestForm] = useState(false);

    const handleAddQuest = async () => {
        if (!campaign || !newQuest.title) return;
        const quest: Quest = { // Explicit Type
            id: '', // To be generated by backend
            title: newQuest.title,
            type: newQuest.type,
            status: 'active'
        };
        const updatedCampaign = { ...campaign, quests: [...(campaign.quests || []), quest] };
        const saved = await saveCampaign(updatedCampaign);
        setCampaign(saved);
        setNewQuest({ title: '', type: 'main' });
        setShowQuestForm(false);
    };

    const handleToggleQuest = async (questId: string) => {
        if (!campaign) return;
        const updatedQuests = (campaign.quests || []).map((q: Quest) =>
            q.id === questId ? { ...q, status: (q.status === 'completed' ? 'active' : 'completed') } as Quest : q
        );
        const saved = await saveCampaign({ ...campaign, quests: updatedQuests });
        setCampaign(saved);
    };

    const handleDeleteQuest = async (questId: string) => {
        if (!campaign) return;
        const updatedQuests = (campaign.quests || []).filter((q: Quest) => q.id !== questId);
        const saved = await saveCampaign({ ...campaign, quests: updatedQuests });
        setCampaign(saved);
    };

    // --- Clue Logic ---
    const [newClue, setNewClue] = useState('');
    const [showClueForm, setShowClueForm] = useState(false);

    const handleAddClue = async () => {
        if (!campaign || !newClue) return;
        const clue: Clue = { // Explicit Type
            id: '',
            content: newClue,
            status: 'unsolved',
            found_at: new Date().toISOString().split('T')[0]
        };
        const updatedCampaign = { ...campaign, clues: [...(campaign.clues || []), clue] };
        const saved = await saveCampaign(updatedCampaign);
        setCampaign(saved);
        setNewClue('');
        setShowClueForm(false);
    };

    const handleToggleClue = async (clueId: string) => {
        if (!campaign) return;
        const updatedClues = (campaign.clues || []).map((c: Clue) =>
            c.id === clueId ? { ...c, status: (c.status === 'solved' ? 'unsolved' : 'solved') } as Clue : c
        );
        const saved = await saveCampaign({ ...campaign, clues: updatedClues });
        setCampaign(saved);
    };

    const handleDeleteClue = async (clueId: string) => {
        if (!campaign) return;
        const updatedClues = (campaign.clues || []).filter((c: Clue) => c.id !== clueId);
        const saved = await saveCampaign({ ...campaign, clues: updatedClues });
        setCampaign(saved);
    };

    const handleSaveSession = async () => {
        if (!campaign || !newSession.title) return;

        let updatedSessions = [...(campaign.sessions || [])];

        if (editingSessionId) {
            // Update existing
            updatedSessions = updatedSessions.map((s: Session) =>
                s.id === editingSessionId
                    ? { ...s, ...newSession as Session, id: editingSessionId }
                    : s
            );
        } else {
            // Create new
            const session: Session = {
                id: '',
                title: newSession.title || 'Session sans titre',
                date: new Date().toISOString().split('T')[0],
                duration: newSession.duration || '',
                level: newSession.level || '',
                summary: newSession.summary || ''
            };
            updatedSessions = [session, ...updatedSessions];
        }

        const updatedCampaign = { ...campaign, sessions: updatedSessions };
        const saved = await saveCampaign(updatedCampaign);
        setCampaign(saved);

        // Reset form
        setShowSessionForm(false);
        setEditingSessionId(null);
        setNewSession({
            id: undefined,
            title: '',
            date: new Date().toISOString().split('T')[0],
            duration: '',
            level: '',
            summary: ''
        });
    };

    const handleCancelSession = () => {
        setShowSessionForm(false);
        setEditingSessionId(null);
        setNewSession({
            id: undefined,
            title: '',
            date: new Date().toISOString().split('T')[0],
            duration: '',
            level: '',
            summary: ''
        });
    };

    const formatDateSafe = (dateStr: string | number | undefined) => {
        if (!dateStr) return 'Date inconnue';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Date invalide';
        return d.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="animate-spin text-primary-500 mb-4" size={48} />
                <p className="text-stone-400 font-display">Chargement de la chronique...</p>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="text-center py-20 animate-fade-in">
                <div className="bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <X size={24} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-display font-bold text-stone-200 mb-2">Chronique introuvable</h2>
                <p className="text-stone-400 mb-6">Cette campagne n'existe pas ou vous n'avez pas l'autorisation de la consulter.</p>
                <Link to="/campaign" className="bg-primary-600 hover:bg-primary-500 text-stone-950 px-6 py-2 rounded-lg font-bold transition-colors">
                    Retour aux campagnes
                </Link>
            </div>
        );
    }

    const sortedSessions = (campaign.sessions || []).sort((a: Session, b: Session) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="space-y-6">
            <header className="mb-6 animate-fade-in text-center md:text-left">
                <Link to="/campaign" className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors mb-4 group font-display text-sm uppercase tracking-widest">
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Retour aux campagnes
                </Link>
                <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-400 drop-shadow-lg mb-2">{campaign.name}</h1>
                <p className="text-stone-400 text-lg max-w-full leading-relaxed whitespace-pre-line">{campaign.description || "Aucune description."}</p>
            </header>

            {/* Partage : code d'invitation + membres et leurs fiches */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-2xl border-primary-500/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary-900/30 p-3 rounded-xl border border-primary-500/20">
                            <KeyRound size={24} className="text-primary-400" />
                        </div>
                        <h3 className="font-display font-bold text-xl text-stone-200">Inviter des joueurs</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <code className="bg-stone-950 border border-white/10 rounded-lg px-4 py-2 text-lg font-mono text-primary-300 tracking-widest">
                            {inviteCode || '—'}
                        </code>
                        <button
                            onClick={handleCopyInvite}
                            disabled={!inviteCode}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            <Copy size={14} /> {inviteCopied ? 'Copié !' : 'Copier'}
                        </button>
                        <button
                            onClick={handleRegenerateInvite}
                            disabled={regeneratingInvite}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw size={14} className={clsx(regeneratingInvite && "animate-spin")} /> Régénérer
                        </button>
                    </div>
                    <p className="text-stone-500 text-xs">Partagez ce code : vos joueurs rejoignent la campagne depuis leur compte.</p>
                </div>

                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-primary-500/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary-900/30 p-3 rounded-xl border border-primary-500/20">
                            <Users size={24} className="text-primary-400" />
                        </div>
                        <h3 className="font-display font-bold text-xl text-stone-200">Membres</h3>
                    </div>
                    {memberships.length === 0 ? (
                        <p className="text-stone-600 text-sm italic">Aucun joueur n'a encore rejoint cette campagne.</p>
                    ) : (
                        <div className="space-y-3">
                            {memberships.map((m) => (
                                <div key={m.id} className="bg-stone-900/50 p-4 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center gap-3">
                                        <span className="font-bold text-stone-200">{getPlayerPseudo(m)}</span>
                                        <button
                                            onClick={() => handleRemoveMembership(m.id)}
                                            className="text-stone-500 hover:text-red-500 text-xs font-bold uppercase flex items-center gap-1 transition-colors shrink-0"
                                        >
                                            <UserX size={14} /> Exclure
                                        </button>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {charactersForMember(m).length === 0 ? (
                                            <span className="text-stone-600 text-xs italic">Aucune fiche de personnage</span>
                                        ) : (
                                            charactersForMember(m).map((c) => (
                                                <Link
                                                    key={c.id}
                                                    to={`/characters/${c.id}`}
                                                    className="text-xs bg-stone-800 hover:bg-primary-900/40 text-primary-300 px-2 py-1 rounded-lg border border-white/5 hover:border-primary-500/40 transition-colors"
                                                >
                                                    {c.name} (Niv {c.level})
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-2xl border-primary-500/20 hover:border-primary-500/40 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary-900/30 p-3 rounded-xl border border-primary-500/20 group-hover:bg-primary-900/50 transition-colors">
                                <Users size={24} className="text-primary-400" />
                            </div>
                            <h3 className="font-display font-bold text-xl text-stone-200">Personnages</h3>
                        </div>
                        <span className="text-3xl font-display font-bold text-stone-200">{campaignCharacters.length}</span>
                    </div>
                    <div className="h-px w-full bg-white/5 mb-4"></div>

                    {/* Liste des personnages rattachés */}
                    {campaignCharacters.length > 0 && (
                        <ul className="space-y-2 mb-4">
                            {campaignCharacters.map(c => (
                                <li key={c.id} className="flex items-center justify-between gap-2 bg-black/20 rounded-lg px-3 py-2">
                                    <Link to={`/characters/${c.id}`} className="min-w-0 truncate text-stone-200 hover:text-primary-400 transition-colors">
                                        {c.name} <span className="text-stone-500 text-sm">· Niv {c.level}</span>
                                    </Link>
                                    <button
                                        onClick={() => handleDetachCharacter(c.id)}
                                        className="shrink-0 text-stone-500 hover:text-red-400 transition-colors"
                                        title="Détacher de la campagne"
                                    >
                                        <X size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Bouton « Ajouter un PJ » → modale (créer / rattacher) */}
                    <button
                        onClick={() => setShowAddPjModal(true)}
                        className="w-full py-2 rounded-lg border border-dashed border-stone-700 text-stone-500 hover:border-primary-500 hover:text-primary-400 transition-all text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Ajouter un PJ
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
                        <Plus size={16} /> Créer une rencontre
                    </button>
                </div>
            </div>

            {/* Quests and Clues */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* Quest Log */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-primary-500/20 relative group">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-900/30 p-2 rounded-lg border border-amber-500/20">
                                <Scroll size={20} className="text-amber-400" />
                            </div>
                            <h2 className="text-xl font-display font-bold text-stone-200">Journal de Quêtes</h2>
                        </div>
                        <button
                            onClick={() => setShowQuestForm(!showQuestForm)}
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
                        {/* Main Quests */}
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
                                        <div className="flex-1">
                                            <p className={clsx("text-stone-200 leading-snug", quest.status === 'completed' && "line-through text-stone-500")}>{quest.title}</p>
                                        </div>
                                        <button onClick={() => handleDeleteQuest(quest.id)} className="text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Secondary Quests */}
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
                                        <div className="flex-1">
                                            <p className={clsx("text-sm text-stone-300 leading-snug", quest.status === 'completed' && "line-through text-stone-600")}>{quest.title}</p>
                                        </div>
                                        <button onClick={() => handleDeleteQuest(quest.id)} className="text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clues & Rumors */}
                <div className="glass-panel p-6 rounded-2xl border-primary-500/20 flex flex-col h-full bg-stone-950/40 relative group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Search size={18} className="text-stone-400" />
                            <h2 className="text-lg font-display font-bold text-stone-300">Indices & Rumeurs</h2>
                        </div>
                        <button
                            onClick={() => setShowClueForm(!showClueForm)}
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

                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[400px]">
                        {(campaign.clues || []).length === 0 && (
                            <div className="text-center py-8 text-stone-600 text-sm">
                                <HelpCircle className="mx-auto mb-2 opacity-50" size={24} />
                                Rien à signaler...
                            </div>
                        )}
                        {(campaign.clues || []).map((clue: Clue) => (
                            <div key={clue.id} className={clsx("p-3 rounded-lg border text-sm relative group/clue", clue.status === 'solved' ? "bg-green-900/10 border-green-500/20" : "bg-stone-900/50 border-white/5")}>
                                <p className={clsx("mb-2", clue.status === 'solved' ? "text-stone-500 line-through" : "text-stone-300")}>{clue.content}</p>
                                <div className="flex justify-between items-center text-[10px] text-stone-600">
                                    <span className="flex items-center gap-1"><MapPin size={10} /> Trouvé le {formatDateSafe(clue.found_at)}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleToggleClue(clue.id)} className={clsx("hover:underline", clue.status === 'solved' ? "text-stone-500" : "text-green-600")}>
                                            {clue.status === 'solved' ? "Rouvrir" : "Résoudre"}
                                        </button>
                                        <button onClick={() => handleDeleteClue(clue.id)} className="text-stone-600 hover:text-red-500 opacity-0 group-hover/clue:opacity-100 transition-opacity">Suppr.</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Session Journal & Notes */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Journal Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-display font-bold text-stone-200 flex items-center gap-2">
                            Journal de Campagne
                        </h2>
                        {!showSessionForm && (
                            <button
                                onClick={() => setShowSessionForm(true)}
                                className="text-sm bg-primary-600 hover:bg-primary-500 text-stone-950 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} /> Nouvelle Session
                            </button>
                        )}
                    </div>

                    {/* New Session Form */}
                    {showSessionForm && (
                        <div className="glass-panel p-6 rounded-xl border-primary-500/30 animate-in slide-in-from-top-4 fade-in duration-200 space-y-4 bg-stone-900/80">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-stone-300">{editingSessionId ? 'Modifier la session' : 'Nouvelle session'}</h3>
                                <button onClick={handleCancelSession} className="text-stone-500 hover:text-white"><X size={16} /></button>
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
                                <button
                                    onClick={handleCancelSession}
                                    className="px-4 py-2 rounded-lg font-bold text-stone-500 hover:bg-white/5 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSaveSession}
                                    disabled={!newSession.title}
                                    className="bg-primary-600 hover:bg-primary-500 text-stone-950 px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingSessionId ? 'Mettre à jour' : 'Enregistrer la session'}
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
                                    <p className="text-stone-400 text-sm line-clamp-3 whitespace-pre-line">
                                        {session.summary}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 rounded-lg p-1 border border-white/10 shadow-xl backdrop-blur-sm z-10">
                                        <button
                                            onClick={() => handleEditSession(session)}
                                            className="p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-primary-600 transition-colors"
                                            title="Modifier"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSession(session.id)}
                                            className="p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-red-600 transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Notes */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-display font-bold text-stone-200 flex items-center gap-2">
                        Notes Rapides
                    </h2>
                    <div className={clsx(
                        "glass-panel p-1 rounded-xl border h-[400px] flex flex-col bg-stone-900/40 transition-colors",
                        isSavingNotes ? "border-primary-500/50" : "border-primary-500/20"
                    )}>
                        <textarea
                            className="w-full h-full bg-transparent p-4 resize-none focus:outline-none text-stone-300 placeholder-stone-600 font-mono text-sm leading-relaxed"
                            placeholder="Idées en vrac, PNJ improvisés, loot à distribuer..."
                            value={notes}
                            onChange={handleNotesChange}
                        />
                        <div className="px-3 py-2 text-[10px] text-stone-600 border-t border-white/5 flex justify-between items-center bg-black/20 rounded-b-lg">
                            <span className="flex items-center gap-1">
                                {isSavingNotes ? (
                                    <>Enregistrement...</>
                                ) : (
                                    <><Check size={10} className="text-green-500" /> Sauvegardé</>
                                )}
                            </span>
                            <span>{notes.length} caractères</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl border-white/5 text-center">
                <div className="bg-stone-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Sword size={24} className="text-stone-600" />
                </div>
                <p className="text-stone-400 italic">Des fonctionnalités avancées de gestion de campagne (fiches de personnages, journal de quête...) arrivent bientôt.</p>
            </div>

            {/* Modale « Ajouter un PJ » : créer un nouveau OU rattacher un existant */}
            {showAddPjModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowAddPjModal(false)}>
                    <div className="glass-panel rounded-2xl border border-white/10 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <h3 className="font-display font-bold text-lg text-stone-100">Ajouter un personnage</h3>
                            <button onClick={() => setShowAddPjModal(false)} className="text-stone-400 hover:text-stone-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            <button
                                onClick={handleCreateNewPj}
                                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold rounded-lg px-4 py-3 transition-colors"
                            >
                                <Plus size={16} /> Créer un nouveau personnage
                            </button>

                            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-stone-500">
                                <div className="h-px flex-1 bg-white/10" /> ou rattacher un existant <div className="h-px flex-1 bg-white/10" />
                            </div>

                            {attachCandidates.length === 0 ? (
                                <p className="text-stone-400 text-sm text-center py-4">
                                    Aucun de tes personnages n'est disponible (déjà tous rattachés à une campagne).
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {attachCandidates.map(c => (
                                        <li key={c.id}>
                                            <button
                                                onClick={() => handleAttachCharacter(c.id)}
                                                className="w-full flex items-center justify-between gap-2 bg-black/30 hover:bg-primary-900/30 border border-white/5 hover:border-primary-500/40 rounded-lg px-4 py-3 transition-colors text-left"
                                            >
                                                <span className="text-stone-200">{c.name} <span className="text-stone-500 text-sm">· Niv {c.level}</span></span>
                                                <Plus size={16} className="text-primary-400 shrink-0" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
