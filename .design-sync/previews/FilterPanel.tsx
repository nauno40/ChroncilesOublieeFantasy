import React from 'react';
import { FilterPanel } from 'app';

const Champ = ({ label, options }: { label: string; options: string[] }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold text-primary-500/70 uppercase tracking-wider">{label}</label>
        <select className="w-full bg-stone-950/40 border border-stone-800 rounded-lg px-3 py-2 text-stone-300">
            {options.map(o => <option key={o}>{o}</option>)}
        </select>
    </div>
);

/** Ouvert, avec des filtres actifs : l'action d'effacement apparaît. */
export const Ouvert = () => (
    <div className="w-[560px]">
        <FilterPanel defaultOpen hasActiveFilters onClearFilters={() => {}}>
            <div className="grid grid-cols-2 gap-4">
                <Champ label="Famille" options={['Toutes familles', 'Aigles', 'Bandits']} />
                <Champ label="Taille" options={['Toutes tailles', 'Moyenne', 'Énorme']} />
            </div>
        </FilterPanel>
    </div>
);

/** Replié : l'état de repos d'une page de liste. */
export const Replie = () => (
    <div className="w-[560px]">
        <FilterPanel>
            <div className="grid grid-cols-2 gap-4">
                <Champ label="Famille" options={['Toutes familles']} />
            </div>
        </FilterPanel>
    </div>
);
