import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import type { Character } from '../types/character';
import { Plus, User, Swords } from 'lucide-react';
import { Loader } from '../components/common';

export const CharacterList: React.FC = () => {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ApiService.getAll<Character>('characters')
            .then(setCharacters)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader />;

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
                    <div key={char.id} className="glass-panel rounded-2xl hover:border-primary-500/50 transition-all group relative overflow-hidden flex flex-col">
                        <Link to={`/characters/${char.id}`} className="block p-6 pb-4 hover:bg-stone-900/40 transition-all flex-1">
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
                        {/* Entrée directe vers le mode session (mobile) */}
                        <Link
                            to={`/play/${char.id}`}
                            className="flex items-center justify-center gap-2 border-t border-white/5 bg-green-800/20 hover:bg-green-700/40 text-green-300 font-display font-bold uppercase text-xs tracking-widest py-3 transition-all active:scale-[0.99]"
                        >
                            <Swords size={16} /> Jouer
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};
