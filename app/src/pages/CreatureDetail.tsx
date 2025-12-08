import React from 'react';
import { useParams, Link } from 'react-router-dom';
import creaturesData from '../data/creatures.json';
import familiesData from '../data/families.json';
import type { Creature } from '../types';
import { getCreatureName, getCreatureLevel, getCreatureCategory, getCreatureFamily, getCreatureArchetype, getCreatureEnvironment, getCreatureSize } from '../utils/creature';
import { ArrowLeft, Shield, Sword, Heart } from 'lucide-react';

const creatures = creaturesData as unknown as Creature[];
// Helper to find family description
const getFamilyDescription = (familyName: string | undefined): string | null => {
    if (!familyName) return null;
    const family = familiesData.find(f => f.Famille === familyName);
    return family?.Text || null;
};

export const CreatureDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const index = parseInt(id || '0', 10);
    const creature = creatures[index];

    if (!creature) {
        return <div>Créature introuvable</div>;
    }

    const name = getCreatureName(creature);
    const level = getCreatureLevel(creature);
    const family = getCreatureFamily(creature);
    const category = getCreatureCategory(creature);
    const familyDesc = getFamilyDescription(family);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <Link to="/bestiary" className="inline-flex items-center text-stone-400 hover:text-primary-400 transition-colors group mb-2">
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> <span className="font-display font-medium">Retour au Bestiaire</span>
            </Link>

            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border-primary-500/20 relative">
                {/* Decorative top border */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>

                {/* Header */}
                <div className="bg-stone-900/40 p-8 backdrop-blur-sm relative overflow-hidden">
                    {/* Background Token Blur */}
                    {creature.picture?.[0]?.creature_token_url && (
                        <div className="absolute top-0 right-0 w-96 h-96 opacity-10 bg-no-repeat bg-contain bg-center pointer-events-none blur-3xl transform translate-x-1/3 -translate-y-1/3" style={{ backgroundImage: `url(${creature.picture[0].creature_token_url})` }}></div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">{name}</h1>

                            {/* Main Characteristics Badges */}
                            <div className="flex flex-wrap gap-2 text-sm mb-6">
                                <span className="bg-primary-950/80 px-4 py-1.5 rounded-lg border border-primary-500/40 text-primary-300 font-bold tracking-wider shadow-lg shadow-black/20">NIVEAU {level}</span>
                                {category && <span className="bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-700 text-stone-300">{category}</span>}
                                {family && <span className="bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 italic">{family}</span>}
                            </div>

                            {/* Detailed Info Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                <div>
                                    <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">Famille</div>
                                    <div className="text-stone-300 font-medium">{family || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">Archétype</div>
                                    <div className="text-stone-300 font-medium">{getCreatureArchetype(creature) || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">Environnement</div>
                                    <div className="text-stone-300 font-medium">{getCreatureEnvironment(creature) || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">Taille</div>
                                    <div className="text-stone-300 font-medium">{getCreatureSize(creature) || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Token Image (Reverted) */}
                        {creature.picture?.[0]?.creature_token_url && (
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-20"></div>
                                <img
                                    src={creature.picture[0].creature_token_url}
                                    alt={name}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-primary-500/30 object-cover bg-stone-950 shadow-2xl relative z-10"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Block */}
                <div className="grid grid-cols-3 divide-x divide-white/5 border-y border-white/5 bg-black/20 backdrop-blur-md">
                    <div className="py-6 text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center text-stone-500 mb-2 gap-2 text-xs uppercase tracking-widest font-bold">
                            <Shield size={14} /> Défense
                        </div>
                        <div className="text-3xl font-display font-bold text-stone-200">{creature.defense?.[0]?.value || '-'}</div>
                    </div>
                    <div className="py-6 text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center text-stone-500 mb-2 gap-2 text-xs uppercase tracking-widest font-bold">
                            <Heart size={14} className="text-green-500/70" /> Points de Vie
                        </div>
                        <div className="text-3xl font-display font-bold text-green-500">{creature.health_point?.[0]?.value || '-'}</div>
                    </div>
                    <div className="py-6 text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center text-stone-500 mb-2 gap-2 text-xs uppercase tracking-widest font-bold">
                            <Sword size={14} className="text-amber-600/70" /> Initiative
                        </div>
                        <div className="text-3xl font-display font-bold text-amber-500">{creature.init?.[0]?.value || '-'}</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-6 md:p-8 space-y-8 bg-gradient-to-b from-stone-900/30 to-transparent">

                    {/* Attributes */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
                        {[
                            { label: 'FOR', col: 'str_mod' as const },
                            { label: 'DEX', col: 'dex_mod' as const },
                            { label: 'CON', col: 'con_mod' as const },
                            { label: 'INT', col: 'int_mod' as const },
                            { label: 'SAG', col: 'wis_mod' as const },
                            { label: 'CHA', col: 'cha_mod' as const },
                        ].map(attr => (
                            <div key={attr.label} className="bg-black/20 rounded-lg p-3 border border-white/5 text-center hover:border-primary-500/30 transition-colors">
                                <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">{attr.label}</div>
                                <div className="font-display font-bold text-xl text-stone-200">
                                    {(creature[attr.col as keyof Creature] as unknown as { value: string }[])?.[0]?.value || '0'}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-8">
                        {/* 1. Family Description */}
                        {familyDesc && (
                            <div className="glass-panel p-6 rounded-xl border-white/5 bg-primary-950/20">
                                <h3 className="text-xl font-display font-bold text-primary-300 mb-4 border-b border-primary-500/20 pb-2 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Famille : {family}
                                </h3>
                                <p className="text-stone-300 leading-relaxed text-sm italic">{familyDesc}</p>
                            </div>
                        )}

                        {/* 2. Creature Description */}
                        {creature.description?.[0]?.value && (
                            <div className="glass-panel p-6 rounded-xl border-white/5">
                                <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">Description</h3>
                                <div
                                    className="prose prose-invert prose-stone max-w-none text-sm space-y-3 [&_p]:leading-relaxed text-stone-300/90"
                                    dangerouslySetInnerHTML={{ __html: creature.description[0].value }}
                                />
                            </div>
                        )}

                        {/* 3. Attacks */}
                        {creature.attacks?.[0]?.data?.length > 0 && (
                            <div>
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Attaques
                                </h3>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {creature.attacks[0].data.map((attack, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-stone-900/40 p-4 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all hover:bg-stone-900/60">
                                            <span className="font-bold text-stone-200 text-lg mb-1 sm:mb-0">{attack.name}</span>
                                            <div className="flex gap-4 text-sm bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 self-start sm:self-auto">
                                                <span className="text-primary-400 font-mono font-bold">{attack.test}</span>
                                                <span className="text-stone-400 font-mono border-l border-white/10 pl-4">{attack.dm}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 4. Capabilities */}
                        {creature.capabilities?.length > 0 && (
                            <div>
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Capacités
                                </h3>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {creature.capabilities.map((cap, i) => {
                                        let displayName = cap.label;
                                        let isLimited = cap.is_limited === '1';

                                        // Clean asterisks
                                        displayName = displayName.replace(/\*/g, '');

                                        // Handle "(L)" or " L" suffix removal as per user request
                                        if (displayName.includes('(L)')) {
                                            isLimited = true;
                                            displayName = displayName.replace('(L)', '').trim();
                                        } else if (displayName.endsWith(' L')) {
                                            isLimited = true;
                                            displayName = displayName.slice(0, -2).trim();
                                        }

                                        return (
                                            <div key={i} className="bg-stone-900/30 p-4 rounded-xl border border-white/5 hover:bg-stone-900/50 transition-colors">
                                                <div className="font-bold text-primary-300 mb-1 font-display tracking-wide flex items-center gap-2 flex-wrap">
                                                    {displayName}
                                                    {isLimited && (
                                                        <span className="text-[10px] bg-red-950/40 text-red-300 border border-red-900/50 px-1.5 py-0.5 rounded uppercase tracking-wider font-sans leading-none">
                                                            Limité
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-stone-400 leading-relaxed">{cap.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 5. Illustration (Full Art) */}
                        {/* Try local image based on name first, fallback to token */}
                        {(creature.picture?.[0]?.creature_token_url || name) && (
                            <div className="border-t border-white/5 pt-8">
                                <h3 className="text-xl font-display font-bold text-primary-400 mb-6 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Illustration
                                </h3>
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white border border-white/10 group w-fit mx-auto">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                                    <img
                                        src={`/assets/creatures/${name}.jpg`}
                                        onError={(e) => {
                                            if (creature.picture?.[0]?.creature_token_url) {
                                                e.currentTarget.src = creature.picture[0].creature_token_url;
                                            } else {
                                                e.currentTarget.style.display = 'none';
                                            }
                                        }}
                                        alt={name}
                                        className="block max-w-full h-auto max-h-[600px] object-contain transform transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
