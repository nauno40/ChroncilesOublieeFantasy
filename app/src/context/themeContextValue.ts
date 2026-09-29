import { createContext } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

/**
 * Le contexte vit hors du fichier du fournisseur : un module qui exporte autre chose
 * qu'un composant casse le rafraîchissement à chaud de Vite (react-refresh).
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
