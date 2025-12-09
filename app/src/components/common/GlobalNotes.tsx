import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface GlobalNotesProps {
    isOpen: boolean;
    onClose: () => void;
}

const STORAGE_KEY = 'co_global_notes';

export const GlobalNotes: React.FC<GlobalNotesProps> = ({ isOpen, onClose }) => {
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial load
    useEffect(() => {
        const savedNotes = localStorage.getItem(STORAGE_KEY);
        if (savedNotes) {
            setNotes(savedNotes);
        }
    }, []);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setNotes(newValue);
        setIsSaving(true);

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, newValue);
            setIsSaving(false);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-4 md:right-24 w-80 md:w-96 glass-panel rounded-2xl shadow-2xl z-50 flex flex-col h-[400px] border-primary-500/30 animate-in slide-in-from-bottom-10 fade-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/20 rounded-t-2xl">
                <h3 className="font-display font-bold text-lg text-primary-400 flex items-center gap-2">
                    Notes Globales
                </h3>
                <button
                    onClick={onClose}
                    className="text-stone-400 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 relative">
                <textarea
                    className="w-full h-full bg-transparent p-4 resize-none focus:outline-none text-stone-300 placeholder-stone-600 font-handwriting text-sm leading-relaxed"
                    placeholder="Notes accessibles partout..."
                    value={notes}
                    onChange={handleNotesChange}
                    autoFocus
                />
            </div>

            {/* Footer */}
            <div className="p-2 text-[10px] text-stone-500 border-t border-white/10 bg-black/20 rounded-b-2xl flex justify-between items-center">
                <span className="flex items-center gap-1 min-w-[80px]">
                    {isSaving ? (
                        <>Enregistrement...</>
                    ) : (
                        <><Check size={10} className="text-green-500" /> Sauvegardé</>
                    )}
                </span>
                <span>{notes.length} car.</span>
            </div>
        </div>
    );
};
