import React, { useRef, useState } from 'react';
import { clsx } from 'clsx';
import { StickyNote, Check } from 'lucide-react';
import { saveCampaign } from '../../services/campaignService';
import type { Campaign } from '../../types/campaign';

interface Props {
    campaign: Campaign;
}

/**
 * Bloc-notes rapide du MJ, extrait de CampaignDetail. Autosave débouncé (1 s) des notes
 * de la campagne ; auto-contenu, il n'a besoin que de la campagne courante.
 */
export const CampaignNotes: React.FC<Props> = ({ campaign }) => {
    const [notes, setNotes] = useState(campaign.notes || '');
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNotes(value);
        setIsSaving(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            await saveCampaign({ ...campaign, notes: value });
            setIsSaving(false);
        }, 1000);
    };

    return (
        <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2 mb-3">
                <StickyNote size={16} className="text-primary-400" /> Notes rapides
            </h3>
            <div className={clsx(
                "rounded-xl border h-[240px] flex flex-col bg-stone-900/40 transition-colors",
                isSaving ? "border-primary-500/40" : "border-white/10"
            )}>
                <textarea
                    className="w-full h-full bg-transparent p-4 resize-none focus:outline-none text-stone-300 placeholder-stone-600 font-mono text-sm leading-relaxed"
                    placeholder="Idées en vrac, PNJ improvisés, loot à distribuer..."
                    value={notes}
                    onChange={handleChange}
                />
                <div className="px-3 py-2 text-[10px] text-stone-600 border-t border-white/5 flex justify-between items-center bg-black/20 rounded-b-xl">
                    <span className="flex items-center gap-1">
                        {isSaving ? (
                            <>Enregistrement...</>
                        ) : (
                            <><Check size={10} className="text-green-500" /> Sauvegardé</>
                        )}
                    </span>
                    <span>{notes.length} caractères</span>
                </div>
            </div>
        </div>
    );
};
