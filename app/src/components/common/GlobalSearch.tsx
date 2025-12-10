
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, X, ChevronRight, type LucideIcon, Ghost, Sparkles, BookOpen, User, Users, Shield, Sword, AlertCircle, Backpack } from 'lucide-react';
import { createPortal } from 'react-dom';

// Import data
import creaturesData from '../../data/creatures.json';
import capacitesData from '../../data/capacites.json';
import profilesData from '../../data/profiles.json';
import racesData from '../../data/races.json';
import voiesData from '../../data/voies.json';
import rulesData from '../../data/Rules.json';
import statesData from '../../data/states.json';
import weaponsData from '../../data/weapons.json';
import armorsData from '../../data/armors.json';
import materialsData from '../../data/materials.json';

interface SearchResult {
    id: string;
    label: string;
    subLabel?: string;
    type: 'creature' | 'capacity' | 'class' | 'race' | 'voie' | 'rule' | 'state' | 'equipment';
    url: string;
}

const TYPE_CONFIG: Record<string, { icon: LucideIcon; label: string }> = {
    creature: { icon: Ghost, label: 'Bestiaire' },
    capacity: { icon: Sparkles, label: 'Capacité' },
    class: { icon: User, label: 'Profil' },
    race: { icon: Users, label: 'Race' },
    voie: { icon: BookOpen, label: 'Voie' },
    rule: { icon: Command, label: 'Règle' },
    state: { icon: AlertCircle, label: 'État' },
    equipment: { icon: Backpack, label: 'Équipement' },
};

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Build the search index (memoized)
    const allItems = useMemo(() => {
        const items: SearchResult[] = [];

        // Helper to safely add items
        const safeAdd = (data: any, type: SearchResult['type'], mapFn: (item: any, index: number) => Partial<SearchResult> | null) => {
            if (!Array.isArray(data)) return;
            data.forEach((item, index) => {
                if (!item) return;
                try {
                    const mapped = mapFn(item, index);
                    if (!mapped) return;

                    if (mapped.label && typeof mapped.label === 'string') {
                        items.push({
                            id: mapped.id || `${type}-${Math.random().toString(36).substr(2, 9)}`,
                            label: mapped.label,
                            subLabel: mapped.subLabel,
                            type: type,
                            url: mapped.url || '/'
                        } as SearchResult);
                    }
                } catch (e) {
                    console.warn(`Error mapping ${type} item:`, e);
                }
            });
        };

        safeAdd(creaturesData, 'creature', (c, index) => {
            const name = c.name?.[0]?.value;
            if (!name) return null;

            const level = c.level?.[0]?.value;
            const category = c.category?.[0]?.label;

            return {
                id: `creature-${index}`, // Use index as ID since creatures have no inherent ID
                label: name,
                subLabel: level ? `Niv ${level} • ${category || ''}` : category,
                url: `/bestiary/${index}`
            };
        });

        safeAdd(capacitesData, 'capacity', c => ({
            id: `capacity-${c.id}`,
            label: c.name,
            subLabel: c.rank ? `Rang ${c.rank}` : undefined,
            url: `/capacites/${c.id}`
        }));

        safeAdd(profilesData, 'class', p => ({
            id: `profile-${p.id}`,
            label: p.name,
            url: `/classes/${p.id}`
        }));

        safeAdd(racesData, 'race', r => ({
            id: `race-${r.id}`,
            label: r.name,
            url: `/races/${r.id}`
        }));

        safeAdd(voiesData, 'voie', v => ({
            id: `voie-${v.id}`,
            label: v.name,
            url: `/voies/${v.id}`
        }));

        safeAdd(rulesData, 'rule', (r) => ({
            id: `rule-${r.title}`,
            label: r.title,
            url: '/rules'
        }));

        safeAdd(statesData, 'state', s => ({
            id: `state-${s.id}`,
            label: s.name,
            url: '/states'
        }));

        safeAdd(weaponsData, 'equipment', w => ({
            id: `weapon-${w.id}`,
            label: w.name,
            subLabel: w.damage ? `Arme • ${w.damage}` : 'Arme',
            url: '/equipment'
        }));

        safeAdd(armorsData, 'equipment', a => ({
            id: `armor-${a.id}`,
            label: a.name,
            subLabel: a.defense ? `Armure • DEF ${a.defense}` : 'Armure',
            url: '/equipment'
        }));

        safeAdd(materialsData, 'equipment', m => ({
            id: `material-${m.id}`,
            label: m.name,
            subLabel: m.price ? `Matériel • ${m.price}` : 'Matériel',
            url: '/equipment'
        }));

        return items;
    }, []);

    // Filter results
    const results = useMemo(() => {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();
        return allItems
            .filter(item =>
                item.label.toLowerCase().includes(lowerQuery) ||
                item.subLabel?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 50); // Limit to 50 results
    }, [query, allItems]);

    // Keyboard navigation
    useEffect(() => {
        const handleNavigation = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [isOpen, results, selectedIndex]);

    const handleSelect = (result: SearchResult) => {
        navigate(result.url);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="w-full max-w-2xl relative bg-stone-900 rounded-2xl shadow-2xl border border-primary-500/20 overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-200">
                {/* Search Header */}
                <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-stone-900/50">
                    <Search className="text-primary-400" size={24} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Rechercher une créature, un sort, une règle..."
                        className="flex-1 bg-transparent border-none text-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-0"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') onClose();
                        }}
                    />
                    <div className="hidden md:flex items-center gap-2 text-xs text-stone-500 border border-white/10 rounded px-2 py-1">
                        <span className="font-bold">ESC</span> pour fermer
                    </div>
                    <button onClick={onClose} className="md:hidden text-stone-400">
                        <X size={24} />
                    </button>
                </div>

                {/* Results List */}
                <div className="overflow-y-auto custom-scrollbar p-2 flex-1">
                    {results.length === 0 ? (
                        <div className="text-center py-12 text-stone-500">
                            {query ? (
                                <>
                                    <Ghost className="mx-auto mb-3 opacity-20" size={48} />
                                    <p>Aucun résultat pour "{query}"</p>
                                </>
                            ) : (
                                <>
                                    <Command className="mx-auto mb-3 opacity-20" size={48} />
                                    <p>Commencez à taper pour rechercher...</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {results.map((result, index) => {
                                const Icon = TYPE_CONFIG[result.type].icon;
                                const isSelected = index === selectedIndex;

                                return (
                                    <button
                                        key={result.id}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-4 transition-all duration-200 group ${isSelected
                                            ? 'bg-primary-900/40 border-primary-500/30 shadow-lg'
                                            : 'hover:bg-white/5 border border-transparent'
                                            } border`}
                                    >
                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-500 text-stone-900' : 'bg-stone-800 text-stone-400'
                                            } transition-colors`}>
                                            <Icon size={20} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-display font-bold ${isSelected ? 'text-primary-200' : 'text-stone-300'
                                                    }`}>
                                                    {result.label}
                                                </span>
                                                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${isSelected ? 'bg-primary-500/20 text-primary-200' : 'bg-stone-800 text-stone-500'
                                                    }`}>
                                                    {TYPE_CONFIG[result.type].label}
                                                </span>
                                            </div>
                                            {result.subLabel && (
                                                <p className={`text-sm truncate ${isSelected ? 'text-primary-200/70' : 'text-stone-500'
                                                    }`}>
                                                    {result.subLabel}
                                                </p>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <ChevronRight size={16} className="text-primary-400 animate-in slide-in-from-left-2" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-stone-950/50 border-t border-white/5 text-[10px] text-stone-500 flex justify-between items-center">
                    <span>
                        <strong>{results.length}</strong> résultats trouvés
                    </span>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="border border-white/10 rounded px-1">↑</span><span className="border border-white/10 rounded px-1">↓</span> naviguer</span>
                        <span className="flex items-center gap-1"><span className="border border-white/10 rounded px-1">↵</span> sélectionner</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
