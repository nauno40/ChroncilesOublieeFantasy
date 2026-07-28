import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Coquille partagée des écrans d'authentification (connexion, inscription, mot de
 * passe oublié / réinitialisation). Centralise le décor de fond, le bouton retour et
 * la carte glass-panel pour garantir une identité visuelle unique — les pages ne
 * fournissent que le contenu de la carte. Cf. le design system (PageShell, etc.).
 */
interface AuthShellProps {
    backTo: string;
    backLabel: string;
    children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ backTo, backLabel, children }) => (
    <div className="min-h-screen bg-stone-950/60 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
        {/* Décor de fond (ambre du thème + rappel froid discret) */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-900/20 rounded-full blur-[100px] -z-10 opacity-60"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link
                to={backTo}
                className="mb-8 flex items-center gap-2 text-stone-500 hover:text-stone-200 transition-colors text-sm font-bold group w-fit"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                {backLabel}
            </Link>

            <div className="glass-panel p-8 rounded-3xl border-white/10 shadow-2xl">
                {children}
            </div>
        </div>
    </div>
);
