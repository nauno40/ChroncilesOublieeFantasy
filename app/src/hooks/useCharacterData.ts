import { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import type { RefRace, RefProfile, RefVoie, RefEquipmentItem } from '../types/compendiumRefs';

/**
 * Charge les données de référence du compendium nécessaires à la fiche de
 * personnage : races, profils, armes, armures, voies et voies de prestige.
 *
 * Passe par DataService (caché + `pagination=false` → collections *entières*).
 * Auparavant ce hook appelait ApiService en direct sur des endpoints paginés
 * ('voies', 'equipment'…) : le cache était contourné ET seuls ~30 items étaient
 * récupérés (voies tronquées, filtrage armes/armures jamais appliqué sur la liste
 * complète).
 */
export const useCharacterData = () => {
    const [races, setRaces] = useState<RefRace[]>([]);
    const [profiles, setProfiles] = useState<RefProfile[]>([]);
    const [allWeapons, setAllWeapons] = useState<RefEquipmentItem[]>([]);
    const [allArmors, setAllArmors] = useState<RefEquipmentItem[]>([]);
    const [allVoies, setAllVoies] = useState<RefVoie[]>([]); // Store all voies for lookup
    const [prestigePaths, setPrestigePaths] = useState<RefVoie[]>([]); // New state for Prestige Paths

    useEffect(() => {
        const load = async () => {
            try {
                const all = await DataService.getEquipment<RefEquipmentItem>();
                const idOf = (i: RefEquipmentItem) =>
                    parseInt(i.id as unknown as string) || parseInt(i['@id']?.split('/').pop() as unknown as string);
                // Normalisation : `value`/`defense` sont des champs calculés côté client
                // (absents de l'API brute) — la DEF peut venir de acBonus (API) ou du prix
                // (fallback JSON « +N »).
                const processed = all.map((i) => {
                    const priceStr = i.price?.toString() || '';
                    const def = i.acBonus ? parseInt(i.acBonus as unknown as string) : (priceStr.startsWith('+') ? parseInt(priceStr.replace('+', '')) : 0);
                    return { ...i, defense: i.defense || def, value: (i.value || def) as unknown as string };
                });

                setAllWeapons(processed.filter((i) =>
                    i.type?.includes('Distance') ||
                    i.type?.includes('Contact') ||
                    (idOf(i) >= 2 && idOf(i) <= 36)
                ));
                setAllArmors(processed.filter((i) =>
                    i.type === 'Corps' ||
                    i.type === 'Bouclier' ||
                    i.type?.includes('Armure') ||
                    (idOf(i) >= 38 && idOf(i) <= 46)
                ));

            } catch (e) {
                console.error("Échec du chargement de l'équipement", e);
            }
        };
        load();
    }, []);

    // Les voies se chargent SÉPARÉMENT de l'équipement. Elles partageaient le même bloc
    // `try`, après la normalisation des armes et armures : une exception dans ce traitement
    // laissait `allVoies` vide pour toujours, sans autre trace qu'un message de console. La
    // fiche affichait alors cinq emplacements de voie dont trois vides — le nom d'une voie
    // se résolvant depuis cette liste.
    useEffect(() => {
        DataService.getVoies()
            .then((data) => {
                const voiesData = data as unknown as RefVoie[];
                setAllVoies(voiesData);
                setPrestigePaths(voiesData.filter((v) => v.category === 'Prestige' || v.type === 'Prestige' || v.description?.includes('Prestige')));
            })
            .catch((e) => console.error('Échec du chargement des voies', e));
    }, []);

    useEffect(() => {
        DataService.getRaces().then(data => setRaces(data as unknown as RefRace[]));
        DataService.getProfiles().then(data => setProfiles(data as unknown as RefProfile[]));
    }, []);

    return { races, profiles, allWeapons, allArmors, allVoies, prestigePaths };
};
