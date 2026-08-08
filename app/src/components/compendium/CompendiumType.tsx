import React, { useState } from 'react';
import { PageContainer, PageShell, SourceTabs } from '../common';
import { HomebrewBrowser } from '../homebrew/HomebrewBrowser';
import { LEXIQUE } from '../../domain/lexique';
import { TYPES_COMPENDIUM } from '../../domain/compendium';

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

export const CompendiumType: React.FC<{ category: string | string[]; official: React.ReactNode }> = ({ category, official }) => {
    const [source, setSource] = useState<Source>('official');
    // Une seule source pour le nom, l'icône et la fonction de la page : la route ne les
    // réécrit plus, et l'entrée de navigation porte le même symbole.
    const meta = TYPES_COMPENDIUM[Array.isArray(category) ? category[0] : category];

    return (
        <div>
            <PageContainer>
                <PageShell
                    title={meta.titre}
                    subtitle={meta.fonction}
                    icon={meta.icone}
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
