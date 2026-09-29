import { ThemeContext, type Theme } from './themeContextValue';
import React, { useState, useEffect, type ReactNode } from 'react';

const STORAGE_KEY = 'co_theme';

/**
 * Thème clair (« parchemin ») / sombre, pour toute l'appli — pas seulement l'assistant de
 * création, qui forçait jusqu'ici sa propre classe `.parchment`. Défaut `dark` : comportement
 * inchangé pour qui n'a jamais choisi.
 */
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'light' ? 'light' : 'dark';
    });

    // `.parchment` posée sur <html> plutôt que sur une div : cascade à toute l'appli
    // (et aux portails, <body> étant toujours descendant de <html>), en réutilisant tel
    // quel le bloc de variables CSS déjà construit pour l'assistant.
    useEffect(() => {
        document.documentElement.classList.toggle('parchment', theme === 'light');
    }, [theme]);

    const setTheme = (next: Theme) => {
        setThemeState(next);
        localStorage.setItem(STORAGE_KEY, next);
    };

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
