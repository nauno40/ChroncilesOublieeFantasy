import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Shield, Crown, Activity, HelpCircle as HelpIcon } from 'lucide-react';
import type { ProfileSheetVM, SheetEquipmentItem } from './types';
import { DynamicDetailsRenderer } from '../common';
import { CapabilityCard } from './CapabilityCard';
import { CapabilityRefs } from '../creature/CapabilityRefs';
import type { ReferencesDeclaration } from '../homebrew/HomebrewFields';
import { imagePlaceholder, onImageError } from '../common/imagePlaceholder';


interface ProfileSheetProps {
    vm: ProfileSheetVM;
    backTo?: string;
    backLabel?: string;
    /** Bandeau propriétaire (contenu communautaire uniquement). */
    header?: React.ReactNode;
    /** Entités nécessaires à la résolution des liens de déclaration. Absente, aucune
     *  pastille : une feuille est pure et ne charge rien elle-même. */
    references?: ReferencesDeclaration;
}

/** Rendu récursif d'un élément d'équipement de départ : item simple, choix entre
 * alternatives (« Au choix »), ou ensemble groupé (« Ensemble »). Repris tel quel de
 * `ClassDetail.tsx`.
 */
const renderEquipmentItem = (item: SheetEquipmentItem | string, idx: number, level = 0): React.ReactNode => {
    if (typeof item === 'string') {
        return (
            <div key={idx} className="flex items-start gap-3 mb-3">
                <div className={`w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0 ${level > 0 ? 'bg-primary-500/50' : ''}`}></div>
                <span className="leading-relaxed">{item}</span>
            </div>
        );
    }

    if (item.choice) {
        return (
            <div key={idx} className="mb-4 pl-0">
                <div className="flex items-center gap-2 mb-2 text-primary-300/80 text-xs uppercase tracking-wider font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500/30"></div>
                    Au choix :
                </div>
                <div className="pl-4 border-l border-white/10 space-y-2">
                    {item.choice.map((choice, cIdx) => (
                        <div key={cIdx}>
                            {cIdx > 0 && <div className="text-[10px] text-stone-500 uppercase font-bold my-1">OU</div>}
                            {renderEquipmentItem(choice, cIdx, level + 1)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (item.set) {
        return (
            <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/5">
                <span className="text-xs text-stone-400 block mb-2 uppercase tracking-wide font-bold">Ensemble :</span>
                {item.set.map((subItem, sIdx) => renderEquipmentItem(subItem, sIdx, level + 1))}
            </div>
        );
    }

    return (
        <div key={idx} className="flex items-start gap-3 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0 ${level > 0 ? 'bg-primary-500/50' : ''}`}></div>
            <span>
                <strong className="text-stone-200">{item.item}</strong>
                {item.stats && <span className="text-primary-400/80 ml-1">({item.stats})</span>}
                {item.examples && <span className="text-stone-500 italic ml-1">- ex: {item.examples}</span>}
            </span>
        </div>
    );
};

export const ProfileSheet: React.FC<ProfileSheetProps> = ({ vm, backTo, backLabel, header, references }) => {
    const [activeTab, setActiveTab] = useState<'lore' | 'voies'>('lore');
    const image = vm.image ?? imagePlaceholder(vm.name, 'portrait');

    // La carte "Statistiques Vitales" ne rend le bloc famille (PV/Niveau, Récupération,
    // Points de Chance, Bonus) que si l'un de ces champs est réellement renseigné — un
    // simple nom de famille (cas homebrew fréquent : le schéma ne capture que le nom) ne
    // doit pas suffire à afficher un titre de carte sans aucun contenu. `magicStat` n'en
    // dépend pas : côté communautaire, famille et caractéristique de magie sont deux
    // champs indépendants du formulaire (cf. homebrewSchemas.ts) — renseigner la seconde
    // sans la première ne doit pas la faire disparaître.
    const hasFamilyStats =
        vm.family?.baseHp !== undefined ||
        vm.family?.recoveryDie !== undefined ||
        (vm.family?.luckPoints ?? 0) > 0 ||
        vm.magicStat !== undefined ||
        vm.family?.manaStat !== undefined ||
        vm.family?.bonus !== undefined;
    const hasStatsEntries = vm.stats !== undefined && Object.keys(vm.stats).length > 0;
    const hasVitalStats = vm.hitDie !== undefined || vm.armorMaxDef !== undefined || hasFamilyStats || hasStatsEntries;
    const hasMasteries = (vm.masteries?.length ?? 0) > 0 || vm.weaponsAndArmor !== undefined;
    const hasStartingEquipment = (vm.startingEquipment?.length ?? 0) > 0;
    const hasLoreTab = vm.description !== undefined || vm.note !== undefined || (vm.lore?.length ?? 0) > 0 || vm.family?.description !== undefined;
    const hasVoiesTab = (vm.voies?.length ?? 0) > 0;

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
                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white drop-shadow-xl mb-2">{vm.name}</h1>
                    {vm.family?.subtitle && (
                        <h2 className="text-xl md:text-2xl font-display text-primary-400 italic opacity-90">{vm.family.subtitle}</h2>
                    )}
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

                        {hasVitalStats && (
                            <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl transition-all hover:border-primary-500/20">
                                <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-stone-700"></span>
                                    {vm.profileType || 'Statistiques Vitales'}
                                </h3>
                                <div className="space-y-4">
                                    {vm.hitDie !== undefined && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2 text-stone-400">
                                                <Heart size={16} className="text-red-900" />
                                                <span>Dé de Vie</span>
                                            </div>
                                            <span className="font-display text-xl text-primary-200">{vm.hitDie}</span>
                                        </div>
                                    )}

                                    {vm.armorMaxDef !== undefined && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2 text-stone-400">
                                                <Shield size={16} className="text-blue-900" />
                                                <span>DEF max d’armure</span>
                                            </div>
                                            <span className="font-display text-xl text-primary-200">{vm.armorMaxDef}</span>
                                        </div>
                                    )}

                                    {vm.stats && Object.entries(vm.stats).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2 text-stone-400">
                                                <Activity size={16} className="text-primary-600/60" />
                                                <span>{key}</span>
                                            </div>
                                            <span className="font-display text-lg text-primary-200 text-right max-w-[60%]">{String(value)}</span>
                                        </div>
                                    ))}

                                    {vm.family?.baseHp !== undefined && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2 text-stone-400">
                                                <Activity size={16} className="text-green-900" />
                                                <span>PV / Niveau</span>
                                            </div>
                                            <span className="font-display text-xl text-primary-200">{vm.family.baseHp}</span>
                                        </div>
                                    )}
                                    {vm.family?.recoveryDie !== undefined && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2 text-stone-400">
                                                <Shield size={16} className="text-blue-900" />
                                                <span>Récupération</span>
                                            </div>
                                            <span className="font-display text-xl text-primary-200">{vm.family.recoveryDie}</span>
                                        </div>
                                    )}
                                    {(vm.family?.luckPoints ?? 0) > 0 && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2 text-stone-400">
                                                <Crown size={16} className="text-yellow-600" />
                                                <span>Points de Chance</span>
                                            </div>
                                            <span className="font-display text-xl text-primary-200">{vm.family?.luckPoints}</span>
                                        </div>
                                    )}
                                    {/* Indépendant de la famille (I1) : côté communautaire, famille et caractéristique
                                        de magie sont deux champs distincts du formulaire ; renseigner l'un sans l'autre
                                        ne doit pas faire disparaître la donnée. */}
                                    {(vm.magicStat !== undefined || vm.family?.manaStat !== undefined) && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2 text-stone-400">
                                                <Activity size={16} className="text-purple-500" />
                                                <span>Carac. Magique</span>
                                            </div>
                                            <span className="font-display text-xl text-primary-200">{vm.magicStat ?? vm.family?.manaStat}</span>
                                        </div>
                                    )}
                                    {vm.family?.bonus && (
                                        <div className="pt-2">
                                            <div className="flex items-center gap-2 text-stone-400 mb-1">
                                                <Crown size={14} className="text-primary-400" />
                                                <span className="text-xs uppercase tracking-wider font-bold">Bonus de Famille</span>
                                            </div>
                                            <p className="text-sm text-primary-100 italic leading-snug">{vm.family?.bonus}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {hasMasteries && (
                            <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl hover:border-primary-500/20">
                                <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-stone-700"></span>
                                    Maîtrises
                                </h3>
                                <div className="space-y-6">
                                    {vm.masteries ? (
                                        vm.masteries.map((entry, i) => (
                                            <div key={i}>
                                                {entry.label && (
                                                    <strong className="text-primary-400 block mb-2 font-display text-sm uppercase tracking-wide">{entry.label}</strong>
                                                )}
                                                <p className="text-stone-300 text-sm leading-relaxed">{entry.value}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div>
                                            <p className="text-stone-300 text-sm leading-relaxed">{vm.weaponsAndArmor}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {hasStartingEquipment && (
                            <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl hover:border-primary-500/20">
                                <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-stone-700"></span>
                                    Équipement de départ
                                </h3>
                                <div className="text-sm text-stone-300">
                                    <div className="space-y-1">
                                        {vm.startingEquipment!.map((item, idx) => renderEquipmentItem(item, idx))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-8">
                        {hasLoreTab && hasVoiesTab && (
                            <div className="flex items-center gap-8 border-b border-white/10 mb-8 px-2 overflow-x-auto">
                                {(['lore', 'voies'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 text-lg font-display font-bold tracking-wide transition-all relative ${activeTab === tab ? 'text-white' : 'text-stone-500 hover:text-stone-300'}`}
                                    >
                                        {tab === 'lore' ? 'Légendes & Histoire' : 'Voies & Capacités'}
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {hasLoreTab && (!hasVoiesTab || activeTab === 'lore') && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {(vm.description || vm.note) && (
                                    <div className="bg-gradient-to-b from-white/5 to-transparent p-8 rounded-2xl border border-white/5">
                                        {vm.description && (
                                            <p className="lead text-xl text-primary-100 italic font-serif mb-6 leading-relaxed">&ldquo;{vm.description}&rdquo;</p>
                                        )}
                                        {vm.note && (
                                            <div className="mt-6 pt-6 border-t border-white/10">
                                                <h4 className="flex items-center gap-2 text-primary-400 font-bold mb-2 uppercase text-xs tracking-wider">
                                                    <HelpIcon size={14} /> Note
                                                </h4>
                                                <div className="text-stone-300 whitespace-pre-line leading-relaxed">{vm.note}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {vm.lore && vm.lore.length > 0 && (
                                    <div className="grid gap-6">
                                        {vm.lore.map((entry, i) => (
                                            <div key={i} className="bg-stone-900/60 p-8 rounded-2xl border border-white/5">
                                                {entry.label && (
                                                    <h3 className="text-xl font-display font-bold text-white mb-4 border-b border-primary-500/20 pb-2 inline-block">{entry.label}</h3>
                                                )}
                                                <div className="text-stone-300 leading-relaxed whitespace-pre-line">{entry.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {vm.family?.description && (
                                    <div className="glass-panel p-8 rounded-xl border border-primary-500/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <Crown size={150} />
                                        </div>
                                        <h3 className="text-2xl font-display font-bold text-primary-300 mb-6 flex items-center gap-3 relative z-10">
                                            <Crown size={24} className="text-primary-400" />
                                            A propos de la {vm.family.subtitle ?? vm.family.name}
                                        </h3>
                                        <p className="text-lg text-stone-300 leading-relaxed relative z-10">{vm.family.description}</p>

                                        {vm.family.bonus && (
                                            <div className="mt-6 pt-6 border-t border-primary-500/20 relative z-10">
                                                <h4 className="flex items-center gap-2 text-primary-400 font-bold mb-2 uppercase text-xs tracking-wider">
                                                    <Crown size={14} /> Bonus de Famille
                                                </h4>
                                                <p className="text-stone-300 italic">{vm.family.bonus}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {hasVoiesTab && (!hasLoreTab || activeTab === 'voies') && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-12">
                                    {vm.voies!.map(v => (
                                        <div key={v.id ?? v.name} className="space-y-6">
                                            <div className="flex items-baseline gap-4 border-b border-white/10 pb-4">
                                                {v.id ? (
                                                    <Link to={`/voies/${v.id}`} className="text-3xl font-display font-bold text-primary-200 hover:text-primary-100 transition-colors">{v.name}</Link>
                                                ) : (
                                                    <span className="text-3xl font-display font-bold text-primary-200">{v.name}</span>
                                                )}
                                                <span className="text-stone-500 text-sm font-mono uppercase tracking-wider">Voie de Classe</span>
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
                </div>
            </div>
        </div>
    );
};
