import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

/**
 * Charge les données de référence du compendium nécessaires à la fiche de
 * personnage : races, profils, armes, armures, voies et voies de prestige.
 *
 * Aucune logique de règles ici — uniquement les fetchs (extraits verbatim de
 * CharacterSheet.tsx).
 */
export const useCharacterData = () => {
    const [races, setRaces] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [allWeapons, setAllWeapons] = useState<any[]>([]);
    const [allArmors, setAllArmors] = useState<any[]>([]);
    const [allVoies, setAllVoies] = useState<any[]>([]); // Store all voies for lookup
    const [prestigePaths, setPrestigePaths] = useState<any[]>([]); // New state for Prestige Paths

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                // Fetch all equipment and filter client-side or use filter if API supports
                // Assuming getAll returns mixed or valid typed list
                const weapons = await ApiService.getAll<any>('equipment?type=Arme');
                const armors = await ApiService.getAll<any>('equipment?type=Armure');
                // Fallback if API doesn't support type filter:
                if (weapons.length === 0 && armors.length === 0) {
                    const all = await ApiService.getAll<any>('equipment');
                    // Filter and normalize based on actual API types
                    const processed = all.map((i: any) => {
                        const priceStr = i.price?.toString() || '';
                        // Defense can be in acBonus (new API) or price (old JSON fallback)
                        const def = i.acBonus ? parseInt(i.acBonus) : (priceStr.startsWith('+') ? parseInt(priceStr.replace('+', '')) : 0);
                        return { ...i, defense: i.defense || def, value: i.value || def };
                    });

                    const w = processed.filter((i: any) =>
                        i.type?.includes('Distance') ||
                        i.type?.includes('Contact') ||
                        ((parseInt(i.id) || parseInt(i['@id']?.split('/').pop())) >= 2 && (parseInt(i.id) || parseInt(i['@id']?.split('/').pop())) <= 36)
                    );
                    const a = processed.filter((i: any) =>
                        i.type === 'Corps' ||
                        i.type === 'Bouclier' ||
                        i.type?.includes('Armure') ||
                        ((parseInt(i.id) || parseInt(i['@id']?.split('/').pop())) >= 38 && (parseInt(i.id) || parseInt(i['@id']?.split('/').pop())) <= 46)
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
                const voiesData = await ApiService.getAll<any>('voies');
                setAllVoies(voiesData);

                // Fetch Prestige Paths
                setPrestigePaths(voiesData.filter((v: any) => v.category === 'Prestige' || v.type === 'Prestige' || v.description?.includes('Prestige')));
            } catch (e) {
                console.error("Failed to fetch equipment or voies", e);
            }
        };
        fetchEquipment();
    }, []);

    useEffect(() => {
        // Fetch Dependencies
        ApiService.getAll<any>('races').then(data => {

            setRaces(data);
        });
        ApiService.getAll<any>('profiles').then(setProfiles);
    }, []);

    return { races, profiles, allWeapons, allArmors, allVoies, prestigePaths };
};
