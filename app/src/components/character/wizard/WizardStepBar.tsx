import React from 'react';
import clsx from 'clsx';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

interface Props {
    /** Libellés des étapes, dans l'ordre (1 par « chapitre ») — utilisés pour l'accessibilité. */
    labels: string[];
    /** Étape courante, 1-indexée. */
    current: number;
    /** Étape la plus avancée jamais atteinte : au-delà, verrouillé (grisé, non cliquable). */
    maxUnlocked: number;
    onJump: (step: number) => void;
}

/**
 * Barre de chapitres façon livre de règles (I, II, III…) : simple ligne de chiffres romains
 * avec un soulignement fin sur le chapitre courant — pas de pilules encadrées. Le titre du
 * chapitre est déjà affiché au-dessus (en-tête de `CharacterCreationWizard`) : cette barre
 * n'a plus qu'à porter la navigation, pas à répéter les libellés.
 */
export const WizardStepBar: React.FC<Props> = ({ labels, current, maxUnlocked, onJump }) => (
    <nav aria-label="Étapes de création" className="flex items-center justify-center gap-1 border-b border-stone-400/20 pb-px">
        {labels.map((label, i) => {
            const n = i + 1;
            const isActive = n === current;
            const isUnlocked = n <= maxUnlocked;
            return (
                <button
                    key={label}
                    type="button"
                    onClick={() => isUnlocked && onJump(n)}
                    disabled={!isUnlocked}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={label}
                    title={label}
                    className={clsx(
                        'px-2.5 sm:px-3.5 py-2 text-xs tracking-wider border-b-2 -mb-px transition-colors font-display',
                        isActive
                            ? 'border-primary-600 text-primary-700'
                            : isUnlocked
                                ? 'border-transparent text-stone-500 hover:text-stone-300 cursor-pointer'
                                : 'border-transparent text-stone-400/60 cursor-not-allowed',
                    )}
                >
                    {ROMAN[i] || String(n)}
                </button>
            );
        })}
    </nav>
);
