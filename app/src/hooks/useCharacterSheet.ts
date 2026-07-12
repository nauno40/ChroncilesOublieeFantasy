import { useState, useEffect, useMemo, useRef } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { ApiService } from '../services/api';
import type { Character, CharacterData } from '../types/character';
import type { useCharacterData } from './useCharacterData';
import { CAPABILITY_MODIFIERS } from '../data/capabilityModifiers';
import {
  computeMaxHp,
  computeRecoveryDie,
  computeLuckPoints,
  computeFinalStats,
  computeSpentPoints,
  computeManaPoints,
  computeCombatStats,
  migrateLegacyStats,
  capacityBudget,
  evolutiveDie,
  MIN_STAT,
  MAX_STAT,
  STAT_SERIES,
} from '../utils/cofRules';

export const defaultData: CharacterData = {
    // COF2 : valeurs de caractéristiques directes (‑2 à +5). 0 = « moyen pour un humain ».
    stats: { FOR: 0, AGI: 0, CON: 0, INT: 0, PER: 0, CHA: 0, VOL: 0 },
    modifiers: { FOR: 0, AGI: 0, CON: 0, INT: 0, PER: 0, CHA: 0, VOL: 0 },
    hp: { current: 10, max: 10 },
    mp: { current: 0, max: 0 },
    attack: { contact: 0, distance: 0, magic: 0, weapons: [] },
    def: 10,
    init: 10,
    rp: { ideal: '', flaw: '' },
    luck: { current: 3, max: 3 },
    recovery: { die: 'd8', value: 0 },
    voies: {
        racial: { name: '', ranks: [false, false, false, false, false] },
        profile: Array(5).fill(null).map((_, i) => ({ name: `Voie ${i + 1}`, ranks: [false, false, false, false, false] })),
        prestige: []
    },
    protection: {
        armor: { name: '', def: 0 },
        shield: { name: '', def: 0 }
    },
    money: { pa: 0 },
    equipment: []
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

/**
 * État de formulaire, valeurs dérivées (via cofRules) et effets de synchronisation
 * de la fiche de personnage. Extrait verbatim de CharacterSheet.tsx — aucun
 * changement de comportement.
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
        // Default race/profile
        data: defaultData
    });

    // Racial Bonus Choices (Map of "Key" -> Choice)
    const [racialBonusChoices, setRacialBonusChoices] = useState<Record<string, string>>({});

    // Creation Mode
    // Creation Method is now always 'profile' for Level 0
    const [selectedProfileType, setSelectedProfileType] = useState<'polyvalent' | 'expert' | 'specialist'>('expert');

    // Voies Selection State (New Rules)
    const [selectedVoies, setSelectedVoies] = useState<string[]>(['', '', '']); // [Profile1, Profile2, Racial]
    const [mageReplacedRaceVoie, setMageReplacedRaceVoie] = useState(false);
    // Track where the mage bonus point is spent (Rank 2) - No longer needed as state, derived now.

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
                    // Ensure data structure exists
                    if (!data.data) data.data = defaultData;
                    // Migration COF2 : convertit les persos créés avec l'ancien modèle
                    // « score D&D » (9‑14) vers les valeurs de caractéristiques directes.
                    if (data.data.stats) {
                        data.data.stats = migrateLegacyStats(data.data.stats, data.data.modifiers);
                    }
                    setCharacter(data);
                })
                .catch(err => {
                    console.error(err);
                    alert("Erreur lors du chargement du personnage");
                    navigate('/characters');
                })
                .finally(() => setLoading(false));
        }
    }, [id, isNew, navigate]);

    // Derived Calculations
    const stats = character.data?.stats || defaultData.stats;

    // Caractéristiques effectives = valeurs de base + modificateurs de race (COF2). TOUS les
    // calculs de jeu (PV, DEF, Init, PC, PM, attaques) s'appuient sur ces valeurs, jamais sur
    // les valeurs de base seules — sinon le bonus racial de caractéristique ne se propagerait pas.
    const finalStats = useMemo(() => {
        const selectedRace = races.find(r => (r.name || r.nom) === character.race || r['@id'] === character.race);
        return computeFinalStats(stats, selectedRace?.modifiers, racialBonusChoices);
    }, [stats, character.race, races, racialBonusChoices]);
    // Les calculs de jeu utilisent la caractéristique effective (base + race), pas la base seule.
    const mods = finalStats;

    // Effect to update stored modifiers when stats change
    useEffect(() => {
        setCharacter(prev => ({
            ...prev,
            data: {
                ...prev.data!,
                modifiers: mods
            }
        }));
    }, [mods]);

    // Effect: Calculate Max HP (Level 1)
    useEffect(() => {
        if ((character.level || 0) > 1) return; // Run for Level 0/1

        const profileId = (character.profile as any)?.['@id'] || (typeof character.profile === 'string' ? character.profile : null);
        if (!profileId) return;

        const profile = profiles.find(p => p['@id'] === profileId);

        // Debug


        // Use hpPerLevel from profile (Base HP)
        // Formula: (2 * Base) + CON
        const baseHp = (profile as any)?.stats?.hpPerLevel
            || (profile as any)?.hpPerLevel
            || (profile as any)?.class?.stats?.hpPerLevel;



        if (baseHp) {
            const maxHp = computeMaxHp(baseHp, mods.CON);

            if (character.data?.hp?.max !== maxHp) {

                setCharacter(prev => ({
                    ...prev,
                    data: {
                        ...prev.data!,
                        hp: {
                            ...prev.data!.hp!,
                            max: maxHp,
                            current: maxHp // Also set current to max for new chars
                        }
                    }
                }));
            }
        }
    }, [character.level, character.profile, mods.CON, profiles]);

    // Compute Racial Voie Options
    const racialVoieOptions = useMemo(() => {
        const raceId = (character.race as any)?.['@id'] || (typeof character.race === 'string' ? character.race : null);

        if (!raceId) return [];

        const selectedRace = races.find(r => r['@id'] === raceId);
        if (!selectedRace) return [];

        let options = [...(selectedRace.availableVoies || [])];


        // Special Case: Demi-elfe
        if ((selectedRace.name || selectedRace.nom) === 'Demi-elfe') {
            const humanRace = races.find(r => (r.name || r.nom) === 'Humain');
            const highElfRace = races.find(r => (r.name || r.nom) === 'Elfe haut');
            const woodElfRace = races.find(r => (r.name || r.nom) === 'Elfe sylvain');

            if (humanRace?.availableVoies) options.push(...humanRace.availableVoies);
            // Include both elf types to be safe, user can choose
            if (highElfRace?.availableVoies) options.push(...highElfRace.availableVoies);
            if (woodElfRace?.availableVoies) options.push(...woodElfRace.availableVoies);

            // Deduplicate by name
            options = options.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
        }

        return options;
        return options;
    }, [character.race, races]);

    // Effect: Auto-select Racial Voie into Slot 3
    useEffect(() => {
        if (racialVoieOptions.length > 0 && !mageReplacedRaceVoie) {
            setSelectedVoies(prev => {
                const newVoies = [...prev];
                // Only update if empty or different (to avoid loops, though racial options change with race)
                if (newVoies[2] !== racialVoieOptions[0].name) {
                    newVoies[2] = racialVoieOptions[0].name;
                }
                return newVoies;
            });
        } else if (mageReplacedRaceVoie) {
            setSelectedVoies(prev => {
                const newVoies = [...prev];
                newVoies[2] = "Voie du Mage"; // Hardcoded for now, should check exact name in DB
                return newVoies;
            });
        }
    }, [racialVoieOptions, mageReplacedRaceVoie]);

    // Helper to check if current profile is a Mage family
    const isMageFamily = useMemo(() => {
        const profileId = (character.profile as any)?.['@id'] || (typeof character.profile === 'string' ? character.profile : null);
        if (!profileId) return false;
        const profile = profiles.find(p => p['@id'] === profileId);
        // Check family ID (normalized) or name
        return profile?.familyId === 'mages' || (profile?.family && profile.family.toLowerCase().includes('mage')) || (profile?.name && ['Magicien', 'Ensorceleur', 'Nécromancien', 'Forgesort', 'Invocateur', 'Archimage'].includes(profile.name));
    }, [character.profile, profiles]);

    // Reset Mage state if not mage
    useEffect(() => {
        if (!isMageFamily) {
            setMageReplacedRaceVoie(false);
        }
    }, [isMageFamily]);

    // Points de capacité : 2 par niveau (le niveau 0 de création équivaut au niveau 1).
    const maxStartingPoints = capacityBudget(character.level);

    const spentPoints = useMemo(() => computeSpentPoints(character.data?.voies, character.level, isMageFamily), [character.data, character.level, isMageFamily]);

    // Mémorise le dernier profil traité pour détecter un changement de classe.
    const lastProfileIdRef = useRef<string | null>(null);

    // Sync des voies du personnage depuis le profil sélectionné.
    //
    // Les noms/emplacements des voies de profil sont des données de référence
    // dérivées du profil. On distingue deux situations, quel que soit le niveau :
    //  - changement de classe : on reconstruit les 5 voies depuis le nouveau
    //    profil (les rangs de l'ancienne classe ne s'appliquent plus) ;
    //  - chargement initial / réouverture : on ne remplit que les emplacements
    //    vides ou encore sur le libellé par défaut « Voie N », ce qui préserve
    //    les rangs acquis et les voies de prestige ayant remplacé une voie.
    useEffect(() => {
        const profileId = (character.profile as any)?.['@id'] || (typeof character.profile === 'string' ? character.profile : null);
        // Vrai changement de classe (≠ premier chargement) : l'ancien profil
        // mémorisé diffère du nouveau.
        const profileChanged = !!profileId && lastProfileIdRef.current !== null && lastProfileIdRef.current !== profileId;
        if (profileId) lastProfileIdRef.current = profileId;

        setCharacter(prev => {
            const currentData = prev.data || defaultData;
            const currentProfileVoies = [...(currentData.voies?.profile || [])];
            const isCreation = character.level === 0;

            // Reconstruire les voies de profil depuis le profil sélectionné.
            if (profileId) {
                const profile = profiles.find(p => p['@id'] === profileId);
                // profile.voies contient des objets complets (nom + capacités) ;
                // allVoies ne sert que de repli au cas où ce seraient des IRIs.
                if (profile && profile.voies) {
                    profile.voies.forEach((vOrId: any, idx: number) => {
                        if (idx >= 5) return;

                        const voieData = typeof vOrId === 'object' ? vOrId : allVoies.find(v => v.id === vOrId || v['@id'] === vOrId || v.id === parseInt(vOrId));
                        if (!voieData) return;

                        const existing = currentProfileVoies[idx];
                        const name = existing?.name || '';
                        const isEmptyOrDefault = !name || /^Voie \d$/.test(name);

                        if (profileChanged) {
                            // Nouvelle classe : remplacer et repartir de zéro.
                            currentProfileVoies[idx] = { name: voieData.name, ranks: [false, false, false, false, false] };
                        } else if (isEmptyOrDefault) {
                            // Emplacement vide ou libellé par défaut : le renseigner
                            // depuis le profil, en conservant d'éventuels rangs déjà posés.
                            currentProfileVoies[idx] = { name: voieData.name, ranks: existing?.ranks || [false, false, false, false, false] };
                        }
                        // sinon : conserver (rangs acquis + voies de prestige)
                    });
                }
            }

            // La voie raciale n'est pilotée par selectedVoies que pendant la
            // création ; en édition on conserve la valeur sauvegardée.
            let currentRacialVoie = currentData.voies?.racial || { name: '', ranks: [false, false, false, false, false] };
            if (isCreation) {
                currentRacialVoie = { ...currentRacialVoie, name: selectedVoies[2] || '' };
                if (selectedVoies[2]) {
                    // Rang 1 racial automatiquement obtenu au niveau 0.
                    if (!currentRacialVoie.ranks) currentRacialVoie.ranks = [true, false, false, false, false];
                    currentRacialVoie.ranks[0] = true;
                } else {
                    currentRacialVoie.ranks = [false, false, false, false, false];
                }
            }

            return {
                ...prev,
                data: {
                    ...currentData,
                    voies: {
                        ...currentData.voies,
                        profile: currentProfileVoies,
                        racial: currentRacialVoie
                    }
                }
            };
        });

    }, [selectedVoies, character.level, character.profile, profiles, allVoies]);


    // Helper to add equipment
    const addEquipmentItem = (itemObj: any, currentData: CharacterData) => {
        // Handle Sets
        if (itemObj.set) {
            itemObj.set.forEach((subItem: any) => addEquipmentItem(subItem, currentData));
            return;
        }

        const item = itemObj.item;
        const stats = itemObj.stats || '';

        // 1. Detect Weapons (DM)
        if (stats.includes('DM')) {
            const weapons = [...(currentData.attack?.weapons || [])];
            // Parse DMG
            const dmgMatch = stats.match(/DM\s*(\d+d\d+)/i);
            const dmg = dmgMatch ? dmgMatch[1] : '';
            // Parse Special (everything else)
            let special = stats.replace(/DM\s*\d+d\d+/i, '').replace(/^,\s*/, '').trim();
            // Detect Range if present
            if (stats.includes('portée')) {
                // Keep it in special
            }

            weapons.push({ name: item, atkMod: 0, dmg, special });
            if (!currentData.attack) currentData.attack = { contact: 0, distance: 0, magic: 0, weapons: [] };
            currentData.attack.weapons = weapons;
        }
        // 2. Detect Armor/Shield (DEF)
        else if (stats.includes('DEF')) {
            const defMatch = stats.match(/DEF\s*\+(\d+)/i);
            const defVal = defMatch ? parseInt(defMatch[1]) : 0;

            if (item.toLowerCase().includes('bouclier')) {
                if (!currentData.protection) currentData.protection = { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } };
                currentData.protection.shield = { name: item, def: defVal };
            } else {
                if (!currentData.protection) currentData.protection = { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } };
                currentData.protection.armor = { name: item, def: defVal };
            }
        }
        // 3. Inventory (Everything else)
        else {
            const equipment = [...(currentData.equipment || [])];
            equipment.push(`${item} ${stats ? `(${stats})` : ''}`);
            currentData.equipment = equipment;
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (isNew) {
                // Rattachement à une campagne si la fiche est créée depuis « Ajouter un PJ ».
                const payload = campaignId ? { ...character, campaignId } : character;
                const res = await ApiService.post<Character>('characters', payload);
                navigate(campaignId ? `/campaign/${campaignId}` : `/characters/${res.id}`);
            } else if (id) {
                await ApiService.put<Character>('characters', id, character);
            }
            alert("Personnage enregistré !");
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const getCapabilityName = (voieName: string, rank: number) => {
        if (!voieName) return null;

        // Search in races (Racial Voies)
        for (const race of races) {
            if (race.availableVoies) {
                const foundVoie = race.availableVoies.find((v: any) => v.name === voieName);
                if (foundVoie && foundVoie.capabilities) {
                    const cap = foundVoie.capabilities.find((c: any) => c.rank === rank);
                    if (cap) return { name: cap.name, description: cap.description };
                }
            }
        }

        // Search in profiles (Profile Voies)
        for (const profile of profiles) {
            if (profile.voies) {
                const foundVoie = profile.voies.find((v: any) => v.name === voieName);
                if (foundVoie && foundVoie.capabilities) {
                    const cap = foundVoie.capabilities.find((c: any) => c.rank === rank);
                    if (cap) return { name: cap.name, description: cap.description };
                }
            }
        }

        // Search in standalone voies (notamment les voies de prestige, hors profil/race)
        for (const voie of allVoies) {
            if (voie?.name === voieName && voie.capabilities) {
                const cap = voie.capabilities.find((c: any) => c.rank === rank);
                if (cap) return { name: cap.name, description: cap.description };
            }
        }
        return null;
    };

    const updateStat = (stat: keyof typeof stats, value: string) => {
        const val = parseInt(value) || 0;

        // COF2 : la valeur de caractéristique se saisit directement, dans la plage ‑2..+5
        // (à la création on répartit une des trois séries — voir STAT_SERIES).
        if (character.level === 0) {
            if (val < MIN_STAT) return;
            if (val > MAX_STAT) return;
        }

        setCharacter(prev => ({
            ...prev,
            data: {
                ...prev.data!,
                stats: {
                    ...prev.data!.stats,
                    [stat]: val
                }
            }
        }));
    };

    // Remaining Points logic removed


    // Calculate Recovery Die
    const recoveryDieString = useMemo(() => {
        const profileName = profiles.find(p => p['@id'] === ((character.profile as any)?.['@id'] || character.profile))?.name;
        return computeRecoveryDie(profileName, mods.CON);
    }, [character.profile, profiles, mods.CON]);

    // Calculate Luck Points (PC)
    const luckPoints = useMemo(() => {
        const profileName = profiles.find(p => p['@id'] === ((character.profile as any)?.['@id'] || character.profile))?.name;
        return computeLuckPoints(profileName, mods.CHA, character.data?.voies?.racial);
    }, [character.profile, character.data?.voies?.racial, profiles, mods.CHA]);

    // Calculate Mana Points (PM)
    const manaPoints = useMemo(() => computeManaPoints(character.data?.voies, races, profiles, mods.VOL, mods.PER), [character.data?.voies, races, profiles, mods.VOL, mods.PER]);

    // Effect: Sync Luck Points and Recovery Die to Data
    useEffect(() => {
        // Sync Luck
        if (luckPoints !== undefined) {
            // Only update if different to avoid loops
            const currentLuckMax = character.data?.luck?.max;
            if (currentLuckMax !== luckPoints) {
                setCharacter(prev => ({
                    ...prev,
                    data: {
                        ...prev.data!,
                        luck: {
                            ...prev.data!.luck,
                            max: luckPoints,
                            // Optional: Reset current to max if it was equal to old max or 0?
                            // Let's just set current to max for now to simplify, or maybe keep it if user tracked something?
                            // Safety: if new max < current, clamp it?
                            // For simplicity: set current = max if this is a new char or explicitly desired.
                            // Let's set it to max.
                            current: luckPoints
                        }
                    }
                }));
            }
        }

        // Sync Recovery Die
        // We defer this slightly or do it in same pass?
        // We can't do two setCharacters in one render easily without functional update merging, which we do.
        // But doing it here might be racy if I used 'prev' in separate calls.
        // I'll assume I can just do another check.
    }, [luckPoints]);

    useEffect(() => {
        if (recoveryDieString) {
            const currentRecovery = character.data?.recovery?.die;
            if (currentRecovery !== recoveryDieString) {
                setCharacter(prev => ({
                    ...prev,
                    data: {
                        ...prev.data!,
                        recovery: {
                            ...prev.data!.recovery,
                            die: recoveryDieString
                        }
                    }
                }));
            }
        }
    }, [recoveryDieString]);

    useEffect(() => {
        if (manaPoints !== undefined) {
            const currentMpMax = character.data?.mp?.max;
            if (currentMpMax !== manaPoints) {
                setCharacter(prev => ({
                    ...prev,
                    data: {
                        ...prev.data!,
                        mp: {
                            ...prev.data!.mp!,
                            max: manaPoints,
                            current: manaPoints // Auto-fill current to max for now
                        }
                    }
                }));
            }
        }
    }, [manaPoints]);


    // Calculate Final Combat Stats (Init & Def)
    const combatStats = useMemo(() => computeCombatStats({
        voies: character.data?.voies,
        protection: character.data?.protection,
        races,
        profiles,
        perMod: mods.PER,
        agiMod: mods.AGI,
        capabilityModifiers: CAPABILITY_MODIFIERS,
    }), [mods.PER, mods.AGI, character.data?.protection, character.data?.voies, races, profiles]);

    // Sync Init/Def to Data
    useEffect(() => {
        if (character.data?.init !== combatStats.init || character.data?.def !== combatStats.def) {
            setCharacter(prev => ({
                ...prev,
                data: {
                    ...prev.data!,
                    init: combatStats.init,
                    def: combatStats.def
                }
            }));
        }
    }, [combatStats]);

    return {
        character, setCharacter,
        loading, saving,
        stats, mods, finalStats, combatStats,
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
        handleSave, updateStat, getCapabilityName, addEquipmentItem,
    };
};
