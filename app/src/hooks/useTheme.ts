import { useContext } from 'react';
import { ThemeContext } from '../context/themeContextValue';

/**
 * Accès au contexte de thème (clair/sombre).
 *
 * Vit hors de `ThemeContext.tsx` : un module qui exporte autre chose qu'un composant casse
 * le rafraîchissement à chaud de Vite (react-refresh).
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
