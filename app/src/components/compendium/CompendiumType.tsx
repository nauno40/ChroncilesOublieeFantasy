import React, { useState } from 'react';
import { PageContainer, PageShell, SourceTabs } from '../common';
import { HomebrewBrowser } from '../homebrew/HomebrewBrowser';
import { LEXIQUE } from '../../domain/lexique';

/**
 * Page de type du compendium unifié. Porte l'unique en-tête (titre + filtre source
 * Officiel / Communauté / Mes créations) via PageShell ; la page officielle (rendue
 * sans son propre titre) ou HomebrewBrowser s'affiche dessous.
 */
type Source = 'official' | 'community' | 'mine';

const SOURCES: { id: Source; label: string }[] = [
    { id: 'official', label: LEXIQUE.sourceOfficiel },
    { id: 'community', label: LEXIQUE.sourceCommunaute },
    { id: 'mine', label: LEXIQUE.sourceMiennes },
];

export const CompendiumType: React.FC<{ title: string; category: string | string[]; official: React.ReactNode }> = ({ title, category, official }) => {
    const [source, setSource] = useState<Source>('official');

    return (
        <div>
            <PageContainer>
                <PageShell
                    title={title}
                    tabs={<SourceTabs tabs={SOURCES} value={source} onChange={setSource} />}
                    className="mb-0"
                />
            </PageContainer>

            {/* La page officielle apporte son propre PageContainer ; on n'imbrique pas. */}
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
