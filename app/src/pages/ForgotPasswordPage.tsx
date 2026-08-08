import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, Loader2, MailCheck, Send } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { AuthShell } from '../components/auth/AuthShell';

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sentMessage, setSentMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const message = await AuthService.forgotPassword(email);
            setSentMessage(message);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell backTo="/login" backLabel="Retour à la connexion">
            {sentMessage ? (
                        <div className="text-center space-y-4">
                            <div className="inline-flex size-14 bg-green-500/10 rounded-2xl items-center justify-center text-green-400 mb-2">
                                <MailCheck size={28} />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-white">Vérifiez vos e-mails</h2>
                            <p className="text-stone-400 text-sm">{sentMessage}</p>
                            <Link to="/login" className="inline-block mt-2 font-bold text-primary-500 hover:text-primary-400">
                                Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-display font-bold text-white mb-2">Mot de passe oublié</h2>
                                <p className="text-stone-400 text-sm">Entrez votre adresse : nous vous enverrons un lien de réinitialisation.</p>
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

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-bold text-stone-950 bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : (<><Send size={20} className="mr-2" /> Envoyer le lien</>)}
                                </button>
                            </form>
                        </>
                    )}
        </AuthShell>
    );
};
