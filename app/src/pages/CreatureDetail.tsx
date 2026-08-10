import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Creature, Family } from '../types';
import { DataService } from '../services/dataService';
import { getMonsters } from '../services/monsterService';
import { CreatureSheet } from '../components/sheets';
import { creatureToVM } from '../components/sheets/adapters/fromOfficial';
import { Loader } from '../components/common';
import type { ReferencesDeclaration } from '../components/homebrew/HomebrewFields';

/**
 * Fiche d'une créature du bestiaire officiel. La page se réduit à charger, mapper et
 * rendre : la présentation vit dans `CreatureSheet`, partagée avec les créatures maison
 * (cf. `CustomCreatureDetail`).
 */
export const CreatureDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [creature, setCreature] = useState<Creature | null>(null);
    const [familles, setFamilles] = useState<Family[]>([]);
    const [loading, setLoading] = useState(true);
    const [references, setReferences] = useState<ReferencesDeclaration>({
        etats: [],
        sources: { creatures: [], monstresMaison: [], armes: [], armures: [], communautaire: [] },
    });

    useEffect(() => {
        if (!id) return;
        Promise.all([DataService.getCreatureById(id), DataService.getFamilies()])
            .then(([creatureData, famillesData]) => {
                setCreature(creatureData);
                setFamilles(famillesData as unknown as Family[]);
            })
            .catch(e => console.error('Échec du chargement de la créature', e))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        // Les liens de déclaration ont besoin des entités existantes ; un échec ne prive la
        // page que de ses pastilles, jamais de ses capacités.
        Promise.all([
            DataService.getStates().catch(() => []),
            DataService.getCreatures().catch(() => []),
            DataService.getWeapons().catch(() => []),
            DataService.getArmors().catch(() => []),
            getMonsters().catch(() => []),
        ]).then(([etats, creatures, armes, armures, monstresMaison]) => {
            setReferences({ etats, sources: { creatures, monstresMaison, armes, armures, communautaire: [] } });
        });
    }, []);

    if (loading) return <Loader />;

    if (!creature) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Créature introuvable</h2>
                <Link to="/creatures" className="text-primary-400 hover:text-primary-300 flex items-center justify-center gap-2">
                    <ArrowLeft size={20} /> Retour aux créatures
                </Link>
            </div>
        );
    }

    // L'entité ne porte que le nom de sa famille ; la description vient de la collection.
    const nomFamille = creature.family?.name;
    const descriptionFamille = nomFamille
        ? familles.find(f => f.name === nomFamille)?.description
        : undefined;

    return (
        <CreatureSheet
            vm={creatureToVM(creature, descriptionFamille)}
            backTo="/creatures"
            backLabel="Retour aux créatures"
            references={references}
        />
    );
};
