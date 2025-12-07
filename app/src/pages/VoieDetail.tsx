import React from 'react';
import { useParams, Link } from 'react-router-dom';
import voiesData from '../data/Voies.json';
import capacitesData from '../data/Capacités.json';
import type { Path, Capability } from '../types';
import { ArrowLeft } from 'lucide-react';

const voies = voiesData as Path[];
const capacites = capacitesData as Capability[];

export const VoieDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const index = parseInt(id || '0', 10);
    const voie = voies[index];

    if (!voie) {
        return <div>Voie introuvable</div>;
    }

    const spellNames = [
        voie.spell1,
        voie.spell2,
        voie.spell3,
        voie.spell4,
        voie.spell5
    ].filter(Boolean);

    // Find full spell details from Capacités.json
    const getSpellDetails = (spellName: string): Capability | null => {
        // Match exact name including markers like (L) and *
        return capacites.find(cap => cap.Nom === spellName) || null;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <Link to="/voies" className="inline-flex items-center text-stone-400 hover:text-primary-400 transition-colors group mb-2">
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-display font-medium">Retour aux Voies</span>
            </Link>

            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border-primary-500/20 relative">
                {/* Decorative top border */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>

                {/* Header */}
                <div className="bg-stone-900/40 p-8 backdrop-blur-sm">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 drop-shadow-sm mb-4">
                        {voie.Voie}
                    </h1>
                    <div className="flex gap-3">
                        {voie.profil && (
                            <span className="bg-primary-950/50 text-primary-300 px-4 py-2 rounded-lg border border-primary-500/30 font-medium">
                                {voie.profil}
                            </span>
                        )}
                        <span className="bg-stone-900/60 text-stone-300 px-4 py-2 rounded-lg border border-stone-700">
                            {voie.Type}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-stone-900/30 to-transparent">
                    {/* Spells/Capabilities */}
                    {spellNames.length > 0 && (
                        <div>
                            <h3 className="text-xl font-display font-bold text-primary-400 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary-500 rounded-full"></span> Capacités
                            </h3>
                            <div className="space-y-4">
                                {spellNames.map((spellName, i) => {
                                    const spellDetails = getSpellDetails(spellName);
                                    return (
                                        <div
                                            key={i}
                                            className="glass-panel p-6 rounded-xl border border-white/5 bg-stone-900/40"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <h4 className="text-lg font-display font-bold text-primary-300">
                                                    {spellName}
                                                </h4>
                                                <span className="text-xs text-stone-500 bg-black/30 px-2 py-1 rounded whitespace-nowrap ml-2">
                                                    Rang {i + 1}
                                                </span>
                                            </div>
                                            {spellDetails ? (
                                                <div className="space-y-2">
                                                    <p className="text-stone-300 leading-relaxed">{spellDetails.Desc}</p>
                                                    {spellDetails.rang && (
                                                        <div className="text-xs text-stone-500 mt-2">
                                                            Rang requis: {spellDetails.rang}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-stone-400 italic text-sm">Détails non disponibles</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Note (if present) */}
                    {voie.Note && (
                        <div className="glass-panel p-6 rounded-xl border-white/5">
                            <h3 className="text-xl font-display font-bold text-stone-300 mb-4 border-b border-white/10 pb-2">
                                Notes
                            </h3>
                            <p className="text-stone-300 leading-relaxed">{voie.Note}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
