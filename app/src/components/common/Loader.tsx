import React from 'react';
import { Loader2 } from 'lucide-react';

/** Indicateur de chargement partagé : spinner + libellé, centré. Remplace les « Chargement… »
 *  bruts pour un état de chargement cohérent d'une page à l'autre. */
export const Loader: React.FC<{ label?: string; className?: string }> = ({ label = 'Chargement…', className }) => (
    <div className={`flex flex-col items-center justify-center gap-3 py-20 text-stone-400 ${className ?? ''}`}>
        <Loader2 className="animate-spin text-primary-500" size={32} />
        <span className="text-sm font-display tracking-wide">{label}</span>
    </div>
);
