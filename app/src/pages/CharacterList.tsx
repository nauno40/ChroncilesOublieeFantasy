import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import { DataService } from '../services/dataService';
import type { Character } from '../types/character';
import { Plus, User, Swords } from 'lucide-react';
import { PageContainer, PageShell, ContentCard, EmptyState, Loader } from '../components/common';
import { LEXIQUE } from '../domain/lexique';

/**
 * L'API renvoie race/profile en IRI (« /api/races/349 »). On résout le nom via
 * une map @id→name du compendium, tout en gérant le cas où c'est déjà un objet.
 */
const resolveName = (
    val: Character['race'] | Character['profile'],
    map: Record<string, string>,
    fallback: string,
): string => {
    if (!val) return fallback;
    if (typeof val === 'object') return val.name ?? fallback;
    return map[val] ?? fallback;
};

// Construit une map @id (IRI) → nom depuis une collection compendium. Le type
// public ne déclare pas `@id`/`nom` (présents au runtime en JSON-LD), d'où le cast.
const toIriNameMap = (items: unknown[]): Record<string, string> =>
    Object.fromEntries(
        (items as Array<Record<string, unknown>>)
            .filter(i => typeof i['@id'] === 'string')
            .map(i => [i['@id'] as string, String(i.name ?? i.nom ?? '')]),
    );

export const CharacterList: React.FC = () => {
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [raceMap, setRaceMap] = useState<Record<string, string>>({});
    const [profileMap, setProfileMap] = useState<Record<string, string>>({});
    // Les maps peuple/profil se chargent après les persos ; tant qu'elles ne sont
    // pas prêtes on n'affiche pas le fallback « Inconnu » (évite un flash trompeur).
    const [refReady, setRefReady] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ApiService.getAll<Character>('characters')
            .then(setCharacters)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        Promise.all([DataService.getRaces(), DataService.getProfiles()])
            .then(([races, profiles]) => {
                setRaceMap(toIriNameMap(races));
                setProfileMap(toIriNameMap(profiles));
            })
            .catch(() => { /* noms de secours si le compendium est indisponible */ })
            .finally(() => setRefReady(true));
    }, []);

    if (loading) return <Loader />;

    return (
        <PageContainer>
            <PageShell
                title={LEXIQUE.mesPersonnages}
                subtitle="Vos héros : fiches complètes, jouables à la table."
                icon={User}
                actions={
                    <Link to="/characters/new" className="bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-primary-500/25 text-sm">
                        <Plus size={18} /> Nouveau Personnage
                    </Link>
                }
            />

            {characters.length === 0 ? (
                <EmptyState
                    icon={User}
                    title="Aucun personnage pour le moment"
                    message="Créez votre premier héros pour le gérer et le jouer à la table."
                    action={{ label: 'Créer votre premier héros', onClick: () => navigate('/characters/new') }}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {characters.map((char) => (
                        <ContentCard
                            key={char.id}
                            onClick={() => navigate(`/characters/${char.id}`)}
                            footer={
                                <Link
                                    to={`/play/${char.id}`}
                                    onClick={e => e.stopPropagation()}
                                    className="flex items-center justify-center gap-2 bg-green-800/20 hover:bg-green-700/40 text-green-300 font-display font-bold uppercase text-xs tracking-widest py-3 transition-all active:scale-[0.99]"
                                >
                                    <Swords size={16} /> Jouer
                                </Link>
                            }
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-primary-900/30 rounded-full flex items-center justify-center text-primary-400 border border-primary-500/20 group-hover:scale-110 transition-transform">
                                    <User size={24} />
                                </div>
                                <span className="bg-stone-950/50 text-stone-400 text-xs px-2 py-1 rounded font-mono">Niv {char.level}</span>
                            </div>
                            <h3 className="text-xl font-display font-bold text-stone-100 group-hover:text-primary-400 transition-colors mb-1">{char.name}</h3>
                            <p className="text-stone-500 text-sm mb-4 min-h-[1.25rem]">
                                {refReady
                                    ? `${resolveName(char.race, raceMap, 'Inconnu')} - ${resolveName(char.profile, profileMap, 'Aventurier')}`
                                    : <span className="text-stone-700">…</span>}
                            </p>
                            <div className="text-xs text-stone-600">
                                Modifié le {char.updatedAt ? new Date(char.updatedAt).toLocaleDateString() : 'Jamais'}
                            </div>
                        </ContentCard>
                    ))}
                </div>
            )}
        </PageContainer>
    );
};
