import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { RaceSheetVM } from './types';
import { DynamicDetailsRenderer } from '../common';
import { CapabilityCard } from './CapabilityCard';
import { CapabilityRefs } from '../creature/CapabilityRefs';
import type { ReferencesDeclaration } from '../homebrew/HomebrewFields';
import { imagePlaceholder, onImageError } from '../common/imagePlaceholder';


interface RaceSheetProps {
    vm: RaceSheetVM;
    backTo?: string;
    backLabel?: string;
    /** Bandeau propriétaire (contenu communautaire uniquement). */
    header?: React.ReactNode;
    /** Entités nécessaires à la résolution des liens de déclaration. Absente, aucune
     *  pastille : une feuille est pure et ne charge rien elle-même. */
    references?: ReferencesDeclaration;
}

/** Formule lisible d'une plage partiellement connue (taille, poids) : les deux bornes
 * si les deux existent, la borne seule sinon. Les 8 races officielles ont toujours les
 * quatre valeurs (min+max de taille et de poids), mais côté communautaire ce sont quatre
 * champs indépendants du formulaire — une entrée à moitié remplie est le cas nominal, pas
 * une exception à masquer.
 */
const rangeLabel = (min: number | undefined, max: number | undefined, fmt: (n: number) => string): string | undefined => {
    if (min !== undefined && max !== undefined) return `${fmt(min)} - ${fmt(max)}`;
    if (min !== undefined) return `à partir de ${fmt(min)}`;
    if (max !== undefined) return `jusqu'à ${fmt(max)}`;
    return undefined;
};

export const RaceSheet: React.FC<RaceSheetProps> = ({ vm, backTo, backLabel, header, references }) => {
    const [activeTab, setActiveTab] = useState<'lore' | 'rules'>('lore');
    const image = vm.image ?? imagePlaceholder(vm.name, 'portrait');
    const heightLabel = rangeLabel(vm.minHeight, vm.maxHeight, n => `${n / 100}m`);
    const weightLabel = rangeLabel(vm.minWeight, vm.maxWeight, n => `${n} kg`);
    const hasVitals = [vm.startingAge, vm.lifeExpectancy, vm.minHeight, vm.maxHeight, vm.minWeight, vm.maxWeight, vm.speed].some(v => v !== undefined);
    const hasLore = [vm.description, vm.detailedDescription, vm.physicalTraits, vm.publicPerception, vm.roleplay, vm.typicalNames].some(v => v !== undefined);
    const hasRules = vm.abilities !== undefined || vm.modifiers !== undefined || (vm.voies?.length ?? 0) > 0;

    return (
        <div className="min-h-screen pb-12 relative">
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
                <img src={image} alt={vm.name} onError={onImageError(vm.name, 'portrait')} className="w-full h-full object-cover object-top opacity-30" />
            </div>

            <div className="container mx-auto px-4 relative z-10 pt-6">
                <div className="mb-8">
                    {backTo && (
                        <Link to={backTo} className="inline-flex items-center text-stone-400 hover:text-white transition-colors group mb-6">
                            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-display font-medium tracking-wide text-sm uppercase">{backLabel}</span>
                        </Link>
                    )}
                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white drop-shadow-xl">{vm.name}</h1>
                    {header}
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                            <div className="aspect-[3/4] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-60 z-10"></div>
                                <img src={image} alt={vm.name} onError={onImageError(vm.name, 'portrait')} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                            </div>
                        </div>

                        {hasVitals && (
                            <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl">
                                <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-stone-700"></span>
                                    Statistiques Vitales
                                </h3>
                                <div className="space-y-4">
                                    {vm.startingAge !== undefined && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <span className="text-stone-400">Âge de départ</span>
                                            <span className="font-display text-xl text-primary-200">{vm.startingAge} ans</span>
                                        </div>
                                    )}
                                    {vm.lifeExpectancy !== undefined && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <span className="text-stone-400">Espérance de vie</span>
                                            <span className="font-display text-xl text-primary-200">{vm.lifeExpectancy} ans</span>
                                        </div>
                                    )}
                                    {heightLabel && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <span className="text-stone-400">Taille</span>
                                            <span className="font-display text-xl text-primary-200">{heightLabel}</span>
                                        </div>
                                    )}
                                    {weightLabel && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <span className="text-stone-400">Poids</span>
                                            <span className="font-display text-xl text-primary-200">{weightLabel}</span>
                                        </div>
                                    )}
                                    {vm.speed !== undefined && (
                                        <div className="flex justify-between items-center pb-2">
                                            <span className="text-stone-400">Vitesse</span>
                                            <span className="font-display text-xl text-primary-200">{vm.speed}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-8">
                        {hasLore && hasRules && (
                            <div className="flex items-center gap-8 border-b border-white/10 mb-8 px-2">
                                {(['lore', 'rules'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 text-lg font-display font-bold tracking-wide transition-all relative ${activeTab === tab ? 'text-white' : 'text-stone-400 hover:text-stone-300'}`}
                                    >
                                        {tab === 'lore' ? 'Légendes & Culture' : 'Règles & Capacités'}
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {hasLore && (!hasRules || activeTab === 'lore') && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {(vm.description || vm.detailedDescription) && (
                                    <div className="prose prose-invert prose-lg max-w-none">
                                        <div className="bg-gradient-to-b from-white/5 to-transparent p-8 rounded-2xl border border-white/5">
                                            {vm.description && <p className="lead text-xl text-primary-100 not-italic mb-6 leading-relaxed">{vm.description}</p>}
                                            {vm.detailedDescription && <p className="text-stone-300">{vm.detailedDescription}</p>}
                                        </div>
                                    </div>
                                )}
                                {vm.physicalTraits && (
                                    <div className="bg-stone-900/60 p-8 rounded-2xl border border-white/5">
                                        <h3 className="text-xl font-display font-bold text-white mb-4">Traits Physiques</h3>
                                        <p className="text-stone-300 leading-relaxed">{vm.physicalTraits}</p>
                                    </div>
                                )}
                                <div className="space-y-6">
                                    {vm.publicPerception && (
                                        <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                                            <h4 className="text-primary-400 font-bold mb-3 uppercase text-sm tracking-wider">Réputation</h4>
                                            <p className="text-stone-400 text-sm italic">"{vm.publicPerception}"</p>
                                        </div>
                                    )}
                                    {vm.roleplay && (
                                        <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                                            <h4 className="text-primary-400 font-bold mb-3 uppercase text-sm tracking-wider">Interprétation</h4>
                                            <p className="text-stone-400 text-sm italic">"{vm.roleplay}"</p>
                                        </div>
                                    )}
                                    {vm.typicalNames && (
                                        <div className="bg-stone-900/40 p-6 rounded-xl border border-white/5">
                                            <h4 className="text-stone-400 font-bold mb-3 uppercase text-sm tracking-wider flex items-center gap-2">
                                                <span className="w-8 h-[1px] bg-stone-700"></span>
                                                Noms Typiques
                                            </h4>
                                            <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line">{vm.typicalNames}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {hasRules && (!hasLore || activeTab === 'rules') && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {(vm.modifiers || vm.abilities) && (
                                    <div className="relative">
                                        <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                            <div className="size-2 rounded-full bg-primary-500/50"></div>
                                            Traits Raciaux
                                        </h3>
                                        <div className="bg-stone-900/60 rounded-2xl p-8 border border-white/5 relative overflow-hidden backdrop-blur-sm">
                                            {vm.modifiers && (
                                                <div className="mb-6">
                                                    <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-3">Caractéristiques</h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        {vm.modifiers.map((mod, i) => (
                                                            <div key={i} className="px-4 py-2 rounded-lg bg-primary-600/20 border border-primary-500/30 text-primary-100 font-mono text-sm flex items-center gap-2">
                                                                {mod.description ? (
                                                                    <span>{mod.description}</span>
                                                                ) : (
                                                                    <>
                                                                        <span className={`font-bold ${(mod.value ?? 0) > 0 ? 'text-primary-300' : 'text-red-300'}`}>
                                                                            {(mod.value ?? 0) > 0 ? '+' : ''}{mod.value}
                                                                        </span>
                                                                        <span className="uppercase tracking-wider opacity-90">
                                                                            {mod.options?.length ? mod.options.join(' / ') : mod.stat}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute top-0 right-0 p-32 bg-primary-900/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                            {vm.abilities && (
                                                <p className="text-stone-300 leading-relaxed whitespace-pre-line relative z-10 text-lg">{vm.abilities}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {vm.voies && vm.voies.length > 0 && (
                                    <div className="relative">
                                        <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                            <div className="size-2 rounded-full bg-primary-500/50"></div>
                                            Voies & Évolution
                                        </h3>
                                        <div className="space-y-12">
                                            {vm.voies.map(v => (
                                                <div key={v.id ?? v.name} className="space-y-6">
                                                    <div className="flex items-baseline gap-4 border-b border-white/10 pb-4">
                                                        {v.id ? (
                                                            <Link to={`/voies/${v.id}`} className="text-3xl font-display font-bold text-primary-200 hover:text-primary-100 transition-colors">{v.name}</Link>
                                                        ) : (
                                                            <span className="text-3xl font-display font-bold text-primary-200">{v.name}</span>
                                                        )}
                                                        <span className="text-stone-400 text-sm font-mono uppercase tracking-wider">Voie Raciale</span>
                                                    </div>

                                                    {v.details && <DynamicDetailsRenderer details={v.details} />}

                                                    {v.capabilities && v.capabilities.length > 0 && (
                                                        <div className="grid gap-4">
                                                            {v.capabilities.map(cap => (
                                                                <div key={cap.id ?? `${cap.rank ?? ''}-${cap.name}`}>
                                                                <CapabilityCard cap={cap} />
                                                                {/* À côté de la carte, jamais dedans : CapabilityCard
                                                                    est partagée et ne connaît pas les références. */}
                                                                {references && (
                                                                    <CapabilityRefs
                                                                        capacite={{ name: cap.name, states: cap.states, summons: cap.summons }}
                                                                        etatsConnus={references.etats}
                                                                        sources={references.sources}
                                                                    />
                                                                )}
                                                            </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
