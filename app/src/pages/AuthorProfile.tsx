import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ghost, Scroll } from 'lucide-react';
import { PageContainer, PageHeader, EmptyState, Loader } from '../components/common';
import { HomebrewService, categoryLabel, type HomebrewEntry } from '../services/homebrewService';
import { getMonsters } from '../services/monsterService';
import type { CustomCreature } from '../types';

/**
 * Profil public d'un auteur : ses créations publiques (bibliothèque + monstres maison),
 * derrière une URL partageable (`/profil/:authorId`). Pas de nouvel endpoint API — la
 * bibliothèque et les monstres publics sont déjà lisibles sans compte (jalon B), et
 * chaque entrée porte déjà `authorId`/`authorPseudo` : ce profil ne fait que filtrer ce
 * qui existe déjà, ce qui vaut aussi pour le pseudo affiché (pas de `GET /api/users/:id`,
 * réservé à l'intéressé et à l'admin).
 */
export const AuthorProfile: React.FC = () => {
    const { authorId } = useParams<{ authorId: string }>();
    const [entries, setEntries] = useState<HomebrewEntry[] | null>(null);
    const [creatures, setCreatures] = useState<CustomCreature[] | null>(null);

    useEffect(() => {
        HomebrewService.getAll().then(setEntries).catch(() => setEntries([]));
        getMonsters().then(setCreatures).catch(() => setCreatures([]));
    }, []);

    const mesEntries = useMemo(
        () => (entries ?? []).filter(e => e.visibility === 'public' && String(e.authorId) === authorId),
        [entries, authorId],
    );
    const mesCreatures = useMemo(
        () => (creatures ?? []).filter(c => c.visibility === 'public' && String(c.authorId) === authorId),
        [creatures, authorId],
    );

    const loading = entries === null || creatures === null;
    const pseudo = mesEntries[0]?.authorPseudo ?? mesCreatures[0]?.authorPseudo ?? null;
    const total = mesEntries.length + mesCreatures.length;

    if (loading) return <Loader />;

    if (total === 0) {
        return (
            <PageContainer>
                <EmptyState
                    title="Profil introuvable"
                    message="Ce profil n'existe pas ou ne partage aucune création publique pour l'instant."
                />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title={pseudo ?? 'Créateur anonyme'}
                subtitle={`${total} création${total > 1 ? 's' : ''} publique${total > 1 ? 's' : ''}`}
            />

            {mesEntries.length > 0 && (
                <section className="mt-8">
                    <h2 className="flex items-center gap-2 text-lg font-display font-bold text-primary-300 mb-4">
                        <Scroll size={20} /> Bibliothèque
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mesEntries.map(e => (
                            <Link
                                key={e.id}
                                to={`/homebrew/${e.id}`}
                                className="glass-panel rounded-xl p-4 border border-white/5 hover:border-primary-500/40 transition-colors block"
                            >
                                <span className="text-[11px] uppercase font-bold tracking-wider text-primary-400/80">{categoryLabel(e.category)}</span>
                                <h3 className="font-display font-bold text-primary-200 mt-1">{e.name}</h3>
                                {e.description && <p className="text-stone-400 text-sm line-clamp-2 mt-1">{e.description}</p>}
                            </Link>
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
                        {mesCreatures.map(c => (
                            <Link
                                key={c.id}
                                to={`/creatures/maison/${c.id}`}
                                className="glass-panel rounded-xl p-4 border border-white/5 hover:border-primary-500/40 transition-colors block"
                            >
                                <span className="text-[11px] uppercase font-bold tracking-wider text-primary-400/80">NC {c.nc}</span>
                                <h3 className="font-display font-bold text-primary-200 mt-1">{c.name}</h3>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </PageContainer>
    );
};
