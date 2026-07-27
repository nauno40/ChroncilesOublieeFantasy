import React, { useState } from 'react';
import { PageContainer } from '../common';
import { HomebrewBrowser } from '../homebrew/HomebrewBrowser';

/**
 * Page de type du compendium unifié : un filtre source (Officiel / Communauté /
 * Mes créations) au-dessus. « Officiel » affiche la page compendium existante ;
 * les deux autres affichent le contenu homebrew de la catégorie (HomebrewBrowser).
 */
type Source = 'official' | 'community' | 'mine';

const SOURCES: { id: Source; label: string }[] = [
    { id: 'official', label: 'Officiel' },
    { id: 'community', label: 'Communauté' },
    { id: 'mine', label: 'Mes créations' },
];

export const CompendiumType: React.FC<{ category: string; official: React.ReactNode }> = ({ category, official }) => {
    const [source, setSource] = useState<Source>('official');

    return (
        <div>
            <PageContainer>
                <div className="flex flex-wrap gap-2">
                    {SOURCES.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSource(s.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${source === s.id ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40' : 'bg-stone-900/40 text-stone-500 border border-white/5 hover:text-stone-300'}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </PageContainer>

            {source === 'official' ? (
                official
            ) : (
                <PageContainer>
                    <HomebrewBrowser
                        category={category}
                        tab={source === 'mine' ? 'mine' : 'community'}
                        onTabChange={t => setSource(t === 'mine' ? 'mine' : 'community')}
                    />
                </PageContainer>
            )}
        </div>
    );
};
