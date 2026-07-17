import { useState, useEffect, useMemo, useRef } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { ApiService } from '../services/api';
import type { Character, Caracs, PlayState, CharacterVoieRef } from '../types/character';
import type { useCharacterData } from './useCharacterData';
import { CAPABILITY_MODIFIERS } from '../data/capabilityModifiers';
import {
  computeMaxHp,
  computeHybridMaxHp,
  computeRecoveryDie,
  computeLuckPoints,
  computeFinalStats,
  computeSpentPoints,
  computeManaPoints,
  computeCombatStats,
  computeDamageReduction,
  computeLanguageSlots,
  computeItemBonuses,
  computeActiveStateBonuses,
  resolveCapabilityEffect,
  capacityBudget,
  evolutiveDie,
  MIN_STAT,
  MAX_STAT,
  STAT_SERIES,
  PROFILE_FAMILIES,
  type CompendiumVoie,
} from '../utils/cofRules';

// COF2 : valeurs de caractéristiques directes (‑2 à +5). 0 = « moyen pour un humain ».
export const defaultCaracs: Caracs = { AGI: 0, CON: 0, FOR: 0, PER: 0, CHA: 0, INT: 0, VOL: 0 };

// État de jeu par défaut : uniquement les `current` et les choix du joueur. Les valeurs
// dérivées (PV max, DEF, Init, PC, PM, dé de récup.) ne sont PAS stockées (cf. cofRules).
export const defaultPlayState: PlayState = {
  hp: { current: 0 },
  mana: { current: 0 },
  luck: { current: 0 },
  recovery: { used: 0 },
  money: { pa: 0 },
  equipment: [],
  rp: { ideal: '', flaw: '' },
  languages: [],
  protection: { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } },
  weapons: [],
};

export const ADVENTURER_PACK = [
    "Couverture",
    "Torche",
    "Briquet à silex",
    "Outre",
    "Gamelle"
];

type RefData = ReturnType<typeof useCharacterData>;

interface UseCharacterSheetArgs {
    races: RefData['races'];
    profiles: RefData['profiles'];
    allVoies: RefData['allVoies'];
    id: string | undefined;
    isNew: boolean;
    navigate: NavigateFunction;
    /** Rattache la fiche à une campagne à la création (bouton « Ajouter un PJ » côté MJ). */
    campaignId?: number;
}

/** Extrait l'IRI d'une valeur compendium (objet `{@id}`/`{id}` ou chaîne IRI). */
const toIri = (v: unknown): string => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    const o = v as { '@id'?: string; id?: number | string };
    return o['@id'] || (o.id != null ? `/api/voies/${o.id}` : '');
};

/**
 * État de formulaire, valeurs dérivées (via cofRules) et effets de synchronisation
 * de la fiche de personnage. Modèle Phase 2 : `caracs` / `playState` / `characterVoies`
 * (voies par IRI). Les valeurs dérivées sont calculées et retournées, jamais stockées.
 */
export const useCharacterSheet = ({ races, profiles, allVoies, id, isNew, navigate, campaignId }: UseCharacterSheetArgs) => {
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    // Equipment Choice State
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);
    const [equipmentChoiceQueue, setEquipmentChoiceQueue] = useState<any[]>([]);
    const [currentChoiceIndex, setCurrentChoiceIndex] = useState(0);

    // Form State
    const [character, setCharacter] = useState<Partial<Character>>({
        name: '',
        level: 0,
        caracs: { ...defaultCaracs },
        playState: { ...defaultPlayState },
        characterVoies: [],
    });

    // Racial Bonus Choices (Map of "Key" -> Choice)
    const [racialBonusChoices, setRacialBonusChoices] = useState<Record<string, string>>({});

    // Creation Method is now always 'profile' for Level 0
    const [selectedProfileType, setSelectedProfileType] = useState<'polyvalent' | 'expert' | 'specialist'>('expert');

    // Voies Selection State (création) — [Profile1, Profile2, Racial(IRI)]
    const [selectedVoies, setSelectedVoies] = useState<string[]>(['', '', '']);
    const [mageReplacedRaceVoie, setMageReplacedRaceVoie] = useState(false);

    // COF2 : séries de valeurs de caractéristiques à répartir (‑2 à +5), voir STAT_SERIES.
    const profileValues = useMemo(() => {
        switch (selectedProfileType) {
            case 'polyvalent': return STAT_SERIES.polyvalent;
            case 'expert': return STAT_SERIES.expert;
            case 'specialist': return STAT_SERIES.specialiste;
        }
    }, [selectedProfileType]);

    // Reset choice when race changes (use stable ID)
    const raceId = (character.race as any)?.['@id'] || (typeof character.race === 'string' ? character.race : '');
    useEffect(() => {
        setRacialBonusChoices({});
    }, [raceId]);

    const [showPrestigeSelector, setShowPrestigeSelector] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (!isNew && id) {
            ApiService.getOne<Character>('characters', id)
                .then(data => {
                    // Filet : garantir la présence des racines du modèle Phase 2.
                    setCharacter({
                        ...data,
                        caracs: { ...defaultCaracs, ...(data.caracs || {}) },
                        playState: { ...defaultPlayState, ...(data.playState || {}) },
                        characterVoies: data.characterVoies || [],
                    });
                })
                .catch(err => {
                    console.error(err);
                    alert("Erreur lors du chargement du personnage");
                    navigate('/characters');
                })
                .finally(() => setLoading(false));
        }
    }, [id, isNew, navigate]);

    // --- Dérivations (cofRules) — calculées, jamais stockées ---

    const caracs = character.caracs || defaultCaracs;
    const playState = character.playState || defaultPlayState;
    const characterVoies = useMemo(() => character.characterVoies || [], [character.characterVoies]);

    // Caractéristiques effectives = valeurs de base + modificateurs de race (COF2).
    const finalStats = useMemo(() => {
        const selectedRace = races.find(r => (r.name || r.nom) === character.race || r['@id'] === character.race);
        return computeFinalStats(caracs, selectedRace?.modifiers, racialBonusChoices);
    }, [caracs, character.race, races, racialBonusChoices]);
    const mods = finalStats;

    // Profil sélectionné (objet compendium).
    const selectedProfile = useMemo(() => {
        const profileId = (character.profile as any)?.['@id'] || (typeof character.profile === 'string' ? character.profile : null);
        return profileId ? profiles.find(p => p['@id'] === profileId) : undefined;
    }, [character.profile, profiles]);
    const profileName: string | undefined = selectedProfile?.name;

    // Famille du profil principal (COF2 : fixe, pilote PV niveau 1, DR, PC, défauts hybrides).
    const mainFamily = PROFILE_FAMILIES[profileName ?? '']?.id;

    // PV max (dérivé, COF2 chap. 9 — cas hybride géré par computeHybridMaxHp).
    const maxHp = useMemo(() => {
        const baseHp = (selectedProfile as any)?.stats?.hpPerLevel
            || (selectedProfile as any)?.hpPerLevel
            || (selectedProfile as any)?.class?.stats?.hpPerLevel;
        if (!baseHp) return playState.hp?.current || 0;
        const level = character.level || 1;
        if (!mainFamily) return computeMaxHp(baseHp, mods.CON, level);
        return computeHybridMaxHp(mainFamily, playState.hpByLevel, mods.CON, level);
    }, [selectedProfile, mainFamily, mods.CON, character.level, playState.hp?.current, playState.hpByLevel]);

    // RD (dérivé) : somme des bonus fixes des capacités acquises (voir cofRules).
    const damageReduction = useMemo(
        () => computeDamageReduction(characterVoies, races, profiles, allVoies, mods, character.level || 1),
        [characterVoies, races, profiles, allVoies, mods, character.level],
    );

    // Emplacements de langues (dérivé, COF2 création).
    const languageSlots = useMemo(() => computeLanguageSlots(mods.INT), [mods.INT]);

    // Résout une voie du compendium par IRI (peuple + profil + voies libres/prestige).
    const resolveVoieByIri = useMemo(() => {
        const byIri = new Map<string, any>();
        for (const r of races) for (const v of (r.availableVoies || [])) if (v?.['@id']) byIri.set(v['@id'], v);
        for (const p of profiles) for (const v of (p.voies || [])) if (v?.['@id']) byIri.set(v['@id'], v);
        for (const v of allVoies) if (v?.['@id']) byIri.set(v['@id'], v);
        return (iri: string) => byIri.get(iri);
    }, [races, profiles, allVoies]);

    // Résout le dé évolutif d'une capacité (voie + rang) au niveau courant, pour affichage.
    const getResolvedDice = (voieIri: string, rank: number): string | undefined => {
        const voie = resolveVoieByIri(voieIri) as CompendiumVoie | undefined;
        const cap = voie?.capabilities?.find((c) => c.rank === rank);
        return resolveCapabilityEffect(cap?.effect, { level: character.level || 1, rank, caracs: mods }).dice;
    };

    // Compute Racial Voie Options
    const racialVoieOptions = useMemo(() => {
        const rId = (character.race as any)?.['@id'] || (typeof character.race === 'string' ? character.race : null);
        if (!rId) return [];
        const selectedRace = races.find(r => r['@id'] === rId);
        if (!selectedRace) return [];

        let options = [...(selectedRace.availableVoies || [])];

        // Cas spécial : Demi-elfe (accès aux voies humaine + elfiques).
        if ((selectedRace.name || selectedRace.nom) === 'Demi-elfe') {
            const humanRace = races.find(r => (r.name || r.nom) === 'Humain');
            const highElfRace = races.find(r => (r.name || r.nom) === 'Elfe haut');
            const woodElfRace = races.find(r => (r.name || r.nom) === 'Elfe sylvain');
            if (humanRace?.availableVoies) options.push(...humanRace.availableVoies);
            if (highElfRace?.availableVoies) options.push(...highElfRace.availableVoies);
            if (woodElfRace?.availableVoies) options.push(...woodElfRace.availableVoies);
            options = options.filter((v, i, a) => a.findIndex(t => t['@id'] === v['@id']) === i);
        }
        return options;
    }, [character.race, races]);

    // IRI de la « Voie du Mage » (remplacement racial des mages), résolu par nom.
    const mageVoieIri = useMemo(() => {
        const found = allVoies.find((v: any) => /voie du mage/i.test(v?.name || ''));
        return found?.['@id'] || '';
    }, [allVoies]);

    // Effect: Auto-select Racial Voie into Slot 3 (par IRI)
    useEffect(() => {
        if (mageReplacedRaceVoie) {
            setSelectedVoies(prev => (prev[2] === mageVoieIri ? prev : [prev[0], prev[1], mageVoieIri]));
        } else if (racialVoieOptions.length > 0) {
            const firstIri = racialVoieOptions[0]['@id'];
            setSelectedVoies(prev => (prev[2] === firstIri ? prev : [prev[0], prev[1], firstIri]));
        }
    }, [racialVoieOptions, mageReplacedRaceVoie, mageVoieIri]);

    // Famille de mages ?
    const isMageFamily = useMemo(() => {
        if (!selectedProfile) return false;
        return selectedProfile?.familyId === 'mages'
            || (selectedProfile?.family && selectedProfile.family.toLowerCase().includes('mage'))
            || (selectedProfile?.name && ['Magicien', 'Ensorceleur', 'Nécromancien', 'Forgesort', 'Invocateur', 'Archimage'].includes(selectedProfile.name));
    }, [selectedProfile]);

    // Reset Mage state if not mage
    useEffect(() => {
        if (!isMageFamily) setMageReplacedRaceVoie(false);
    }, [isMageFamily]);

    // Points de capacité : 2 par niveau (le niveau 0 de création équivaut au niveau 1).
    const maxStartingPoints = capacityBudget(character.level);
    const spentPoints = useMemo(
        () => computeSpentPoints(characterVoies, character.level, isMageFamily),
        [characterVoies, character.level, isMageFamily],
    );

    // Mémorise le dernier profil traité pour détecter un changement de classe.
    const lastProfileIdRef = useRef<string | null>(null);

    // Synchronise `characterVoies` depuis le profil sélectionné et la voie de peuple choisie.
    //  - changement de classe : on reconstruit les voies de profil (rang 0) ;
    //  - chargement / réouverture : on ne rajoute que les voies de profil manquantes,
    //    ce qui préserve les rangs acquis, les voies hybrides et de prestige ;
    //  - à la création, la voie de peuple (IRI de selectedVoies[2]) est posée au rang 1 (gratuit).
    useEffect(() => {
        const profileId = (character.profile as any)?.['@id'] || (typeof character.profile === 'string' ? character.profile : null);
        const profileChanged = !!profileId && lastProfileIdRef.current !== null && lastProfileIdRef.current !== profileId;
        if (profileId) lastProfileIdRef.current = profileId;

        setCharacter(prev => {
            const cv = [...(prev.characterVoies || [])];
            const isCreation = character.level === 0;

            let profil = cv.filter(v => v.source === 'profil' || v.source === 'hybride');
            let peuple = cv.find(v => v.source === 'peuple');
            const prestige = cv.filter(v => v.source === 'prestige');

            if (profileId) {
                const profile = profiles.find(p => p['@id'] === profileId);
                const profileVoieIris = (profile?.voies || [])
                    .slice(0, 5)
                    .map((vOrId: any) => toIri(typeof vOrId === 'object' ? vOrId : allVoies.find(v => v.id === vOrId || v['@id'] === vOrId)))
                    .filter(Boolean);

                if (profileChanged) {
                    // Nouvelle classe : repartir de zéro pour les voies de profil.
                    profil = profileVoieIris.map((iri: string) => ({ voie: iri, rank: 0, source: 'profil' as const }));
                } else {
                    // Compléter : ajouter les voies de profil manquantes (rang 0), préserver l'existant.
                    profileVoieIris.forEach((iri: string) => {
                        if (!profil.some(v => v.voie === iri)) profil.push({ voie: iri, rank: 0, source: 'profil' as const });
                    });
                }
            }

            // Voie de peuple : pilotée par selectedVoies[2] uniquement à la création.
            if (isCreation) {
                const racialIri = selectedVoies[2] || '';
                if (racialIri) {
                    const keepRank = peuple?.voie === racialIri ? Math.max(1, peuple?.rank || 1) : 1;
                    peuple = { voie: racialIri, rank: keepRank, source: 'peuple', ...(peuple?.choices ? { choices: peuple.choices } : {}) };
                } else {
                    peuple = undefined;
                }
            }

            const nextCv: CharacterVoieRef[] = [...(peuple ? [peuple] : []), ...profil, ...prestige];
            return { ...prev, characterVoies: nextCv };
        });
    }, [selectedVoies, character.level, character.profile, profiles, allVoies]);

    // Helper to add equipment (écrit dans le playState)
    const addEquipmentItem = (itemObj: any, ps: PlayState) => {
        if (itemObj.set) {
            itemObj.set.forEach((subItem: any) => addEquipmentItem(subItem, ps));
            return;
        }
        const item = itemObj.item;
        const stats = itemObj.stats || '';

        if (stats.includes('DM')) {
            const dmgMatch = stats.match(/DM\s*(\d+d\d+)/i);
            const dmg = dmgMatch ? dmgMatch[1] : '';
            const special = stats.replace(/DM\s*\d+d\d+/i, '').replace(/^,\s*/, '').trim();
            ps.weapons = [...(ps.weapons || []), { name: item, atkMod: 0, dmg, special }];
        } else if (stats.includes('DEF')) {
            const defMatch = stats.match(/DEF\s*\+(\d+)/i);
            const defVal = defMatch ? parseInt(defMatch[1]) : 0;
            // Copie immuable pour ne jamais muter la protection partagée (defaultPlayState).
            const prot = { ...(ps.protection || { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } }) };
            if (item.toLowerCase().includes('bouclier')) prot.shield = { name: item, def: defVal };
            else prot.armor = { name: item, def: defVal };
            ps.protection = prot;
        } else {
            ps.equipment = [...(ps.equipment || []), `${item} ${stats ? `(${stats})` : ''}`];
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Les voies sans IRI (emplacements de prestige vides) ne sont pas persistables
            // (contrainte backend NotBlank) — on les écarte du payload.
            const cleaned: Partial<Character> = {
                ...character,
                characterVoies: (character.characterVoies || []).filter(v => v.voie),
            };
            if (isNew) {
                const payload = campaignId ? { ...cleaned, campaignId } : cleaned;
                const res = await ApiService.post<Character>('characters', payload);
                navigate(campaignId ? `/campaign/${campaignId}` : `/characters/${res.id}`);
            } else if (id) {
                await ApiService.put<Character>('characters', id, cleaned);
            }
            alert("Personnage enregistré !");
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    // Résout le nom + description d'une capacité d'une voie (par IRI) à un rang donné.
    const getCapabilityName = (voieIri: string, rank: number) => {
        if (!voieIri) return null;
        const voie = resolveVoieByIri(voieIri);
        const cap = voie?.capabilities?.find((c: any) => c.rank === rank);
        return cap ? { name: cap.name, description: cap.description } : null;
    };

    /** Nom d'affichage d'une voie (résolu par IRI dans le compendium). */
    const getVoieName = (voieIri: string): string => resolveVoieByIri(voieIri)?.name || '';

    const updateStat = (stat: keyof Caracs, value: string) => {
        const val = parseInt(value) || 0;
        // COF2 : valeur de caractéristique saisie directement, plage ‑2..+5 à la création.
        if (character.level === 0) {
            if (val < MIN_STAT) return;
            if (val > MAX_STAT) return;
        }
        setCharacter(prev => ({
            ...prev,
            caracs: { ...(prev.caracs || defaultCaracs), [stat]: val },
        }));
    };

    // Dé de récupération (dérivé).
    const recoveryDieString = useMemo(
        () => computeRecoveryDie(profileName, mods.CON),
        [profileName, mods.CON],
    );

    // Voie de peuple résolue (nom + rang) pour le calcul des PC.
    const racialVoieResolved = useMemo(() => {
        const peuple = characterVoies.find(v => v.source === 'peuple');
        if (!peuple) return undefined;
        return { name: resolveVoieByIri(peuple.voie)?.name, rank: peuple.rank };
    }, [characterVoies, resolveVoieByIri]);

    // Points de chance (PC, dérivé).
    const luckPoints = useMemo(
        () => computeLuckPoints(profileName, mods.CHA, racialVoieResolved),
        [profileName, mods.CHA, racialVoieResolved],
    );

    // Points de mana (PM, dérivé).
    const manaPoints = useMemo(
        () => computeManaPoints(characterVoies, races, profiles, mods.VOL, mods.PER),
        [characterVoies, races, profiles, mods.VOL, mods.PER],
    );

    // Init & Def (dérivés).
    const combatStats = useMemo(() => computeCombatStats({
        voies: characterVoies,
        protection: playState.protection,
        races,
        profiles,
        perMod: mods.PER,
        agiMod: mods.AGI,
        capabilityModifiers: CAPABILITY_MODIFIERS,
    }), [characterVoies, playState.protection, races, profiles, mods.PER, mods.AGI]);

    // À la création, les réserves (PV/PM/PC) démarrent au maximum. En édition, on ne
    // clobber PAS les `current` suivis par le joueur.
    useEffect(() => {
        if (!isNew) return;
        setCharacter(prev => {
            const ps = prev.playState || defaultPlayState;
            if (ps.hp?.current === maxHp && ps.mana?.current === manaPoints && ps.luck?.current === luckPoints) return prev;
            return {
                ...prev,
                playState: {
                    ...ps,
                    hp: { ...ps.hp, current: maxHp },
                    mana: { ...ps.mana, current: manaPoints },
                    luck: { ...ps.luck, current: luckPoints },
                },
            };
        });
    }, [isNew, maxHp, manaPoints, luckPoints]);

    // Bonus composés (objets magiques équipés + états actifs) — ajoutés aux dérivés ; cofRules inchangé.
    const gearBonuses = useMemo(() => computeItemBonuses(playState.magicItems), [playState.magicItems]);
    const stateBonuses = useMemo(() => computeActiveStateBonuses(playState.activeStates), [playState.activeStates]);
    const bonuses = {
        def: gearBonuses.def + stateBonuses.def, init: gearBonuses.init + stateBonuses.init,
        pv: gearBonuses.pv + stateBonuses.pv, rd: gearBonuses.rd + stateBonuses.rd,
        attaque: gearBonuses.attaque + stateBonuses.attaque, dm: gearBonuses.dm + stateBonuses.dm,
    };

    return {
        character, setCharacter,
        loading, saving,
        caracs, stats: caracs, mods, finalStats,
        combatStats: { init: combatStats.init + bonuses.init, def: combatStats.def + bonuses.def },
        maxHp: maxHp + bonuses.pv, mainFamily, damageReduction: damageReduction + bonuses.rd, languageSlots,
        bonuses,
        recoveryDieString, evolutiveDie: evolutiveDie(character.level), luckPoints, manaPoints,
        spentPoints, maxStartingPoints,
        selectedVoies, setSelectedVoies,
        selectedProfileType, setSelectedProfileType,
        racialBonusChoices, setRacialBonusChoices,
        racialVoieOptions,
        isMageFamily,
        mageReplacedRaceVoie, setMageReplacedRaceVoie,
        showPrestigeSelector, setShowPrestigeSelector,
        showEquipmentModal, setShowEquipmentModal,
        equipmentChoiceQueue, setEquipmentChoiceQueue,
        currentChoiceIndex, setCurrentChoiceIndex,
        profileValues,
        handleSave, updateStat, getCapabilityName, getVoieName, getResolvedDice, addEquipmentItem,
    };
};
