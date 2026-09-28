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
 * Mise en page partagée par chaque étape de l'assistant : portrait/description à gauche
 * (optionnel), contenu de l'étape à droite, barre Précédent/Suivant en bas. Le thème reste
 * celui de l'appli (glass-panel, Cinzel/Inter, ambre) — l'habillage « parchemin » est un
 * chantier séparé, pas fait ici.
 */
export const WizardShellLayout: React.FC<Props> = ({ aside, children, onBack, onNext, nextLabel = 'Suivant', nextDisabled, nextLoading }) => (
    <div className="space-y-6">
        {aside ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5">{aside}</div>
                <div className="lg:col-span-7 space-y-4">{children}</div>
            </div>
        ) : (
            <div className="space-y-4">{children}</div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <button
                type="button"
                onClick={onBack}
                disabled={!onBack}
                className="flex items-center gap-2 px-4 py-3 rounded-xl glass-panel text-stone-300 hover:text-primary-300 hover:border-primary-500/30 transition-all border border-white/5 disabled:opacity-0 disabled:pointer-events-none"
            >
                <ArrowLeft size={16} /> Précédent
            </button>
            <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled || nextLoading}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-display font-black uppercase text-xs tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-primary-400/20"
            >
                {nextLoading ? <RefreshCw className="animate-spin" size={16} /> : null}
                {nextLabel}
                {!nextLoading && <ChevronRight size={16} />}
            </button>
        </div>
    </div>
);
