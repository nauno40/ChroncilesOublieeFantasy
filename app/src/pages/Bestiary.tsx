import React, { useState, useMemo } from 'react';
import creaturesData from '../data/creatures.json';
import type { Creature } from '../types';
import { getCreatureName, getCreatureLevel, getCreatureCategory, getCreatureFamily, getCreatureArchetype, getCreatureEnvironment, getCreatureSize, getCreatureImage } from '../utils/creature';
import { Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

// Cast the JSON import to the generic type first because of the complex JSON structure validity
// In a real app, we would validate this with Zod.
const creatures = creaturesData as unknown as Creature[];

export const Bestiary: React.FC = () => {
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
    }, [searchTerm, selectedCategory, selectedFamily, selectedArchetype, selectedEnvironment, selectedSize, minLevel, maxLevel]);

    const categories = useMemo(() => {
        const cats = new Set(creatures.map(c => getCreatureCategory(c)).filter(Boolean));
        return Array.from(cats).sort();
    }, []);

    const families = useMemo(() => {
        const items = new Set(creatures.map(c => getFamily(c)).filter(Boolean));
        return Array.from(items).sort();
    }, []);

    const archetypes = useMemo(() => {
        const items = new Set(creatures.map(c => getCreatureArchetype(c)).filter(Boolean));
        return Array.from(items).sort();
    }, []);

    const environments = useMemo(() => {
        const items = new Set(creatures.map(c => getCreatureEnvironment(c)).filter(Boolean));
        return Array.from(items).sort();
    }, []);

    const sizes = useMemo(() => {
        const items = new Set(creatures.map(c => getCreatureSize(c)).filter(Boolean));
        return Array.from(items).sort();
    }, []);

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

    const [showFilters, setShowFilters] = useState(false);

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

    const hasActiveFilters = searchTerm || selectedCategory || selectedFamily || selectedArchetype || selectedEnvironment || selectedSize || minLevel > 0 || maxLevel < 30;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <header className="sticky top-[72px] md:top-0 z-20 -mx-4 px-4 pb-4 pt-4 mb-8 transition-all">
                <div className="glass-panel rounded-2xl p-6 border-primary-500/30 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-stone-950/80">
                    {/* Decorative background glow */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            {/* Main Search Bar */}
                            <div className="relative flex-1 w-full group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500/70 group-focus-within:text-primary-400 transition-colors" size={24} />
                                <input
                                    type="text"
                                    placeholder="Rechercher une créature..."
                                    className="w-full bg-stone-900/50 border border-primary-500/20 text-stone-100 placeholder-primary-500/30 rounded-xl py-4 pl-14 pr-4 focus:ring-1 focus:ring-primary-400 focus:border-primary-400/50 transition-all font-display tracking-wide text-lg shadow-inner"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Filter Toggle Button */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={clsx(
                                        "flex items-center gap-2 px-6 py-4 rounded-xl font-display font-bold transition-all border shadow-lg whitespace-nowrap",
                                        showFilters
                                            ? "bg-primary-600 text-stone-950 border-primary-500"
                                            : "bg-stone-900/50 text-primary-400 border-primary-500/30 hover:bg-stone-800 hover:border-primary-500/60"
                                    )}
                                >
                                    <Filter size={20} />
                                    <span className="hidden sm:inline">Filtres</span>
                                    {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {/* Global Reset Button - Visible only if filters are applied */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={resetFilters}
                                        className="flex items-center gap-2 px-4 py-4 rounded-xl font-display font-bold transition-all border border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 shadow-lg whitespace-nowrap"
                                        title="Tout effacer"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Collapsible Filters Section */}
                        <div className={clsx(
                            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ease-in-out overflow-hidden",
                            showFilters ? "max-h-[500px] opacity-100 pt-4 border-t border-primary-500/10" : "max-h-0 opacity-0"
                        )}>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-primary-500/70 uppercase tracking-wider ml-1">Famille</label>
                                <select
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
                                <select
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
                                <select
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
                                <select
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
                                <select
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
                                        type="number"
                                        min="0" max="99"
                                        value={minLevel}
                                        onChange={e => setMinLevel(Math.min(parseInt(e.target.value) || 0, maxLevel))}
                                        className="w-full bg-transparent text-center text-stone-200 focus:outline-none focus:text-primary-400 font-mono font-bold"
                                    />
                                    <span className="text-primary-500/50 font-bold">-</span>
                                    <input
                                        type="number"
                                        min="0" max="99"
                                        value={maxLevel}
                                        onChange={e => setMaxLevel(Math.max(parseInt(e.target.value) || 0, minLevel))}
                                        className="w-full bg-transparent text-center text-stone-200 focus:outline-none focus:text-primary-400 font-mono font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Active Filters Display Tag - Click to remove */}
                        {!showFilters && hasActiveFilters && (
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
                    </div>
                </div>
            </header>

            <div className="space-y-12 pb-12">
                {Object.keys(groupedCreatures).length === 0 ? (
                    <div className="text-center py-20 bg-stone-900/40 rounded-3xl border border-white/5 border-dashed">
                        <p className="text-stone-500 font-display text-lg">Aucune créature ne correspond à vos recherches.</p>
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
                                    <Link
                                        to={`/bestiary/${creatures.indexOf(creature)}`}
                                        key={idx}
                                        className="glass-panel rounded-xl hover:border-primary-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all duration-300 group flex flex-col overflow-hidden hover:-translate-y-1"
                                    >
                                        {/* Creature Image */}
                                        <div className="relative h-48 overflow-hidden bg-stone-200">
                                            <img
                                                src={getCreatureImage(creature)}
                                                alt={getCreatureName(creature)}
                                                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    // Fallback to placeholder if image not found
                                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23292524" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%23f59e0b"%3E' + getCreatureName(creature).charAt(0) + '%3C/text%3E%3C/svg%3E';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60"></div>
                                        </div>

                                        {/* Creature Info */}
                                        <div className="p-4 flex flex-col justify-between flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-display font-bold text-lg text-stone-200 group-hover:text-primary-400 transition-colors">{getCreatureName(creature)}</h3>
                                                    <div className="text-xs text-stone-500 flex flex-wrap gap-2 mt-1">
                                                        <span className="bg-stone-950/50 px-2 py-0.5 rounded text-primary-400 font-bold border border-primary-900/30">NIV {getCreatureLevel(creature)}</span>
                                                        {getCreatureCategory(creature) && <span className="opacity-80">{getCreatureCategory(creature)}</span>}
                                                    </div>
                                                </div>

                                                {creature.health_point?.[0]?.value && (
                                                    <div className="text-right bg-stone-950/30 px-2 py-1 rounded border border-white/5">
                                                        <span className="text-[10px] text-stone-500 uppercase tracking-wider block">PV</span>
                                                        <span className="font-mono text-green-500/90 font-bold text-base">{creature.health_point[0].value}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-px bg-stone-950/40 rounded-lg overflow-hidden border border-white/5">
                                                <div className="p-2 text-center group-hover:bg-primary-500/5 transition-colors">
                                                    <span className="text-[10px] text-stone-500 uppercase block mb-0.5 font-bold">DEF</span>
                                                    <span className="font-bold text-sm text-stone-300">{creature.defense?.[0]?.value || '-'}</span>
                                                </div>
                                                <div className="p-2 text-center group-hover:bg-primary-500/5 transition-colors border-l border-r border-white/5">
                                                    <span className="text-[10px] text-stone-500 uppercase block mb-0.5 font-bold">FOR</span>
                                                    <span className="font-bold text-sm text-stone-300">{creature.str_mod?.[0]?.value || '0'}</span>
                                                </div>
                                                <div className="p-2 text-center group-hover:bg-primary-500/5 transition-colors">
                                                    <span className="text-[10px] text-stone-500 uppercase block mb-0.5 font-bold">INIT</span>
                                                    <span className="font-bold text-sm text-stone-300">{creature.init?.[0]?.value || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="text-center text-xs text-stone-600 pb-8">
                {filteredCreatures.length} résultats affichés
            </div>
        </div>
    );
};
