import React, { useState } from 'react';
import { Bestiary } from './Bestiary';
import { CustomMonsters } from './CustomMonsters';
import { PageContainer } from '../components/common';

/**
 * Page « Créatures » unifiée (compendium communautaire) : un filtre de source
 * réunit le bestiaire officiel (Bestiary) et les créatures maison / communautaires
 * (CustomMonsters, encapsulé). Phase 1 de la refonte compendium unifié.
 */
type Source = 'official' | 'community' | 'mine';

const SOURCES: { id: Source; label: string }[] = [
    { id: 'official', label: 'Officiel' },
    { id: 'community', label: 'Communauté' },
    { id: 'mine', label: 'Mes créations' },
];

export const Creatures: React.FC = () => {
    const [source, setSource] = useState<Source>('official');

    return (
        <div>
            <PageContainer>
                <div className="flex items-center flex-wrap gap-2">
                    <h1 className="text-3xl font-display font-bold text-white mr-2">Créatures</h1>
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
                <Bestiary />
            ) : (
                <CustomMonsters
                    embedded
                    tab={source === 'mine' ? 'mine' : 'community'}
                    onTabChange={t => setSource(t === 'mine' ? 'mine' : 'community')}
                />
            )}
        </div>
    );
};
