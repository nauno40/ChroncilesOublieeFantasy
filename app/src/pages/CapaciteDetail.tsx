import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Capacity, Voie } from '../types/normalized';
import { DataService } from '../services/dataService';
import { CapaciteSheet } from '../components/sheets';
import { capacityToVM } from '../components/sheets/adapters/fromOfficial';

export const CapaciteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [capacite, setCapacite] = useState<Capacity | null>(null);
    const [voie, setVoie] = useState<Voie | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch the specific capability directly
                const foundCapacite = await DataService.getCapabilityById(id);
                setCapacite(foundCapacite);

                // Then fetch related data if relationships exist
                const voies = await DataService.getVoies();

                if (foundCapacite) {
                    // L'API n'expose pas `voieId` : elle renvoie `voie` en IRI
                    // (`/api/voies/7131`). `voieId` reste lu en repli pour les objets déjà
                    // renormalisés par d'autres pages consommatrices.
                    const voieRef = foundCapacite.voie ?? foundCapacite.voieId ?? undefined;
                    const voieIdFromRef = voieRef ? String(voieRef).split('/').pop() : undefined;
                    const foundVoie = voieIdFromRef ? voies.find(v => String(v.id) === voieIdFromRef) : null;
                    setVoie(foundVoie || null);
                }
            } catch (error) {
                console.error("Failed to fetch capacity details", error);
                setCapacite(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-primary-200">Chargement...</div>;
    if (!capacite) return <div className="p-8 text-center text-red-400">Capacité introuvable</div>;

    return <CapaciteSheet vm={capacityToVM(capacite, voie?.name, voie?.id)} backTo="/capacites" backLabel="Retour aux Capacités" />;
};
