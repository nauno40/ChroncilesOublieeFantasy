import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Capacity, Voie } from '../types/normalized';
import { DataService } from '../services/dataService';
import { CapaciteSheet } from '../components/sheets';
import { getMonsters } from '../services/monsterService';
import { HomebrewService } from '../services/homebrewService';
import type { ReferencesDeclaration } from '../components/homebrew/HomebrewFields';
import { capacityToVM } from '../components/sheets/adapters/fromOfficial';

export const CapaciteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [capacite, setCapacite] = useState<Capacity | null>(null);

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

    return <CapaciteSheet vm={capacityToVM(capacite, voie?.name, voie?.id)} backTo="/capacites" backLabel="Retour aux Capacités" references={references} />;
};
