import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface LegalLayoutProps {
    title: string;
    children: React.ReactNode;
}

/**
 * Coquille commune aux trois pages légales (CGU, mentions légales, confidentialité).
 *
 * Le bandeau « brouillon » n'est pas cosmétique : ce texte a été rédigé par un agent, pas
 * par un juriste ni même relu par l'exploitant. Il reste affiché tant que l'exploitant ne
 * l'a pas explicitement validé (et ce commentaire retiré) — le retirer sans relecture
 * publierait un texte qui engage juridiquement le site sans que personne n'en ait vérifié
 * le contenu.
 */
export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, children }) => (
    <div className="min-h-screen bg-stone-950 text-stone-300">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
            <Link to="/" className="inline-flex items-center text-stone-400 hover:text-white transition-colors mb-8 text-sm">
                <ArrowLeft size={16} className="mr-2" /> Retour à l'accueil
            </Link>

            <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex gap-3 text-amber-200 text-sm">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <p>
                    <strong>Brouillon non validé.</strong> Ce texte a été rédigé automatiquement à partir du
                    fonctionnement réel du site, pour servir de point de départ — il n'a pas été relu par un
                    juriste ni validé par l'exploitant du site, et les champs marqués <code>[À COMPLÉTER]</code>{' '}
                    sont volontairement laissés vides. Il ne doit pas être considéré comme un texte légal
                    opposable tant qu'il n'a pas été révisé.
                </p>
            </div>

            <h1 className="text-3xl font-display font-bold text-white mb-8">{title}</h1>

            <div className="prose prose-invert prose-stone max-w-none space-y-6 [&_h2]:text-xl [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-primary-300 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:leading-relaxed [&_p]:text-stone-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_li]:text-stone-300">
                {children}
            </div>
        </div>
    </div>
);
