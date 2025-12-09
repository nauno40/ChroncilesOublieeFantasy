import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

interface GlobalNotesProps {
    isOpen: boolean;
    onClose: () => void;
}

const STORAGE_KEY = 'co_global_notes';

export const GlobalNotes: React.FC<GlobalNotesProps> = ({ isOpen }) => {
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
        <div className="flex flex-col h-full w-full">
            {/* Content */}
            <div className="flex-1 relative">
                <textarea
                    className="w-full h-full bg-transparent p-4 resize-none focus:outline-none text-stone-300 placeholder-stone-600 font-handwriting text-sm leading-relaxed scrollbar-thin scrollbar-thumb-stone-800"
                    placeholder="Notes accessibles partout..."
                    value={notes}
                    onChange={handleNotesChange}
                    autoFocus
                />
            </div>

            {/* Footer */}
            <div className="p-2 text-[10px] text-stone-500 border-t border-white/10 bg-black/20 flex justify-between items-center select-none">
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
