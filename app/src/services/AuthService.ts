import { ApiService } from './api';

const TOKEN_KEY = 'co_auth_token';
const USER_KEY = 'co_auth_user';

export interface User {
    id: number;
    email: string;
    roles: string[];
}

export const AuthService = {
    async login(email: string, password: string): Promise<string> {
        // Symfony LexikJWT login_check path
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/login_check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Identifiants invalides');
        }

        const { token } = await response.json();
        localStorage.setItem(TOKEN_KEY, token);

        // Optionally fetch user info if needed, or decode from JWT
        // For now, we'll just store the email in a dummy user object
        localStorage.setItem(USER_KEY, JSON.stringify({ email }));

        return token;
    },

    async register(email: string, password: string, pseudo: string): Promise<void> {
        // API Platform POST to /users
        await ApiService.post('users', { email, password, pseudo });
        // Automatically login after registration
        await this.login(email, password);
    },

    // Demande un e-mail de réinitialisation. Réponse volontairement neutre côté API
    // (ne révèle pas si l'adresse a un compte) ; on renvoie le message affiché.
    async forgotPassword(email: string): Promise<string> {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${base}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Une erreur est survenue.");
        return data.message || "Si un compte existe, un e-mail vient d'être envoyé.";
    },

    // Réinitialise le mot de passe à partir du jeton reçu par e-mail.
    async resetPassword(token: string, password: string): Promise<string> {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${base}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ token, password })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Lien invalide ou expiré.');
        return data.message || 'Mot de passe réinitialisé.';
    },

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/';
    },

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    getUser(): User | null {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        // Simple exp check if you want to be fancy, but browsers usually handle 401
        return true;
    }
};
