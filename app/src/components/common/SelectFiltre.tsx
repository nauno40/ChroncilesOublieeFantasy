import React from 'react';

/**
 * Sélecteur d'un filtre de liste : un intitulé au-dessus, un `select` en dessous.
 *
 * Chaque page officielle réécrivait ce couple avec les mêmes classes recopiées — et la
 * liste communautaire, qui n'avait aucun filtre, n'avait rien à recopier. Les deux passent
 * désormais par ce composant : même hauteur, mêmes marges, même focus.
 */
export interface OptionFiltre {
    value: string;
    label: string;
}

interface SelectFiltreProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: OptionFiltre[];
    /** Option de tête, qui ne filtre rien (« Tous les rangs »). */
    toutLabel?: string;
}

export const SelectFiltre: React.FC<SelectFiltreProps> = ({ label, value, onChange, options, toutLabel = 'Tous' }) => (
    <div>
        <label className="block text-sm font-medium text-stone-300 mb-2">{label}</label>
        <select
            aria-label={label}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-200 focus:border-primary-500 focus:outline-none transition-colors"
        >
            <option value="all">{toutLabel}</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

/** Grille des filtres, sous la barre de recherche. Une seule disposition, deux sources. */
export const GrilleFiltres: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
);
