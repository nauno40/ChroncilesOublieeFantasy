import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCampaign, saveCampaign } from '../utils/campaignService';
import { ApiService } from '../services/api';
import { SharingService, type Membership } from '../services/sharingService';
import { DataService } from '../services/dataService';
import { getMonsters } from '../services/monsterService';
import { CampaignEncounters } from '../components/campaign/CampaignEncounters';
import { CampaignNotes } from '../components/campaign/CampaignNotes';
import { CampaignQuests } from '../components/campaign/CampaignQuests';
import { CampaignClues } from '../components/campaign/CampaignClues';
import { CampaignSessions } from '../components/campaign/CampaignSessions';
import { ArrowLeft, Users, Plus, X, Check, Edit, Loader2, KeyRound, Copy, RefreshCw, UserX, ChevronDown } from 'lucide-react';
import type { Campaign } from '../types/campaign';
import type { Creature, CustomCreature } from '../types/normalized';
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
    race?: string | null; // IRI compendium
    profile?: string | null; // IRI compendium (classe)
    data?: {
        hp?: { current?: number; max?: number };
        def?: number;
        init?: number;
        attack?: { contact?: number; distance?: number; magic?: number };
        stats?: Record<string, number>;
        modifiers?: Record<string, number>;
    };
}

// Extrait l'identifiant numérique final d'une IRI API Platform (ex: /api/users/5 -> 5).
const idFromIri = (iri: string): number => Number(iri.split('/').pop());

// Ordre d'affichage des caractéristiques COF2 sur les cartes de personnage.
const STAT_KEYS = ['FOR', 'AGI', 'CON', 'INT', 'PER', 'CHA', 'VOL'] as const;

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
    // Section « Joueurs & partage » : administrative → repliée par défaut, en bas de page.
    const [showSharing, setShowSharing] = useState(false);

    // Édition en place du nom / de la description de la campagne.
    const [editingHeader, setEditingHeader] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [draftDesc, setDraftDesc] = useState('');
    const [savingHeader, setSavingHeader] = useState(false);


    // Rencontres : bestiaire (SRD + monstres custom) pour le sélecteur + état du formulaire.
    const [creatures, setCreatures] = useState<Creature[]>([]);
    const [customMonsters, setCustomMonsters] = useState<CustomCreature[]>([]);

    // Résolution IRI → nom pour afficher race & classe sur les cartes PJ.
    const [raceNames, setRaceNames] = useState<Record<string, string>>({});
    const [profileNames, setProfileNames] = useState<Record<string, string>>({});

    useEffect(() => {
        DataService.getCreatures().then(setCreatures).catch(() => setCreatures([]));
        getMonsters().then(setCustomMonsters).catch(() => setCustomMonsters([]));
        DataService.getRaces()
            .then(rs => setRaceNames(Object.fromEntries(rs.map(r => [`/api/races/${r.id}`, r.name]))))
            .catch(() => setRaceNames({}));
        DataService.getProfiles()
            .then(ps => setProfileNames(Object.fromEntries(ps.map(p => [`/api/profiles/${p.id}`, p.name]))))
            .catch(() => setProfileNames({}));
    }, []);
    const [inviteCopied, setInviteCopied] = useState(false);
    const [regeneratingInvite, setRegeneratingInvite] = useState(false);



    // Initial load of data
    useEffect(() => {
        const load = async () => {
            if (id) {
                const data = await getCampaign(id);
                setCampaign(data);
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

    const startEditHeader = () => {
        if (!campaign) return;
        setDraftName(campaign.name);
        setDraftDesc(campaign.description || '');
        setEditingHeader(true);
    };

    const handleSaveHeader = async () => {
        if (!campaign || !draftName.trim()) return;
        setSavingHeader(true);
        try {
            const saved = await saveCampaign({ ...campaign, name: draftName.trim(), description: draftDesc.trim() });
            setCampaign(saved);
            setEditingHeader(false);
        } finally {
            setSavingHeader(false);
        }
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

    // Groupe de la campagne (taille + niveau moyen), transmis à la section Rencontres.
    const partySize = campaignCharacters.length;
    const partyAvgLevel = partySize > 0
        ? Math.round(campaignCharacters.reduce((s, c) => s + (c.level || 1), 0) / partySize)
        : 0;

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


    return (
        <div className="space-y-6">
            <header className="mb-6 animate-fade-in text-center md:text-left">
                <Link to="/campaign" className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors mb-4 group font-display text-sm uppercase tracking-widest">
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Retour aux campagnes
                </Link>
                {editingHeader ? (
                    <div className="space-y-3 max-w-3xl mx-auto md:mx-0">
                        <input
                            type="text"
                            className="w-full bg-stone-950/50 border border-primary-500/40 rounded-lg px-4 py-3 text-3xl font-display font-bold text-white outline-none focus:border-primary-500 transition-all"
                            value={draftName}
                            onChange={e => setDraftName(e.target.value)}
                            placeholder="Nom de la campagne"
                            autoFocus
                        />
                        <textarea
                            className="w-full bg-stone-950/50 border border-white/10 rounded-lg px-4 py-3 text-stone-300 outline-none focus:border-primary-500/50 transition-all resize-y min-h-[80px] leading-relaxed"
                            value={draftDesc}
                            onChange={e => setDraftDesc(e.target.value)}
                            placeholder="Description de la campagne (optionnelle)"
                        />
                        <div className="flex gap-2 justify-center md:justify-start">
                            <button
                                onClick={handleSaveHeader}
                                disabled={savingHeader || !draftName.trim()}
                                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-stone-950 font-bold px-4 py-2 rounded-lg transition-colors"
                            >
                                <Check size={16} /> Enregistrer
                            </button>
                            <button
                                onClick={() => setEditingHeader(false)}
                                className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded-lg transition-colors"
                            >
                                <X size={16} /> Annuler
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="group/header inline-flex flex-col items-center md:items-start relative">
                        <div className="flex items-center gap-3">
                            <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-400 drop-shadow-lg mb-2">{campaign.name}</h1>
                            <button
                                onClick={startEditHeader}
                                title="Modifier le nom et la description"
                                className="text-stone-600 hover:text-primary-400 transition-colors opacity-0 group-hover/header:opacity-100 focus:opacity-100 p-1.5 rounded-lg hover:bg-stone-900/50 mb-2"
                            >
                                <Edit size={20} />
                            </button>
                        </div>
                        <p className="text-stone-400 text-lg max-w-full leading-relaxed whitespace-pre-line">{campaign.description || "Aucune description."}</p>
                    </div>
                )}
            </header>

            {/* Pilotage de la campagne : colonne principale (jeu) + colonne annexe (allégée) */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Colonne principale — le contenu vivant de la campagne */}
                <div className="lg:col-span-2 space-y-6">

                {/* Journal de Quêtes (section extraite) */}
                <CampaignQuests campaign={campaign} onCampaignSaved={setCampaign} />

                {/* Journal de séances (section extraite) */}
                <CampaignSessions campaign={campaign} onCampaignSaved={setCampaign} />

                </div>
                {/* fin de la colonne principale */}

                {/* Colonne annexe — panneaux secondaires allégés */}
                <div className="space-y-6">

                    {/* Notes rapides (section extraite) */}
                    <CampaignNotes campaign={campaign} />

                    {/* Indices & Rumeurs (section extraite) */}
                    <CampaignClues campaign={campaign} onCampaignSaved={setCampaign} />

                    {/* Préparation : Personnages & Rencontres (compact) */}
                    <div className="bg-stone-900/30 border border-white/5 rounded-xl p-5 space-y-5">
                        {/* Personnages */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Users size={16} className="text-primary-400" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400">Personnages</h3>
                                <span className="text-xs text-stone-600">{campaignCharacters.length}</span>
                            </div>
                            {campaignCharacters.length > 0 && (
                                <ul className="space-y-2 mb-3">
                                    {campaignCharacters.map(c => {
                                        const race = c.race ? raceNames[c.race] : undefined;
                                        const klass = c.profile ? profileNames[c.profile] : undefined;
                                        const meta = [race, klass].filter(Boolean).join(' · ');
                                        const d = c.data || {};
                                        const st = d.stats || {};
                                        return (
                                            <li key={c.id} className="bg-black/20 rounded-lg px-3 py-2.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <Link to={`/characters/${c.id}`} className="min-w-0 group/pj">
                                                        <div className="truncate text-stone-200 font-medium group-hover/pj:text-primary-400 transition-colors">{c.name}</div>
                                                        <div className="text-xs text-stone-500 truncate">{meta ? `${meta} · ` : ''}Niv {c.level}</div>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDetachCharacter(c.id)}
                                                        className="shrink-0 text-stone-500 hover:text-red-400 transition-colors"
                                                        title="Détacher de la campagne"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-xs font-mono">
                                                    {d.hp?.max != null && <span className="text-red-300">PV {d.hp.max}</span>}
                                                    {d.def != null && <span className="text-sky-300">DEF {d.def}</span>}
                                                    {d.attack && <span className="text-amber-300">ATK {d.attack.contact ?? 0}/{d.attack.distance ?? 0}</span>}
                                                    {d.init != null && <span className="text-stone-400">INIT {d.init}</span>}
                                                </div>
                                                {Object.keys(st).length > 0 && (
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        {STAT_KEYS.filter(k => st[k] != null).map(k => (
                                                            <span key={k} className="text-[10px] text-stone-400 bg-stone-800/60 rounded px-1.5 py-0.5">
                                                                <span className="text-stone-500">{k}</span> {st[k]}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            <button
                                onClick={() => setShowAddPjModal(true)}
                                className="w-full py-2 rounded-lg border border-dashed border-stone-700 text-stone-500 hover:border-primary-500 hover:text-primary-400 transition-all text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Ajouter un PJ
                            </button>
                        </div>

                        <div className="h-px w-full bg-white/5"></div>

                        {/* Rencontres (section extraite) */}
                        <CampaignEncounters
                            campaign={campaign}
                            partySize={partySize}
                            partyAvgLevel={partyAvgLevel}
                            creatures={creatures}
                            customMonsters={customMonsters}
                            onCampaignSaved={setCampaign}
                        />
                    </div>

                </div>
            </div>

            {/* Joueurs & partage — administratif, donc replié par défaut et en bas */}
            <div className="glass-panel rounded-2xl border-white/5 overflow-hidden">
                <button
                    onClick={() => setShowSharing(v => !v)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
                >
                    <span className="flex items-center gap-3">
                        <span className="bg-primary-900/30 p-2 rounded-lg border border-primary-500/20">
                            <Users size={18} className="text-primary-400" />
                        </span>
                        <span className="font-display font-bold text-stone-200">Joueurs & partage</span>
                        <span className="text-xs text-stone-500">
                            {memberships.length} membre{memberships.length > 1 ? 's' : ''}{inviteCode ? ` · code ${inviteCode}` : ''}
                        </span>
                    </span>
                    <ChevronDown size={20} className={clsx("text-stone-400 transition-transform", showSharing && "rotate-180")} />
                </button>
                {showSharing && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 grid lg:grid-cols-3 gap-6">
                        {/* Inviter des joueurs */}
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2 mb-3">
                                <KeyRound size={16} className="text-primary-400" /> Inviter des joueurs
                            </h4>
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

                        {/* Membres */}
                        <div className="lg:col-span-2">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2 mb-3">
                                <Users size={16} className="text-primary-400" /> Membres
                            </h4>
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
                )}
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
