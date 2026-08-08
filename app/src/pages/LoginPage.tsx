import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/auth/AuthShell';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await AuthService.login(email, password);
            login(); // synchronise le contexte (isAuthenticated) avant la navigation SPA
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Identifiants invalides');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell backTo="/" backLabel="Retour à l'accueil">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-white mb-2">Bon retour</h2>
                <p className="text-stone-400 text-sm">Préparez votre prochaine session.</p>
            </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full bg-stone-900/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all sm:text-sm"
                                    placeholder="maitre.du.jeu@exemple.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Mot de passe</label>
                                <Link to="/forgot-password" className="text-xs font-bold text-primary-500 hover:text-primary-400">Oublié ?</Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full bg-stone-900/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-bold text-stone-950 bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        <LogIn size={20} className="mr-2" />
                                        Se connecter
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-stone-400 text-sm">
                            Pas encore de compte ?{' '}
                            <Link to="/register" className="font-bold text-primary-500 hover:text-primary-400">
                                Créer une aventure gratuitement
                            </Link>
                        </p>
                    </div>
        </AuthShell>
    );
};
