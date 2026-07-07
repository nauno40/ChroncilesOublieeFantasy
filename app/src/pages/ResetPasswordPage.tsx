import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { AuthService } from '../services/AuthService';

export const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        if (password !== confirm) {
            setError('Les deux mots de passe ne correspondent pas.');
            return;
        }
        setIsLoading(true);
        try {
            await AuthService.resetPassword(token, password);
            setDone(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lien invalide ou expiré.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] -z-10 opacity-50"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => navigate('/login')}
                    className="mb-8 flex items-center gap-2 text-stone-500 hover:text-stone-200 transition-colors text-sm font-bold group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Retour à la connexion
                </button>

                <div className="glass-panel p-8 rounded-3xl border-white/10 shadow-2xl">
                    {done ? (
                        <div className="text-center space-y-4">
                            <div className="inline-flex size-14 bg-green-500/10 rounded-2xl items-center justify-center text-green-400 mb-2">
                                <CheckCircle2 size={28} />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-white">Mot de passe réinitialisé</h2>
                            <p className="text-stone-400 text-sm">Vous allez être redirigé vers la connexion…</p>
                        </div>
                    ) : !token ? (
                        <div className="text-center space-y-4">
                            <div className="inline-flex size-14 bg-red-500/10 rounded-2xl items-center justify-center text-red-400 mb-2">
                                <AlertCircle size={28} />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-white">Lien invalide</h2>
                            <p className="text-stone-400 text-sm">Ce lien de réinitialisation est incomplet ou a expiré.</p>
                            <Link to="/forgot-password" className="inline-block mt-2 font-bold text-primary-500 hover:text-primary-400">
                                Demander un nouveau lien
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-display font-bold text-white mb-2">Nouveau mot de passe</h2>
                                <p className="text-stone-400 text-sm">Choisissez un nouveau mot de passe pour votre compte.</p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Nouveau mot de passe</label>
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
                                            placeholder="Minimum 6 caractères"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Confirmer</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-600">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            className="block w-full bg-stone-900/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all sm:text-sm"
                                            placeholder="Retapez le mot de passe"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-bold text-stone-950 bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'Réinitialiser'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
