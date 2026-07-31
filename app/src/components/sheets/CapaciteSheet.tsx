import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { CapaciteSheetVM } from './types';
import { Badge, DynamicDetailsRenderer } from '../common';

interface CapaciteSheetProps {
    vm: CapaciteSheetVM;
    backTo?: string;
    backLabel?: string;
    /** Bandeau propriétaire (contenu communautaire uniquement). */
    header?: React.ReactNode;
}

/** Nettoie les marqueurs hérités de l'import Drupal encore présents dans certains noms
 * de capacité (astérisques, suffixe "(L)"/" L") — repris tel quel de `CapaciteDetail.tsx`.
 * Purement cosmétique : le badge « Limité » reste piloté par le champ `limited`.
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

export const CapaciteSheet: React.FC<CapaciteSheetProps> = ({ vm, backTo, backLabel, header }) => {
    // Section "Description" : l'officiel l'affiche toujours (le champ est requis côté
    // compendium), mais une entrée communautaire sans aucun de ces champs ne doit pas
    // laisser un titre orphelin.
    const hasDescriptionSection = vm.description !== undefined
        || vm.details !== undefined
        || (vm.effect?.length ?? 0) > 0
        || (vm.detailLines?.length ?? 0) > 0;

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
                        {cleanName(vm.name)}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        {vm.limited && (
                            <Badge variant="danger" size="lg">
                                Limité
                            </Badge>
                        )}
                        {vm.active && (
                            <Badge variant="warning" size="lg">
                                Actif
                            </Badge>
                        )}
                        {vm.rank !== undefined && (
                            <Badge variant="primary" size="lg">
                                Rang {vm.rank}
                            </Badge>
                        )}
                        {vm.voieName && (
                            vm.voieId ? (
                                <Link to={`/voies/${vm.voieId}`} className="inline-block">
                                    <Badge variant="secondary" size="lg" className="hover:border-primary-500/30 hover:text-primary-300 transition-all">
                                        {vm.voieName}
                                    </Badge>
                                </Link>
                            ) : (
                                <Badge variant="secondary" size="lg">
                                    {vm.voieName}
                                </Badge>
                            )
                        )}
                    </div>
                    {header}
                </div>

                {hasDescriptionSection && (
                    <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-stone-900/30 to-transparent">
                        <div>
                            <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Description
                            </h3>
                            {vm.description && (
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-stone-300 leading-relaxed whitespace-pre-line">
                                        {vm.description}
                                    </p>
                                </div>
                            )}

                            {vm.details && <DynamicDetailsRenderer details={vm.details} />}

                            {vm.effect && vm.effect.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-2">Effet</h4>
                                    <ul className="list-disc list-inside text-stone-300 space-y-1 leading-relaxed">
                                        {vm.effect.map((line, i) => <li key={i}>{line}</li>)}
                                    </ul>
                                </div>
                            )}

                            {vm.detailLines && vm.detailLines.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-2">Détails</h4>
                                    <ul className="list-disc list-inside text-stone-300 space-y-1 leading-relaxed">
                                        {vm.detailLines.map((line, i) => <li key={i}>{line}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
