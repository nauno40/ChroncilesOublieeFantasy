import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { CommentService, type Comment, type CommentTargetType } from '../services/commentService';

/**
 * Fil de commentaires d'UNE cible (fiche de détail) : chargement, ajout, retrait.
 *
 * `onAdd` reste `undefined` sans session — même principe que `useFavorite` : POST
 * /api/comments exige ROLE_USER, pas de bouton « Publier » qui échouerait à coup sûr.
 * `canRemove(comment)` porte la règle de suppression (auteur ou admin) : le composant
 * n'a pas à connaître `user.id`/`user.roles` pour décider d'afficher le bouton.
 */
export function useComments(targetType: CommentTargetType, targetId: number | undefined) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[] | undefined>(undefined);
    const [posting, setPosting] = useState(false);
    const [removingId, setRemovingId] = useState<number | null>(null);

    useEffect(() => {
        if (targetId === undefined) {
            setComments(undefined);
            return;
        }
        let cancelled = false;
        CommentService.getForTarget(targetType, targetId)
            .then(list => { if (!cancelled) setComments(list); })
            .catch(() => { if (!cancelled) setComments([]); });
        return () => { cancelled = true; };
    }, [targetType, targetId]);

    const add = useCallback(async (content: string) => {
        if (!user || targetId === undefined || posting) return;
        setPosting(true);
        try {
            const created = await CommentService.add(targetType, targetId, content);
            setComments(list => [...(list ?? []), created]);
        } finally {
            setPosting(false);
        }
    }, [user, targetType, targetId, posting]);

    const remove = useCallback(async (id: number) => {
        setRemovingId(id);
        try {
            await CommentService.remove(id);
            setComments(list => (list ?? []).filter(c => c.id !== id));
        } finally {
            setRemovingId(null);
        }
    }, []);

    const canRemove = useCallback((comment: Comment): boolean => {
        if (!user) return false;
        return comment.authorId === user.id || user.roles.includes('ROLE_ADMIN');
    }, [user]);

    return {
        comments,
        loading: comments === undefined,
        posting,
        removingId,
        onAdd: user ? add : undefined,
        onRemove: remove,
        canRemove,
    };
}
