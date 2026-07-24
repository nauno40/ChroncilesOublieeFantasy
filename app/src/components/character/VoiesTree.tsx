import React from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { CapabilityNode } from './CapabilityNode';
import { canAcquireRank, rankUnlockLevel, canAddVoie, MAX_VOIES, type VoieKind } from '../../domain/rules';
import type { Character, CharacterVoieRef } from '../../types/character';
import type {
    GetCapabilityName,
    GetVoieName,
    GetResolvedDice,
    SelectedVoiesSetter,
    IsMageFamily,
    RacialVoieOptions,
    VoieList,
} from './types';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    spentPoints: number;
    maxStartingPoints: number;
    isMageFamily: IsMageFamily;
    mageReplacedRaceVoie: boolean;
    setMageReplacedRaceVoie: React.Dispatch<React.SetStateAction<boolean>>;
    racialVoieOptions: RacialVoieOptions;
    selectedVoies: string[];
    setSelectedVoies: SelectedVoiesSetter;
    getCapabilityName: GetCapabilityName;
    getVoieName: GetVoieName;
    getResolvedDice: GetResolvedDice;
    prestigePaths: VoieList;
    /** Voies disponibles par profil (IRI + nom), pour les voies hybrides hors profil principal. */
    voieOptionsByProfile: { profile: string; voies: { iri: string; name: string }[] }[];
}

const isProfil = (v: CharacterVoieRef) => v.source === 'profil' || v.source === 'hybride';

export const VoiesTree: React.FC<Props> = ({
    character,
    setCharacter,
    spentPoints,
    maxStartingPoints,
    isMageFamily,
    mageReplacedRaceVoie,
    setMageReplacedRaceVoie,
    racialVoieOptions,
    selectedVoies,
    setSelectedVoies,
    getCapabilityName,
    getVoieName,
    getResolvedDice,
    prestigePaths,
    voieOptionsByProfile,
}) => {
    const level = character.level ?? 0;
    const voies = character.characterVoies ?? [];

    const profilEntries = voies.filter(isProfil);
    const racialEntry = voies.find(v => v.source === 'peuple');
    const prestigeEntries = voies.filter(v => v.source === 'prestige');

    // Un rang 2 est-il déjà pris dans une autre voie normale (bonus mage) ?
    const countRank2 = (excludeVoieIri?: string): number =>
        voies.filter(v => v.source !== 'prestige' && v.voie !== excludeVoieIri && v.rank >= 2).length;

    // Valide l'acquisition d'un rang (prérequis, niveau requis, budget) via les règles COF2.
    const validateAcquire = (rank: number, currentRank: number, voieKind: VoieKind, voieIri: string): boolean => {
        const res = canAcquireRank(rank, rank === 1 || currentRank >= rank - 1, voieKind, {
            level,
            isMageFamily,
            spentPoints,
            budget: maxStartingPoints,
            hasOtherRank2: countRank2(voieIri) > 0,
        });
        if (!res.ok) {
            alert(res.reason);
            return false;
        }
        return true;
    };

    // Props de verrouillage visuel d'un rang selon le niveau requis (COF2).
    const lockProps = (rank: number, voieKind: VoieKind) => {
        const req = rankUnlockLevel(rank, voieKind, isMageFamily);
        return { locked: Math.max(1, level) < req, lockedLabel: `Niv. ${req}` };
    };

    // Met à jour le rang de la n-ième voie d'une `source` donnée (par filtre positionnel).
    const setRankBySourceIndex = (predicate: (v: CharacterVoieRef) => boolean, nth: number, newRank: number) => {
        setCharacter(prev => {
            const cv = [...(prev.characterVoies || [])];
            const globalIdxs = cv.map((v, i) => (predicate(v) ? i : -1)).filter(i => i >= 0);
            const target = globalIdxs[nth];
            if (target == null) return prev;
            cv[target] = { ...cv[target], rank: Math.max(0, newRank) };
            return { ...prev, characterVoies: cv };
        });
    };

    // Remplace (ou crée) la voie de la n-ième entrée de profil et réinitialise son rang.
    const setProfilVoie = (nth: number, newIri: string) => {
        setCharacter(prev => {
            const cv = [...(prev.characterVoies || [])];
            const globalIdxs = cv.map((v, i) => (isProfil(v) ? i : -1)).filter(i => i >= 0);
            const target = globalIdxs[nth];
            if (target != null) {
                cv[target] = { ...cv[target], voie: newIri, rank: 0 };
            } else {
                cv.push({ voie: newIri, rank: 0, source: 'profil' });
            }
            return { ...prev, characterVoies: cv };
        });
    };

    const setPrestigeVoie = (nth: number, newIri: string) => {
        setCharacter(prev => {
            const cv = [...(prev.characterVoies || [])];
            const globalIdxs = cv.map((v, i) => (v.source === 'prestige' ? i : -1)).filter(i => i >= 0);
            const target = globalIdxs[nth];
            if (target == null) return prev;
            cv[target] = { ...cv[target], voie: newIri, rank: 0 };
            return { ...prev, characterVoies: cv };
        });
    };

    // Plafond COF2 : 6 voies max (hors peuple ; la prestige compte parmi les 6).
    const atVoieCap = !canAddVoie(voies);
    // COF2 : un personnage ne peut avoir qu'UNE SEULE voie de prestige.
    const hasPrestige = prestigeEntries.length >= 1;
    const addPrestige = () => {
        if (atVoieCap || hasPrestige) return;
        setCharacter(prev => ({
            ...prev,
            characterVoies: [...(prev.characterVoies || []), { voie: '', rank: 0, source: 'prestige' as const }],
        }));
    };

    const removePrestige = (nth: number) =>
        setCharacter(prev => {
            const cv = [...(prev.characterVoies || [])];
            const globalIdxs = cv.map((v, i) => (v.source === 'prestige' ? i : -1)).filter(i => i >= 0);
            const target = globalIdxs[nth];
            if (target == null) return prev;
            cv.splice(target, 1);
            return { ...prev, characterVoies: cv };
        });

    // Voie de peuple affichée : IRI de selectedVoies[2] en création, sinon l'entrée persistée.
    const racialIri = level === 0 ? (selectedVoies[2] || '') : (racialEntry?.voie || '');
    const racialRank = racialEntry?.rank || 0;

    return (
                    <div className="space-y-6 pt-8 border-t border-white/10 overflow-visible">
                        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center justify-between">
                            <span>Voies & Progression</span>
                            <span className={`text-base px-3 py-1 rounded-full border ${spentPoints > maxStartingPoints ? 'bg-red-900/30 border-red-500 text-red-200' :
                                spentPoints === maxStartingPoints ? 'bg-green-900/30 border-green-500 text-green-200' :
                                    'bg-primary-900/30 border-primary-500 text-primary-200'
                                }`}>
                                Points de capacité : {maxStartingPoints - spentPoints} / {maxStartingPoints}
                            </span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible">
                            {/* Racial Voie (voie de peuple) */}
                            <div className="glass-panel p-5 rounded-2xl border-primary-500/20 bg-stone-900/10 hover:border-primary-500/30 transition-all group/voie overflow-visible relative">
                                {isMageFamily && mageReplacedRaceVoie && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent pointer-events-none rounded-tr-2xl" />
                                )}
                                <div className="mb-5 space-y-2">
                                    <h3 className="text-primary-600/70 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">
                                        {mageReplacedRaceVoie ? 'Voie du Mage' : 'Héritage Racial'}
                                    </h3>
                                    {character.level === 0 && isMageFamily && (
                                        <div className="flex justify-end mb-1">
                                            <button
                                                onClick={() => setMageReplacedRaceVoie(!mageReplacedRaceVoie)}
                                                className={`text-[9px] uppercase font-bold py-1 px-2 rounded border transition-all ${mageReplacedRaceVoie
                                                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                                    : 'bg-stone-950 border-stone-700 text-stone-400 hover:text-white'
                                                    }`}
                                            >
                                                {mageReplacedRaceVoie ? 'Rétablir Racial' : 'Remplacer (Mage)'}
                                            </button>
                                        </div>
                                    )}
                                    {isMageFamily && mageReplacedRaceVoie ? (
                                        <div className="w-full bg-stone-950/30 border border-purple-500/50 rounded-lg px-4 py-2 text-lg font-display font-bold text-purple-300 shadow-inner">
                                            {getVoieName(racialIri) || 'Voie du Mage'}
                                        </div>
                                    ) : (
                                        racialVoieOptions.length > 1 ? (
                                            <select
                                                className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-2 text-lg font-display font-bold text-white outline-none focus:border-primary-500/50 focus:bg-stone-900/50 transition-all cursor-pointer appearance-none shadow-inner"
                                                value={selectedVoies[2]}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setSelectedVoies(prev => [prev[0], prev[1], val]);
                                                }}
                                            >
                                                <option value="">-- Choisir héritage --</option>
                                                {racialVoieOptions.map((v, idx) => (
                                                    <option key={idx} value={v['@id']}>{v.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-2 text-lg font-display font-bold text-white shadow-inner">
                                                {getVoieName(racialIri) || racialVoieOptions[0]?.name || '...'}
                                            </div>
                                        )
                                    )}
                                </div>
                                <div className="space-y-2.5 overflow-visible">
                                    {isMageFamily && mageReplacedRaceVoie && (
                                        <div className="text-[10px] text-purple-300/70 italic px-2 pb-2">
                                            Bonus Passif : {racialVoieOptions[0]?.name} (Rang 1) conservé !
                                        </div>
                                    )}

                                    {[1, 2, 3, 4, 5].map(rank => {
                                        const cap = getCapabilityName(racialIri, rank);
                                        const isActive = racialRank >= rank;

                                        return (
                                            <CapabilityNode
                                                key={rank}
                                                rank={rank}
                                                isActive={isActive}
                                                nextActive={racialRank >= rank + 1}
                                                cap={cap}
                                                resolvedDice={getResolvedDice(racialIri, rank)}
                                                theme="primary"
                                                shape="round"
                                                {...lockProps(rank, 'racial')}
                                                onChange={e => {
                                                    if (character.level === 0 && rank === 1) return; // rang 1 gratuit/auto
                                                    if (!racialEntry) return;
                                                    if (e.target.checked) {
                                                        if (!validateAcquire(rank, racialRank, 'racial', racialIri)) return;
                                                        setRankBySourceIndex(v => v.source === 'peuple', 0, rank);
                                                    } else {
                                                        setRankBySourceIndex(v => v.source === 'peuple', 0, rank - 1);
                                                    }
                                                }}
                                                badge={isMageFamily && rank === 2 && character.level === 0 && (
                                                    (() => {
                                                        const hasOtherRank2 = countRank2(racialIri) > 0;
                                                        if (isActive || (!hasOtherRank2 && racialRank >= 1)) {
                                                            return <span className="text-green-400 ml-2 animate-pulse">(Gratuit)</span>;
                                                        }
                                                        return null;
                                                    })()
                                                )}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Profile Voies */}
                            {[0, 1, 2, 3, 4].map((vIdx) => {
                                const entry = profilEntries[vIdx];
                                const iri = entry?.voie || '';
                                const rank = entry?.rank || 0;
                                const name = iri ? getVoieName(iri) : '';
                                const isCreation = character.level === 0;

                                return (
                                    <div key={vIdx} className={`glass-panel p-5 rounded-2xl border-primary-500/10 bg-stone-900/10 transition-all group/voie overflow-visible ${isCreation ? '' : 'hover:border-primary-500/20'}`}>
                                        <div className="mb-5 space-y-2">
                                            <h3 className="text-stone-600/70 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">Voie de Profil {vIdx + 1}</h3>
                                            <div className="flex gap-2 items-center">
                                                {isCreation ? (
                                                    <div className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-2 text-lg font-display font-bold text-white shadow-inner">
                                                        {name || '...'}
                                                    </div>
                                                ) : (
                                                    // En jeu : voie choisie parmi tous les profils (profils hybrides, COF2 chap. 9).
                                                    <select
                                                        value={iri}
                                                        onChange={(e) => {
                                                            const newIri = e.target.value;
                                                            if (!newIri || newIri === iri) return;
                                                            if (rank > 0 && !confirm('Changer de voie réinitialisera sa progression. Continuer ?')) return;
                                                            setProfilVoie(vIdx, newIri);
                                                        }}
                                                        className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-2 text-lg font-display font-bold text-white shadow-inner outline-none focus:border-primary-500/50 cursor-pointer appearance-none"
                                                    >
                                                        {!iri && <option value="">— Choisir une voie —</option>}
                                                        {voieOptionsByProfile.map(grp => (
                                                            <optgroup key={grp.profile} label={grp.profile}>
                                                                {grp.voies.map(v => <option key={v.iri} value={v.iri}>{v.name}</option>)}
                                                            </optgroup>
                                                        ))}
                                                        {/* Conserve l'affichage d'une voie hors liste (ex. voie déjà posée). */}
                                                        {iri && !voieOptionsByProfile.some(g => g.voies.some(v => v.iri === iri)) && (
                                                            <option value={iri}>{name || '(voie)'}</option>
                                                        )}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2.5 overflow-visible">
                                            {[1, 2, 3, 4, 5].map(rk => {
                                                const cap = getCapabilityName(iri, rk);
                                                const isActive = rank >= rk;

                                                return (
                                                    <CapabilityNode
                                                        key={rk}
                                                        rank={rk}
                                                        isActive={isActive}
                                                        nextActive={rank >= rk + 1}
                                                        cap={cap}
                                                        resolvedDice={getResolvedDice(iri, rk)}
                                                        theme="primary"
                                                        shape="gem"
                                                        {...lockProps(rk, 'profile')}
                                                        onChange={e => {
                                                            if (!entry) return;
                                                            if (e.target.checked) {
                                                                if (!validateAcquire(rk, rank, 'profile', iri)) return;
                                                                setRankBySourceIndex(isProfil, vIdx, rk);
                                                            } else {
                                                                setRankBySourceIndex(isProfil, vIdx, rk - 1);
                                                            }
                                                        }}
                                                        badge={isMageFamily && rk === 2 && character.level === 0 && (
                                                            (() => {
                                                                const hasOtherRank2 = countRank2(iri) > 0;
                                                                if (isActive || (!hasOtherRank2 && rank >= 1)) {
                                                                    return <span className="text-green-400 ml-2 animate-pulse">(Gratuit)</span>;
                                                                }
                                                                return null;
                                                            })()
                                                        )}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Prestige Voies - Separate Section */}
                        {prestigeEntries.length > 0 && (
                            <div className="space-y-4 overflow-visible">
                                <h3 className="text-xl font-display font-bold text-amber-400/80 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    Voies de Prestige
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible">
                                    {prestigeEntries.map((entry, vIdx) => {
                                        const iri = entry.voie || '';
                                        const rank = entry.rank || 0;
                                        return (
                                        <div key={`prestige-${vIdx}`} className="glass-panel p-5 rounded-2xl border-amber-500/20 bg-stone-900/10 hover:border-amber-500/30 transition-all group/voie overflow-visible">
                                            <div className="mb-5 space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <h3 className="text-amber-600/70 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">Voie de Prestige</h3>
                                                    <button
                                                        onClick={() => removePrestige(vIdx)}
                                                        className="text-stone-600 hover:text-red-500 transition-colors p-1"
                                                        title="Supprimer cette voie"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <select
                                                    className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-2 text-lg font-display font-bold text-amber-500 outline-none focus:border-amber-500/50 transition-all shadow-inner appearance-none cursor-pointer"
                                                    value={iri}
                                                    onChange={e => setPrestigeVoie(vIdx, e.target.value)}
                                                >
                                                    <option value="">— Choisir une voie de prestige —</option>
                                                    {[...prestigePaths]
                                                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                                                        .map(p => (
                                                            <option key={p['@id'] ?? p.id ?? p.name} value={p['@id']}>{p.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2.5 overflow-visible">
                                                {[1, 2, 3, 4, 5].map(rk => {
                                                    const cap = getCapabilityName(iri, rk);
                                                    const isActive = rank >= rk;

                                                    return (
                                                        <CapabilityNode
                                                            key={rk}
                                                            rank={rk}
                                                            isActive={isActive}
                                                            nextActive={rank >= rk + 1}
                                                            cap={cap}
                                                            resolvedDice={getResolvedDice(iri, rk)}
                                                            theme="amber"
                                                            shape="gem"
                                                            {...lockProps(rk, 'prestige')}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    if (!validateAcquire(rk, rank, 'prestige', iri)) return;
                                                                    setRankBySourceIndex(v => v.source === 'prestige', vIdx, rk);
                                                                } else {
                                                                    setRankBySourceIndex(v => v.source === 'prestige', vIdx, rk - 1);
                                                                }
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Add Prestige Voie Button */}
                        <div className="flex flex-col items-center gap-1 pt-4">
                            <button
                                onClick={addPrestige}
                                disabled={atVoieCap || hasPrestige}
                                title={hasPrestige ? 'Une seule voie de prestige par personnage (COF2)' : atVoieCap ? `Maximum ${MAX_VOIES} voies (hors voie de peuple)` : 'Prérequis : niveau 5+, et généralement rang 2 dans 3 voies du même profil'}
                                className="flex items-center gap-2 px-6 py-3 rounded-full bg-stone-900/50 border border-amber-500/30 text-amber-500/70 hover:text-amber-400 hover:border-amber-500/50 hover:bg-stone-900 transition-all group font-display font-bold uppercase text-[10px] tracking-[0.2em] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-amber-500/70 disabled:hover:border-amber-500/30 disabled:hover:bg-stone-900/50"
                            >
                                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                Ajouter une Voie de Prestige
                            </button>
                            {atVoieCap && (
                                <span className="text-[9px] uppercase tracking-wider text-stone-600">Maximum {MAX_VOIES} voies (hors peuple)</span>
                            )}
                            {hasPrestige ? (
                                <span className="text-[9px] uppercase tracking-wider text-amber-700/70">Une seule voie de prestige (COF2)</span>
                            ) : (
                                <span className="text-[9px] tracking-wider text-stone-600 italic normal-case">Prérequis : niveau 5+, généralement rang 2 dans 3 voies du même profil (le rang 4 d'une voie pour une voie de spécialiste).</span>
                            )}
                        </div>
                    </div>
    );
};
