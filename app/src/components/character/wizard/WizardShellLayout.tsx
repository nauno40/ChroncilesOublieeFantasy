import React from 'react';
import { ArrowLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface Props {
    /** Colonne de gauche (portrait + description narrative) ; omise pour une étape pleine largeur. */
    aside?: React.ReactNode;
    /** Contenu de l'étape (occupe toute la largeur si `aside` est omis). */
    children: React.ReactNode;
    onBack?: () => void;
    onNext: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
    nextLoading?: boolean;
}

/**
 * Mise en page partagée par chaque étape de l'assistant : portrait/description au-dessus
 * (optionnel, pleine largeur — colonne unique resserrée, à la Lands of Evershade), contenu
 * de l'étape en dessous, barre Précédent/Suivant en bas.
 */
export const WizardShellLayout: React.FC<Props> = ({ aside, children, onBack, onNext, nextLabel = 'Suivant', nextDisabled, nextLoading }) => (
    <div className="space-y-6">
        {aside}
        <div className="space-y-4">{children}</div>

        <div className="flex justify-between items-center pt-5 border-t border-stone-400/20">
            <button
                type="button"
                onClick={onBack}
                disabled={!onBack}
                className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300 text-xs uppercase tracking-[0.15em] transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
                <ArrowLeft size={14} /> Précédent
            </button>
            <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled || nextLoading}
                className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-950 font-display text-sm tracking-wide px-5 py-2.5 rounded-full transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {nextLoading ? <RefreshCw className="animate-spin" size={16} /> : null}
                {nextLabel}
                {!nextLoading && <ChevronRight size={16} />}
            </button>
        </div>
    </div>
);
