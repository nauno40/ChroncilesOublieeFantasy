import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ghost, Heart, Scroll, X } from 'lucide-react';
import { PageContainer, PageHeader, EmptyState, Loader } from '../components/common';
import { HomebrewService, categoryLabel, type HomebrewEntry } from '../services/homebrewService';
import { getMonsters } from '../services/monsterService';
import { FavoriteService, type Favorite } from '../services/favoriteService';
import type { CustomCreature } from '../types';

/**
 * Mes favoris : la bibliothèque et les monstres maison que j'ai marqués, dans l'ordre où
 * je les ai ajoutés (l'API sert `Favorite` trié par `createdAt DESC`). Comme AuthorProfile,
 * pas de filtre serveur dédié — les collections sont déjà chargées en entier partout
 * ailleurs dans l'app ; on croise juste avec mes favoris ici.
 */
export const MyFavorites: React.FC = () => {
    const [favorites, setFavorites] = useState<Favorite[] | null>(null);
    const [entries, setEntries] = useState<HomebrewEntry[] | null>(null);
    const [creatures, setCreatures] = useState<CustomCreature[] | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);

    useEffect(() => {
        FavoriteService.getMine().then(setFavorites).catch(() => setFavorites([]));
        HomebrewService.getAll().then(setEntries).catch(() => setEntries([]));
        getMonsters().then(setCreatures).catch(() => setCreatures([]));
    }, []);

    const loading = favorites === null || entries === null || creatures === null;
    if (loading) return <Loader />;

    const retirer = async (favoriteId: number) => {
        setRemovingId(favoriteId);
        try {
            await FavoriteService.remove(favoriteId);
            setFavorites(f => (f ?? []).filter(x => x.id !== favoriteId));
        } finally {
            setRemovingId(null);
        }
    };

    // Chaque favori porte sa cible résolue (ou `null` si elle a depuis été supprimée/rendue
    // privée — un favori orphelin ne doit pas faire planter la page, juste disparaître).
    const mesEntries = favorites
        .filter(f => f.targetType === 'homebrew_entry')
        .map(f => ({ favorite: f, entry: entries.find(e => e.id === f.targetId) }))
        .filter((x): x is { favorite: Favorite; entry: HomebrewEntry } => x.entry !== undefined);
    const mesCreatures = favorites
        .filter(f => f.targetType === 'custom_creature')
        .map(f => ({ favorite: f, creature: creatures.find(c => c.id === f.targetId) }))
        .filter((x): x is { favorite: Favorite; creature: CustomCreature } => x.creature !== undefined);

    const total = mesEntries.length + mesCreatures.length;

    return (
        <PageContainer>
            <PageHeader
                icon={Heart}
                title="Mes favoris"
                subtitle={total > 0 ? `${total} création${total > 1 ? 's' : ''} de la communauté` : undefined}
            />

            {total === 0 ? (
                <EmptyState
                    icon={Heart}
                    title="Aucun favori pour l'instant"
                    message="Marquez une création de la bibliothèque ou un monstre maison depuis sa fiche pour le retrouver ici."
                />
            ) : (
                <>
                    {mesEntries.length > 0 && (
                        <section className="mt-8">
                            <h2 className="flex items-center gap-2 text-lg font-display font-bold text-primary-300 mb-4">
                                <Scroll size={20} /> Bibliothèque
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {mesEntries.map(({ favorite, entry }) => (
                                    <div key={favorite.id} className="relative glass-panel rounded-xl p-4 border border-white/5 hover:border-primary-500/40 transition-colors group">
                                        <button
                                            onClick={() => retirer(favorite.id)}
                                            disabled={removingId === favorite.id}
                                            title="Retirer des favoris"
                                            className="absolute top-3 right-3 text-stone-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                        >
                                            <X size={16} />
                                        </button>
                                        <Link to={`/homebrew/${entry.id}`} className="block pr-6">
                                            <span className="text-[11px] uppercase font-bold tracking-wider text-primary-400/80">{categoryLabel(entry.category)}</span>
                                            <h3 className="font-display font-bold text-primary-200 mt-1">{entry.name}</h3>
                                            {entry.description && <p className="text-stone-400 text-sm line-clamp-2 mt-1">{entry.description}</p>}
                                            {entry.authorPseudo && <p className="text-stone-500 text-xs mt-2">par {entry.authorPseudo}</p>}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {mesCreatures.length > 0 && (
                        <section className="mt-8">
                            <h2 className="flex items-center gap-2 text-lg font-display font-bold text-primary-300 mb-4">
                                <Ghost size={20} /> Monstres maison
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {mesCreatures.map(({ favorite, creature }) => (
                                    <div key={favorite.id} className="relative glass-panel rounded-xl p-4 border border-white/5 hover:border-primary-500/40 transition-colors group">
                                        <button
                                            onClick={() => retirer(favorite.id)}
                                            disabled={removingId === favorite.id}
                                            title="Retirer des favoris"
                                            className="absolute top-3 right-3 text-stone-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                        >
                                            <X size={16} />
                                        </button>
                                        <Link to={`/creatures/maison/${creature.id}`} className="block pr-6">
                                            <span className="text-[11px] uppercase font-bold tracking-wider text-primary-400/80">NC {creature.nc}</span>
                                            <h3 className="font-display font-bold text-primary-200 mt-1">{creature.name}</h3>
                                            {creature.authorPseudo && <p className="text-stone-500 text-xs mt-2">par {creature.authorPseudo}</p>}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </PageContainer>
    );
};
