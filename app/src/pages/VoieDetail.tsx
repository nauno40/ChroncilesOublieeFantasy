import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Voie, Capacity } from '../types/normalized';
import { DataService } from '../services/dataService';
import { VoieSheet } from '../components/sheets';
import { voieToVM } from '../components/sheets/adapters/fromOfficial';

export const VoieDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [voie, setVoie] = useState<Voie | null>(null);
    const [voieCapacities, setVoieCapacities] = useState<Capacity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch specific voie and its capabilities
                const [voieData, capabilities] = await Promise.all([
                    DataService.getVoieById(id),
                    DataService.getCapabilitiesByVoie(id)
                ]);

                // Normalize voie data if needed (similar to list view)
                const normalizedVoie = {
                    ...voieData,
                    profileId: voieData.profileId || ((voieData as any).profile ? String((voieData as any).profile).split('/').pop() : null) || null,
                    id: String(voieData.id)
                };

                setVoie(normalizedVoie);

                if (capabilities) {
                    setVoieCapacities(capabilities.sort((a, b) => (a.rank || 0) - (b.rank || 0)));
                }
            } catch (error) {
                console.error("Failed to fetch voie details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-primary-200">Chargement...</div>;
    if (!voie) return <div className="p-8 text-center text-red-400">Voie introuvable</div>;

    return <VoieSheet vm={voieToVM(voie, voieCapacities)} backTo="/voies" backLabel="Retour aux Voies" />;
};
