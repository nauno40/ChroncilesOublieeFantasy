import React from 'react';
import { Music } from 'lucide-react';
import { PageContainer, PageShell, Soundboard } from '../components/common';

export const SoundboardPage: React.FC = () => {
    return (
        <PageContainer>
            <PageShell
                title="Pistes audio"
                subtitle="Ambiance sonore pour vos parties."
                icon={Music}
            />

            <div className="max-w-xl mx-auto glass-panel rounded-xl overflow-hidden shadow-2xl border-primary-500/20">
                <Soundboard
                    isOpen={true}
                    onClose={() => { }}
                />
            </div>
        </PageContainer>
    );
};
