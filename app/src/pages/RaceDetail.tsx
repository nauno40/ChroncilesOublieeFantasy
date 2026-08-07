import React, { useState, useEffect } from 'react';
import { getMonsters } from '../services/monsterService';
import { HomebrewService } from '../services/homebrewService';
import type { ReferencesDeclaration } from '../components/homebrew/HomebrewFields';
import { useParams } from 'react-router-dom';
import type { Race, Voie, Capacity } from '../types/normalized';
import { DataService } from '../services/dataService';
import { RaceSheet } from '../components/sheets';
import { raceToVM } from '../components/sheets/adapters/fromOfficial';

export const RaceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [race, setRace] = useState<Race | null>(null);

    // Entités nécessaires à la résolution des liens de déclaration. La feuille est pure :
    // c'est la page qui charge. Un échec laisse la collection vide, donc aucune pastille.
    const [references, setReferences] = useState<ReferencesDeclaration>({
        etats: [],
        sources: { creatures: [], monstresMaison: [], armes: [], armures: [], communautaire: [] },
    });

    useEffect(() => {
        Promise.all([
            DataService.getStates().catch(() => []),
            DataService.getCreatures().catch(() => []),
            DataService.getWeapons().catch(() => []),
            DataService.getArmors().catch(() => []),
            getMonsters().catch(() => []),
            HomebrewService.getAll().catch(() => []),
        ]).then(([etats, creatures, armes, armures, monstresMaison, communautaire]) => {
            setReferences({ etats, sources: { creatures, monstresMaison, armes, armures, communautaire } });
        });
    }, []);
    const [raceVoies, setRaceVoies] = useState<Voie[]>([]);
    const [raceCapacities, setRaceCapacities] = useState<Capacity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch all and filter client side
                const [races, voies, capacities] = await Promise.all([
                    DataService.getRaces(),
                    DataService.getVoies(),
                    DataService.getCapabilities(),
                ]);

                const foundRace = races.find(r => String(r.id) === id);
                setRace(foundRace || null);

                // Process available Voies (New Logic)
                if (foundRace && foundRace.availableVoies && foundRace.availableVoies.length > 0) {
                    const voieIds = foundRace.availableVoies.map(iri => {
                        // Handle IRI string "/api/voies/123" or object
                        if (typeof iri === 'string') {
                            const parts = iri.split('/');
                            return parts[parts.length - 1];
                        }
                        return String((iri as Voie).id);
                    });

                    const foundVoies = voies.filter(v => voieIds.includes(String(v.id)));
                    setRaceVoies(foundVoies);

                    // Collect capabilities for all found voies
                    // Normalize capability voie reference to ID string
                    const allCaps = capacities.filter(c => {
                        const capVoieRef = c.voie || c.voieId; // Handle potential IRI in 'voie' or ID in 'voieId'
                        if (!capVoieRef) return false;

                        const capVoieId = String(capVoieRef).split('/').pop();
                        return foundVoies.some(v => String(v.id) === capVoieId);
                    }).sort((a, b) => (a.rank || 0) - (b.rank || 0));

                    setRaceCapacities(allCaps);
                }
                // Fallback to legacy field logic if no availableVoies
                else if (foundRace && foundRace.voieId) {
                    const foundVoie = voies.find(v => String(v.id) === foundRace.voieId);
                    if (foundVoie) {
                        setRaceVoies([foundVoie]);
                        const filteredCapacities = capacities
                            .filter(c => {
                                const capVoieRef = c.voie || c.voieId;
                                if (!capVoieRef) return false;
                                const capVoieId = String(capVoieRef).split('/').pop();
                                return String(capVoieId) === String(foundVoie.id);
                            })
                            .sort((a, b) => (a.rank || 0) - (b.rank || 0));
                        setRaceCapacities(filteredCapacities);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch race details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-primary-200">Chargement...</div>;

    if (!race) {
        return <div className="p-8 text-center text-red-400">Race introuvable</div>;
    }

    return (
        <RaceSheet
            references={references}
            vm={raceToVM(race, raceVoies, raceCapacities)}
            backTo="/races"
            backLabel="Retour aux Races"
        />
    );
};
