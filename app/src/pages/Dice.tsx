import React from 'react';
import { Dices } from 'lucide-react';
import { PageContainer, PageShell, DiceRoller } from '../components/common';

export const Dice: React.FC = () => {
    return (
        <PageContainer>
            <PageShell
                title="Lanceur de dés"
                subtitle="Table de jeu virtuelle pour tous vos jets."
                icon={Dices}
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
