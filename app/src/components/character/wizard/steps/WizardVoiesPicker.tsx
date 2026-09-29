import React from 'react';
import clsx from 'clsx';
import { CapabilityNode } from '../../CapabilityNode';
import { canAcquireRank, rankUnlockLevel, type VoieKind } from '../../../../domain/rules';
import type { Character, CharacterVoieRef } from '../../../../types/character';
import type {
    GetCapabilityName, GetVoieName, GetResolvedDice, SelectedVoiesSetter, IsMageFamily, RacialVoieOptions,
} from '../../types';

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
}

const isProfil = (v: CharacterVoieRef) => v.source === 'profil' || v.source === 'hybride';

/**
 * Étape « Voies », version assistant : à la création (niveau 0), seul le rang 1 des voies
 * de profil est réellement en jeu — le rang 2 exige le niveau 2 (niveau 1 pour un mage,
 * COF2 Progression), et les rangs 3-5 un niveau que la création n'atteint jamais. Plutôt
 * que d'afficher les 5 rangs de chacune des 6 voies (`VoiesTree`, fiche classique), on ne
 * montre que ce qui est jouable ici : la voie de peuple (rang 1 déjà acquis d'office) et,
 * pour chaque voie de profil, un rang 1 à investir — plus un rang 2 bonus pour les mages
 * uniquement. Même validation que `VoiesTree` (`canAcquireRank`), sans reprendre son JSX.
 */
export const WizardVoiesPicker: React.FC<Props> = ({
    character, setCharacter, spentPoints, maxStartingPoints, isMageFamily,
    mageReplacedRaceVoie, setMageReplacedRaceVoie, racialVoieOptions, selectedVoies, setSelectedVoies,
    getCapabilityName, getVoieName, getResolvedDice,
}) => {
    const voies = character.characterVoies ?? [];
    const profilEntries = voies.filter(isProfil);
    const racialEntry = voies.find(v => v.source === 'peuple');
    const racialIri = selectedVoies[2] || '';
    const racialRank = racialEntry?.rank || 0;

    const countRank2 = (excludeVoieIri?: string): number =>
        voies.filter(v => v.source !== 'prestige' && v.voie !== excludeVoieIri && v.rank >= 2).length;

    const validateAcquire = (rank: number, currentRank: number, voieKind: VoieKind, voieIri: string): boolean => {
        const res = canAcquireRank(rank, rank === 1 || currentRank >= rank - 1, voieKind, {
            level: 0,
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

    const rank2Lock = (voieKind: VoieKind) => {
        const req = rankUnlockLevel(2, voieKind, isMageFamily);
        return { locked: 1 < req, lockedLabel: `Niv. ${req}` };
    };

    const setRacialRank = (newRank: number) =>
        setCharacter(prev => {
            const cv = [...(prev.characterVoies || [])];
            const idx = cv.findIndex(v => v.source === 'peuple');
            if (idx < 0) return prev;
            cv[idx] = { ...cv[idx], rank: Math.max(1, newRank) };
            return { ...prev, characterVoies: cv };
        });

    const setProfilRank = (nth: number, newRank: number) =>
        setCharacter(prev => {
            const cv = [...(prev.characterVoies || [])];
            const globalIdxs = cv.map((v, i) => (isProfil(v) ? i : -1)).filter(i => i >= 0);
            const target = globalIdxs[nth];
            if (target == null) return prev;
            cv[target] = { ...cv[target], rank: Math.max(0, newRank) };
            return { ...prev, characterVoies: cv };
        });

    const rank2Badge = (hasOtherRank2: boolean, isActive: boolean, currentRank: number) => {
        if (!isMageFamily) return undefined;
        if (isActive || (!hasOtherRank2 && currentRank >= 1)) {
            return <span className="text-green-400 ml-2 animate-pulse">(Gratuit)</span>;
        }
        return undefined;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-xl text-white">Vos voies</h2>
                <span className={clsx(
                    'text-xs px-3 py-1 rounded-full border',
                    spentPoints > maxStartingPoints ? 'bg-red-900/30 border-red-500 text-red-200'
                        : spentPoints === maxStartingPoints ? 'bg-green-900/30 border-green-500 text-green-200'
                            : 'bg-primary-900/30 border-primary-500 text-primary-200',
                )}>
                    Points restants : {maxStartingPoints - spentPoints} / {maxStartingPoints}
                </span>
            </div>

            {/* Voie de peuple */}
            <div className="glass-panel p-4 rounded-2xl border border-primary-500/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-primary-400/80 font-bold uppercase text-[11px] tracking-[0.2em]">
                        {mageReplacedRaceVoie ? 'Voie du Mage' : 'Héritage racial'}
                    </h3>
                    {isMageFamily && (
                        <button
                            type="button"
                            onClick={() => setMageReplacedRaceVoie(!mageReplacedRaceVoie)}
                            className={clsx(
                                'text-[11px] uppercase font-bold py-1 px-2 rounded border transition-all',
                                mageReplacedRaceVoie
                                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                    : 'bg-stone-950 border-stone-700 text-stone-400 hover:text-white',
                            )}
                        >
                            {mageReplacedRaceVoie ? 'Rétablir racial' : 'Remplacer (Mage)'}
                        </button>
                    )}
                </div>

                {racialVoieOptions.length > 1 && !(isMageFamily && mageReplacedRaceVoie) ? (
                    <select
                        aria-label="Voie de peuple"
                        className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-2 text-lg font-display font-bold text-white outline-none focus:border-primary-500/50 transition-all cursor-pointer appearance-none shadow-inner"
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
                    <div className="font-display font-bold text-xl text-white">
                        {getVoieName(racialIri) || racialVoieOptions[0]?.name || '...'}
                    </div>
                )}

                <CapabilityNode
                    rank={1}
                    isActive
                    nextActive={racialRank >= 2}
                    cap={getCapabilityName(racialIri, 1)}
                    resolvedDice={getResolvedDice(racialIri, 1)}
                    theme="primary"
                    shape="round"
                    onChange={() => { /* rang 1 gratuit/auto à la création */ }}
                />
                {isMageFamily && (
                    <CapabilityNode
                        rank={2}
                        isActive={racialRank >= 2}
                        nextActive={false}
                        cap={getCapabilityName(racialIri, 2)}
                        resolvedDice={getResolvedDice(racialIri, 2)}
                        theme="primary"
                        shape="round"
                        {...rank2Lock('racial')}
                        badge={rank2Badge(countRank2(racialIri) > 0, racialRank >= 2, racialRank)}
                        onChange={e => {
                            if (e.target.checked) {
                                if (!validateAcquire(2, racialRank, 'racial', racialIri)) return;
                                setRacialRank(2);
                            } else {
                                setRacialRank(1);
                            }
                        }}
                    />
                )}
            </div>

            {/* Voies de profil */}
            {profilEntries.map((entry, idx) => {
                const iri = entry.voie;
                const rank = entry.rank || 0;
                return (
                    <div key={iri || idx} className="glass-panel p-4 rounded-2xl border border-white/10 space-y-2">
                        <h3 className="text-stone-400/70 font-bold uppercase text-[11px] tracking-[0.2em]">{getVoieName(iri)}</h3>
                        <CapabilityNode
                            rank={1}
                            isActive={rank >= 1}
                            nextActive={rank >= 2}
                            cap={getCapabilityName(iri, 1)}
                            resolvedDice={getResolvedDice(iri, 1)}
                            theme="primary"
                            shape="gem"
                            onChange={e => {
                                if (e.target.checked) {
                                    if (!validateAcquire(1, rank, 'profile', iri)) return;
                                    setProfilRank(idx, 1);
                                } else {
                                    setProfilRank(idx, 0);
                                }
                            }}
                        />
                        {isMageFamily && (
                            <CapabilityNode
                                rank={2}
                                isActive={rank >= 2}
                                nextActive={false}
                                cap={getCapabilityName(iri, 2)}
                                resolvedDice={getResolvedDice(iri, 2)}
                                theme="primary"
                                shape="gem"
                                {...rank2Lock('profile')}
                                badge={rank2Badge(countRank2(iri) > 0, rank >= 2, rank)}
                                onChange={e => {
                                    if (e.target.checked) {
                                        if (!validateAcquire(2, rank, 'profile', iri)) return;
                                        setProfilRank(idx, 2);
                                    } else {
                                        setProfilRank(idx, 1);
                                    }
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
