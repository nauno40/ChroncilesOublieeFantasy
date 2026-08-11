import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Sword, Heart, Crown, Zap } from 'lucide-react';
import type { CreatureSheetVM } from './types';
import { CapabilityRefs } from '../creature/CapabilityRefs';
import type { ReferencesDeclaration } from '../homebrew/HomebrewFields';
import { typeCreature } from '../../domain/rules/typesCreature';
import { formatNC } from '../../domain/creature';

/**
 * Feuille d'une créature — bestiaire officiel comme créature maison.
 *
 * Une créature maison n'avait aucune fiche : elle ne se consultait qu'en rouvrant son
 * formulaire d'édition, et un visiteur qui n'en était pas l'auteur ne pouvait donc pas la
 * lire du tout. C'est l'écart que #148 avait traité pour les peuples, classes, voies et
 * capacités ; cette feuille applique le même motif au bestiaire.
 *
 * Composant pur : il ne charge rien. L'unique delta communautaire est `header`, où la page
 * pose `OwnerBar` — jamais de condition de provenance ici.
 */
interface CreatureSheetProps {
    vm: CreatureSheetVM;
    backTo?: string;
    backLabel?: string;
    /** Bandeau propriétaire (créature maison uniquement). */
    header?: React.ReactNode;
    /** Entités nécessaires aux liens de déclaration (états, invocations). */
    references?: ReferencesDeclaration;
}

/** Ordre du profil de créature du livre. */
const CARACS = ['AGI', 'CON', 'FOR', 'PER', 'CHA', 'INT', 'VOL'];

const Info: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
        <span className="text-stone-400">{label}</span>
        <span className="font-display text-lg text-primary-200">{value || '—'}</span>
    </div>
);

export const CreatureSheet: React.FC<CreatureSheetProps> = ({ vm, backTo, backLabel, header, references }) => {
    const aDesInfos = vm.category || vm.environment || vm.archetype || vm.size;
    const type = typeCreature(vm.category);
    const aDesCapacites = (vm.capabilities?.length ?? 0) > 0 || vm.specialAbilitiesHtml || vm.specialAbilitiesText;
    const aUneDescription = vm.descriptionHtml || vm.descriptionText || vm.familyDescription;

    return (
        <div className="min-h-screen pb-12 relative">
            {/* Bandeau décoratif : la même illustration, floutée. */}
            {vm.image && (
                <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
                    <img
                        src={vm.image}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover object-top opacity-30 blur-sm"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-stone-950/60 mix-blend-multiply"></div>
                </div>
            )}

            <div className="container mx-auto px-4 relative z-10 pt-6">
                <div className="mb-8">
                    {backTo && (
                        <Link to={backTo} className="inline-flex items-center text-stone-400 hover:text-white transition-colors group mb-6">
                            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-display font-medium tracking-wide text-sm uppercase">{backLabel ?? 'Retour'}</span>
                        </Link>
                    )}

                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white drop-shadow-xl mb-4">{vm.name}</h1>

                    <div className="flex flex-wrap gap-3 items-center">
                        {vm.nc !== undefined && (
                            <span className="bg-primary-950/80 px-4 py-1.5 rounded-lg border border-primary-500/40 text-primary-300 font-bold tracking-wider shadow-lg shadow-black/20 text-sm">
                                NC {formatNC(vm.nc)}
                            </span>
                        )}
                        {vm.familyName && (
                            <span className="bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 italic text-sm">
                                {vm.familyName}
                            </span>
                        )}
                    </div>

                    {header && <div className="mt-4">{header}</div>}
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        {vm.image && (
                            <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                                <div className="aspect-[3/4] relative overflow-hidden flex items-center justify-center bg-stone-950">
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-60 z-10"></div>
                                    <img
                                        src={vm.image}
                                        alt={vm.name}
                                        className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                </div>
                            </div>
                        )}

                        {aDesInfos && (
                            <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl">
                                <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-stone-700"></span>
                                    Informations
                                </h3>
                                <div className="space-y-4">
                                    <Info label="Catégorie" value={vm.category} />
                                    {/* Le type n'est pas qu'une étiquette : le livre y attache des immunités
                                        précises, que le MJ devait retrouver dans le livre au moment où un
                                        joueur tente justement d'empoisonner un mort-vivant. */}
                                    {type && type.implications.length > 0 && (
                                        <ul className="-mt-2 space-y-1 text-xs text-stone-400 list-disc list-inside marker:text-stone-600">
                                            {type.implications.map(i => <li key={i}>{i}</li>)}
                                            {type.siSansIntelligence?.map(i => (
                                                // Le livre conditionne ces immunités : une créature végétative
                                                // intelligente « n'a pas d'autre immunité particulière ». Rien
                                                // dans le profil ne dit à partir de quelle INT elle l'est —
                                                // la condition reste donc énoncée, pas tranchée.
                                                <li key={i}><span className="italic text-stone-500">Si elle est dépourvue d’intelligence :</span> {i}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <Info label="Milieu" value={vm.environment} />
                                    <Info label="Archétype" value={vm.archetype} />
                                    <Info label="Taille" value={vm.size} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-stone-900/80 p-4 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center hover:border-white/20 transition-colors">
                                <Shield className="mb-2 text-stone-400" size={20} />
                                <div className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Défense</div>
                                <div className="text-2xl font-display font-bold text-stone-200">{vm.def ?? '—'}</div>
                            </div>
                            <div className="bg-stone-900/80 p-4 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center hover:border-green-500/30 transition-colors group">
                                <Heart className="mb-2 text-green-900 group-hover:text-green-500 transition-colors" size={20} />
                                <div className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">PV</div>
                                <div className="text-2xl font-display font-bold text-green-500">{vm.hp ?? '—'}</div>
                            </div>
                            <div className="bg-stone-900/80 p-4 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center hover:border-amber-500/30 transition-colors group">
                                <Sword className="mb-2 text-amber-900 group-hover:text-amber-500 transition-colors" size={20} />
                                <div className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Init</div>
                                <div className="text-2xl font-display font-bold text-amber-500">{vm.init ?? '—'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        {vm.stats && (
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-8">
                                {CARACS.map(carac => (
                                    // L'intitulé et la valeur sont deux blocs voisins : lus séparément, ils
                                    // ne disent pas à quelle caractéristique le chiffre appartient. Le label
                                    // les réunit — pour un lecteur d'écran comme pour un test.
                                    <div
                                        key={carac}
                                        aria-label={`${carac} ${vm.stats?.[carac] ?? 0}`}
                                        className="bg-stone-900/60 rounded-xl p-3 border border-white/5 text-center hover:border-primary-500/30 transition-colors"
                                    >
                                        <div className="text-stone-400 text-[11px] font-bold uppercase tracking-wider mb-1">{carac}</div>
                                        <div className="font-display font-bold text-xl text-stone-200">{vm.stats?.[carac] ?? 0}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(vm.attacks?.length ?? 0) > 0 && (
                            <div className="mb-10">
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                    <Sword size={20} /> Attaques
                                </h3>
                                <div className="grid gap-4">
                                    {vm.attacks!.map((attaque, i) => (
                                        <div key={i} className="flex flex-col gap-3 bg-stone-900/60 p-5 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all hover:bg-stone-900/80">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
                                                <span className="font-bold text-stone-100 text-lg">{attaque.name}</span>
                                                <div className="flex gap-4 text-sm items-center self-start sm:self-auto">
                                                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                                                        <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">Test</span>
                                                        <span className="text-primary-400 font-mono font-bold">{attaque.test || '—'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                                                        <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">DM</span>
                                                        <span className="text-stone-300 font-mono font-bold">{attaque.dm || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {attaque.special && (
                                                <div className="text-sm text-stone-400 flex gap-2 items-start mt-1 pl-2 border-l-2 border-primary-500/30">
                                                    <span className="italic">{attaque.special}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {aDesCapacites && (
                            <div className="mb-10">
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                    <Zap size={20} /> Capacités
                                </h3>
                                <div className="space-y-4">
                                    {vm.specialAbilitiesHtml && (
                                        <div className="bg-stone-900/40 p-6 rounded-xl border border-white/5">
                                            <div
                                                className="prose prose-invert prose-stone max-w-none text-sm space-y-3 [&_p]:leading-relaxed text-stone-300/90"
                                                dangerouslySetInnerHTML={{ __html: vm.specialAbilitiesHtml }}
                                            />
                                        </div>
                                    )}
                                    {vm.specialAbilitiesText && (
                                        <div className="bg-stone-900/40 p-6 rounded-xl border border-white/5">
                                            <p className="text-sm text-stone-300/90 leading-relaxed whitespace-pre-line">{vm.specialAbilitiesText}</p>
                                        </div>
                                    )}
                                    {vm.capabilities?.map((cap, i) => (
                                        <div key={i} className="bg-stone-900/60 p-5 rounded-xl border border-white/5 hover:border-primary-500/30 transition-colors">
                                            <div className="font-bold text-primary-300 mb-2 flex items-baseline gap-2">
                                                {cap.name}
                                                {cap.rank !== undefined && <span className="text-stone-400 font-normal text-xs bg-black/30 px-2 py-0.5 rounded border border-white/5">Rang {cap.rank}</span>}
                                            </div>
                                            {cap.description && (
                                                <div className="text-sm text-stone-300 leading-relaxed opacity-90 whitespace-pre-line pl-2 border-l-2 border-white/10">
                                                    {cap.description}
                                                </div>
                                            )}
                                            <CapabilityRefs
                                                capacite={{ name: cap.name, states: cap.states, summons: cap.summons }}
                                                etatsConnus={references?.etats ?? []}
                                                sources={references?.sources ?? { creatures: [], monstresMaison: [], armes: [], armures: [], communautaire: [] }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {aUneDescription && (
                            <div>
                                <h3 className="text-xl font-display font-bold text-stone-300 mb-4 flex items-center gap-2">
                                    <Crown size={20} /> Description & Comportement
                                </h3>
                                <div className="space-y-6">
                                    {vm.familyDescription && (
                                        <div className="bg-primary-950/10 p-6 rounded-xl border border-primary-500/10">
                                            <h4 className="text-primary-400 font-bold mb-3 uppercase text-xs tracking-wider flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                                                Famille : {vm.familyName}
                                            </h4>
                                            <p className="text-stone-300 italic text-sm leading-relaxed">{vm.familyDescription}</p>
                                        </div>
                                    )}
                                    {vm.descriptionHtml && (
                                        <div className="bg-stone-900/20 p-6 rounded-xl border border-white/5">
                                            <div
                                                className="prose prose-invert prose-stone max-w-none text-sm space-y-3 [&_p]:leading-relaxed text-stone-300/90"
                                                dangerouslySetInnerHTML={{ __html: vm.descriptionHtml }}
                                            />
                                        </div>
                                    )}
                                    {vm.descriptionText && (
                                        <div className="bg-stone-900/20 p-6 rounded-xl border border-white/5">
                                            <p className="text-sm text-stone-300/90 leading-relaxed whitespace-pre-line">{vm.descriptionText}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
