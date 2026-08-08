import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer, SearchToolbar, EmptyState, Loader } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';

import type { Weapon, Armor, Material } from '../types/normalized';

// Modificateur de dégâts : les armes de contact ajoutent la FOR (COF2).
const getDamageMod = (type: string) =>
    type && type.toLowerCase().includes('contact') ? '+ FOR' : '-';

// --- Cartes mobiles (la table large est réservée au desktop) ---

const Field: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (value === undefined || value === null || value === '' || value === '-') return null;
    return (
        <div className="min-w-0">
            <span className="text-stone-500 text-xs">{label} </span>
            <span className="text-stone-300 font-mono text-sm break-words">{value}</span>
        </div>
    );
};

const MobileCard: React.FC<{ name: string; price?: string | number; children?: React.ReactNode; footer?: string | null }> = ({ name, price, children, footer }) => (
    <div className="glass-panel rounded-xl p-4">
        <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display font-bold text-stone-100 leading-tight">{name}</h3>
            {price !== undefined && price !== '' && <span className="text-yellow-500/90 font-mono text-sm whitespace-nowrap">{price}</span>}
        </div>
        {children && <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">{children}</div>}
        {footer && <p className="text-xs text-amber-400/80 italic mt-2">{footer}</p>}
    </div>
);

const WeaponCard: React.FC<{ w: Weapon }> = ({ w }) => {
    const mod = getDamageMod(w.type);
    return (
        <MobileCard name={w.name} price={w.price} footer={w.requirements}>
            <Field label="Type" value={w.type} />
            <Field label="Dégâts" value={`${w.damage ?? ''}${mod !== '-' ? ' ' + mod : ''}`.trim()} />
            <Field label="Critique" value={w.critical} />
            <Field label="Portée" value={w.range} />
            <Field label="Rechargement" value={w.reload} />
        </MobileCard>
    );
};

const ArmorCard: React.FC<{ a: Armor }> = ({ a }) => (
    <MobileCard name={a.name} price={a.price} footer={a.comments}>
        <Field label="Type" value={a.type} />
        <Field label="Défense" value={a.acBonus ? `+${a.acBonus}` : undefined} />
    </MobileCard>
);

const MaterialCard: React.FC<{ m: Material }> = ({ m }) => (
    <MobileCard name={m.name} price={m.price} footer={m.notes} />
);

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
            DataService.getWeapons(), // API returns all equipment here
            DataService.getMaterials()
        ])
            .then(([allEquipment, m]) => {
                // Client-side filtering because API ignores type parameter
                const actualWeapons = allEquipment.filter((item: any) =>
                    !['Bouclier', 'Corps'].includes(item.type)
                );
                const actualArmors = allEquipment.filter((item: any) =>
                    ['Bouclier', 'Corps'].includes(item.type)
                );

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
                                      <>
                                        {/* Mobile : cartes empilées */}
                                        <div className="md:hidden space-y-3">
                                            {weaponSearch.filteredItems.map((weapon, i) => <WeaponCard key={i} w={weapon} />)}
                                        </div>
                                        {/* Desktop : table complète */}
                                        <div className="hidden md:block glass-panel rounded-xl overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/10 bg-black/20">
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Nom</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Type</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Dégâts</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Mod.</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Critique</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Portée</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Rechargement</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Spécial</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap text-right">Prix</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {weaponSearch.filteredItems.map((weapon, i) => (
                                                        <tr key={i} className="hover:bg-primary-500/5 transition-colors">
                                                            <td className="p-4 text-stone-200 font-bold">{weapon.name}</td>
                                                            <td className="p-4 text-stone-400 text-sm whitespace-nowrap">{weapon.type}</td>
                                                            <td className="p-4 text-stone-300 font-mono text-sm">{weapon.damage}</td>
                                                            <td className="p-4 text-stone-400 font-mono text-sm">{getDamageMod(weapon.type)}</td>
                                                            <td className="p-4 text-stone-400 font-mono text-sm">{weapon.critical || '-'}</td>
                                                            <td className="p-4 text-stone-400 font-mono text-sm whitespace-nowrap">{weapon.range || '-'}</td>
                                                            <td className="p-4 text-stone-400 text-sm whitespace-nowrap">{weapon.reload || '-'}</td>
                                                            <td className="p-4 text-amber-400/80 text-xs italic">{weapon.requirements}</td>
                                                            <td className="p-4 text-yellow-500/90 font-mono text-sm text-right whitespace-nowrap">{weapon.price}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                      </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'armors' && (
                                <div className="space-y-4">

                                    {armorSearch.filteredItems.length === 0 ? (
                                        <EmptyState message="Aucune armure trouvée" />
                                    ) : (
                                      <>
                                        <div className="md:hidden space-y-3">
                                            {armorSearch.filteredItems.map((armor, i) => <ArmorCard key={i} a={armor} />)}
                                        </div>
                                        <div className="hidden md:block glass-panel rounded-xl overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/10 bg-black/20">
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Nom</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Type</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Défense</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Notes</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap text-right">Prix</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {armorSearch.filteredItems.map((armor, i) => (
                                                        <tr key={i} className="hover:bg-primary-500/5 transition-colors">
                                                            <td className="p-4 text-stone-200 font-bold">{armor.name}</td>
                                                            <td className="p-4 text-stone-400 text-sm whitespace-nowrap">{armor.type}</td>
                                                            <td className="p-4 text-primary-400 font-mono font-bold whitespace-nowrap">
                                                                {armor.acBonus ? `+${armor.acBonus}` : '-'}
                                                            </td>
                                                            <td className="p-4 text-stone-400 text-sm italic">{armor.comments}</td>
                                                            <td className="p-4 text-yellow-500/90 font-mono text-sm text-right whitespace-nowrap">{armor.price}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                      </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'materials' && (
                                <div className="space-y-4">
                                    {materialSearch.filteredItems.length === 0 ? (
                                        <EmptyState message="Aucun matériel trouvé" />
                                    ) : (
                                      <>
                                        <div className="md:hidden space-y-3">
                                            {materialSearch.filteredItems.map((item, i) => <MaterialCard key={i} m={item} />)}
                                        </div>
                                        <div className="hidden md:block glass-panel rounded-xl overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/10 bg-black/20">
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Nom</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Notes</th>
                                                        <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap text-right">Prix</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {materialSearch.filteredItems.map((item, i) => (
                                                        <tr key={i} className="hover:bg-primary-500/5 transition-colors">
                                                            <td className="p-4 text-stone-200 font-bold">{item.name}</td>
                                                            <td className="p-4 text-stone-400 text-sm italic">{item.notes || '-'}</td>
                                                            <td className="p-4 text-yellow-500/90 font-mono text-sm text-right whitespace-nowrap">{item.price}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                      </>
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
