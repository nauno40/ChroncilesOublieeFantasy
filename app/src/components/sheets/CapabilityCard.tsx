import React from 'react';
import type { SheetCapabilityRef } from './types';
import { DynamicDetailsRenderer } from '../common';
import { cleanCapabilityName } from './cleanCapabilityName';

interface CapabilityCardProps {
    cap: SheetCapabilityRef;
}

/**
 * Carte de capacité unifiée, consommée par `RaceSheet`, `ProfileSheet` et `VoieSheet`
 * — les trois feuilles affichaient jusqu'ici une capacité chacune à sa façon (voir
 * l'historique dans task-3-report.md). Reprend telle quelle la structure la plus
 * complète des trois (celle de `VoieSheet`) : badges « Limité »/« Sort »/« Actif»,
 * pastille de rang (le rang 0 est une valeur légitime, distincte de l'absence de
 * rang), description et détails libres — chacun conditionné par la seule présence de
 * sa donnée, jamais par sa valeur.
 */
export const CapabilityCard: React.FC<CapabilityCardProps> = ({ cap }) => (
    // `group` rend vivant le `group-hover:` porté par le titre plus bas : il était inerte
    // dans le rendu d'origine de `VoieSheet`, alors qu'il fonctionnait sur les fiches de
    // peuple et de classe, dont le conteneur portait cette classe.
    <div className="group glass-panel p-6 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
                {cap.rank !== undefined && (
                    <span className="flex items-center justify-center size-6 rounded bg-primary-950 text-primary-500 text-xs font-bold border border-primary-500/20">
                        {cap.rank}
                    </span>
                )}
                <h4 className="text-lg font-bold text-stone-100 group-hover:text-primary-300 transition-colors">
                    {cleanCapabilityName(cap.name)}
                </h4>
                <div className="flex gap-2 flex-wrap">
                    {cap.limited && (
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-red-900/20 text-red-400 rounded border border-red-500/20">
                            Limité
                        </span>
                    )}
                    {cap.isSpell && (
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-900/20 text-blue-400 rounded border border-blue-500/20">
                            Sort
                        </span>
                    )}
                    {cap.active && (
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-900/20 text-amber-400 rounded border border-amber-500/20">
                            Actif
                        </span>
                    )}
                </div>
            </div>
            <div className="h-[1px] flex-1 bg-white/5 mx-4 hidden md:block"></div>
        </div>
        {cap.description && (
            <p className="text-stone-300 leading-relaxed whitespace-pre-line pl-9">
                {cap.description}
            </p>
        )}
        {cap.details && (
            <DynamicDetailsRenderer details={cap.details} className="pl-9 mt-4" />
        )}
    </div>
);
