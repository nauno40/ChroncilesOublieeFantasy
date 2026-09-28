import React from 'react';
import { Check } from 'lucide-react';
import clsx from 'clsx';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

interface Props {
    /** Libellés des étapes, dans l'ordre (1 par « chapitre »). */
    labels: string[];
    /** Étape courante, 1-indexée. */
    current: number;
    /** Étape la plus avancée jamais atteinte : au-delà, verrouillé (grisé, non cliquable). */
    maxUnlocked: number;
    onJump: (step: number) => void;
}

/**
 * Barre de chapitres façon livre de règles (I, II, III…) pour l'assistant de création de
 * personnage. Vocabulaire visuel emprunté à `TabGroup` (état actif/inactif), mais piloté
 * par le parent (étape courante dans l'URL) plutôt que par un état interne : contrairement
 * à `TabGroup`, les étapes ne sont pas toutes équivalentes — seules celles déjà atteintes
 * sont cliquables.
 */
export const WizardStepBar: React.FC<Props> = ({ labels, current, maxUnlocked, onJump }) => (
    <nav aria-label="Étapes de création" className="glass-panel rounded-xl p-2 flex gap-1 overflow-x-auto">
        {labels.map((label, i) => {
            const n = i + 1;
            const isActive = n === current;
            const isUnlocked = n <= maxUnlocked;
            const isDone = n < current;
            return (
                <button
                    key={label}
                    type="button"
                    onClick={() => isUnlocked && onJump(n)}
                    disabled={!isUnlocked}
                    aria-current={isActive ? 'step' : undefined}
                    className={clsx(
                        'flex items-center gap-2 px-3 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all',
                        isActive
                            ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                            : isUnlocked
                                ? 'text-stone-300 hover:text-stone-100 hover:bg-stone-900/30 cursor-pointer border border-transparent'
                                : 'text-stone-600 cursor-not-allowed opacity-50 border border-transparent',
                    )}
                >
                    <span
                        className={clsx(
                            'flex items-center justify-center w-5 h-5 rounded-full border text-[10px] flex-none',
                            isActive ? 'border-primary-400 text-primary-300' : isUnlocked ? 'border-stone-500 text-stone-400' : 'border-stone-700 text-stone-600',
                        )}
                    >
                        {isDone ? <Check size={12} /> : (ROMAN[i] || String(n))}
                    </span>
                    {label}
                </button>
            );
        })}
    </nav>
);
