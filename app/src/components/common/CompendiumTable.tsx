import React from 'react';
import type { ColonneCompendium } from '../../domain/tablesCompendium';

/**
 * Table d'un type du compendium, partagée par la page officielle et la liste
 * communautaire — c'est ce partage qui garantit qu'une création communautaire a la même
 * tête que son équivalent officiel. Les deux listes portaient jusqu'ici deux tables
 * écrites séparément, qui avaient déjà divergé (intitulés, colonnes manquantes).
 *
 * Sur petit écran, la table devient une pile de cartes : la table officielle se contentait
 * d'un défilement horizontal, la communautaire avait ses propres cartes. Une seule
 * réponse ici, la même des deux côtés.
 */
export interface CompendiumTableProps<T> {
    colonnes: ColonneCompendium[];
    /** Intitulé de la colonne du nom (« Poison », « Piège »…). */
    labelNom: string;
    lignes: T[];
    cle: (ligne: T) => string | number;
    nom: (ligne: T) => string;
    /** Lecture d'une colonne. Par défaut, la propriété de même nom. */
    valeur?: (ligne: T, key: string) => unknown;
    /** Complément affiché à côté du nom, sur la même ligne (icône de visibilité). */
    sousNom?: (ligne: T) => React.ReactNode;
    /** Complément affiché SOUS le nom (description libre d'une entrée communautaire —
     * les entités officielles de ces types n'en ont pas). */
    detail?: (ligne: T) => React.ReactNode;
    onLigneClick?: (ligne: T) => void;
    /** Colonne terminale collée à droite (auteur, actions) — communautaire uniquement. */
    colonneFin?: { label: string; rendu: (ligne: T) => React.ReactNode };
}

/** Une valeur absente s'affiche en tiret cadratin, jamais en case vide silencieuse. */
const formate = (v: unknown, c?: ColonneCompendium): string => {
    // Les fixtures officielles notent parfois l'absence par un trait d'union isolé : sans
    // ça, une même table mélangeait des cases « - » et des cases « — ».
    if (v === undefined || v === null || v === '' || v === '-' || v === 0) return '—';
    if (Array.isArray(v)) return v.filter(Boolean).join(' · ') || '—';
    if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
    if (c?.plus && Number(v) > 0) return `+${v}`;
    return String(v);
};

/** Accents repris des tables officielles de l'équipement : le prix en or, la contrainte
 *  d'usage en ambre, la DEF d'une armure en couleur d'accent. */
const TONS: Record<NonNullable<ColonneCompendium['ton']>, string> = {
    prix: 'text-yellow-500/90',
    special: 'text-amber-400/80 italic text-xs',
    def: 'text-primary-400 font-bold',
};

const classesCellule = (c: ColonneCompendium): string => [
    'px-4 py-3 align-top',
    c.align === 'center' ? 'text-center' : c.align === 'right' ? 'text-right' : '',
    c.ton ? TONS[c.ton] : c.mono ? 'font-mono text-stone-300' : c.discret ? 'text-stone-400 text-xs' : 'text-stone-300',
    c.mono && c.ton ? 'font-mono' : '',
    c.wrap ? '' : 'whitespace-nowrap',
].filter(Boolean).join(' ');

export function CompendiumTable<T>({
    colonnes, labelNom, lignes, cle, nom, valeur, sousNom, detail, onLigneClick, colonneFin,
}: CompendiumTableProps<T>) {
    const lire = valeur ?? ((ligne: T, key: string) => (ligne as Record<string, unknown>)[key]);
    // Pas de largeur minimale imposée : la table s'ajuste à son conteneur, et les colonnes
    // de texte long se replient. Une largeur minimale forçait le défilement horizontal, et
    // la colonne d'actions collée à droite recouvrait alors la colonne « Spécial ».
    // `overflow-x-auto` reste le filet des écrans vraiment étroits.

    return (
        <>
            {/* Grand écran : la table complète. */}
            <div className="hidden md:block glass-panel rounded-2xl border border-white/5 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-primary-500/70 border-b border-white/10">
                            <th className="px-4 py-3 font-bold">{labelNom}</th>
                            {colonnes.map(c => (
                                <th key={c.key} className={`px-4 py-3 font-bold ${c.align === 'center' ? 'text-center' : c.align === 'right' ? 'text-right' : ''}`}>
                                    {c.label}
                                </th>
                            ))}
                            {colonneFin && (
                                <th className="px-4 py-3 font-bold text-right sticky right-0 bg-stone-950/95 backdrop-blur-sm">{colonneFin.label}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {lignes.map(ligne => (
                            <tr
                                key={cle(ligne)}
                                onClick={onLigneClick ? () => onLigneClick(ligne) : undefined}
                                className={`border-b border-white/5 last:border-0 transition-colors ${onLigneClick ? 'hover:bg-primary-500/5 cursor-pointer' : 'hover:bg-white/[0.02]'}`}
                            >
                                {/* La police d'affichage habille le NOM seul : posée sur la
                                    cellule, elle débordait sur le complément en dessous. */}
                                <td className="px-4 py-3 align-top">
                                    <div className="flex items-center gap-2 whitespace-nowrap font-display font-bold text-stone-100">{nom(ligne)}{sousNom?.(ligne)}</div>
                                    {detail?.(ligne)}
                                </td>
                                {colonnes.map(c => (
                                    <td key={c.key} className={classesCellule(c)}>
                                        {c.wrap
                                            ? <span className="line-clamp-2 leading-snug">{formate(lire(ligne, c.key), c)}</span>
                                            : formate(lire(ligne, c.key), c)}
                                    </td>
                                ))}
                                {colonneFin && (
                                    <td className="px-4 py-3 align-top text-right sticky right-0 bg-stone-950/95 backdrop-blur-sm">
                                        {colonneFin.rendu(ligne)}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Petit écran : une carte par ligne, mêmes colonnes en paires libellé/valeur. */}
            <div className="md:hidden space-y-3">
                {lignes.map(ligne => (
                    <div
                        key={cle(ligne)}
                        onClick={onLigneClick ? () => onLigneClick(ligne) : undefined}
                        className={`glass-panel rounded-xl p-4 ${onLigneClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="font-display font-bold text-stone-100 leading-tight flex items-center gap-2">
                                {nom(ligne)}{sousNom?.(ligne)}
                            </h3>
                            {colonneFin?.rendu(ligne)}
                        </div>
                        {detail?.(ligne)}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                            {colonnes.map(c => {
                                const v = formate(lire(ligne, c.key), c);
                                if (v === '—') return null;
                                return (
                                    <div key={c.key} className="min-w-0">
                                        <span className="text-stone-400 text-xs">{c.label} </span>
                                        <span className="text-stone-300 text-sm break-words">{v}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
