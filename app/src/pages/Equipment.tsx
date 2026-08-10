import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer, SearchToolbar, EmptyState, Loader, CompendiumTable } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';
import { COLONNES_TABLE, LABEL_NOM, modDegats, sousTypeEquipement } from '../domain/tablesCompendium';

import type { Weapon, Armor, Material } from '../types/normalized';

export const Equipment: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'weapons';
    const initialQuery = searchParams.get('q') || '';

    const [weapons, setWeapons] = React.useState<Weapon[]>([]);
    const [armors, setArmors] = React.useState<Armor[]>([]);
    const [materials, setMaterials] = React.useState<Material[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        Promise.all([
            // `getEquipment` et non `getWeapons` : cette dernière écarte déjà les boucliers,
            // si bien que le Petit et le Grand bouclier — présents dans la table du livre et
            // servis par l'API — n'apparaissaient dans AUCUN onglet de cette page.
            DataService.getEquipment<Weapon>(),
            DataService.getMaterials()
        ])
            .then(([allEquipment, m]) => {
                // L'API ignore le paramètre `type` : le tri se fait ici. La règle est celle
                // de `sousTypeEquipement`, partagée avec la liste communautaire — sans quoi
                // une même arme pourrait être rangée en armure d'un côté seulement.
                const actualWeapons = allEquipment.filter(item => sousTypeEquipement(item) === 'arme');
                const actualArmors = allEquipment.filter(item => sousTypeEquipement(item) === 'armure');

                setWeapons(actualWeapons);
                setArmors(actualArmors as unknown as Armor[]);
                setMaterials(m);
            })
            .catch(err => {
                console.error("Equipment load error:", err);
                setError(err instanceof Error ? err.message : 'Une erreur est survenue');
            })
            .finally(() => setLoading(false));
    }, []);

    const weaponSearch = useSearch(weapons, (w, term) => w.name.toLowerCase().includes(term.toLowerCase()), initialTab === 'weapons' ? initialQuery : '');
    const armorSearch = useSearch(armors, (a, term) => a.name.toLowerCase().includes(term.toLowerCase()), initialTab === 'armors' ? initialQuery : '');
    const materialSearch = useSearch(materials, (m, term) => m.name.toLowerCase().includes(term.toLowerCase()), initialTab === 'materials' ? initialQuery : '');

    // Sous-types de la page. Ils vivaient dans un second système d'onglets empilé sous le
    // filtre de source : deux grammaires visuelles pour la même intention, restreindre ce
    // qu'on regarde. Ce sont désormais des pastilles dans la barre de recherche, avec
    // laquelle elles font corps.
    const [sousType, setSousType] = useState<'weapons' | 'armors' | 'materials'>(
        (initialTab as 'weapons' | 'armors' | 'materials') ?? 'weapons');

    const CHIPS = [
        { id: 'weapons', label: 'Armes' },
        { id: 'armors', label: 'Armures' },
        { id: 'materials', label: 'Matériel' },
    ];

    const recherche = sousType === 'weapons' ? weaponSearch : sousType === 'armors' ? armorSearch : materialSearch;
    const invite = sousType === 'weapons' ? 'Rechercher une arme…'
        : sousType === 'armors' ? 'Rechercher une armure…' : 'Rechercher un matériel…';
    const singulier = sousType === 'weapons' ? 'arme' : sousType === 'armors' ? 'armure' : 'matériel';

    return (
        <PageContainer>

            {loading ? (
                <Loader />
            ) : error ? (
                <div className="p-8 text-center text-red-400">
                    <p>Erreur lors du chargement des équipements :</p>
                    <code className="text-sm bg-black/20 p-1 rounded block mt-2">{error}</code>
                </div>
            ) : (
                <div className="space-y-4">
                    <SearchToolbar
                        value={recherche.searchTerm}
                        onChange={recherche.setSearchTerm}
                        placeholder={invite}
                        chips={CHIPS}
                        chipActif={sousType}
                        onChipChange={id => setSousType(id as 'weapons' | 'armors' | 'materials')}
                        count={{ n: recherche.filteredItems.length, singulier, pluriel: singulier === 'matériel' ? 'matériels' : undefined }}
                    />
                    {(() => { const activeTab = sousType; return (
                        <>
                            {activeTab === 'weapons' && (
                                <div className="space-y-4">
                                    {weaponSearch.filteredItems.length === 0 ? (
                                        <EmptyState message="Aucune arme trouvée" />
                                    ) : (
                                        <CompendiumTable
                                            colonnes={COLONNES_TABLE.arme}
                                            labelNom={LABEL_NOM.arme}
                                            lignes={weaponSearch.filteredItems}
                                            cle={item => item.id ?? item.name}
                                            nom={item => item.name}
                                            valeur={(item, key) => (key === 'mod' ? modDegats(item.type) : (item as unknown as Record<string, unknown>)[key])}
                                        />
                                    )}
                                </div>
                            )}

                            {activeTab === 'armors' && (
                                <div className="space-y-4">
                                    {armorSearch.filteredItems.length === 0 ? (
                                        <EmptyState message="Aucune armure trouvée" />
                                    ) : (
                                        <CompendiumTable
                                            colonnes={COLONNES_TABLE.armure}
                                            labelNom={LABEL_NOM.armure}
                                            lignes={armorSearch.filteredItems}
                                            cle={item => item.id ?? item.name}
                                            nom={item => item.name}
                                        />
                                    )}
                                </div>
                            )}

                            {activeTab === 'materials' && (
                                <div className="space-y-4">
                                    {materialSearch.filteredItems.length === 0 ? (
                                        <EmptyState message="Aucun matériel trouvé" />
                                    ) : (
                                        <CompendiumTable
                                            colonnes={COLONNES_TABLE.materiel}
                                            labelNom={LABEL_NOM.materiel}
                                            lignes={materialSearch.filteredItems}
                                            cle={item => item.id ?? item.name}
                                            nom={item => item.name}
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    ); })()}
                </div>
            )}
        </PageContainer>
    );
};
