import React, { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { ReportService, type ReportTargetType } from '../../services/reportService';

interface ReportContentModalProps {
    isOpen: boolean;
    targetType: ReportTargetType;
    targetId: number;
    onClose: () => void;
}

/**
 * Signalement d'un contenu communautaire (bibliothèque, monstre maison) à destination des
 * administrateurs. Motif obligatoire : un signalement sans raison n'aide personne à
 * l'arbitrer (cf. `ContentReport.reason`, non-blank côté backend).
 */
export const ReportContentModal: React.FC<ReportContentModalProps> = ({ isOpen, targetType, targetId, onClose }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    if (!isOpen) return null;

    const close = () => {
        setReason('');
        setError(null);
        setDone(false);
        onClose();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await ReportService.report(targetType, targetId, reason.trim());
            setDone(true);
        } catch {
            setError("Le signalement n'a pas pu être envoyé. Réessayez plus tard.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={close}>
            <div
                className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {done ? (
                    <div className="text-center space-y-3">
                        <div className="inline-flex size-12 bg-green-500/10 rounded-xl items-center justify-center text-green-400">
                            <Flag size={22} />
                        </div>
                        <h3 className="text-lg font-display font-bold text-white">Signalement envoyé</h3>
                        <p className="text-stone-400 text-sm">Un administrateur va l'examiner.</p>
                        <button
                            onClick={close}
                            className="mt-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm"
                        >
                            Fermer
                        </button>
                    </div>
                ) : (
                    <>
                        <h3 className="text-lg font-display font-bold text-white mb-1 flex items-center gap-2">
                            <Flag size={18} className="text-red-400" /> Signaler ce contenu
                        </h3>
                        <p className="text-stone-400 mb-4 text-sm">Expliquez ce qui pose problème.</p>

                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

                        <form onSubmit={submit} className="space-y-4">
                            <textarea
                                required
                                autoFocus
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                placeholder="Contenu hors charte, statistiques copiées, propos injurieux…"
                                className="w-full bg-stone-950/50 border border-stone-700 rounded-xl p-3 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 text-sm resize-none"
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={close} className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 font-bold text-sm">
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !reason.trim()}
                                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                                    Signaler
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
