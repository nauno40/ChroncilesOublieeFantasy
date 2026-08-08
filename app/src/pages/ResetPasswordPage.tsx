import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { AuthShell } from '../components/auth/AuthShell';

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
        <AuthShell backTo="/login" backLabel="Retour à la connexion">
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
                                    <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Nouveau mot de passe</label>
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
                                            placeholder="Minimum 6 caractères"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Confirmer</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
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
        </AuthShell>
    );
};
