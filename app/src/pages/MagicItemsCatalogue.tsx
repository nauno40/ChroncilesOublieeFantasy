import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dices } from 'lucide-react';
import { PageContainer, SearchToolbar, CompendiumTable, EmptyState } from '../components/common';
import { useSearch } from '../hooks';
import { catalogueObjetsMagiques, type ObjetMagiqueOfficiel } from '../domain/magicItems';
import { COLONNES_TABLE, LABEL_NOM } from '../domain/tablesCompendium';

/**
 * Catalogue officiel des objets magiques.
 *
 * L'onglet « Officiel » de cette page montrait le générateur (évaluateur de valeur et
 * tables de tirage) là où l'onglet communautaire montrait des objets : deux natures de
 * contenu sous le même titre, impossibles à comparer. Les objets existent pourtant dans
 * les règles — nommés à l'intérieur des tables de tirage. Cette page les rend consultables
 * sans jet de dé, dans la même table que les créations communautaires. Le générateur, lui,
 * est resté entier dans les outils du MJ.
 */
const NATURES = [
    { id: 'tous', label: 'Tous' },
    { id: 'objet', label: 'Objets' },
    { id: 'propriete', label: 'Propriétés' },
];

export const MagicItemsCatalogue: React.FC = () => {
    const objets = useMemo(() => catalogueObjetsMagiques(), []);
    const [nature, setNature] = useState('tous');

    const visibles = useMemo(
        () => (nature === 'tous' ? objets : objets.filter(o => o.nature === nature)),
        [objets, nature],
    );

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        visibles,
        (o: ObjetMagiqueOfficiel, term) => (o.nom + ' ' + o.type + ' ' + o.source).toLowerCase().includes(term.toLowerCase()),
    );

    return (
        <PageContainer>
            <SearchToolbar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Rechercher un objet magique…"
                count={{ n: filteredItems.length, singulier: 'objet' }}
                chips={NATURES}
                chipActif={nature}
                onChipChange={setNature}
                action={(
                    <Link
                        to="/tools/magic-items"
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm px-4 py-3 rounded-xl transition-all whitespace-nowrap"
                    >
                        <Dices size={16} /> Générer / évaluer
                    </Link>
                )}
            />

            {filteredItems.length === 0 ? (
                <EmptyState message="Aucun objet magique trouvé" />
            ) : (
                <CompendiumTable
                    colonnes={COLONNES_TABLE['objet-magique']}
                    labelNom={LABEL_NOM['objet-magique']}
                    lignes={filteredItems}
                    cle={o => o.nom}
                    nom={o => o.nom}
                    // Les règles ne donnent ni propriétés ni prix objet par objet : ces
                    // colonnes restent vides plutôt que d'être remplies par autre chose —
                    // y mettre la table d'origine dirait « propriété » pour désigner une
                    // source. La table figure sous le nom, là où une entrée communautaire
                    // porte sa description.
                    valeur={(o, key) => (key === 'type' ? o.type : key === 'rarity' ? o.rarete : undefined)}
                    detail={o => <div className="text-stone-400 text-xs mt-0.5 font-normal">{o.source}</div>}
                />
            )}

            <p className="text-[11px] text-stone-400 mt-3 italic">
                Ces objets sont ceux que nomment les tables du chapitre « Objets magiques ». Les règles ne
                leur donnent ni prix ni propriétés fixes : la valeur d'un objet se calcule d'après son
                niveau de magie, avec l'évaluateur du générateur.
            </p>
        </PageContainer>
    );
};
