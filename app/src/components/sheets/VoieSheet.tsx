import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { VoieSheetVM } from './types';
import { DynamicDetailsRenderer } from '../common';

interface VoieSheetProps {
    vm: VoieSheetVM;
    backTo?: string;
    backLabel?: string;
    /** Bandeau propriétaire (contenu communautaire uniquement). */
    header?: React.ReactNode;
}

/** Nettoie les marqueurs hérités de l'import Drupal encore présents dans certains noms
 * de capacité (astérisques, suffixe "(L)"/" L") — repris tel quel de `VoieDetail.tsx`.
 * Purement cosmétique : le badge « Limité » reste piloté par le champ `limited`
 * (déjà calculé côté back à partir du même marqueur, cf. AppFixtures::loadPrestigeVoies).
 */
const cleanName = (name: string): string => {
    let displayName = name.replace(/\*/g, '');
    if (displayName.includes('(L)')) {
        displayName = displayName.replace('(L)', '').trim();
    } else if (displayName.endsWith(' L')) {
        displayName = displayName.slice(0, -2).trim();
    }
    return displayName;
};

export const VoieSheet: React.FC<VoieSheetProps> = ({ vm, backTo, backLabel, header }) => {
    const hasDetails = vm.details !== undefined;
    const hasCapabilities = (vm.capabilities?.length ?? 0) > 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            {backTo && (
                <Link to={backTo} className="inline-flex items-center text-stone-400 hover:text-primary-400 transition-colors group mb-2">
                    <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-display font-medium">{backLabel}</span>
                </Link>
            )}

            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border-primary-500/20 relative">
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>

                <div className="bg-stone-900/40 p-8 backdrop-blur-sm">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">
                        {vm.name}
                    </h1>
                    {header}
                </div>

                {(hasDetails || hasCapabilities) && (
                    <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-stone-900/30 to-transparent">
                        {hasDetails && (
                            <>
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
                                    Détails & Mécaniques
                                </h3>
                                <DynamicDetailsRenderer details={vm.details} className="mb-8" />
                            </>
                        )}

                        {hasCapabilities && (
                            <>
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
                                    Capacités ({vm.capabilities!.length})
                                </h3>

                                <div className="space-y-4">
                                    {vm.capabilities!.map(cap => (
                                        <div
                                            key={cap.id ?? `${cap.rank ?? ''}-${cap.name}`}
                                            className="glass-panel p-6 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all duration-300"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-3">
                                                    {cap.rank !== undefined && (
                                                        <span className="flex items-center justify-center size-6 rounded bg-primary-950 text-primary-500 text-xs font-bold border border-primary-500/20">
                                                            {cap.rank}
                                                        </span>
                                                    )}
                                                    <h4 className="text-lg font-bold text-stone-100 group-hover:text-primary-300 transition-colors">
                                                        {cleanName(cap.name)}
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
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
