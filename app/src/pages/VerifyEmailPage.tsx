import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { AuthShell } from '../components/auth/AuthShell';

type Status = 'pending' | 'success' | 'error';

export const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [status, setStatus] = useState<Status>('pending');
    const [message, setMessage] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }
        AuthService.verifyEmail(token)
            .then((msg) => { setMessage(msg); setStatus('success'); })
            .catch((err) => { setMessage(err instanceof Error ? err.message : 'Lien invalide ou expiré.'); setStatus('error'); });
    }, [token]);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsResending(true);
        setResendMessage(null);
        try {
            const msg = await AuthService.resendVerification(email);
            setResendMessage(msg);
        } catch (err) {
            setResendMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <AuthShell backTo="/login" backLabel="Retour à la connexion">
            {status === 'pending' && (
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin mx-auto text-primary-500" size={32} />
                    <p className="text-stone-400 text-sm">Confirmation de votre adresse e-mail…</p>
                </div>
            )}

            {status === 'success' && (
                <div className="text-center space-y-4">
                    <div className="inline-flex size-14 bg-green-500/10 rounded-2xl items-center justify-center text-green-400 mb-2">
                        <CheckCircle2 size={28} />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">Adresse confirmée</h2>
                    <p className="text-stone-400 text-sm">{message}</p>
                    <Link to="/login" className="inline-block mt-2 font-bold text-primary-500 hover:text-primary-400">
                        Se connecter
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div className="text-center space-y-4">
                    <div className="inline-flex size-14 bg-red-500/10 rounded-2xl items-center justify-center text-red-400 mb-2">
                        <AlertCircle size={28} />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">Lien invalide</h2>
                    <p className="text-stone-400 text-sm">{message || 'Ce lien de confirmation est incomplet ou a expiré.'}</p>

                    {resendMessage ? (
                        <div className="flex items-center justify-center gap-2 text-green-400 text-sm mt-2">
                            <MailCheck size={16} />
                            <span>{resendMessage}</span>
                        </div>
                    ) : (
                        <form onSubmit={handleResend} className="flex flex-col gap-3 items-center mt-4">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Votre adresse e-mail"
                                className="w-full bg-stone-900/50 border border-white/5 rounded-2xl py-3 px-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600/50 transition-all sm:text-sm"
                            />
                            <button
                                type="submit"
                                disabled={isResending}
                                className="font-bold text-primary-500 hover:text-primary-400 disabled:opacity-50"
                            >
                                {isResending ? 'Envoi…' : 'Renvoyer le lien de confirmation'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </AuthShell>
    );
};
