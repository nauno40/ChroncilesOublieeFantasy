import React, { useState, useEffect } from 'react';
import { getMonsters } from '../services/monsterService';
import { HomebrewService } from '../services/homebrewService';
import type { ReferencesDeclaration } from '../components/homebrew/HomebrewFields';
import { useParams, Link } from 'react-router-dom';
import { DataService } from '../services/dataService';
import type { Profile, Voie, Capacity, Family } from '../types/normalized';
import { ProfileSheet } from '../components/sheets';
import { profileToVM } from '../components/sheets/adapters/fromOfficial';
import { Loader2, ArrowLeft } from 'lucide-react';

const ClassDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<Profile | null>(null);

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
    const [family, setFamily] = useState<Family | undefined>(undefined);
    const [profileVoies, setProfileVoies] = useState<Voie[]>([]);
    const [capacities, setCapacities] = useState<Capacity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const [profiles, families] = await Promise.all([
                    DataService.getProfiles(),
                    DataService.getProfileFamilies(),
                ]);

                const foundProfile = profiles.find(p => String(p.id) === id);
                setProfile(foundProfile || null);

                if (foundProfile) {
                    if (foundProfile.family) {
                        if (typeof foundProfile.family === 'object' && 'id' in foundProfile.family) {
                            setFamily(foundProfile.family as Family);
                        } else if (typeof foundProfile.family === 'string') {
                            const famIdOrIri = foundProfile.family;
                            const famId = famIdOrIri.split('/').pop();
                            const matched = families.find(f => String(f.id) === famId);
                            if (matched) setFamily(matched);
                        }
                    }

                    const [voies, allCapacities] = await Promise.all([
                        DataService.getVoiesByProfile(foundProfile.id),
                        DataService.getCapabilities(),
                    ]);
                    setProfileVoies(voies);
                    setCapacities(allCapacities);
                }
            } catch (error) {
                console.error('Failed to fetch class details', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-primary-200">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Classe introuvable</h2>
                <Link to="/classes" className="text-primary-400 hover:text-primary-300 flex items-center justify-center gap-2">
                    <ArrowLeft size={20} /> Retour aux classes
                </Link>
            </div>
        );
    }

    return (
        <ProfileSheet
            references={references}
            vm={profileToVM(profile, profileVoies, capacities, family)}
            backTo="/classes"
            backLabel="Retour aux Classes"
        />
    );
};

export default ClassDetail;
