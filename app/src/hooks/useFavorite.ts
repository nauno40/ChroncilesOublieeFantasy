import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { FavoriteService, type FavoriteTargetType } from '../services/favoriteService';

/**
 * État + bascule d'un favori pour UNE cible (fiche de détail). `toggle` reste `undefined`
 * sans session — c'est ce qu'OwnerBar attend pour ne pas rendre un bouton mort (POST
 * /api/favorites exige ROLE_USER).
 *
 * `favoriteId` vaut `undefined` tant que l'état n'est pas connu (session en cours de
 * résolution, ou requête de vérification en vol), puis `null` (pas favori) ou l'id du
 * favori. Sans session, il vaut `null` d'emblée : rien à vérifier.
 */
export function useFavorite(targetType: FavoriteTargetType, targetId: number | undefined) {
    const { user } = useAuth();
    const [favoriteId, setFavoriteId] = useState<number | null | undefined>(undefined);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!user || targetId === undefined) {
            setFavoriteId(null);
            return;
        }
        let cancelled = false;
        FavoriteService.getMine()
            .then(mine => {
                if (cancelled) return;
                const match = mine.find(f => f.targetType === targetType && f.targetId === targetId);
                setFavoriteId(match ? match.id : null);
            })
            .catch(() => { if (!cancelled) setFavoriteId(null); });
        return () => { cancelled = true; };
    }, [user, targetType, targetId]);

    const toggle = useCallback(async () => {
        if (!user || targetId === undefined || busy) return;
        setBusy(true);
        try {
            if (favoriteId) {
                await FavoriteService.remove(favoriteId);
                setFavoriteId(null);
            } else {
                const created = await FavoriteService.add(targetType, targetId);
                setFavoriteId(created.id);
            }
        } finally {
            setBusy(false);
        }
    }, [user, targetType, targetId, favoriteId, busy]);

    return {
        favorited: Boolean(favoriteId),
        favoriting: busy,
        onToggleFavorite: user ? toggle : undefined,
    };
}
