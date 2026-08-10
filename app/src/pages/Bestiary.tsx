import React, { useState, useMemo, useEffect } from 'react';
import type { Creature } from '../types';
import { getCreatureName, getCreatureLevel, getCreatureCategory, getCreatureFamily, getCreatureArchetype, getCreatureEnvironment, getCreatureSize, carteDepuisCreature } from '../domain/creature';
import { CreatureCard } from '../components/creature/CreatureCard';
import { X } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Loader, PageContainer, SearchToolbar, FilterPanel } from '../components/common';

export const Bestiary: React.FC = () => {
    const [creatures, setCreatures] = useState<Creature[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DataService.getCreatures()
            .then(setCreatures)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedFamily, setSelectedFamily] = useState<string>('');
    const [selectedArchetype, setSelectedArchetype] = useState<string>('');
    const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [minLevel, setMinLevel] = useState<number>(0);
    const [maxLevel, setMaxLevel] = useState<number>(30); // Assuming 30 is a reasonable max

    // Helper to extract family safely
    const getFamily = (c: Creature) => getCreatureFamily(c) || 'Sans famille';

    const filteredCreatures = useMemo(() => {
        return creatures.filter((creature) => {
            const name = getCreatureName(creature).toLowerCase();
            const category = getCreatureCategory(creature);
            const family = getFamily(creature);
            const archetype = getCreatureArchetype(creature);
            const environment = getCreatureEnvironment(creature);
            const size = getCreatureSize(creature);
            const level = getCreatureLevel(creature);

            const matchesSearch = name.includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory ? category === selectedCategory : true;
            const matchesFamily = selectedFamily ? family === selectedFamily : true;
            const matchesArchetype = selectedArchetype ? archetype === selectedArchetype : true;
            const matchesEnvironment = selectedEnvironment ? environment === selectedEnvironment : true;
            const matchesSize = selectedSize ? size === selectedSize : true;
            const matchesLevel = level >= minLevel && level <= maxLevel;

            return matchesSearch && matchesCategory && matchesFamily && matchesArchetype && matchesEnvironment && matchesSize && matchesLevel;
        });
    }, [creatures, searchTerm, selectedCategory, selectedFamily, selectedArchetype, selectedEnvironment, selectedSize, minLevel, maxLevel]);

    const categories = useMemo(() => {
        const cats = new Set(creatures.map(c => getCreatureCategory(c)).filter(Boolean));
        return Array.from(cats).sort();
    }, [creatures]);

    const families = useMemo(() => {
        const items = new Set(creatures.map(c => getFamily(c)).filter(Boolean));
        return Array.from(items).sort();
    }, [creatures]);

    const archetypes = useMemo(() => {
        const items = new Set(creatures.map(c => getCreatureArchetype(c)).filter(Boolean));
        return Array.from(items).sort();
    }, [creatures]);

    const environments = useMemo(() => {
        const items = new Set(creatures.map(c => getCreatureEnvironment(c)).filter(Boolean));
        return Array.from(items).sort();
    }, [creatures]);

    const sizes = useMemo(() => {
        const items = new Set(creatures.map(c => getCreatureSize(c)).filter(Boolean));
        return Array.from(items).sort();
    }, [creatures]);

    // Grouping Logic
    const groupedCreatures = useMemo(() => {
        const groups: Record<string, Creature[]> = {};
        filteredCreatures.forEach(c => {
            const family = getFamily(c);
            if (!groups[family]) groups[family] = [];
            groups[family].push(c);
        });
        // Sort families alphabetically
        const sortedKeys = Object.keys(groups).sort();
        return sortedKeys.reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {} as Record<string, Creature[]>);
    }, [filteredCreatures]);


    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setSelectedFamily('');
        setSelectedArchetype('');
        setSelectedEnvironment('');
        setSelectedSize('');
        setMinLevel(0);
        setMaxLevel(30);
    };

    const hasActiveFilters = Boolean(searchTerm || selectedCategory || selectedFamily || selectedArchetype || selectedEnvironment || selectedSize || minLevel > 0 || maxLevel < 30);

    if (loading) return <Loader />;

    return (
        <PageContainer>
            {/* Même barre que les autres pages de liste : le panneau collant, sa recherche
                maison et son bouton « Filtres » faisaient une quatrième grammaire pour la
                même intention. Les quatre sélecteurs deviennent des filtres avancés. */}
            <SearchToolbar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Rechercher une créature…"
                count={{ n: filteredCreatures.length, singulier: 'créature' }}
                filters={(
                    <FilterPanel hasActiveFilters={hasActiveFilters} onClearFilters={resetFilters}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-primary-500/70 uppercase tracking-wider ml-1">Famille</label>
                                <select aria-label="Famille"
                                    className="w-full bg-stone-900/50 border border-primary-500/20 text-stone-300 rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 transition-colors cursor-pointer hover:bg-stone-800/50"
                                    value={selectedFamily}
                                    onChange={(e) => setSelectedFamily(e.target.value)}
                                >
                                    <option value="">Toutes familles</option>
                                    {families.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-primary-500/70 uppercase tracking-wider ml-1">Catégorie</label>
                                <select aria-label="Catégorie"
                                    className="w-full bg-stone-900/50 border border-primary-500/20 text-stone-300 rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 transition-colors cursor-pointer hover:bg-stone-800/50"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">Toutes catégories</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-primary-500/70 uppercase tracking-wider ml-1">Archétype</label>
                                <select aria-label="Archétype"
                                    className="w-full bg-stone-900/50 border border-primary-500/20 text-stone-300 rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 transition-colors cursor-pointer hover:bg-stone-800/50"
                                    value={selectedArchetype}
                                    onChange={(e) => setSelectedArchetype(e.target.value)}
                                >
                                    <option value="">Tous archétypes</option>
                                    {archetypes.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-primary-500/70 uppercase tracking-wider ml-1">Environnement</label>
                                <select aria-label="Environnement"
                                    className="w-full bg-stone-900/50 border border-primary-500/20 text-stone-300 rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 transition-colors cursor-pointer hover:bg-stone-800/50"
                                    value={selectedEnvironment}
                                    onChange={(e) => setSelectedEnvironment(e.target.value)}
                                >
                                    <option value="">Tous environnements</option>
                                    {environments.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-primary-500/70 uppercase tracking-wider ml-1">Taille</label>
                                <select aria-label="Taille"
                                    className="w-full bg-stone-900/50 border border-primary-500/20 text-stone-300 rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 transition-colors cursor-pointer hover:bg-stone-800/50"
                                    value={selectedSize}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                >
                                    <option value="">Toutes tailles</option>
                                    {sizes.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-primary-500/70 uppercase tracking-wider ml-1">Niveau ({minLevel} - {maxLevel})</label>
                                <div className="flex items-center gap-2 bg-stone-900/50 border border-primary-500/20 rounded-lg px-3 py-2">
                                    <input
                                        aria-label="Niveau minimum"
                                        type="number"
                                        min="0" max="99"
                                        value={minLevel}
                                        onChange={e => setMinLevel(Math.min(parseInt(e.target.value) || 0, maxLevel))}
                                        className="w-full bg-transparent text-center text-stone-200 focus:outline-none focus:text-primary-400 font-mono font-bold"
                                    />
                                    <span className="text-primary-500/50 font-bold">-</span>
                                    <input
                                        aria-label="Niveau maximum"
                                        type="number"
                                        min="0" max="99"
                                        value={maxLevel}
                                        onChange={e => setMaxLevel(Math.max(parseInt(e.target.value) || 0, minLevel))}
                                        className="w-full bg-transparent text-center text-stone-200 focus:outline-none focus:text-primary-400 font-mono font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </FilterPanel>
                )}
            />

            {/* Filtres actifs, cliquables pour les retirer. */}
            {hasActiveFilters && (
                            <div className="flex flex-wrap gap-2 text-xs">
                                {selectedFamily && (
                                    <button onClick={() => setSelectedFamily('')} className="bg-primary-900/30 text-primary-300 border border-primary-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-red-900/30 hover:text-red-300 hover:border-red-500/30 transition-colors group">
                                        Famille: {selectedFamily} <X size={12} className="group-hover:scale-110" />
                                    </button>
                                )}
                                {selectedCategory && (
                                    <button onClick={() => setSelectedCategory('')} className="bg-primary-900/30 text-primary-300 border border-primary-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-red-900/30 hover:text-red-300 hover:border-red-500/30 transition-colors group">
                                        Cat: {selectedCategory} <X size={12} className="group-hover:scale-110" />
                                    </button>
                                )}
                                {selectedArchetype && (
                                    <button onClick={() => setSelectedArchetype('')} className="bg-primary-900/30 text-primary-300 border border-primary-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-red-900/30 hover:text-red-300 hover:border-red-500/30 transition-colors group">
                                        Arch: {selectedArchetype} <X size={12} className="group-hover:scale-110" />
                                    </button>
                                )}
                                {selectedEnvironment && (
                                    <button onClick={() => setSelectedEnvironment('')} className="bg-primary-900/30 text-primary-300 border border-primary-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-red-900/30 hover:text-red-300 hover:border-red-500/30 transition-colors group">
                                        Env: {selectedEnvironment} <X size={12} className="group-hover:scale-110" />
                                    </button>
                                )}
                                {selectedSize && (
                                    <button onClick={() => setSelectedSize('')} className="bg-primary-900/30 text-primary-300 border border-primary-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-red-900/30 hover:text-red-300 hover:border-red-500/30 transition-colors group">
                                        Taille: {selectedSize} <X size={12} className="group-hover:scale-110" />
                                    </button>
                                )}
                                {(minLevel > 0 || maxLevel < 30) && (
                                    <button onClick={() => { setMinLevel(0); setMaxLevel(30); }} className="bg-primary-900/30 text-primary-300 border border-primary-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-red-900/30 hover:text-red-300 hover:border-red-500/30 transition-colors group">
                                        Niv: {minLevel}-{maxLevel} <X size={12} className="group-hover:scale-110" />
                                    </button>
                                )}
                </div>
            )}

            <div className="space-y-12 pb-12">
                {Object.keys(groupedCreatures).length === 0 ? (
                    <div className="text-center py-20 bg-stone-900/40 rounded-3xl border border-white/5 border-dashed">
                        <p className="text-stone-400 font-display text-lg">Aucune créature ne correspond à vos recherches.</p>
                    </div>
                ) : (
                    Object.entries(groupedCreatures).map(([family, familyCreatures]) => (
                        <div key={family} className="space-y-4 animate-fade-in">
                            <h3 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-stone-500 flex items-center gap-4">
                                {family}
                                <span className="h-px flex-1 bg-gradient-to-r from-primary-500/20 to-transparent"></span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {familyCreatures.map((creature, idx) => (
                                    <CreatureCard
                                        key={idx}
                                        carte={carteDepuisCreature(creature)}
                                        to={`/bestiary/${creature.id}`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="text-center text-xs text-stone-400 pb-8">
                {filteredCreatures.length} résultats affichés
            </div>
        </PageContainer>
    );
};
