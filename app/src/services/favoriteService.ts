import { ApiService } from './api';

export type FavoriteTargetType = 'homebrew_entry' | 'custom_creature';

export interface Favorite {
    id: number;
    targetType: FavoriteTargetType;
    targetId: number;
    createdAt: string;
}

/** Clé stable pour indexer un Set/Map de favoris par cible. */
export const favoriteKey = (targetType: FavoriteTargetType, targetId: number): string =>
    `${targetType}:${targetId}`;

export const FavoriteService = {
    // Scopée au membre courant côté serveur (CurrentUserExtension) : jamais les favoris
    // de quelqu'un d'autre, quel que soit l'appelant.
    getMine: (): Promise<Favorite[]> => ApiService.getAll<Favorite>('favorites'),
    add: (targetType: FavoriteTargetType, targetId: number): Promise<Favorite> =>
        ApiService.post<Favorite>('favorites', { targetType, targetId }),
    remove: (id: number): Promise<void> => ApiService.delete('favorites', id),
};
