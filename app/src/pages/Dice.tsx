import React from 'react';
import { PageContainer, PageHeader, DiceRoller } from '../components/common';

export const Dice: React.FC = () => {
    return (
        <PageContainer>
            <PageHeader
                title="Lanceur de dés"
                subtitle="Table de jeu virtuelle pour tous vos jets"
            />

            <div className="max-w-xl mx-auto h-[600px]">
                <DiceRoller
                    isOpen={true}
                    onClose={() => { }}
                    mode="inline"
                />
            </div>
        </PageContainer>
    );
};
