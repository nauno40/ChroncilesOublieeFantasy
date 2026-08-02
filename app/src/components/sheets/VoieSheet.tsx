import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { VoieSheetVM } from './types';
import { DynamicDetailsRenderer } from '../common';
import { CapabilityCard } from './CapabilityCard';

interface VoieSheetProps {
    vm: VoieSheetVM;
    backTo?: string;
    backLabel?: string;
    /** Bandeau propriétaire (contenu communautaire uniquement). */
    header?: React.ReactNode;
}

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
                    {(vm.category || vm.maxRank !== undefined) && (
                        <div className="flex items-center gap-3 mb-1">
                            {vm.category && (
                                <span className="text-[11px] uppercase font-bold tracking-widest text-primary-400/90 border border-primary-500/40 rounded px-2 py-0.5">
                                    {vm.category}
                                </span>
                            )}
                            {vm.maxRank !== undefined && (
                                <span className="text-[11px] text-stone-500 uppercase tracking-widest">
                                    Rang max. {vm.maxRank}
                                </span>
                            )}
                        </div>
                    )}
                    {vm.description && (
                        <p className="text-stone-300 leading-relaxed mt-4">{vm.description}</p>
                    )}
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
                                        <CapabilityCard key={cap.id ?? `${cap.rank ?? ''}-${cap.name}`} cap={cap} />
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
