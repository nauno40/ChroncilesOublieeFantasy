import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { RefRace, RefProfile, RefVoie, RefEquipmentItem } from '../types/compendiumRefs';

/**
 * Charge les données de référence du compendium nécessaires à la fiche de
 * personnage : races, profils, armes, armures, voies et voies de prestige.
 *
 * Aucune logique de règles ici — uniquement les fetchs (extraits verbatim de
 * CharacterSheet.tsx).
 */
export const useCharacterData = () => {
    const [races, setRaces] = useState<RefRace[]>([]);
    const [profiles, setProfiles] = useState<RefProfile[]>([]);
    const [allWeapons, setAllWeapons] = useState<RefEquipmentItem[]>([]);
    const [allArmors, setAllArmors] = useState<RefEquipmentItem[]>([]);
    const [allVoies, setAllVoies] = useState<RefVoie[]>([]); // Store all voies for lookup
    const [prestigePaths, setPrestigePaths] = useState<RefVoie[]>([]); // New state for Prestige Paths

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                // Fetch all equipment and filter client-side or use filter if API supports
                // Assuming getAll returns mixed or valid typed list
                const weapons = await ApiService.getAll<RefEquipmentItem>('equipment?type=Arme');
                const armors = await ApiService.getAll<RefEquipmentItem>('equipment?type=Armure');
                // Fallback if API doesn't support type filter:
                if (weapons.length === 0 && armors.length === 0) {
                    const all = await ApiService.getAll<RefEquipmentItem>('equipment');
                    // Filter and normalize based on actual API types
                    const processed = all.map((i) => {
                        const priceStr = i.price?.toString() || '';
                        // Defense can be in acBonus (new API) or price (old JSON fallback)
                        const def = i.acBonus ? parseInt(i.acBonus as unknown as string) : (priceStr.startsWith('+') ? parseInt(priceStr.replace('+', '')) : 0);
                        // `value`/`defense` sont des champs calculés côté client (absents de l'API
                        // brute) : cast nécessaire, la forme réelle de ces données est hétérogène
                        // (parfois un nombre déjà normalisé, cf. RefEquipmentItem).
                        return { ...i, defense: i.defense || def, value: (i.value || def) as unknown as string };
                    });

                    const w = processed.filter((i) =>
                        i.type?.includes('Distance') ||
                        i.type?.includes('Contact') ||
                        ((parseInt(i.id as unknown as string) || parseInt(i['@id']?.split('/').pop() as unknown as string)) >= 2 && (parseInt(i.id as unknown as string) || parseInt(i['@id']?.split('/').pop() as unknown as string)) <= 36)
                    );
                    const a = processed.filter((i) =>
                        i.type === 'Corps' ||
                        i.type === 'Bouclier' ||
                        i.type?.includes('Armure') ||
                        ((parseInt(i.id as unknown as string) || parseInt(i['@id']?.split('/').pop() as unknown as string)) >= 38 && (parseInt(i.id as unknown as string) || parseInt(i['@id']?.split('/').pop() as unknown as string)) <= 46)
                    );

                    console.log('DEBUG EQ: Filtered Weapons:', w.length, 'Filtered Armors:', a.length);
                    if (a.length > 0) console.log('DEBUG EQ: First Armor Example:', a[0]);

                    setAllWeapons(w);
                    setAllArmors(a);
                } else {
                    setAllWeapons(weapons);
                    setAllArmors(armors);
                }

                // Fetch All Voies
                const voiesData = await ApiService.getAll<RefVoie>('voies');
                setAllVoies(voiesData);

                // Fetch Prestige Paths
                setPrestigePaths(voiesData.filter((v) => v.category === 'Prestige' || v.type === 'Prestige' || v.description?.includes('Prestige')));
            } catch (e) {
                console.error("Failed to fetch equipment or voies", e);
            }
        };
        fetchEquipment();
    }, []);

    useEffect(() => {
        // Fetch Dependencies
        ApiService.getAll<RefRace>('races').then(data => {

            setRaces(data);
        });
        ApiService.getAll<RefProfile>('profiles').then(setProfiles);
    }, []);

    return { races, profiles, allWeapons, allArmors, allVoies, prestigePaths };
};
