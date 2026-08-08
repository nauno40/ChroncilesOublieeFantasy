import React from 'react';

export interface StatCarte {
    label: string;
    value: React.ReactNode;
}

/**
 * Pied de statistiques d'une carte : jusqu'à quatre valeurs, réparties à parts égales.
 *
 * Les créatures affichaient DEF / FOR / INIT en pied tandis que les peuples et les classes
 * ne montraient qu'un nom — rien ne disait au lecteur ce qu'il pouvait attendre d'une
 * carte. C'est la même carte, garnie différemment, et non trois cartes différentes.
 *
 * La grille est posée en style en ligne : le nombre de colonnes vient de la donnée, et un
 * nom de classe utilitaire construit à la volée ne serait pas compilé.
 */
export const CardStats: React.FC<{ stats: StatCarte[] }> = ({ stats }) => {
    if (stats.length === 0) return null;
    return (
        <div
            className="grid divide-x divide-white/5 text-center"
            style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
        >
            {stats.map(s => (
                <div key={s.label} className="py-2 px-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-stone-500 truncate">{s.label}</div>
                    <div className="font-mono font-bold text-stone-200 truncate">{s.value}</div>
                </div>
            ))}
        </div>
    );
};
