import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Save, Music, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { LEXIQUE } from '../../domain/lexique';

interface SoundboardProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Track {
    id: string;
    label: string;
    url: string;
    color: string;
}

const STORAGE_KEY = 'co_soundboard_tracks';

const DEFAULT_TRACKS: Track[] = [
    { id: '1', label: 'Combat', url: 'https://www.youtube.com/results?search_query=rpg+combat+music', color: 'bg-stone-800 border-stone-700 text-stone-300 hover:border-primary-500 hover:text-primary-400' },
    { id: '2', label: 'Taverne', url: 'https://www.youtube.com/results?search_query=rpg+tavern+music', color: 'bg-stone-800 border-stone-700 text-stone-300 hover:border-primary-500 hover:text-primary-400' },
    { id: '3', label: 'Angoisse', url: 'https://www.youtube.com/results?search_query=rpg+creepy+music', color: 'bg-stone-800 border-stone-700 text-stone-300 hover:border-primary-500 hover:text-primary-400' },
    { id: '4', label: 'Voyage', url: 'https://www.youtube.com/results?search_query=rpg+travel+music', color: 'bg-stone-800 border-stone-700 text-stone-300 hover:border-primary-500 hover:text-primary-400' },
];

export const Soundboard: React.FC<SoundboardProps> = ({ isOpen }) => {
    // Lu à l'initialisation plutôt que dans un effet : hydrater après coup affichait un
    // instant les pistes par défaut avant celles du joueur. Un contenu illisible en base
    // locale ne doit pas empêcher la table de tourner, d'où le repli sur les pistes
    // par défaut.
    const [tracks, setTracks] = useState<Track[]>(() => {
        try {
            const enregistre = localStorage.getItem(STORAGE_KEY);
            return enregistre ? JSON.parse(enregistre) as Track[] : DEFAULT_TRACKS;
        } catch {
            return DEFAULT_TRACKS;
        }
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editTrack, setEditTrack] = useState<Track | null>(null);

    // Save whenever tracks change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    }, [tracks]);

    const handleOpenLink = (url: string) => {
        if (isEditing) return;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleSaveTrack = () => {
        if (!editTrack) return;

        if (tracks.find(t => t.id === editTrack.id)) {
            setTracks(tracks.map(t => t.id === editTrack.id ? editTrack : t));
        } else {
            setTracks([...tracks, editTrack]);
        }
        setEditTrack(null);
    };

    const handleDeleteTrack = (id: string) => {
        if (confirm('Supprimer ce raccourci ?')) {
            setTracks(tracks.filter(t => t.id !== id));
        }
    };

    const handleCreateTrack = () => {
        setEditTrack({
            id: crypto.randomUUID(),
            label: 'Nouveau son',
            url: 'https://',
            color: 'bg-stone-800 border-stone-700 text-stone-300 hover:border-primary-500 hover:text-primary-400'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header Toolbar (Optional extra controls inside content if needed, but mostly pure content) */}
            <div className="p-2 border-b border-white/5 flex justify-between items-center bg-black/10">
                <div className="text-[11px] uppercase font-bold text-primary-400 tracking-wider">
                    {isEditing ? 'Mode édition' : LEXIQUE.ambiances}
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={clsx("p-1.5 rounded-lg transition-colors", isEditing ? "bg-primary-600 text-stone-900" : "text-stone-400 hover:text-white hover:bg-white/10")}
                    title="Mode Édition"
                >
                    <Edit size={14} />
                </button>
            </div>

            {!isEditing && (
                <p className="px-3 pt-2 text-[11px] text-stone-500 italic leading-snug">
                    Chaque bouton ouvre une recherche musicale d'ambiance (YouTube) dans un nouvel onglet.
                </p>
            )}

            {/* Content List */}
            <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3 min-h-0">
                {/* min-h-0 is crucial for flex child scroll */}
                {isEditing && (
                    <button
                        onClick={handleCreateTrack}
                        className="w-full py-2 mb-2 rounded-lg border border-dashed border-stone-600 text-stone-400 hover:border-primary-500 hover:text-primary-400 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase"
                    >
                        <Plus size={14} /> Ajouter un bouton
                    </button>
                )}

                {editTrack ? (
                    <div className="bg-stone-900/80 p-3 rounded-xl border border-primary-500/50 space-y-3 animate-in fade-in">
                        <h4 className="text-xs font-bold text-primary-400 uppercase">Éditer le bouton</h4>
                        <div>
                            <label className="text-[11px] text-stone-500 uppercase font-bold block mb-1">Label</label>
                            <input
                                type="text"
                                className="w-full bg-stone-950 border border-white/10 rounded px-2 py-1 text-sm text-stone-200 outline-none focus:border-primary-500"
                                value={editTrack.label}
                                onChange={e => setEditTrack({ ...editTrack, label: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-stone-500 uppercase font-bold block mb-1">URL</label>
                            <input
                                type="text"
                                className="w-full bg-stone-950 border border-white/10 rounded px-2 py-1 text-sm text-stone-200 outline-none focus:border-primary-500"
                                value={editTrack.url}
                                onChange={e => setEditTrack({ ...editTrack, url: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-stone-500 uppercase font-bold block mb-1">Style</label>
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    'bg-stone-800 border-stone-700 text-stone-300 hover:border-primary-500 hover:text-primary-400',
                                    'bg-primary-900/20 border-primary-500/30 text-primary-200 hover:bg-primary-900/40',
                                    'bg-red-900/20 border-red-500/30 text-red-200 hover:bg-red-900/40',
                                    'bg-amber-900/20 border-amber-500/30 text-amber-200 hover:bg-amber-900/40',
                                ].map((c, i) => (
                                    <button
                                        key={i}
                                        className={clsx("w-6 h-6 rounded-full border-2", c.split(' ')[0], c.split(' ')[1], editTrack.color === c ? "ring-2 ring-white scale-110" : "")}
                                        onClick={() => setEditTrack({ ...editTrack, color: c })}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditTrack(null)} className="px-2 py-1 text-xs font-bold text-stone-500 hover:text-white">Annuler</button>
                            <button onClick={handleSaveTrack} className="px-3 py-1 bg-primary-600 rounded text-xs font-bold text-stone-950 hover:bg-primary-500 flex items-center gap-1"><Save size={12} /> OK</button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 pb-2">
                        {tracks.map(track => (
                            <div key={track.id} className="relative group min-h-[50px]">
                                <button
                                    onClick={() => isEditing ? setEditTrack(track) : handleOpenLink(track.url)}
                                    className={clsx(
                                        "w-full p-2 h-full rounded-lg border text-left transition-all duration-200 flex items-center justify-between group-hover:scale-[1.02]",
                                        track.color
                                    )}
                                >
                                    <span className="flex items-center gap-1.5 min-w-0">
                                        {!isEditing && <Music size={14} className="text-primary-400/70 flex-shrink-0" />}
                                        <span className="font-display font-bold text-xs tracking-wide truncate">{track.label}</span>
                                    </span>
                                    {isEditing ? <Edit size={12} className="opacity-50 flex-shrink-0" /> : <ExternalLink size={12} className="opacity-40 flex-shrink-0" />}
                                </button>
                                {isEditing && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteTrack(track.id); }}
                                        className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full shadow-lg hover:scale-110 transition-transform z-10"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
