import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Étape courante d'un assistant pas-à-pas, portée par `?step=` dans l'URL plutôt qu'un
 * simple `useState` : le bouton retour du navigateur et un rafraîchissement de page
 * ramènent à la bonne étape. Ne persiste aucun brouillon (comme la fiche classique
 * aujourd'hui) — seul le numéro d'étape est dans l'URL.
 */
export const useWizardStep = (totalSteps: number) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const clamp = useCallback((n: number) => Math.min(Math.max(1, n), totalSteps), [totalSteps]);

    const raw = parseInt(searchParams.get('step') || '1', 10);
    const step = clamp(Number.isNaN(raw) ? 1 : raw);

    const goTo = useCallback((n: number) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('step', String(clamp(n)));
            return next;
        });
    }, [clamp, setSearchParams]);

    const goNext = useCallback(() => goTo(step + 1), [goTo, step]);
    const goBack = useCallback(() => goTo(step - 1), [goTo, step]);

    return { step, goNext, goBack, goTo };
};
