import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { CustomCreature } from '../types';
import { getMonster, getMonsters, deleteMonster, createMonster } from '../services/monsterService';
import { DataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { CreatureSheet, OwnerBar } from '../components/sheets';
import { customCreatureToVM } from '../components/sheets/adapters/fromCustomCreature';
import { Loader } from '../components/common';
import type { ReferencesDeclaration } from '../components/homebrew/HomebrewFields';

/**
 * Fiche d'une créature maison ou communautaire.
 *
 * Elle n'existait pas : une créature maison ne se consultait qu'en rouvrant son formulaire
 * d'édition, et un visiteur qui n'en était pas l'auteur ne pouvait donc pas la lire du
 * tout. Cette page rend la même `CreatureSheet` que le bestiaire officiel ; l'unique delta
 * est `OwnerBar`, posée en `header`.
 */
export const CustomCreatureDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [creature, setCreature] = useState<CustomCreature | null>(null);
    const [loading, setLoading] = useState(true);
    const [duplication, setDuplication] = useState(false);
    const [references, setReferences] = useState<ReferencesDeclaration>({
        etats: [],
        sources: { creatures: [], monstresMaison: [], armes: [], armures: [], communautaire: [] },
    });

    useEffect(() => {
        if (!id) return;
        getMonster(id)
            .then(setCreature)
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
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

    const mienne = creature.authorId === user?.id;

    const supprimer = async () => {
        if (!confirm(`Supprimer « ${creature.name} » ? Cette action est définitive.`)) return;
        await deleteMonster(creature.id);
        navigate('/creatures');
    };

    const dupliquer = async () => {
        setDuplication(true);
        try {
            // Une copie part toujours privée : elle est à son nouveau propriétaire, pas
            // republiée en son nom sans qu'il l'ait décidé.
            const { id: _id, authorId: _auteur, authorPseudo: _pseudo, ...reste } = creature;
            const copie = await createMonster({ ...reste, name: `${creature.name} (copie)`, visibility: 'private' });
            navigate(`/creatures/maison/${copie.id}`);
        } finally {
            setDuplication(false);
        }
    };

    return (
        <CreatureSheet
            vm={customCreatureToVM(creature)}
            backTo="/creatures"
            backLabel="Retour aux créatures"
            references={references}
            header={(
                <OwnerBar
                    pseudo={creature.authorPseudo}
                    visibility={creature.visibility ?? 'private'}
                    mine={mienne}
                    duplicating={duplication}
                    onEdit={mienne ? () => navigate('/tools/monsters', { state: { editerId: creature.id, retour: location.pathname } }) : undefined}
                    onDuplicate={dupliquer}
                    onDelete={mienne ? supprimer : undefined}
                />
            )}
        />
    );
};
