import React from 'react';
import { Save, ChevronLeft, RefreshCw, Trash2, Printer } from 'lucide-react';

interface Props {
    name: string;
    isNew: boolean;
    saving: boolean;
    onBack: () => void;
    onSave: () => void;
    onDelete: () => void;
    onPrint?: () => void;
}

export const CharacterToolbar: React.FC<Props> = ({ name, isNew, saving, onBack, onSave, onDelete, onPrint }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-stone-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-2xl">
            <div className="flex items-center gap-5">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-stone-500 hover:text-primary-400 hover:border-primary-500/30 transition-all group border border-white/5"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold font-display text-gradient-gold tracking-widest leading-none">
                        {isNew ? 'Nouveau Héros' : name}
                    </h1>
                    <p className="text-[10px] uppercase font-black text-stone-500 tracking-[0.3em] mt-2 ml-0.5 opacity-70">
                        Chroniqueur de Légendes
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-500 text-stone-950 font-display font-black uppercase text-xs tracking-widest px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary-900/20 active:scale-95 disabled:opacity-50 border border-primary-400/20"
                >
                    {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? 'Incantation...' : 'Enregistrer'}
                </button>
                {!isNew && onPrint && (
                    <button
                        onClick={onPrint}
                        className="p-3 glass-panel text-stone-600 hover:text-primary-400 hover:border-primary-500/30 transition-all rounded-xl border border-white/5"
                        title="Imprimer / PDF"
                    >
                        <Printer size={20} />
                    </button>
                )}
                {!isNew && (
                    <button
                        onClick={onDelete}
                        className="p-3 glass-panel text-stone-600 hover:text-red-500 hover:border-red-900/30 transition-all rounded-xl border border-white/5"
                        title="Supprimer"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};
