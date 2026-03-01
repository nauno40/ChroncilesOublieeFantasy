import React from 'react';


interface EquipmentChoice {
    item?: string;
    stats?: string;
    examples?: string;
    set?: EquipmentChoice[];
}

interface EquipmentChoiceModalProps {
    isOpen: boolean;
    title: string;
    choices: EquipmentChoice[];
    onSelect: (choice: EquipmentChoice) => void;
}

export const EquipmentChoiceModal: React.FC<EquipmentChoiceModalProps> = ({ isOpen, title, choices, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-display font-bold text-white mb-2">Choix d'équipement</h3>
                <p className="text-stone-400 mb-6 text-sm">{title}</p>

                <div className="space-y-3">
                    {choices.map((choice, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(choice)}
                            className="w-full text-left p-4 rounded-xl border border-stone-800 bg-stone-950/50 hover:bg-primary-900/20 hover:border-primary-500/50 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-primary-100 group-hover:text-primary-400 transition-colors">
                                    {choice.item || (choice.set ? choice.set.map(s => s.item).join(' + ') : 'Unknown Item')}
                                </span>
                                {choice.stats && (
                                    <span className="text-xs px-2 py-1 rounded bg-stone-900 border border-stone-800 text-stone-500 font-mono">
                                        {choice.stats}
                                    </span>
                                )}
                                {choice.set && (
                                    <span className="text-xs px-2 py-1 rounded bg-stone-900 border border-stone-800 text-stone-500 font-mono">
                                        {choice.set.map(s => s.stats).join(' + ')}
                                    </span>
                                )}
                            </div>
                            {choice.examples && (
                                <p className="text-xs text-stone-500 mt-1 italic">
                                    Ex: {choice.examples}
                                </p>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
