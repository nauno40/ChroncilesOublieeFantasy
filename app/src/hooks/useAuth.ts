import { useContext } from 'react';
import { AuthContext } from '../context/authContextValue';

/**
 * Accès au contexte d'authentification.
 *
 * Vit hors de `AuthContext.tsx` : un module qui exporte autre chose qu'un composant casse
 * le rafraîchissement à chaud de Vite (react-refresh), ce qui obligeait à recharger la page
 * entière à chaque modification du contexte.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
