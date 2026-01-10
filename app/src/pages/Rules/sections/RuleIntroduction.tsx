import React from 'react';
import { BookOpen } from 'lucide-react';

export const RulesHeader: React.FC = () => {
    return (
        <header className="mb-12 pb-8 border-b border-white/10">
            <div className="flex items-center gap-4 mb-4">
                <BookOpen className="text-primary-400" size={48} />
                <h1 className="text-4xl md:text-5xl text-primary-100 font-display">COF 2 - Règles</h1>
            </div>
            <p className="text-xl text-stone-400">Référence Système Complète</p>
        </header>
    );
};

export const RuleIntroduction: React.FC = () => {
    return (
        <section id="introduction" className="mb-24">
            <h2 className="text-3xl text-primary-400 mb-2 font-display border-b-2 border-primary-900/50 pb-2">Introduction & Univers</h2>

            {/* INGREDIENTS DU JEU */}
            <div id="ingredients" className="glass-panel p-8 rounded-xl border-l-4 border-l-primary-500 mb-8">
                <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Les Ingrédients du Jeu</h3>
                <p className="text-stone-300 mb-4">Pour jouer à Chroniques Oubliées Fantasy, vous avez besoin :</p>
                <ul className="grid md:grid-cols-2 gap-2 text-sm text-stone-300 mb-8 list-disc ml-5">
                    <li>D’un <strong>Meneur de Jeu (MJ)</strong>.</li>
                    <li>D’un <strong>groupe de joueurs</strong> (1 à 5, idéalement 4).</li>
                    <li>De <strong>personnages</strong> (fiches de PJ).</li>
                    <li>Des <strong>règles du jeu</strong>.</li>
                    <li>D’un <strong>scénario d’aventure</strong>.</li>
                    <li>De <strong>dés</strong>, crayons, gommes et papier.</li>
                </ul>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        {/* PERSONNAGES */}
                        <div>
                            <h4 className="font-bold text-xl text-primary-200 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                Les Personnages
                            </h4>
                            <p className="text-sm text-stone-400 mb-3">Définis par une identité et des paramètres de jeu :</p>

                            <div className="space-y-4">
                                <div className="bg-stone-900/40 p-3 rounded border border-white/5">
                                    <strong className="text-primary-300 block mb-1">Caractéristiques</strong>
                                    <p className="text-xs text-stone-300 mb-2">Inné et acquis. Indicateur des capacités physiques et mentales (-2 à +5).</p>
                                    <div className="flex flex-col gap-1.5 text-[10px] text-stone-400 mt-2">
                                        <div><strong className="text-primary-300">FOR (Force) :</strong> Puissance musculaire, dégâts au contact.</div>
                                        <div><strong className="text-primary-300">AGI (Agilité) :</strong> Réflexes, souplesse, tir, initiative.</div>
                                        <div><strong className="text-primary-300">CON (Constitution) :</strong> Santé, endurance, résistance poison.</div>
                                        <div><strong className="text-primary-300">INT (Intelligence) :</strong> Mémoire, raisonnement, savoir.</div>
                                        <div><strong className="text-primary-300">PER (Perception) :</strong> 5 sens, intuition, vigilance.</div>
                                        <div><strong className="text-primary-300">VOL (Volonté) :</strong> Résistance mentale, courage, concentration.</div>
                                        <div><strong className="text-primary-300">CHA (Charisme) :</strong> Influence, persuasion, commandement.</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="bg-stone-900/40 p-2 rounded border border-white/5">
                                        <strong className="text-primary-300 block">Peuple</strong>
                                        <span className="text-stone-400">Humain, Elfe, Nain, etc.</span>
                                    </div>
                                    <div className="bg-stone-900/40 p-2 rounded border border-white/5">
                                        <strong className="text-primary-300 block">Profil</strong>
                                        <span className="text-stone-400">Archétype héroïque (Guerrier, Mage...).</span>
                                    </div>
                                </div>

                                <div className="bg-stone-900/40 p-3 rounded border border-white/5">
                                    <strong className="text-primary-300 block mb-1">Voies & Capacités</strong>
                                    <p className="text-xs text-stone-300 mb-2">Chaque profil a 5 Voies, composées de 5 Capacités (Rangs 1 à 5). La règle spécifique de la capacité prime sur la règle générale.</p>
                                    <div className="text-[10px] space-y-1 text-stone-400 border-t border-white/5 pt-1 mt-1">
                                        <div className="flex justify-between"><span>* 1/combat</span> <span>Repos rapide (30 min)</span></div>
                                        <div className="flex justify-between"><span>* 1/jour</span> <span>Repos complet (8 h)</span></div>
                                    </div>
                                </div>

                                <div className="bg-stone-900/40 p-3 rounded border border-white/5">
                                    <strong className="text-primary-300 block mb-1">Points de Vigueur (PV)</strong>
                                    <p className="text-xs text-stone-300 mb-2">Énergie vitale et capacité à éviter les coups (pas juste la santé).</p>
                                    <ul className="text-[10px] text-stone-400 list-disc ml-3">
                                        <li><strong>40 PV :</strong> Combattant expert (encaisse, esquive).</li>
                                        <li><strong>6 PV :</strong> Coup mortel direct.</li>
                                        <li><strong>0 PV :</strong> Inconscience et risque de mort.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* DES */}
                        <div>
                            <h4 className="font-bold text-xl text-primary-200 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                Les Dés & Mécaniques
                            </h4>

                            <div className="bg-stone-900/40 p-4 rounded-xl border border-white/5 mb-4">
                                <div className="grid grid-cols-6 gap-2 text-center text-xs font-bold text-stone-400 mb-4">
                                    <div className="p-2 bg-black/20 rounded">d4</div>
                                    <div className="p-2 bg-black/20 rounded">d6</div>
                                    <div className="p-2 bg-black/20 rounded">d8</div>
                                    <div className="p-2 bg-black/20 rounded">d10</div>
                                    <div className="p-2 bg-black/20 rounded">d12</div>
                                    <div className="p-2 bg-primary-900/30 text-primary-300 ring-1 ring-primary-500/50 rounded">d20</div>
                                </div>
                                <div className="bg-primary-950/30 p-3 rounded border border-primary-500/20 text-sm">
                                    <strong className="text-primary-300 block mb-1">Lecture : "3d6 + 4"</strong>
                                    <ul className="text-stone-400 list-disc ml-4 space-y-1 text-xs">
                                        <li>Lancer 3 dés à 6 faces.</li>
                                        <li>Additionner les résultats.</li>
                                        <li>Ajouter 4 au total.</li>
                                        <li><em>(Ex: 3+5+2 = 10, +4 = 14).</em></li>
                                    </ul>
                                </div>
                                <p className="text-[10px] text-stone-500 mt-2 italic text-center">Note : Le "d3" est un d6 divisé par 2 (arrondi sup).</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm p-2 bg-stone-900/30 rounded border border-white/5">
                                    <span className="font-bold text-primary-300">PC (Chance)</span>
                                    <span className="text-stone-400 text-xs text-right">Faveur du destin,<br />Joker pour survivre.</span>
                                </div>
                                <div className="flex justify-between items-center text-sm p-2 bg-stone-900/30 rounded border border-white/5">
                                    <span className="font-bold text-blue-300">PM (Mana)</span>
                                    <span className="text-stone-400 text-xs text-right">Énergie magique<br />pour les sorts.</span>
                                </div>
                                <div className="flex justify-between items-center text-sm p-2 bg-stone-900/30 rounded border border-white/5">
                                    <span className="font-bold text-amber-300">DR (Récup)</span>
                                    <span className="text-stone-400 text-xs text-right">Second souffle<br />après le combat.</span>
                                </div>
                            </div>
                        </div>

                        {/* ACCESSOIRES */}
                        <div>
                            <h4 className="font-bold text-xl text-primary-200 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                Accessoires & Lexique
                            </h4>
                            <div className="text-xs text-stone-300 space-y-2">
                                <p><strong>Écran du MJ :</strong> Cache les notes et résume les tables.</p>
                                <p><strong>VTT (Virtual Table Top) :</strong> Table virtuelle pour jouer en ligne (tokens, plans).</p>

                                <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                                    <div><strong className="text-stone-400">PJ :</strong> Personnage Joueur</div>
                                    <div><strong className="text-stone-400">PNJ :</strong> Perso. Non-Joueur (MJ)</div>
                                    <div><strong className="text-stone-400">Campagne :</strong> Saga d'aventures</div>
                                    <div><strong className="text-stone-400">Roleplay :</strong> Interprétation</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* UNIVERS OSGILD */}
            <div id="univers" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-primary-500">
                <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">L'Univers : Les Terres d'Osgild</h3>

                <div className="grid md:grid-cols-2 gap-6 text-sm text-stone-300 mb-6">
                    <div>
                        <h4 className="font-bold text-primary-200 mb-2">Géographie</h4>
                        <ul className="list-disc ml-5 space-y-1">
                            <li><strong>Situation :</strong> Continent du "Mitan".</li>
                            <li><strong>Dimensions :</strong> 1500 x 1000 km.</li>
                            <li><strong>Climat :</strong> Tempéré (avec microclimats magiques).</li>
                            <li><strong>Lieux :</strong> Désert de Tanith, Jungle Luir-An-Doral.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-primary-200 mb-2">Géopolitique</h4>
                        <ul className="list-disc ml-5 space-y-1">
                            <li><strong>Humains :</strong> Comté du Ponant, Principauté d'Arly, Duché de Périk.</li>
                            <li><strong>Cités Libres :</strong> Port-Libre (Commerce), Feng (Pirates).</li>
                            <li><strong>Non-Humains :</strong> Kaerimbor (Nains, Monts Argentés), Hautesylve (Elfes).</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-stone-900/50 p-4 rounded border border-white/10">
                    <h4 className="font-bold text-primary-200 mb-2 text-sm">Chronologie Sommaire</h4>
                    <div className="flex justify-between items-center text-xs text-stone-400 font-mono">
                        <span>-2500 <br />Empire</span>
                        <span className="h-px bg-white/20 flex-1 mx-2"></span>
                        <span>-1000 <br />Chute</span>
                        <span className="h-px bg-white/20 flex-1 mx-2"></span>
                        <span>An 1 <br />Paix</span>
                        <span className="h-px bg-white/20 flex-1 mx-2"></span>
                        <span className="text-primary-300 font-bold">An 325 <br />Aujourd'hui</span>
                    </div>
                </div>
            </div>

            {/* LEXIQUE */}
            <div className="glass-panel p-4 rounded-xl border-l-4 border-l-stone-500 bg-stone-900/40">
                <h4 className="font-bold text-stone-300 mb-2 text-sm">Petit Lexique</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-stone-400">
                    <div><strong className="text-stone-200">PJ / PNJ :</strong> Perso Joueur / Non-Joueur</div>
                    <div><strong className="text-stone-200">Campagne :</strong> Saga d'aventures</div>
                    <div><strong className="text-stone-200">Roleplay :</strong> Interprétation</div>
                    <div><strong className="text-stone-200">Background :</strong> Passé du perso</div>
                    <div><strong className="text-stone-200">D20 / D6... :</strong> Dés à X faces</div>
                    <div><strong className="text-stone-200">Mod. :</strong> Modificateur de Carac.</div>
                    <div><strong className="text-stone-200">PV :</strong> Points de Vie (Santé)</div>
                    <div><strong className="text-stone-200">PM :</strong> Points de Mana (Magie)</div>
                    <div><strong className="text-stone-200">DM :</strong> Dommages (Dégâts)</div>
                    <div><strong className="text-stone-200">DEF :</strong> Défense (Score à battre)</div>
                    <div><strong className="text-stone-200">SD :</strong> Seuil de Difficulté</div>
                    <div><strong className="text-stone-200">AOE :</strong> Zone d'effet (Area of Effect)</div>
                </div>
            </div>
        </section>
    );
};
