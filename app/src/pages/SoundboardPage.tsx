import React from 'react';
import { PageContainer, PageHeader, Soundboard } from '../components/common';

export const SoundboardPage: React.FC = () => {
    return (
        <PageContainer>
            <PageHeader
                title="Pistes Audio"
                subtitle="Ambiance sonore pour vos parties"
            />

            <div className="max-w-xl mx-auto h-[600px] glass-panel rounded-xl overflow-hidden shadow-2xl border-primary-500/20">
                <Soundboard
                    isOpen={true}
                    onClose={() => { }}
                />
            </div>
        </PageContainer>
    );
};
