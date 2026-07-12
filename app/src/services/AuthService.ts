import { ApiService } from './api';

const TOKEN_KEY = 'co_auth_token';
const USER_KEY = 'co_auth_user';

export interface User {
    id: number;
    email: string;
    roles: string[];
}

// Décode le payload d'un JWT (base64url) : LexikJWT y expose `username` (e-mail) et
// `roles`, et notre JwtCreatedSubscriber y ajoute `id`.
function decodeUserFromToken(token: string): User | null {
    try {
        const part = token.split('.')[1];
        if (!part) return null;
        const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
        const p = JSON.parse(json);
        return { id: p.id ?? 0, email: p.username ?? p.email ?? '', roles: p.roles ?? [] };
    } catch {
        return null;
    }
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

        // On peuple id/email/roles depuis le JWT (payload enrichi côté API).
        const decoded = decodeUserFromToken(token) ?? { id: 0, email, roles: [] };
        if (!decoded.email) decoded.email = email;
        localStorage.setItem(USER_KEY, JSON.stringify(decoded));

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
        const raw = localStorage.getItem(USER_KEY);
        const stored: Partial<User> | null = raw ? JSON.parse(raw) : null;
        // Auto-réparation des sessions antérieures stockées sans id : on redécode le jeton.
        if (stored && !stored.id) {
            const token = this.getToken();
            const decoded = token ? decodeUserFromToken(token) : null;
            if (decoded?.id) {
                const merged = { ...decoded, email: stored.email || decoded.email };
                localStorage.setItem(USER_KEY, JSON.stringify(merged));
                return merged;
            }
        }
        return stored as User | null;
    },

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        // Simple exp check if you want to be fancy, but browsers usually handle 401
        return true;
    }
};
