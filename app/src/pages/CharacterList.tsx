import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import type { Character } from '../types/character';
import { Plus, User } from 'lucide-react';

export const CharacterList: React.FC = () => {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ApiService.getAll<Character>('characters')
            .then(setCharacters)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center text-primary-200">Chargement...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 pt-6">
            <header className="flex justify-between items-center mb-8 px-4">
                <h1 className="text-4xl font-display font-bold text-white drop-shadow-lg">Mes Personnages</h1>
                <Link to="/characters/new" className="bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-primary-500/25">
                    <Plus size={20} /> Nouveau Personnage
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {/* Create New Card (Empty State or quick action) */}
                {characters.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-stone-900/40 rounded-3xl border border-white/5 border-dashed">
                        <p className="text-stone-400 font-display text-lg mb-4">Aucun personnage pour le moment.</p>
                        <Link to="/characters/new" className="text-primary-400 hover:text-primary-300 underline font-bold">Créer votre premier héros</Link>
                    </div>
                )}

                {characters.map((char) => (
                    <Link to={`/characters/${char.id}`} key={char.id} className="glass-panel p-6 rounded-2xl hover:border-primary-500/50 hover:bg-stone-900/80 transition-all group relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-primary-900/30 rounded-full flex items-center justify-center text-primary-400 border border-primary-500/20 group-hover:scale-110 transition-transform">
                                <User size={24} />
                            </div>
                            <span className="bg-stone-950/50 text-stone-400 text-xs px-2 py-1 rounded font-mono">Niv {char.level}</span>
                        </div>
                        <h3 className="text-xl font-display font-bold text-stone-100 group-hover:text-primary-400 transition-colors mb-1">{char.name}</h3>
                        <p className="text-stone-500 text-sm mb-4">
                            {(char.race as any)?.name ?? 'Inconnu'} - {(char.profile as any)?.name ?? 'Aventurier'}
                        </p>
                        <div className="text-xs text-stone-600">
                            Modifié le {char.updatedAt ? new Date(char.updatedAt).toLocaleDateString() : 'Jamais'}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};
