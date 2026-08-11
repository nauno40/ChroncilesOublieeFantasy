import React from 'react';
import { formatNC } from '../../domain/creature';
import { ContentCard, CardMedia, CardStats } from '../common';

/**
 * Carte d'une créature — la même pour le bestiaire officiel et pour les créatures maison.
 *
 * Les deux listes s'écrivaient séparément : l'officielle avec une illustration, un badge
 * de niveau et un pied DEF / FOR / INIT ; la communautaire sans image, ses valeurs alignées
 * dans une phrase (« NC 3 · PV 20 · DEF 14 · INIT 12 »). Une même créature ne se lisait donc
 * pas de la même façon selon son origine, et le pied de statistiques du design system
 * (`CardStats`), écrit pour ce cas précis, n'était utilisé ni d'un côté ni de l'autre.
 *
 * Au passage, le badge officiel annonçait « NIV » : les règles disent **NC**, niveau de
 * créature (chapitre « Bestiaire »). C'est le mot que porte la carte partagée.
 */
export interface CarteCreature {
    nom: string;
    image?: string;
    /** Niveau de créature. Peut valoir « 1/2 » dans les règles, d'où le type ouvert. */
    nc?: number | string;
    pv?: number;
    def?: number;
    force?: number;
    init?: number;
    categorie?: string;
    description?: string;
}

interface CreatureCardProps {
    carte: CarteCreature;
    /** Destination de consultation. Sans elle, la carte n'est pas cliquable. */
    to?: string;
    /** Complément posé sous le titre (pastille de visibilité, auteur…). */
    entete?: React.ReactNode;
    /** Pied d'actions (créations communautaires uniquement). */
    footer?: React.ReactNode;
}

/** Une valeur absente s'affiche en tiret, jamais en case vide. */
const ou = (v: number | string | undefined): string =>
    v === undefined || v === null || v === '' ? '—' : String(v);

export const CreatureCard: React.FC<CreatureCardProps> = ({ carte, to, entete, footer }) => (
    <ContentCard
        to={to}
        className="h-full"
        media={<CardMedia src={carte.image} alt={carte.nom} />}
        footer={(
            <>
                <CardStats stats={[
                    { label: 'DEF', value: ou(carte.def) },
                    { label: 'FOR', value: ou(carte.force) },
                    { label: 'INIT', value: ou(carte.init) },
                ]} />
                {footer}
            </>
        )}
    >
        <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
                <h3 className="font-display font-bold text-lg text-stone-200 group-hover:text-primary-400 transition-colors truncate">{carte.nom}</h3>
                <div className="text-xs text-stone-400 flex flex-wrap gap-2 mt-1 items-center">
                    <span className="bg-stone-950/50 px-2 py-0.5 rounded text-primary-400 font-bold border border-primary-900/30">NC {formatNC(carte.nc)}</span>
                    {carte.categorie && <span className="opacity-80">{carte.categorie}</span>}
                    {entete}
                </div>
            </div>
            {carte.pv !== undefined && (
                <div className="text-right bg-stone-950/30 px-2 py-1 rounded border border-white/5 shrink-0">
                    <span className="text-[11px] text-stone-400 uppercase tracking-wider block">PV</span>
                    <span className="font-mono text-green-500/90 font-bold text-base">{carte.pv}</span>
                </div>
            )}
        </div>
        {carte.description && <p className="text-sm text-stone-400 mt-3 line-clamp-2">{carte.description}</p>}
    </ContentCard>
);
