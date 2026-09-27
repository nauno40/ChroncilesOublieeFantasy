import { ApiService } from './api';

export type CommentTargetType = 'homebrew_entry' | 'custom_creature';

export interface Comment {
    id: number;
    targetType: CommentTargetType;
    targetId: number;
    content: string;
    authorId: number | null;
    authorPseudo: string | null;
    createdAt: string;
}

export const CommentService = {
    // Filtrée côté serveur par cible (ApiFilter sur Comment) — jamais toute la collection.
    // La visibilité (public/privé) suit celle de la cible, gérée par CurrentUserExtension :
    // un visiteur anonyme ne voit que les commentaires d'une cible publique.
    getForTarget: (targetType: CommentTargetType, targetId: number): Promise<Comment[]> =>
        ApiService.getAll<Comment>(`comments?targetType=${targetType}&targetId=${targetId}`),
    add: (targetType: CommentTargetType, targetId: number, content: string): Promise<Comment> =>
        ApiService.post<Comment>('comments', { targetType, targetId, content }),
    remove: (id: number): Promise<void> => ApiService.delete('comments', id),
};
