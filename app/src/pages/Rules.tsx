import React, { useState, useMemo } from 'react';
import { Search, BookOpen, ChevronDown, ChevronRight, Dices, Sword, Shield, Sparkles, Users, Map, Coins, Zap, Heart, Eye, Flame, Droplet, Wind } from 'lucide-react';
import rulesData from '../data/Rules.json';

interface RuleContent {
    type: 'text' | 'list' | 'table';
    content?: string;
    items?: string[];
    headers?: string[];
    rows?: string[][];
}

interface RuleSection {
    title: string;
    content: RuleContent[];
}

// Map section titles to icons
const getIconForSection = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('caractéristique') || lowerTitle.includes('race') || lowerTitle.includes('profil')) return Users;
    if (lowerTitle.includes('combat') || lowerTitle.includes('attaque') || lowerTitle.includes('dommage')) return Sword;
    if (lowerTitle.includes('défense') || lowerTitle.includes('armure') || lowerTitle.includes('vie')) return Shield;
    if (lowerTitle.includes('magie') || lowerTitle.includes('sort') || lowerTitle.includes('voie') || lowerTitle.includes('mana')) return Sparkles;
    if (lowerTitle.includes('test') || lowerTitle.includes('dé')) return Dices;
    if (lowerTitle.includes('voyage') || lowerTitle.includes('exploration') || lowerTitle.includes('saut')) return Map;
    if (lowerTitle.includes('équipement') || lowerTitle.includes('trésor') || lowerTitle.includes('objet')) return Coins;
    if (lowerTitle.includes('initiative')) return Zap;
    if (lowerTitle.includes('guérison') || lowerTitle.includes('récupération') || lowerTitle.includes('repos')) return Heart;
    if (lowerTitle.includes('perception') || lowerTitle.includes('surprise')) return Eye;
    if (lowerTitle.includes('feu') || lowerTitle.includes('chaleur')) return Flame;
    if (lowerTitle.includes('poison') || lowerTitle.includes('maladie')) return Droplet;
    if (lowerTitle.includes('chute') || lowerTitle.includes('saut')) return Wind;
    return BookOpen;
};

export const Rules: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Caractéristiques']));

    const sections = rulesData as RuleSection[];

    const toggleSection = (title: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(title)) {
            newExpanded.delete(title);
        } else {
            newExpanded.add(title);
        }
        setExpandedSections(newExpanded);
    };

    const filteredSections = useMemo(() => {
        if (!searchTerm) return sections;

        return sections.filter(section =>
            section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.content.some(c =>
                c.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.items?.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        );
    }, [searchTerm, sections]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-primary-500/20 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-6">
                    <BookOpen className="text-primary-400" size={32} />
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500">
                            Règles du Jeu
                        </h1>
                        <p className="text-stone-400 text-sm mt-1">
                            {sections.length} sections • Documentation complète
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher dans les règles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-stone-900/50 border border-primary-500/20 rounded-xl text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-all"
                    />
                </div>
            </div>

            {/* Quick Reference Card */}
            <div className="glass-panel p-6 rounded-xl border-primary-500/30 bg-gradient-to-br from-primary-950/30 to-primary-900/10">
                <h2 className="text-xl font-display font-bold text-primary-300 mb-4 flex items-center gap-2">
                    <Dices size={20} />
                    Référence Rapide
                </h2>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-stone-900/30 border border-white/5">
                        <h3 className="font-bold text-primary-300 mb-1">Tests</h3>
                        <p className="text-stone-300">1d20 + Mod. vs ND</p>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-900/30 border border-white/5">
                        <h3 className="font-bold text-primary-300 mb-1">Attaque</h3>
                        <p className="text-stone-300">1d20 + bonus ≥ DEF</p>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-900/30 border border-white/5">
                        <h3 className="font-bold text-primary-300 mb-1">Initiative</h3>
                        <p className="text-stone-300">1d20 + DEX + INT</p>
                    </div>
                </div>
            </div>

            {/* Rules Sections */}
            <div className="space-y-4">
                {filteredSections.map((section, sectionIdx) => {
                    const Icon = getIconForSection(section.title);
                    const isExpanded = expandedSections.has(section.title);

                    return (
                        <div key={sectionIdx} className="glass-panel rounded-xl border-white/5 overflow-hidden">
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.title)}
                                className="w-full p-6 flex items-center justify-between hover:bg-stone-900/30 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
                                        <Icon size={24} className="text-primary-400" />
                                    </div>
                                    <h2 className="text-2xl font-display font-bold text-stone-200 group-hover:text-primary-300 transition-colors text-left">
                                        {section.title}
                                    </h2>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown size={24} className="text-stone-400 flex-shrink-0" />
                                ) : (
                                    <ChevronRight size={24} className="text-stone-400 flex-shrink-0" />
                                )}
                            </button>

                            {/* Section Content */}
                            {isExpanded && (
                                <div className="px-6 pb-6 space-y-4 border-t border-white/5">
                                    {section.content.map((block, blockIdx) => (
                                        <div key={blockIdx}>
                                            {block.type === 'text' && block.content && (
                                                <p className="text-stone-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.content }} />
                                            )}

                                            {block.type === 'list' && block.items && (
                                                <ul className="space-y-2 ml-4">
                                                    {block.items.map((item, itemIdx) => (
                                                        <li key={itemIdx} className="flex items-start gap-2 text-stone-300">
                                                            <span className="text-primary-500 mt-1 flex-shrink-0">•</span>
                                                            <span dangerouslySetInnerHTML={{ __html: item }} />
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {block.type === 'table' && block.headers && block.rows && (
                                                <div className="overflow-x-auto my-4">
                                                    <table className="w-full text-sm border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-white/10">
                                                                {block.headers.map((header, hIdx) => (
                                                                    <th key={hIdx} className="text-left p-3 text-primary-300 font-display font-bold bg-stone-900/30">
                                                                        {header}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {block.rows.map((row, rIdx) => (
                                                                <tr key={rIdx} className="border-b border-white/5 hover:bg-stone-900/20 transition-colors">
                                                                    {row.map((cell, cIdx) => (
                                                                        <td key={cIdx} className="p-3 text-stone-300" dangerouslySetInnerHTML={{ __html: cell }} />
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {searchTerm && filteredSections.length === 0 && (
                <div className="glass-panel p-12 rounded-xl border-white/5 text-center">
                    <Search className="mx-auto text-stone-600 mb-4" size={48} />
                    <p className="text-stone-400">Aucune règle trouvée pour "{searchTerm}"</p>
                </div>
            )}
        </div>
    );
};
