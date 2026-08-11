import { createContext } from 'react';
import type { User } from '../services/AuthService';

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
    isLoading: boolean;
}

/**
 * Le contexte vit hors du fichier du fournisseur : un module qui exporte autre chose
 * qu'un composant casse le rafraîchissement à chaud de Vite (react-refresh).
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
