import React from 'react';
import { createPortal } from 'react-dom';
import { X, ScrollText } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

/**
 * Fiche de personnage en direct de l'assistant (contenu : `WizardSummaryDrawer`), présentée
 * en panneau coulissant déclenché par une icône plutôt qu'en colonne permanente — la mise
 * en page resserrée à colonne unique ne laisse plus de place pour un sidebar qui rivalise
 * en largeur avec l'étape en cours (cf. plan de refonte structurelle).
 *
 * Portée vers `document.body` : rendu en place (comme `EquipmentChoiceModal`), ce panneau
 * `fixed` se retrouvait descendant du `<main>` scrollable du layout applicatif, qui le
 * rognait à sa propre boîte au lieu du viewport — invisible pour un modal centré (jamais
 * remarqué), mais ici son en-tête (titre + bouton fermer, ancrés en haut) disparaissait
 * derrière la barre d'appli mobile. Pas besoin de reposer `.parchment` sur la racine portée
 * (contrairement à une version antérieure de ce fichier) : elle vit maintenant sur `<html>`
 * (`ThemeProvider`), qui reste un ancêtre de `document.body` — ses variables CSS cascadent
 * donc jusqu'ici sans qu'on ait à la reposer localement.
 */
export const WizardCharacterSheetOverlay: React.FC<Props> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-sm h-full bg-stone-950 border-l border-white/10 shadow-2xl overflow-y-auto p-5 space-y-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-primary-400 font-display font-bold uppercase text-xs tracking-wider">
                        <ScrollText size={16} /> Votre personnage
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body,
    );
};
