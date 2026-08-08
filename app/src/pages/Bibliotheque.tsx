import React, { useState } from 'react';
import { PageContainer, PageHeader } from '../components/common';
import { HomebrewBrowser } from '../components/homebrew/HomebrewBrowser';
import { LEXIQUE } from '../domain/lexique';

/**
 * Bibliothèque : vue « toutes catégories » du contenu homebrew. Le cœur (liste + CRUD)
 * vit dans HomebrewBrowser, réutilisé aussi par les pages de type du compendium.
 */
export const Bibliotheque: React.FC = () => {
    const [tab, setTab] = useState<'mine' | 'community'>('mine');
    return (
        <PageContainer>
            <PageHeader
                title="Bibliothèque"
                subtitle="Créez vos contenus (sorts, races, objets…) et partagez-les à la communauté"
            />
            <div className="flex gap-2 mb-4">
                {(['mine', 'community'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40' : 'bg-stone-900/40 text-stone-400 border border-white/5 hover:text-stone-300'}`}
                    >
                        {t === 'mine' ? LEXIQUE.sourceMiennes : LEXIQUE.sourceCommunaute}
                    </button>
                ))}
            </div>
            <HomebrewBrowser tab={tab} onTabChange={setTab} retourLabel="Retour à la Bibliothèque" />
        </PageContainer>
    );
};
