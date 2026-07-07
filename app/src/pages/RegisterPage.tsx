import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await AuthService.register(email, password, pseudo);
            login(); // synchronise le contexte (isAuthenticated) avant la navigation SPA
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de l'inscription");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] -z-10 opacity-50"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => navigate('/')}
                    className="mb-8 flex items-center gap-2 text-stone-500 hover:text-stone-200 transition-colors text-sm font-bold group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Retour à l'accueil
                </button>

                <div className="glass-panel p-8 rounded-3xl border-white/10 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex size-12 bg-primary-600/20 rounded-xl items-center justify-center text-primary-500 mb-4">
                            <Sparkles size={24} />
                        </div>
                        <h2 className="text-3xl font-display font-bold text-white mb-2">Commencer l'Aventure</h2>
                        <p className="text-stone-400 text-sm">Créez votre compte en quelques secondes.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-600">
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
                            <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Pseudo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-600">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={pseudo}
                                    onChange={(e) => setPseudo(e.target.value)}
                                    className="block w-full bg-stone-900/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all sm:text-sm"
                                    placeholder="Aragorn"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Mot de passe</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-600">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full bg-stone-900/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all sm:text-sm"
                                    placeholder="Minimum 8 caractères"
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
                                        Rejoindre la Table
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-stone-400 text-sm">
                            Déjà un compte ?{' '}
                            <Link to="/login" className="font-bold text-primary-500 hover:text-primary-400">
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
