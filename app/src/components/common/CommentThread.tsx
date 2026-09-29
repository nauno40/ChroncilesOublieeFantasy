import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Trash2, Loader2 } from 'lucide-react';
import { AuthorTag } from './AuthorTag';
import { useComments } from '../../hooks/useComments';
import type { CommentTargetType } from '../../services/commentService';

interface CommentThreadProps {
    targetType: CommentTargetType;
    targetId: number;
}

/**
 * Fil de commentaires d'une fiche communautaire (bibliothèque ou monstre maison). La
 * visibilité suit celle de la cible côté serveur (CurrentUserExtension) : ce composant
 * n'a pas à la vérifier lui-même, il affiche ce que l'API renvoie.
 *
 * Pas de bouton « Publier » pour un visiteur anonyme (`onAdd` reste `undefined` — même
 * principe que Favoris/Signaler) : un lien vers /login à la place, jamais une action morte.
 */
export const CommentThread: React.FC<CommentThreadProps> = ({ targetType, targetId }) => {
    const { comments, loading, posting, removingId, onAdd, onRemove, canRemove } = useComments(targetType, targetId);
    const [draft, setDraft] = useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onAdd || !draft.trim()) return;
        await onAdd(draft.trim());
        setDraft('');
    };

    return (
        <section className="mt-8 glass-panel rounded-2xl border border-white/5 p-6">
            <h3 className="flex items-center gap-2 text-lg font-display font-bold text-white mb-4">
                <MessageCircle size={16} className="text-primary-400" />
                Commentaires{comments && comments.length > 0 ? ` (${comments.length})` : ''}
            </h3>

            {loading ? (
                <p className="text-stone-500 text-sm">Chargement…</p>
            ) : comments!.length === 0 ? (
                <p className="text-stone-500 text-sm italic mb-4">Aucun commentaire pour l'instant.</p>
            ) : (
                <ul className="space-y-4 mb-6">
                    {comments!.map(comment => (
                        <li key={comment.id} className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <AuthorTag pseudo={comment.authorPseudo} authorId={comment.authorId} />
                                    <span className="text-stone-600 text-[11px]">
                                        {new Date(comment.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-stone-300 text-sm whitespace-pre-line">{comment.content}</p>
                            </div>
                            {canRemove(comment) && (
                                <button
                                    onClick={() => onRemove(comment.id)}
                                    disabled={removingId === comment.id}
                                    title="Supprimer ce commentaire"
                                    className="shrink-0 text-stone-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {onAdd ? (
                <form onSubmit={submit} className="space-y-3">
                    <textarea
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        placeholder="Votre commentaire…"
                        className="w-full bg-stone-950/50 border border-stone-700 rounded-xl p-3 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 text-sm resize-none"
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={posting || !draft.trim()}
                            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-stone-950 font-bold text-sm flex items-center gap-2"
                        >
                            {posting && <Loader2 size={16} className="animate-spin" />}
                            Publier
                        </button>
                    </div>
                </form>
            ) : (
                <p className="text-stone-500 text-sm">
                    <Link to="/login" className="text-primary-400 hover:text-primary-300 font-bold">Connectez-vous</Link> pour commenter.
                </p>
            )}
        </section>
    );
};
