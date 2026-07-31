import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Race, Voie } from '../types/normalized';
import { DataService } from '../services/dataService';
import { RaceSheet } from '../components/sheets';
import { raceToVM } from '../components/sheets/adapters/fromOfficial';

export const RaceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [race, setRace] = useState<Race | null>(null);
    const [raceVoies, setRaceVoies] = useState<Voie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch all and filter client side
                const [races, voies] = await Promise.all([
                    DataService.getRaces(),
                    DataService.getVoies(),
                ]);

                const foundRace = races.find(r => String(r.id) === id);
                console.log("Race Detail - Found Race:", foundRace?.name, foundRace);
                setRace(foundRace || null);

                // Process available Voies (New Logic)
                if (foundRace && foundRace.availableVoies && foundRace.availableVoies.length > 0) {
                    console.log("Race Detail - Available Voies IRIs:", foundRace.availableVoies);
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
                }
                // Fallback to legacy field logic if no availableVoies
                else if (foundRace && foundRace.voieId) {
                    const foundVoie = voies.find(v => String(v.id) === foundRace.voieId);
                    if (foundVoie) {
                        setRaceVoies([foundVoie]);
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
            vm={raceToVM(race, raceVoies)}
            backTo="/races"
            backLabel="Retour aux Races"
        />
    );
};
