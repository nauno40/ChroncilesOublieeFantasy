import React from 'react';
import { Link } from 'react-router-dom';
import { Sword, Dices, Music, Skull, Sparkles, Wrench } from 'lucide-react';
import { PageContainer, PageShell } from '../components/common';
import { LEXIQUE } from '../domain/lexique';

export const Tools: React.FC = () => {
    return (
        <PageContainer>
            <PageShell
                title="Outils du MJ"
                subtitle="Vos aides de table : combat, dés, monstres, ambiances et objets magiques."
                icon={Wrench}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/tools/tracker" className="glass-panel p-8 rounded-2xl border-primary-500/20 hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Sword size={120} className="text-stone-400" />
                    </div>

                    <div className="relative z-10">
                        <div className="bg-primary-900/30 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
                            <Sword size={32} className="text-primary-400 group-hover:text-primary-300" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-stone-200 mb-2 group-hover:text-primary-400 transition-colors">{LEXIQUE.suiviCombat}</h3>
                        <p className="text-stone-400 text-sm leading-relaxed max-w-sm">Gérez l'initiative, les tours de jeu et les points de vie de vos créatures et joueurs avec fluidité.</p>
                    </div>
                </Link>

                <Link to="/tools/dice" className="glass-panel p-8 rounded-2xl border-primary-500/20 hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Dices size={120} className="text-stone-400" />
                    </div>

                    <div className="relative z-10">
                        <div className="bg-primary-900/30 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
                            <Dices size={32} className="text-primary-400 group-hover:text-primary-300" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-stone-200 mb-2 group-hover:text-primary-400 transition-colors">{LEXIQUE.des}</h3>
                        <p className="text-stone-400 text-sm leading-relaxed max-w-sm">Une table de jeu virtuelle 3D pour tous vos jets de dés.</p>
                    </div>
                </Link>

                <Link to="/tools/monsters" className="glass-panel p-8 rounded-2xl border-primary-500/20 hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Skull size={120} className="text-stone-400" />
                    </div>

                    <div className="relative z-10">
                        <div className="bg-primary-900/30 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
                            <Skull size={32} className="text-primary-400 group-hover:text-primary-300" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-stone-200 mb-2 group-hover:text-primary-400 transition-colors">{LEXIQUE.mesCreatures}</h3>
                        <p className="text-stone-400 text-sm leading-relaxed max-w-sm">Créez vos propres créatures « maison » et importez-les dans le Suivi de combat.</p>
                    </div>
                </Link>

                <Link to="/tools/soundboard" className="glass-panel p-8 rounded-2xl border-primary-500/20 hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Music size={120} className="text-stone-400" />
                    </div>

                    <div className="relative z-10">
                        <div className="bg-primary-900/30 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
                            <Music size={32} className="text-primary-400 group-hover:text-primary-300" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-stone-200 mb-2 group-hover:text-primary-400 transition-colors">{LEXIQUE.ambiances}</h3>
                        <p className="text-stone-400 text-sm leading-relaxed max-w-sm">Gérez l'ambiance sonore de vos parties avec une table de mixage simplifiée.</p>
                    </div>
                </Link>

                <Link to="/tools/magic-items" className="glass-panel p-8 rounded-2xl border-primary-500/20 hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Sparkles size={120} className="text-stone-400" />
                    </div>

                    <div className="relative z-10">
                        <div className="bg-primary-900/30 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
                            <Sparkles size={32} className="text-primary-400 group-hover:text-primary-300" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-stone-200 mb-2 group-hover:text-primary-400 transition-colors">Générateur d’objets magiques</h3>
                        <p className="text-stone-400 text-sm leading-relaxed max-w-sm">Évaluez la valeur d'un objet enchanté et tirez au sort potions, armes et objets de pouvoir sur les tables du livre. Le catalogue des objets, lui, vit dans le compendium.</p>
                    </div>
                </Link>
            </div>
        </PageContainer>
    );
};
