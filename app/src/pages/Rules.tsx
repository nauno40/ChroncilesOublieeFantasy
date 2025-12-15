import React, { useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Rules: React.FC = () => {
    const location = useLocation();

    // Handle smooth scrolling for anchor links
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement> | null, id: string) => {
        if (e) e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Auto-scroll on hash change
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            // Small delay to ensure render
            setTimeout(() => {
                scrollToSection(null, id);
            }, 100);
        }
    }, [location.hash]);

    return (
        <div className="flex h-[calc(100vh-6rem)] overflow-hidden">



            {/* SIDEBAR TOC */}
            <aside className="hidden lg:block w-64 h-full overflow-y-auto border-r border-white/5 p-4 custom-scrollbar flex-shrink-0">
                <nav className="space-y-6 text-sm">
                    <h2 className="text-lg font-bold text-primary-300/80 mb-4 px-2 font-display">Sommaire</h2>

                    {/* Intro */}
                    <div>
                        <div className="px-2 mb-2 pb-1 border-b border-white/5 text-xs font-bold text-stone-500 uppercase tracking-wider">Introduction</div>
                        <ul className="space-y-1">
                            <li><a href="#introduction" onClick={(e) => scrollToSection(e, 'introduction')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">Univers & Intro</a></li>
                        </ul>
                    </div>
                    {/* Règles */}
                    <div>
                        <div className="px-2 mb-2 pb-1 border-b border-white/5 text-xs font-bold text-stone-500 uppercase tracking-wider">Règles</div>
                        <ul className="space-y-1">
                            <li><a href="#bases" onClick={(e) => scrollToSection(e, 'bases')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">1. Les Bases</a></li>
                            <li><a href="#combat" onClick={(e) => scrollToSection(e, 'combat')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">2. Le Combat</a></li>
                            <li><a href="#magie" onClick={(e) => scrollToSection(e, 'magie')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">3. Magie</a></li>
                            <li><a href="#environnement" onClick={(e) => scrollToSection(e, 'environnement')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">4. Environnement</a></li>
                            <li><a href="#aventure" onClick={(e) => scrollToSection(e, 'aventure')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">5. Aventure</a></li>
                        </ul>
                    </div>
                    {/* Monde & MJ */}
                    <div>
                        <div className="px-2 mb-2 pb-1 border-b border-white/5 text-xs font-bold text-stone-500 uppercase tracking-wider">Avancé</div>
                        <ul className="space-y-1">
                            <li><a href="#objets-magiques" onClick={(e) => scrollToSection(e, 'objets-magiques')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">6. Objets Magiques</a></li>
                            <li><a href="#opposition" onClick={(e) => scrollToSection(e, 'opposition')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">7. Opposition</a></li>
                            <li><a href="#meneur-eu-jeu" onClick={(e) => scrollToSection(e, 'meneur-eu-jeu')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">8. Devenir MJ</a></li>
                        </ul>
                    </div>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 h-full overflow-y-auto relative scroll-smooth p-4 md:p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto pb-32">

                    <header className="mb-12 pb-8 border-b border-white/10">
                        <div className="flex items-center gap-4 mb-4">
                            <BookOpen className="text-primary-400" size={48} />
                            <h1 className="text-4xl md:text-5xl text-primary-100 font-display">COF 2 - Règles</h1>
                        </div>
                        <p className="text-xl text-stone-400">Référence Système Complète</p>
                    </header>



                    {/* ============================== */}
                    {/* INTRODUCTION */}
                    {/* ============================== */}
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
                            </div>
                        </div>
                    </section>

                    {/* ============================== */}
                    {/* CHAPITRE 1 : LES BASES */}
                    {/* ============================== */}
                    <section id="bases" className="mb-24">
                        <h2 className="text-3xl text-primary-300 mb-2 font-display border-b-2 border-primary-500/30 pb-2">Chapitre 1 : Les Règles de Base</h2>


                        {/* LE TEST */}
                        <div id="le-test" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-primary-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">La Mécanique du Test</h3>

                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="bg-stone-900/50 p-4 rounded border border-white/10 flex-1 text-center font-bold text-lg text-primary-200">
                                    <span className="block text-stone-500 text-sm uppercase mb-1">Formule</span>
                                    d20 + Caractéristique + Modificateurs
                                </div>
                                <div className="bg-stone-900/50 p-4 rounded border border-white/10 flex-1 text-center font-bold text-lg text-primary-200">
                                    <span className="block text-stone-500 text-sm uppercase mb-1">Résolution</span>
                                    Si Résultat ≥ Difficulté (SD) : <strong>Réussite</strong><br />
                                    <span className="text-sm font-normal text-stone-400">Sinon : Échec</span>
                                </div>
                            </div>

                            <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded text-amber-100 text-sm mb-4">
                                <strong>Règle d'or :</strong> Ne pas demander de test si le PJ est compétent hors stress (réussite auto) ou si l'échec n'est pas souhaité par le scénario.
                            </div>
                        </div>

                        {/* TABLE DES DIFFICULTÉS */}
                        <div id="difficultes" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-primary-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Table des Difficultés</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-stone-900/50 text-primary-300">
                                            <th className="p-3 border border-white/10">Qualificatif</th>
                                            <th className="p-3 border border-white/10">Valeur (SD)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-stone-300">
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Facile</td><td className="p-3 border border-white/10 font-bold">5</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Moyenne</td><td className="p-3 border border-white/10 font-bold">10</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Difficile</td><td className="p-3 border border-white/10 font-bold">15</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Très difficile</td><td className="p-3 border border-white/10 font-bold">20</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Extrême</td><td className="p-3 border border-white/10 font-bold">25</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Abominable</td><td className="p-3 border border-white/10 font-bold">30</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* MODIFICATEURS DE LANCER */}
                        <div id="modificateurs" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-primary-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Modificateurs de Lancer</h3>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="font-bold text-primary-300 mb-2">Dés Bonus / Malus</h4>
                                    <ul className="list-disc ml-4 text-sm text-stone-300 space-y-2">
                                        <li><strong>Dé Bonus :</strong> Lancer 2d20, garder le <strong>meilleur</strong>.</li>
                                        <li><strong>Dé Malus :</strong> Lancer 2d20, garder le <strong>plus faible</strong>.</li>
                                        <li><em>Non cumulables (max 2 dés). Un bonus annule un malus.</em></li>
                                        <li><strong>Carac. Héroïques :</strong> Accordent un dé bonus aux tests de caractéristique (pas d'attaque) au rang 4.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary-300 mb-2">Résultats Critiques</h4>
                                    <ul className="list-disc ml-4 text-sm text-stone-300 space-y-2">
                                        <li><strong className="text-green-400">Réussite Critique (20 naturel) :</strong> Réussite auto + avantage narratif (ou dommages doublés en combat).</li>
                                        <li><strong className="text-red-400">Échec Critique (1 naturel) :</strong> Échec auto + effet désagréable (choix du MJ).</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* TYPES DE TESTS */}
                        <div id="types-tests" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-primary-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Types de Tests</h3>
                            <p className="mb-4 text-sm text-stone-400 italic">Distinction fondamentale : Les bonus de caractéristique ne s'appliquent pas aux attaques, et inversement.</p>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-lg text-stone-200">Test Opposé</h4>
                                    <p className="text-sm text-stone-300 mb-2">Comparaison de deux résultats. Le plus haut l'emporte. (Égalité = statu quo ou relance).</p>
                                    <ul className="list-disc ml-4 text-xs text-stone-300 mb-2">
                                        <li><strong>Réussite Critique :</strong> Bat toujours un résultat normal.</li>
                                        <li><strong>Exemples :</strong> Bras de fer (FOR), Convaincre (CHA vs VOL), Discrétion (AGI vs PER).</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-stone-200">Test de Compétence</h4>
                                    <p className="text-sm text-stone-300 mb-2">Test de Carac. + Bonus de compétence (reçu via une capacité).</p>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm">
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <span><strong>Voie de Profil (Évolutif)</strong></span> <span className="text-right text-stone-400">2 + Rang (Max +7)</span>
                                            <span><strong>Voie de Peuple (Fixe)</strong></span> <span className="text-right text-stone-400">+3</span>
                                            <span><strong>Voie de Prestige (Fixe)</strong></span> <span className="text-right text-stone-400">+5</span>
                                        </div>
                                        <p className="text-xs text-stone-500 italic mt-2 border-t border-white/5 pt-1">
                                            Règle de Cumul : On prend le meilleur bonus de chaque source. Total Max = +15.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MECANIQUES AVANCEES */}
                        <div id="mecaniques-avancees" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-primary-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Mécaniques Avancées</h3>
                            <div className="grid md:grid-cols-2 gap-4 text-sm text-stone-300">
                                <div className="p-3 bg-stone-900/50 rounded border border-white/5">
                                    <strong className="text-primary-300 block mb-1">Coopération</strong>
                                    Allié fait un test Diff 10. Accorde <strong>+2</strong> au partenaire (+4 si critique). (Parfois +5 pour gros efforts physiques).
                                </div>
                                <div className="p-3 bg-stone-900/50 rounded border border-white/5">
                                    <strong className="text-primary-300 block mb-1">Série de Tests</strong>
                                    Exiger plusieurs réussites cumulées pour une action complexe (suspense). 3 succès avant 3 échecs (ou variantes).
                                </div>
                                <div className="p-3 bg-stone-900/50 rounded border border-white/5">
                                    <strong className="text-primary-300 block mb-1">Prendre son temps</strong>
                                    <ul className="list-disc ml-4 text-xs">
                                        <li><strong>x5 temps :</strong> Résultat simulé de 10.</li>
                                        <li><strong>x20 temps :</strong> Résultat simulé de 20 (Pas critique).</li>
                                    </ul>
                                </div>
                                <div className="p-3 bg-stone-900/50 rounded border border-white/5">
                                    <strong className="text-primary-300 block mb-1">Échelle de Difficultés</strong>
                                    Graduer le résultat selon la marge de réussite. (Ex: Diff 15 = Info, Diff 20 = Secret, Diff 25 = Trésor).
                                </div>
                            </div>
                        </div>

                        {/* POINTS DE CHANCE */}
                        <div id="points-chance" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-primary-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Points de Chance (PC)</h3>

                            <div className="grid md:grid-cols-2 gap-6 mb-4 text-sm text-stone-300">
                                <div>
                                    <h4 className="font-bold text-primary-300 mb-2">Utilisation (Max 1/test)</h4>
                                    <ul className="list-disc ml-4 space-y-1">
                                        <li><strong>Bonus Héroïque :</strong> +10 au résultat final.</li>
                                        <li><strong>Sauver sa peau :</strong> Transformer un Échec Critique (1) en réussite normale (si le score suffit). <em className="text-xs text-stone-500">Succès partiel "Oui mais..."</em></li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary-300 mb-2">Récupération</h4>
                                    <ul className="list-disc ml-4 space-y-1">
                                        <li>Passage de niveau (Total).</li>
                                        <li>Récompense RP exceptionnelle (1 PC).</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-stone-900/50 p-4 rounded border border-white/10">
                                <h4 className="font-bold text-stone-200 mb-2">Le Test de Chance</h4>
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="text-3xl font-bold text-primary-400 whitespace-nowrap">1d6 <span className="text-base font-normal text-stone-400">(JSL)</span> + PC</div>
                                    <div className="text-xs text-stone-400 md:border-l md:border-white/10 md:pl-4">
                                        Utilisé pour déterminer le hasard pur.<br />
                                        <strong>Positif :</strong> Le plus haut l'emporte.<br />
                                        <strong>Négatif :</strong> Le plus faible subit.
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-stone-500 italic">Le Destin : Le MJ peut mettre un veto à l'usage d'un PC pour préserver le scénario majeur (le PC n'est pas dépensé).</p>
                        </div>

                        {/* ROLE DU MJ */}
                        <div id="role-mj" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-primary-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Le Rôle du MJ</h3>
                            <ul className="list-disc ml-4 text-sm text-stone-300 space-y-2">
                                <li><strong>Arbitrage :</strong> Tranche les litiges et cas non couverts.</li>
                                <li><strong>Conflits :</strong> Le personnage de plus haut niveau l'emporte. (Égalité = annulation).</li>
                                <li><strong>Modification :</strong> Peut altérer les règles pour le bien du jeu.</li>
                            </ul>
                        </div>
                    </section >

                    {/* ============================== */}
                    {/* CHAPITRE 2 : LE COMBAT */}
                    {/* ============================== */}
                    <section id="combat" className="mb-24">
                        <h2 className="text-3xl text-red-400 mb-2 font-display border-b-2 border-red-900/50 pb-2">Chapitre 2 : Le Combat</h2>


                        {/* SURPRISE & INITIATIVE */}
                        <div id="surprise-init" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-red-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Surprise & Initiative</h3>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-bold text-lg text-primary-300 mb-2">1. La Surprise</h4>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm mb-3">
                                        <strong>Détection :</strong> Test de PER (Vigilance) vs AGI (Discrétion).
                                    </div>
                                    <ul className="list-disc ml-5 text-sm text-stone-300 space-y-1">
                                        <li>Pas d'action durant le round de surprise.</li>
                                        <li><strong>-5 en DEF</strong>.</li>
                                        <li>Perte du bonus d'AGI ou de bouclier à la DEF.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-primary-300 mb-2">2. L'Initiative</h4>
                                    <p className="text-sm text-stone-300 mb-2"><strong>10 + Mod. PER + Bonus</strong></p>
                                    <ul className="list-disc ml-5 text-sm text-stone-300 space-y-1">
                                        <li><strong>Égalité :</strong> PJ &gt; PNJ. Sinon plus haute PER. Sinon 1d20.</li>
                                        <li><strong>Retarder :</strong> On peut agir plus tard (le score change définitivement).</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10">
                                <strong className="text-stone-200">Le Round :</strong> Unité de temps d'environ 10 secondes. Structure cyclique tant que le combat dure.
                            </div>
                        </div>

                        {/* TYPES D'ACTIONS */}
                        <div id="types-actions" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-red-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Types d'Actions</h3>

                            <div className="grid lg:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-stone-900/50 rounded border-l-4 border-l-blue-500 border-y border-r border-white/10">
                                    <h4 className="font-bold text-blue-300 mb-1">Mouvement (M)</h4>
                                    <p className="text-sm text-stone-300 mb-2">Déplacement (20m), se relever, dégainer.</p>
                                    <p className="text-xs text-stone-500 italic">Max 2 par tour (si pas d'attaque).</p>
                                </div>
                                <div className="p-4 bg-stone-900/50 rounded border-l-4 border-l-red-500 border-y border-r border-white/10">
                                    <h4 className="font-bold text-red-300 mb-1">Attaque (A)</h4>
                                    <p className="text-sm text-stone-300 mb-2">Attaque contact/distance ou sort standard.</p>
                                    <p className="text-xs text-stone-500 italic">Une seule par tour.</p>
                                </div>
                                <div className="p-4 bg-stone-900/50 rounded border-l-4 border-l-amber-500 border-y border-r border-white/10">
                                    <h4 className="font-bold text-amber-300 mb-1">Limitée (L)</h4>
                                    <p className="text-sm text-stone-300 mb-2">Action complexe (Sort puissant, Charge).</p>
                                    <p className="text-xs text-stone-500 italic">Remplace Mvt ET Attaque. (Mvt minime autorisé).</p>
                                </div>
                                <div className="p-4 bg-stone-900/50 rounded border-l-4 border-l-green-500 border-y border-r border-white/10">
                                    <h4 className="font-bold text-green-300 mb-1">Gratuite (G)</h4>
                                    <p className="text-sm text-stone-300 mb-2">Parler, lâcher objet.</p>
                                    <p className="text-xs text-stone-500 italic">Illimitée (raisonnable).</p>
                                </div>
                            </div>

                            <div className="mt-6 bg-stone-900/30 p-4 rounded border border-white/10">
                                <h4 className="font-bold text-primary-200 mb-2 border-b border-white/5 pb-1">Règles de Déplacement Spéciales</h4>
                                <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-stone-300">
                                    <li><strong>Ralenti :</strong> 1/2 vitesse (Terrain difficile, Foule, Recul).</li>
                                    <li><strong>Sprinter (L) :</strong> x3 distance (Ligne droite). -5 DEF et MalusTests. (+10m si test AGI réussi).</li>
                                    <li><strong>Nager :</strong> 5m / Action Mvt. (Sauf créatures aquatiques).</li>
                                    <li><strong>Escalader/Ramper :</strong> 3m / Action Mvt.</li>
                                </ul>
                            </div>
                        </div>

                        {/* RESOLUTION ATTAQUES */}
                        <div id="resolution-attaques" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-red-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Résolution des Attaques</h3>

                            <div className="text-center bg-stone-900/80 p-4 rounded-lg border border-red-500/30 mb-6 shadow-inner">
                                <span className="text-2xl font-bold text-red-100 font-mono">d20 + Bonus &ge; Défense</span>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 col-span-2 text-sm text-stone-300 mb-6">
                                <div className="bg-stone-900/50 p-3 rounded">
                                    <strong className="text-green-400 block mb-1">Réussite Critique (20 naturel)</strong>
                                    <ul className="list-disc ml-4 text-xs space-y-1">
                                        <li><strong>Effet :</strong> Touche Auto + DM Doublés.</li>
                                        <li><strong>Sorts :</strong> Si test d'attaque requis, DM + 1d4 (pas x2).</li>
                                        <li><strong>Critique Amélioré :</strong> Plage augmentée (ex: 19-20). Min 16.</li>
                                        <li><strong>Alternative :</strong> Au lieu de x2 DM, effet spécial (Désarmer, Aveugler...).</li>
                                    </ul>
                                </div>
                                <div className="bg-stone-900/50 p-3 rounded">
                                    <strong className="text-red-400 block mb-1">Échec Critique (1 naturel)</strong>
                                    <ul className="list-disc ml-4 text-xs space-y-1">
                                        <li><strong>Effet :</strong> Échec Auto.</li>
                                        <li><strong>Conséquence :</strong> Incident (Arme tombe, corde casse). Ou Test AGI (Diff 10) sinon <em>Ralenti</em>.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* MODIFICATEURS COMBAT */}
                        <div id="modificateurs-combat" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-red-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Modificateurs de Combat</h3>

                            <div className="grid md:grid-cols-2 gap-6 text-sm text-stone-300 mb-6">
                                <div>
                                    <strong className="text-primary-300 block mb-2">Distance & Situation</strong>
                                    <ul className="list-disc ml-4 space-y-1">
                                        <li><strong>Portée Longue :</strong> Dé Malus (x2 portée max).</li>
                                        <li><strong>Tir en Mêlée :</strong> -2 Attaque. (Risque de toucher allié sur 1).</li>
                                        <li><strong>Tireur au Contact :</strong> Dé Malus sur l'attaque à distance.</li>
                                        <li><strong>Couverture Partielle / Totale :</strong> -2 / -5 Attaque.</li>
                                        <li><strong>Visibilité (Pénombre/Brouillard) :</strong> -2 à -5. (Noir total = Aveuglé).</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong className="text-primary-300 block mb-2">Conditions Spéciales</strong>
                                    <ul className="list-disc ml-4 space-y-1">
                                        <li><strong>Combat à 2 armes (L) :</strong> 2 Attaques avec Dé Malus. (Arme légère main faible).</li>
                                        <li><strong>Combat Monté :</strong> Cheval de guerre requis (sinon Malus). Attaqué séparément.</li>
                                        <li><strong>Aquatique :</strong> Mvt / 2. Dé Malus Attaque. -5 DEF. (Suffocation possible).</li>
                                        <li><strong>Confiné :</strong> Armes longues = Dé Malus. Pas d'armes à 2 mains.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-red-900/10 border border-red-500/20 p-4 rounded">
                                <h4 className="font-bold text-red-300 mb-2 border-b border-red-500/10 pb-1">États Préjudiciables (Résumé)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-stone-400">
                                    <span><strong>Aveuglé :</strong> -5 partout, -10 dist.</span>
                                    <span><strong>Affaibli :</strong> Dé Malus tous tests.</span>
                                    <span><strong>Essoufflé :</strong> Mvt 5m max.</span>
                                    <span><strong>Étourdi :</strong> Pas d'action, -5 DEF.</span>
                                    <span><strong>Immobilisé :</strong> Pas Mvt, Malus Att.</span>
                                    <span><strong>Paralysé :</strong> Critique Auto subi.</span>
                                    <span><strong>Ralenti :</strong> 1 seule action (A ou M).</span>
                                    <span><strong>Renversé :</strong> -5 Att/DEF. Se relever = M.</span>
                                </div>
                            </div>
                        </div>

                        {/* OPTIONS TACTIQUES */}
                        <div id="options-tactiques" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-red-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Options Tactiques & Manœuvres</h3>

                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="font-bold text-lg text-primary-200 mb-3">Options Tactiques</h4>
                                    <ul className="space-y-2 text-sm text-stone-300">
                                        <li className="bg-stone-900/30 p-2 rounded border border-white/5">
                                            <strong>Défense Totale (L) :</strong> +5 DEF (Pas d'attaque).
                                        </li>
                                        <li className="bg-stone-900/30 p-2 rounded border border-white/5">
                                            <strong>Défense Partielle (A) :</strong> +3 DEF (Pas d'attaque).
                                        </li>
                                        <li className="bg-stone-900/30 p-2 rounded border border-white/5">
                                            <strong>Attaque Assurée (A) :</strong> +5 Attaque, DM / 2.
                                        </li>
                                        <li className="bg-stone-900/30 p-2 rounded border border-white/5">
                                            <strong>Attaque Violente (A) :</strong> -3 Attaque, +1d4 DM.
                                        </li>
                                        <li className="bg-stone-900/30 p-2 rounded border border-white/5">
                                            <strong>Soutenir (L) :</strong> +5 Attaque pour un allié (Contact).
                                        </li>
                                        <li className="bg-stone-900/30 p-2 rounded border border-white/5">
                                            <strong>Riposte (L ou A) :</strong> Attendre une attaque au contact pour frapper après (avant si Init sup).
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-primary-200 mb-3">Manœuvres (Action L, Test Opposé d'Attaque)</h4>
                                    <p className="text-xs text-stone-500 italic mb-2">Pas de DM. Effet tactique.</p>
                                    <ul className="space-y-2 text-sm text-stone-300">
                                        <li className="flex justify-between items-center border-b border-white/5 pb-1"><span><strong>Renverser (-5) :</strong></span> <span className="text-stone-400">Cible à terre.</span></li>
                                        <li className="flex justify-between items-center border-b border-white/5 pb-1"><span><strong>Désarmer (-5) :</strong></span> <span className="text-stone-400">Arme tombe. Tour perdu pour ramasser.</span></li>
                                        <li className="flex justify-between items-center border-b border-white/5 pb-1"><span><strong>Pousser/Repousser :</strong></span> <span className="text-stone-400">Recule de FOR+3m. (Si mur : perte DEF).</span></li>
                                        <li className="flex justify-between items-center border-b border-white/5 pb-1"><span><strong>Bloquer (-5) :</strong></span> <span className="text-stone-400">Immobilisé 1 round. (Maintien possible).</span></li>
                                        <li className="flex justify-between items-center border-b border-white/5 pb-1"><span><strong>Aveugler (-5) :</strong></span> <span className="text-stone-400">Aveuglé 1 round.</span></li>
                                        <li className="flex justify-between items-center border-b border-white/5 pb-1"><span><strong>Distraire (+CHA) :</strong></span> <span className="text-stone-400">-5 DEF, Surprise. (Test vs Mentale).</span></li>
                                        <li className="flex justify-between items-center border-b border-white/5 pb-1"><span><strong>Étourdir (-10) :</strong></span> <span className="text-stone-400">Pas d'action. (Si Surprise : Assommé possible).</span></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-stone-900/50 p-3 rounded text-xs text-stone-400 text-center italic">
                                Note : Répéter une manœuvre sur la même cible augmente la difficulté (+5 cumulatif sur le test du défenseur).
                            </div>
                        </div>


                        {/* SANTE ET DOMMAGES */}
                        <div id="sante-dommages" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-red-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Gestion des Dommages et Santé</h3>

                            {/* 1. GESTION DOMMAGES */}
                            <div className="mb-8">
                                <h4 className="font-bold text-lg text-red-300 mb-4">1. Encaisser les Coups</h4>
                                <div className="grid md:grid-cols-2 gap-6 text-sm text-stone-300">
                                    <div className="space-y-3">
                                        <div className="bg-stone-900/50 p-3 rounded border border-white/10">
                                            <strong className="block text-primary-200 mb-1">Réduction des Dommages (RD)</strong>
                                            <ul className="list-disc ml-4 space-y-1 text-xs">
                                                <li>Soustraction pure (Ex: RD 5 = -5 DM).</li>
                                                <li>Cumulable si sources différentes.</li>
                                                <li><em>RD spécifique :</em> "Sauf feu", "Sauf magie", "Contre contondant".</li>
                                            </ul>
                                            <p className="text-xs text-stone-500 italic mt-1 font-bold">Règle : Une attaque réussie inflige toujours au moins 1 DM.</p>
                                        </div>
                                        <div className="bg-stone-900/50 p-3 rounded border border-white/10">
                                            <strong className="block text-primary-200 mb-1">Résistance</strong>
                                            <p>Division par 2 des DM (Ex: Squelettes vs Tranchant).</p>
                                            <p className="text-xs text-stone-500 italic mt-1">Ordre : D'abord RD (soustraction), puis Résistance (division).</p>
                                        </div>
                                    </div>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10">
                                        <strong className="block text-primary-200 mb-1">Dommages Temporaires (Non-létaux)</strong>
                                        <ul className="list-disc ml-4 space-y-1">
                                            <li><strong>But :</strong> Assommer sans tuer.</li>
                                            <li><strong>Malus :</strong> 1 Dé de malus à l'attaque (sauf arme adaptée).</li>
                                            <li><strong>Calcul :</strong> DM - [FOR Cible]. Comptés à part.</li>
                                            <li><strong>Effet :</strong> Si DM Temp &gt; PV Actuels = Inconscient.</li>
                                            <li><strong>Récup :</strong> 1 pt / minute.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* 2. ETAT DE SANTE */}
                            <div className="mb-8">
                                <h4 className="font-bold text-lg text-red-300 mb-4">2. État de Santé</h4>
                                <p className="text-sm text-stone-300 mb-4 italic">Les PV représentent l'endurance et la capacité à éviter le coup fatal, pas seulement la vitalité physique.</p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 bg-stone-900/30 p-2 rounded">
                                        <div className="w-16 font-bold text-stone-400 text-sm text-center">&gt; 1 PV</div>
                                        <div className="text-sm text-stone-300"><strong>Opérationnel :</strong> Aucun malus.</div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-orange-900/10 p-2 rounded border border-orange-500/20">
                                        <div className="w-16 font-bold text-orange-400 text-sm text-center">1 PV</div>
                                        <div className="text-sm text-stone-300"><strong>Affaibli :</strong> État critique, blessure grave. (Malus aux tests).</div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-red-900/10 p-2 rounded border border-red-500/20">
                                        <div className="w-16 font-bold text-red-400 text-sm text-center">0 PV</div>
                                        <div className="text-sm text-stone-300">
                                            <strong>Inconscient :</strong> Perte de 1 DR immédiatement.
                                            <div className="text-xs text-stone-400 mt-1">
                                                <strong>Mort :</strong> Si pas de soins sous 1 heure (ou achevé).<br />
                                                <strong>Stabilisation :</strong> Test de SAG diff 10 (ou soins magiques).
                                            </div>
                                        </div>
                                    </div>
                                    {/* 0 PV Block End */}
                                </div>
                            </div>
                            {/* 3. RECUPERATION */}
                            <div>
                                <h4 className="font-bold text-lg text-red-300 mb-4">3. Se Soigner (Le Repos)</h4>
                                <div className="overflow-x-auto mb-4">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-stone-900/50 text-red-300">
                                            <tr>
                                                <th className="p-3 border border-white/10">Type</th>
                                                <th className="p-3 border border-white/10">Durée</th>
                                                <th className="p-3 border border-white/10">Effet (Gain)</th>
                                                <th className="p-3 border border-white/10">Coût</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-300">
                                            <tr className="even:bg-white/5">
                                                <td className="p-3 border border-white/10 font-bold">Rapide</td>
                                                <td className="p-3 border border-white/10">30 min</td>
                                                <td className="p-3 border border-white/10">1 DR + Niveau (PV)</td>
                                                <td className="p-3 border border-white/10">1 DR</td>
                                            </tr>
                                            <tr className="even:bg-white/5">
                                                <td className="p-3 border border-white/10 font-bold">Complète</td>
                                                <td className="p-3 border border-white/10">8 h (Nuit)</td>
                                                <td className="p-3 border border-white/10">Tous les PM + 1 DR (+ PV si voulu)</td>
                                                <td className="p-3 border border-white/10">1 par jour</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-xs text-stone-400">
                                    <strong>Fatigue :</strong> Les epreuves éreintantes font perdre des DR. Si 0 DR, perte de PV (1d4).
                                </div>
                            </div>
                        </div>

                        {/* FUITE ET POURSUITE */}
                        <div id="fuite-poursuite" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-orange-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Fuite & Poursuite</h3>

                            <div className="grid md:grid-cols-2 gap-8 mb-6">
                                <div>
                                    <h4 className="font-bold text-lg text-orange-300 mb-2">La Fuite</h4>
                                    <p className="text-sm text-stone-300 mb-2">Les joueurs peuvent fuir à tout moment. Pour les PNJ/Créatures :</p>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm">
                                        <strong>Test de VOL (Diff 10)</strong> quand effectif réduit de moitié.<br />
                                        <strong>Diff 15</strong> quand réduit au quart.<br />
                                        <em>Modificateurs :</em> Chef mort (+5), Taille, etc.
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-orange-300 mb-2">La Poursuite</h4>
                                    <p className="text-sm text-stone-300 mb-2">Si Fuite engagée (2 Mouvements opposés). Se résout par <strong>Tests Opposés d'AGI</strong>.</p>
                                    <ul className="list-disc ml-5 space-y-1 text-xs text-stone-400">
                                        <li><strong>Gagnant (Fuyard) :</strong> +10m distance.</li>
                                        <li><strong>Gagnant (Poursuivant) :</strong> -10m distance. (Si dist=0, Attaque possible).</li>
                                        <li>Si distance &gt; 40m : Test CON/PER pour ne pas perdre la trace.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-orange-900/10 border border-orange-500/20 p-4 rounded">
                                <h4 className="font-bold text-orange-200 mb-2 text-sm">Mode Cinématique</h4>
                                <p className="text-xs text-stone-300">
                                    Alternative narrative : Premier à 3 réussites gagne. (5 pour terrain découvert).<br />
                                    <strong>Fuyard gagne :</strong> Seme la poursuite.<br />
                                    <strong>Poursuivant gagne :</strong> Rattrape (Fuyard <em>Essoufflé</em>).
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ============================== */}
                    {/* CHAPITRE 3 : MAGIE */}
                    {/* ============================== */}
                    <section id="magie" className="mb-24">
                        <h2 className="text-3xl text-blue-400 mb-6 font-display border-b-2 border-blue-900/50 pb-2">Chapitre 3 : Magie et Sorts</h2>

                        {/* INTRODUCTION & LANCER */}
                        <div id="lancer-sort" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-blue-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Lancer un Sort</h3>
                            <p className="text-stone-300 mb-4 text-sm">
                                Un sort est une capacité magique signalée par un astérisque (*). Lancer un sort se décompose en : Incantation, Cout en Mana, Effet, Durée.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="text-primary-300 font-bold mb-2">Incantation</h4>
                                    <ul className="list-disc ml-5 space-y-1 text-sm text-stone-300">
                                        <li><strong>Composantes :</strong> Vocale (formule) et Gestuelle (mouvements).</li>
                                        <li><strong>Mains :</strong> Au moins une main libre (Magie Profane). Bâton autorisé.</li>
                                        <li><strong>Magie Divine :</strong> Arme du culte autorisée.</li>
                                        <li><strong>Armure :</strong> Interdite pour les Mages (sauf capacité). Autorisée pour Prêtres/Druides (armes limitées).</li>
                                        <li><strong>Durée :</strong> Dépend de l'action requise (L, A, M, G). Possible de lancer plusieurs sorts par tour si les actions le permettent.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-primary-300 font-bold mb-2">Coût en Mana (PM)</h4>
                                    <p className="text-sm text-stone-300 mb-2">Le coût en PM est égal au <strong>Rang du sort</strong>.</p>
                                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded">
                                        <strong className="block text-blue-300 text-sm mb-1">Concentration Accrue</strong>
                                        <p className="text-xs text-stone-300">
                                            Pour les sorts nécessitant une Action d'Attaque (A) :<br />
                                            Le lanceur peut utiliser une <strong>Action Limitée (L)</strong> pour réduire le coût de <strong>2 PM</strong> (min 0).<br />
                                            <em>Non applicable aux sorts L, M ou G.</em>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* REGLES SPECIALES */}
                        <div id="regles-speciales-magie" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-blue-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Règles Spéciales</h3>

                            {/* BRULURE DE MANA */}
                            <div className="mb-6">
                                <h4 className="font-bold text-lg text-red-400 border-l-4 border-red-500 pl-2 mb-2">Brûlure de Mana</h4>
                                <p className="text-sm text-stone-300 mb-2">
                                    Si le lanceur n'a plus de PM, il peut sacrifier son énergie vitale (PV) pour lancer un sort.
                                </p>
                                <div className="bg-red-900/20 border border-red-500/30 p-3 rounded text-center text-red-200 font-bold mb-2">
                                    PV perdus = 1 Dé de Récupération (DR) par PM manquant
                                </div>
                                <p className="text-xs text-stone-400">
                                    <em>Exemple : Un guerrier-mage (DR d10) a besoin de 2 PM. Il lance 2d10 et perd le total en PV.
                                        Aucune RD ne s'applique. Impossible pour les sorts de soins.</em>
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold text-primary-300 mb-2">Sorts de Zone (Tirs amis)</h4>
                                    <p className="text-sm text-stone-300 mb-2">Difficile d'éviter les alliés au corps-à-corps.</p>
                                    <ul className="list-disc ml-5 space-y-1 text-xs text-stone-300">
                                        <li><strong>Choix 1 :</strong> Cible prioritaire. Alliés touchés mais +5 au test d'AGI (dommages /2).</li>
                                        <li><strong>Choix 2 :</strong> Épargner alliés (0 DM). La cible a dommages /2 si échec AGI, 0 si réussite.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary-300 mb-2">Rendement Décroissant</h4>
                                    <p className="text-sm text-stone-300">
                                        Pour les sorts à <strong>test opposé</strong> ou infligeant un <strong>état</strong> (ex: étourdi).<br />
                                        La cible gagne un bonus cumulatif de <strong>+5</strong> à chaque nouvelle tentative de résistance contre le même sort/effet durant le combat.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RECUPERATION */}
                        <div id="mana" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-blue-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Récupération de Mana</h3>
                            <ul className="space-y-4 text-sm text-stone-300">
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-300 min-w-[80px]">Quotidienne</span>
                                    <span>Récupération totale après une <strong>nuit complète (8h)</strong> + 30 min de méditation/révision. (Peut être réduite par le MJ si mauvaises conditions).</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-300 min-w-[80px]">Grimoire</span>
                                    <span>Si un magicien n'a pas son grimoire, le coût des sorts est <strong>doublé</strong>. Récrire un grimoire : 1 jour + 10 pa / rang de sort.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-300 min-w-[80px]">Divin</span>
                                    <span>Les prêtres/druides doivent respecter leur dogme/nature pour récupérer leur mana.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* ============================== */}
                    {/* CHAPITRE 4 : ENVIRONNEMENT */}
                    {/* ============================== */}
                    <section id="environnement" className="mb-24">
                        <h2 className="text-3xl text-cyan-400 mb-8 font-display border-b-2 border-cyan-900/50 pb-2">Chapitre 4 : Environnement</h2>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* LUMIERE & VISION */}
                            <div id="lumiere-vision" className="glass-panel p-6 rounded-xl border-l-4 border-l-cyan-500">
                                <h3 className="text-xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Lumière & Vision</h3>
                                <p className="text-sm text-stone-300 mb-4">Les malus s'appliquent aux tests de PER (Vigilance) et aux attaques à distance.</p>

                                <div className="space-y-3">
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.8)]"></div>
                                            <span className="font-bold text-stone-200">Lumière vive</span>
                                        </div>
                                        <span className="text-xs font-mono text-stone-400">Pas de malus</span>
                                    </div>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-yellow-700/50"></div>
                                            <span className="font-bold text-stone-300">Pénombre</span>
                                        </div>
                                        <span className="text-xs font-mono text-cyan-400 font-bold">-2 Attaque Dist. / PER</span>
                                    </div>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-black border border-stone-700"></div>
                                            <span className="font-bold text-stone-400">Obscurité</span>
                                        </div>
                                        <span className="text-xs font-mono text-cyan-400 font-bold">-5 Attaque / PER (Aveuglé)</span>
                                    </div>
                                </div>
                                <p className="text-xs text-stone-500 mt-3 italic">Note : La Vision dans le noir ignore la pénombre et l'obscurité (portée 18m, noir & blanc).</p>
                            </div>

                            {/* CHUTE & ASPHYXIE */}
                            <div id="chute-asphyxie" className="glass-panel p-6 rounded-xl border-l-4 border-l-slate-500">
                                <h3 className="text-xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Chute & Asphyxie</h3>

                                <div className="mb-4">
                                    <strong className="text-slate-300 block mb-1 text-sm">Chute</strong>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm">
                                        <p className="mb-2"><strong>1d6 DM par tranche de 3m.</strong> (Max 20d6).</p>
                                        <p className="text-xs text-stone-400">Test d'AGI (Athlétisme) ou Acrobatie DD 15 pour réduire de 3m (1d6) la hauteur effective.</p>
                                    </div>
                                </div>

                                <div>
                                    <strong className="text-slate-300 block mb-1 text-sm">Asphyxie (Noyade)</strong>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm">
                                        <ul className="list-disc ml-4 space-y-1 text-xs text-stone-300">
                                            <li>Retenir souffle : <strong>[MOD CON x 2] minutes</strong> (min 30s).</li>
                                            <li>Au delà : <strong>Test de CON diff 10</strong>.</li>
                                            <li>Échec : Inconscient, 0 PV.</li>
                                            <li>Après 1 min inconscient : Mort.</li>
                                            <li>Difficulté augmente de +1 par test supplémentaire.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ELEMENTS & BRIZ D'OBJETS */}
                        <div className="grid md:grid-cols-2 gap-8 mt-8">
                            <div id="feu-acide" className="glass-panel p-6 rounded-xl border-l-4 border-l-orange-500">
                                <h3 className="text-xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Feu, Acide & Températures</h3>

                                <div className="space-y-4 text-sm text-stone-300">
                                    <div>
                                        <strong className="text-orange-300">Feu & Acide (Par round)</strong>
                                        <ul className="grid grid-cols-2 gap-2 mt-1">
                                            <li className="bg-stone-900/30 p-2 rounded"><span className="text-stone-500 text-xs block">Torche / Fiole d'acide</span> 1d6 DM</li>
                                            <li className="bg-stone-900/30 p-2 rounded"><span className="text-stone-500 text-xs block">Feu de camp / Bain acide</span> 2d6 DM</li>
                                            <li className="bg-stone-900/30 p-2 rounded"><span className="text-stone-500 text-xs block">Incendie / Lave</span> 10d6 DM</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <strong className="text-blue-300">Températures Extrêmes</strong>
                                        <p className="text-xs text-stone-400 mt-1">
                                            Test de CON (Endurance) diff 15 toutes les heures (froid) ou minutes (chaleur extrême).
                                            <br />Échec : 1d6 DM (ignore RD) + Fatigue.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div id="briser-objets" className="glass-panel p-6 rounded-xl border-l-4 border-l-stone-500">
                                <h3 className="text-xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Briser des Objets</h3>
                                <p className="text-sm text-stone-300 mb-3">Pour détruire une porte, un coffre ou une arme.</p>

                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div className="bg-stone-900/50 p-2 rounded text-center">
                                        <strong className="block text-primary-200 text-xs uppercase mb-1">Dureté (RD)</strong>
                                        <span className="text-stone-400 text-xs">Réduit les DM subis.</span>
                                        <div className="font-mono text-stone-200 font-bold mt-1">Bois 5, Pierre 10, Fer 15</div>
                                    </div>
                                    <div className="bg-stone-900/50 p-2 rounded text-center">
                                        <strong className="block text-primary-200 text-xs uppercase mb-1">Résistance (PV)</strong>
                                        <span className="text-stone-400 text-xs">Points de structure.</span>
                                        <div className="font-mono text-stone-200 font-bold mt-1">Porte 20, Coffre 10, Mur 50+</div>
                                    </div>
                                </div>

                                <div className="bg-red-900/20 p-2 rounded border border-red-500/20 text-xs text-red-200">
                                    <strong>Armes :</strong> Attaquer une arme tenue = Malus -5 Attaque. Si DM &gt; Dureté, l'arme casse.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ============================== */}
                    {/* CHAPITRE 5 : AVENTURE */}
                    {/* ============================== */}
                    <section id="aventure" className="mb-24">
                        <h2 className="text-3xl text-amber-400 mb-8 font-display border-b-2 border-amber-900/50 pb-2">Chapitre 5 : Les Règles de l'Aventure</h2>

                        {/* VOYAGE */}
                        <div id="voyage" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-600">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Voyage et Progression</h3>

                            <div className="mb-6">
                                <h4 className="font-bold text-lg mb-2 text-primary-300">Voyage Hivernal</h4>
                                <p className="mb-4 text-stone-300">L'hiver rend les voyages plus difficiles (froid, jours courts).</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="bg-stone-900/50 text-primary-300">
                                                <th className="p-3 border border-white/10">Mois</th>
                                                <th className="p-3 border border-white/10">Difficulté Test</th>
                                                <th className="p-3 border border-white/10">Dommages Subis</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-300">
                                            <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Novembre / Février</td><td className="p-3 border border-white/10 font-bold">+5</td><td className="p-3 border border-white/10">-</td></tr>
                                            <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Décembre / Janvier</td><td className="p-3 border border-white/10 font-bold">+5</td><td className="p-3 border border-white/10">+1d4°</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-bold text-lg mb-2 text-primary-300">Progression du Voyage</h4>
                                <p className="mb-2 text-stone-300">Test de <strong>PER (Survie)</strong> demandé à chaque PJ chaque jour.</p>
                                <ul className="list-disc ml-6 mb-4 text-sm text-stone-300">
                                    <li><strong>Calcul :</strong> Somme des succès (1) et échecs (-1) du groupe. Marge de 10 ou critique vaut double.</li>
                                    <li><strong>Condition - Nuit sans vision :</strong> Dé malus.</li>
                                    <li><strong>Condition - Chemin connu :</strong> Bonus cumulatif de +2.</li>
                                    <li><strong>Condition - Guide compétent :</strong> 1 ou 2 succès auto.</li>
                                </ul>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="bg-stone-900/50 text-primary-300">
                                                <th className="p-3 border border-white/10">Score Groupe</th>
                                                <th className="p-3 border border-white/10">Résultat</th>
                                                <th className="p-3 border border-white/10 hidden md:table-cell">Effet</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-300">
                                            <tr className="bg-red-900/20"><td className="p-3 border border-white/10">3 échecs (ou -3)</td><td className="p-3 border border-white/10 font-bold text-red-300">Progression stoppée + Évt Majeur</td><td className="p-3 border border-white/10 hidden md:table-cell text-xs">Dangerosité (x2/x3)</td></tr>
                                            <tr className="bg-red-900/20"><td className="p-3 border border-white/10">2 échecs</td><td className="p-3 border border-white/10 font-bold text-red-300">Progression ralentie + Évt Majeur</td><td className="p-3 border border-white/10 hidden md:table-cell text-xs">Dangerosité</td></tr>
                                            <tr className="bg-orange-900/20"><td className="p-3 border border-white/10">1 échec</td><td className="p-3 border border-white/10 font-bold text-orange-300">Événement mineur</td><td className="p-3 border border-white/10 hidden md:table-cell text-xs">Dangerosité mineure</td></tr>
                                            <tr className="bg-stone-900/20"><td className="p-3 border border-white/10">0 succès (Neutre)</td><td className="p-3 border border-white/10 text-stone-400">Bivouac inconfortable</td><td className="p-3 border border-white/10 hidden md:table-cell text-xs">Malus récupération</td></tr>
                                            <tr className="bg-green-900/20"><td className="p-3 border border-white/10">1 succès</td><td className="p-3 border border-white/10 text-green-300">Progression ordinaire</td><td className="p-3 border border-white/10 hidden md:table-cell text-xs">-</td></tr>
                                            <tr className="bg-green-900/20"><td className="p-3 border border-white/10">2 succès</td><td className="p-3 border border-white/10 text-green-300">Bivouac confortable</td><td className="p-3 border border-white/10 hidden md:table-cell text-xs">Bonus récupération</td></tr>
                                            <tr className="bg-green-900/20"><td className="p-3 border border-white/10">3 succès</td><td className="p-3 border border-white/10 text-green-300">Progression rapide + Bivouac confortable</td><td className="p-3 border border-white/10 hidden md:table-cell text-xs">Mvt supp. + Bonus récup</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg mb-2 text-primary-300">Récupération</h4>
                                <p className="text-sm text-stone-300 mb-2">Si les conditions ne sont pas optimales, un <strong>Test de CON</strong> est requis.</p>
                                <p className="text-sm text-stone-300 border-l-4 border-red-500 pl-2 bg-red-900/10 p-2"><strong>Échec critique ou marge &gt; 10 :</strong> Perte de 1 Dé de Récupération (DR) ou état <em>Affaibli</em> le lendemain.</p>
                            </div>
                        </div>

                        {/* RENCONTRES */}
                        <div id="rencontres" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-600">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Rencontres Aléatoires</h3>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-bold text-lg mb-2 text-primary-300">Fréquence</h4>
                                    <p className="text-sm text-stone-300 mb-3">Le MJ lance <strong>1d20</strong> à intervalles réguliers (selon densité de population/danger).</p>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm">
                                        <ul className="space-y-1 text-stone-300">
                                            <li className="flex justify-between"><span>Zones peuplées / Routes</span> <span className="text-stone-500 font-mono">15-20</span></li>
                                            <li className="flex justify-between"><span>Terres sauvages</span> <span className="text-stone-500 font-mono">17-20</span></li>
                                            <li className="flex justify-between"><span>Zones dangereuses</span> <span className="text-stone-500 font-mono">19-20</span></li>
                                            <li className="flex justify-between"><span>Donjon / Ruines</span> <span className="text-stone-500 font-mono">16-20 (toutes les heures)</span></li>
                                        </ul>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-2 text-primary-300">Distance de Rencontre</h4>
                                    <p className="text-sm text-stone-300 mb-3">Détermine à quelle distance les groupes se repèrent (Test de PER opposé).</p>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm">
                                        <ul className="space-y-1 text-stone-300">
                                            <li className="flex justify-between"><span>Plaine / Désert</span> <span className="text-stone-500 font-mono">4d6 x 10 m</span></li>
                                            <li className="flex justify-between"><span>Forêt clairsemée / Collines</span> <span className="text-stone-500 font-mono">2d6 x 10 m</span></li>
                                            <li className="flex justify-between"><span>Forêt dense / Jungle</span> <span className="text-stone-500 font-mono">2d6 m</span></li>
                                            <li className="flex justify-between"><span>Intérieur /  Brouillard</span> <span className="text-stone-500 font-mono">1d6 x 3 m</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* OBSTACLES */}
                        <div id="obstacles" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-600">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Obstacles Physiques</h3>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="font-bold text-primary-200 border-l-2 border-primary-500 pl-2 mb-2">Saut en longueur</h4>
                                    <ul className="text-sm text-stone-300 space-y-1">
                                        <li><strong>Avec élan :</strong> Diff = 3 x distance (m)</li>
                                        <li><strong>Sans élan :</strong> Diff = 6 x distance (m)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary-200 border-l-2 border-primary-500 pl-2 mb-2">Grand Froid (&lt;0°C)</h4>
                                    <p className="text-sm text-stone-300">Sans vêtements adaptés : Test CON (Diff = temp. négative) / 6h. Echec = 1d4° DM.</p>
                                </div>
                            </div>

                            <p className="text-sm text-stone-400 italic mb-4">Pour les règles de <strong>Chute</strong> et de <strong>Feu</strong>, voir le <a href="#dangers" onClick={(e) => scrollToSection(e, 'dangers')} className="text-primary-400 hover:text-primary-300 underline">Chapitre 4 : Dangers</a>.</p>

                            <h4 className="font-bold text-lg mb-2 text-primary-300">Forcer un Obstacle</h4>
                            <p className="text-sm text-stone-300 mb-4"><strong>Enfoncer :</strong> Test FOR vs Solidité. <strong>Briser :</strong> Dégâts &gt; RD pour réduire PV (PV = Solidité).</p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-stone-900/50 text-primary-300">
                                            <th className="p-3 border border-white/10">Structure</th>
                                            <th className="p-3 border border-white/10">Solidité / PV</th>
                                            <th className="p-3 border border-white/10">RD</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-stone-300">
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Porte simple (bois)</td><td className="p-3 border border-white/10">15</td><td className="p-3 border border-white/10">5</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Porte épaisse / Cloison</td><td className="p-3 border border-white/10">20</td><td className="p-3 border border-white/10">5-7</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Porte renforcée / Barreaux</td><td className="p-3 border border-white/10">25</td><td className="p-3 border border-white/10">10-20</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Porte blindée / Mur pierre</td><td className="p-3 border border-white/10">30</td><td className="p-3 border border-white/10">15-20</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* MONTURES */}
                        <div id="montures" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-600">
                            <h3 className="text-xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Montures & Combat Monté</h3>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-bold text-lg mb-2 text-primary-300">Combat Monté</h4>
                                    <ul className="list-disc ml-4 text-sm text-stone-300 space-y-2">
                                        <li><strong>Attaque :</strong> Le cavalier utilise ses propres scores d'attaque. Si la monture attaque aussi, elle agit à l'initiative du cavalier.</li>
                                        <li><strong>Charge montée :</strong> Action complète. Déplacement en ligne droite (min 10m). +2 Attaque, +2d6 DM (si lance de cavalerie) ou +2 DM (autre arme). -5 DEF au tour suivant.</li>
                                        <li><strong>Tir monté :</strong> Malus -2 (si monture en mouvement double) ou -5 (galop).</li>
                                        <li><strong>Chute :</strong> Si le cavalier ou la monture tombe (renversé, mort de la monture), le cavalier subit 1d6 DM (Test d'Acrobatie DD 15 pour annuler).</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-2 text-primary-300">Dressage</h4>
                                    <p className="text-sm text-stone-300 mb-2">Diriger une monture au combat nécessite un dressage (cheval de guerre). Sinon : Action de Mouvement pour contrôler (Test de CHA/Dressage diff 15).</p>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm mt-3">
                                        <strong className="block text-primary-200 mb-1">Profil Cheveaux</strong>
                                        <ul className="space-y-1 text-xs text-stone-400">
                                            <li><strong>Cheval léger :</strong> NC 1/2, PV 15, DEF 13, Sabots +2 (1d4+3).</li>
                                            <li><strong>Cheval de guerre :</strong> NC 2, PV 30, DEF 15, Sabots +5 (1d6+4).</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* POISONS */}
                        <div id="poisons" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-purple-600">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Poisons</h3>

                            <div className="flex flex-col md:flex-row gap-4 mb-4 text-sm text-stone-300">
                                <div className="flex-1 bg-purple-900/10 p-3 rounded border border-purple-500/20">
                                    <strong className="text-purple-300 block mb-1">Application</strong>
                                    Test INT diff 10. Echec critique = s'empoisonne. Effet sur 1ère attaque.
                                </div>
                                <div className="flex-1 bg-purple-900/10 p-3 rounded border border-purple-500/20">
                                    <strong className="text-purple-300 block mb-1">Résistance</strong>
                                    Test de CON (Difficulté variable, souvent 10-15).
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-stone-900/50 text-purple-300">
                                            <th className="p-3 border border-white/10">Type</th>
                                            <th className="p-3 border border-white/10">Effet (Échec)</th>
                                            <th className="p-3 border border-white/10">Effet (Réussite)</th>
                                            <th className="p-3 border border-white/10">Délai / Durée</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-stone-300">
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Affaiblissant</td><td className="p-3 border border-white/10"><span className="text-orange-300">Affaibli</span></td><td className="p-3 border border-white/10">-</td><td className="p-3 border border-white/10">Immédiat ou 1d6 rounds</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Lent (Maladie)</td><td className="p-3 border border-white/10">1d4° DM</td><td className="p-3 border border-white/10">-</td><td className="p-3 border border-white/10">1 test / jour</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Rapide (Venin)</td><td className="p-3 border border-white/10 text-red-400 font-bold">2d4° DM</td><td className="p-3 border border-white/10 text-red-300">1d4° DM</td><td className="p-3 border border-white/10">Immédiat</td></tr>
                                        <tr className="bg-purple-900/20"><td className="p-3 border border-white/10">Mortel</td><td className="p-3 border border-white/10 text-red-500 font-bold uppercase">Mort (0 PV)</td><td className="p-3 border border-white/10 text-red-300">2d4° DM</td><td className="p-3 border border-white/10">1d6 min</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* PIEGES */}
                        <div id="pieges" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-stone-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Pièges</h3>

                            <div className="mb-4 text-sm text-stone-300 flex flex-wrap gap-4">
                                <span className="bg-stone-900/50 px-3 py-1 rounded border border-white/10"><strong>Détection :</strong> Test de PER (Bonus +5 si recherche active, vitesse /2).</span>
                                <span className="bg-stone-900/50 px-3 py-1 rounded border border-white/10"><strong>Action :</strong> Contourner (AGI) ou Désamorcer (INT).</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-stone-900/50 text-stone-300">
                                            <th className="p-3 border border-white/10 w-1/4">Piège</th>
                                            <th className="p-3 border border-white/10 text-center w-24">Détecter</th>
                                            <th className="p-3 border border-white/10 text-center w-24">Désamorcer</th>
                                            <th className="p-3 border border-white/10">Effet</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-stone-300">
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Aiguille empoisonnée</td><td className="p-3 border border-white/10 text-center">20</td><td className="p-3 border border-white/10 text-center">10</td><td className="p-3 border border-white/10">Selon poison</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Balancier / Fosse</td><td className="p-3 border border-white/10 text-center">15</td><td className="p-3 border border-white/10 text-center">5-10</td><td className="p-3 border border-white/10">2d6 à 10d4 DM (Demi-DM si AGI 15 réussie)</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Chausse-trappe / Loup</td><td className="p-3 border border-white/10 text-center">5-15</td><td className="p-3 border border-white/10 text-center">5</td><td className="p-3 border border-white/10">1 DM + Immobilisé / Invalide</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Lasso / Filet</td><td className="p-3 border border-white/10 text-center">15</td><td className="p-3 border border-white/10 text-center">10</td><td className="p-3 border border-white/10">Immobilisé + Renversé</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10">Trappe et lames</td><td className="p-3 border border-white/10 text-center">20</td><td className="p-3 border border-white/10 text-center">15</td><td className="p-3 border border-white/10">5d4° DM (Demi-DM si AGI 15 réussie)</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ENQUETE */}
                        <div id="enquete" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-indigo-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Enquête</h3>
                            <p className="text-sm text-stone-300 mb-4"><strong>Durée :</strong> 2d6 minutes par recherche.</p>

                            <div className="grid md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-indigo-900/20 p-4 rounded border border-indigo-500/30">
                                    <h4 className="font-bold text-indigo-300 mb-1">Preuve (PER)</h4>
                                    <p className="text-xs text-stone-400">Trouver un indice matériel (cheveu, tâche, empreinte).</p>
                                </div>
                                <div className="bg-indigo-900/20 p-4 rounded border border-indigo-500/30">
                                    <h4 className="font-bold text-indigo-300 mb-1">Déduction (INT)</h4>
                                    <p className="text-xs text-stone-400">Raisonnement logique, repérer les incohérences.</p>
                                </div>
                                <div className="bg-indigo-900/20 p-4 rounded border border-indigo-500/30">
                                    <h4 className="font-bold text-indigo-300 mb-1">Aveu (CHA)</h4>
                                    <p className="text-xs text-stone-400">Obtenir un renseignement d'un interlocuteur.</p>
                                </div>
                            </div>

                            <p className="text-sm text-stone-300 italic p-3 bg-stone-900/50 rounded">
                                <strong>Règle d'or :</strong> Aucun test n'est nécessaire pour des indices <em>évidents</em> si les joueurs cherchent au bon endroit. Les tests servent à obtenir des détails supplémentaires.
                            </p>
                        </div>
                    </section>

                    {/* ============================== */}
                    {/* CHAPITRE 6 : OBJETS MAGIQUES */}
                    {/* ============================== */}
                    <section id="objets-magiques" className="mb-24">
                        <h2 className="text-3xl text-purple-400 mb-8 font-display border-b-2 border-purple-900/50 pb-2">Chapitre 6 : Objets Magiques</h2>



                        {/* CONSOMMABLES */}
                        <div id="consommables" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-green-600">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Potions & Parchemins</h3>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-bold text-lg mb-2 text-green-300">Potions</h4>
                                    <p className="text-sm text-stone-300 mb-2">Boire une potion est une <strong>Action de Mouvement</strong> (ou Gratuite si tenue en main). Elle est détruite après usage.</p>

                                    <div className="overflow-x-auto mt-2">
                                        <table className="w-full text-xs text-left">
                                            <thead className="text-green-200 bg-green-900/20">
                                                <tr><th className="p-2 border border-white/10">Type</th><th className="p-2 border border-white/10">Effet</th><th className="p-2 border border-white/10">Niveau</th></tr>
                                            </thead>
                                            <tbody className="text-stone-300">
                                                <tr className="even:bg-white/5"><td className="p-2 border border-white/10 font-bold">Soins légers</td><td className="p-2 border border-white/10">Rend 1d8+1 PV</td><td className="p-2 border border-white/10 text-center">1</td></tr>
                                                <tr className="even:bg-white/5"><td className="p-2 border border-white/10 font-bold">Soins modérés</td><td className="p-2 border border-white/10">Rend 2d8+3 PV</td><td className="p-2 border border-white/10 text-center">3</td></tr>
                                                <tr className="even:bg-white/5"><td className="p-2 border border-white/10 font-bold">Soins graves</td><td className="p-2 border border-white/10">Rend 3d8+5 PV</td><td className="p-2 border border-white/10 text-center">5</td></tr>
                                                <tr className="even:bg-white/5"><td className="p-2 border border-white/10 font-bold">Mana</td><td className="p-2 border border-white/10">Rend 1d6 PM</td><td className="p-2 border border-white/10 text-center">2</td></tr>
                                                <tr className="even:bg-white/5"><td className="p-2 border border-white/10 font-bold">Invisibilité</td><td className="p-2 border border-white/10">Comme le sort</td><td className="p-2 border border-white/10 text-center">2</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-2 text-green-300">Parchemins</h4>
                                    <p className="text-sm text-stone-300 mb-2">Lire un parchemin est une <strong>Action Limitée</strong> (sauf sort rapide). Le parchemin tombe en poussière après usage.</p>
                                    <ul className="list-disc ml-4 text-sm text-stone-300 space-y-2">
                                        <li><strong>Utilisateur :</strong> N'importe qui si le sort est de niveau 1 ou 2. Sinon, lanceur de sorts uniquement (test d'INT diff 10 + Niv Sort si non connu).</li>
                                        <li><strong>Effet :</strong> Lance le sort inscrit au niveau indiqué. Ne coûte pas de PM.</li>
                                        <li><strong>Coût :</strong> Niv du sort x 50 po (environ).</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* ARMES MAGIQUES */}
                        <div id="armes-magiques" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-purple-600">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Armes Magiques & Sceptres</h3>
                            <p className="mb-4 text-stone-300">Les armes magiques apportent un bonus en attaque et aux dommages (ex: épée +2 donne +2 attaque/DM). Les maniques existent pour les moines.</p>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-stone-900/50 p-4 rounded border border-white/10">
                                    <h4 className="font-bold text-primary-200 mb-2">Règles Spécifiques</h4>
                                    <ul className="list-disc ml-4 text-sm text-stone-300 space-y-2">
                                        <li><strong>Projectiles :</strong> Les projectiles magiques (flèches, carreaux, billes) sont consommables. Si utilisés avec une arme magique, les bonus ne se cumulent pas (seul le plus haut s'applique). Le bonus le plus faible ajoute +10 m de portée par point.</li>
                                        <li><strong>Niveau de Magie :</strong> Égal au bonus de l'arme + bonus des propriétés.</li>
                                        <li><strong>Note :</strong> Lorsqu'une propriété est doublée, son niveau de magie est doublé (ex: Feu intense = +2d4° DM, niveau +4).</li>
                                    </ul>
                                </div>
                                <div className="bg-stone-900/50 p-4 rounded border border-white/10">
                                    <h4 className="font-bold text-primary-200 mb-2">Sceptres (Magiciens)</h4>
                                    <p className="text-sm text-stone-300 mb-2">Objets (bâton, anneau, etc.) donnant des bonus en attaque magique et aux DM des sorts.</p>
                                    <ul className="list-disc ml-4 text-sm text-stone-300 space-y-1">
                                        <li>Peut être utilisé comme arme si sa forme le permet (ex: bâton).</li>
                                        <li><em>Exemple :</em> Sceptre de feu (+2 attaque magique et DM pour sorts de feu).</li>
                                    </ul>
                                </div>
                            </div>

                            <h4 className="font-bold text-lg mb-4 text-purple-300">Propriétés Spéciales</h4>
                            <div className="overflow-x-auto mb-6">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-stone-900/50 text-purple-300">
                                            <th className="p-3 border border-white/10">Propriété</th>
                                            <th className="p-3 border border-white/10">Effet</th>
                                            <th className="p-3 border border-white/10 w-24">Niveau</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-stone-300">
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10 font-bold">Affûtée</td><td className="p-3 border border-white/10">Critique sur 19-20 (ou +1 marge). +1d4 DM aux critiques.</td><td className="p-3 border border-white/10 text-center">+1</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10 font-bold">Fléau des [X]</td><td className="p-3 border border-white/10">+1d6 DM contre une catégorie (démons, morts-vivants...).</td><td className="p-3 border border-white/10 text-center">+1</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10 font-bold text-red-300">Feu / Froid / Acide...</td><td className="p-3 border border-white/10">+1d6 DM élémentaire.</td><td className="p-3 border border-white/10 text-center">+2</td></tr>
                                        <tr className="even:bg-white/5"><td className="p-3 border border-white/10 font-bold">Parade</td><td className="p-3 border border-white/10">Offre un bonus de DEF.</td><td className="p-3 border border-white/10 text-center">Variable</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-stone-900/30 p-4 rounded border border-white/5">
                                <h4 className="font-bold text-sm text-stone-400 mb-4 uppercase tracking-wide border-b border-white/10 pb-2">Génération Aléatoire - Armes</h4>

                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-stone-300">
                                    {/* Etape 1 : Type */}
                                    <div className="space-y-2">
                                        <strong className="block text-primary-300">1. Type (d6)</strong>
                                        <ul className="space-y-1">
                                            <li><span className="text-stone-500 w-6 inline-block">1-3</span> Arme de contact</li>
                                            <li><span className="text-stone-500 w-6 inline-block">4-5</span> Arme à distance</li>
                                            <li><span className="text-stone-500 w-6 inline-block">6</span> Sceptre (dm bâton)</li>
                                        </ul>
                                    </div>

                                    {/* Etape 2 : Armes Contact */}
                                    <div className="space-y-2">
                                        <strong className="block text-primary-300">2. Armes Contact (d20)</strong>
                                        <ul className="space-y-1 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                                            <li><span className="text-stone-500 w-6 inline-block">1</span> Maniques</li>
                                            <li><span className="text-stone-500 w-6 inline-block">2</span> Bâton</li>
                                            <li><span className="text-stone-500 w-8 inline-block">3-4</span> Dague</li>
                                            <li><span className="text-stone-500 w-6 inline-block">5</span> Épée bâtarde</li>
                                            <li><span className="text-stone-500 w-8 inline-block">6-7</span> Épée courte</li>
                                            <li><span className="text-stone-500 w-8 inline-block">8-10</span> Épée longue</li>
                                            <li><span className="text-stone-500 w-6 inline-block">11</span> Hache 1 main</li>
                                            <li><span className="text-stone-500 w-8 inline-block">12-13</span> Épée 2 mains</li>
                                            <li><span className="text-stone-500 w-6 inline-block">14</span> Hache 2 mains</li>
                                            <li><span className="text-stone-500 w-8 inline-block">15-16</span> Masse/Marteau</li>
                                            <li><span className="text-stone-500 w-8 inline-block">17-18</span> Rapière</li>
                                            <li><span className="text-stone-500 w-6 inline-block">19</span> Katana/Vivelame</li>
                                            <li><span className="text-stone-500 w-6 inline-block">20</span> Autre</li>
                                        </ul>
                                    </div>

                                    {/* Etape 2 : Armes Distance */}
                                    <div className="space-y-2">
                                        <strong className="block text-primary-300">2. Armes Dist. (d20)</strong>
                                        <ul className="space-y-1 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                                            <li><span className="text-stone-500 w-6 inline-block">1</span> Arbalète poing</li>
                                            <li><span className="text-stone-500 w-8 inline-block">2-3</span> Arbalète légère</li>
                                            <li><span className="text-stone-500 w-8 inline-block">4-5</span> Arbalète lourde</li>
                                            <li><span className="text-stone-500 w-8 inline-block">6-7</span> Arc court</li>
                                            <li><span className="text-stone-500 w-8 inline-block">8-9</span> Arc long</li>
                                            <li><span className="text-stone-500 w-6 inline-block">10</span> Dague</li>
                                            <li><span className="text-stone-500 w-6 inline-block">11</span> Fronde</li>
                                            <li><span className="text-stone-500 w-6 inline-block">12</span> Hachette</li>
                                            <li><span className="text-stone-500 w-6 inline-block">13</span> Javelot</li>
                                            <li><span className="text-stone-500 w-8 inline-block">14-15</span> Carreaux</li>
                                            <li><span className="text-stone-500 w-8 inline-block">16-17</span> Flèches</li>
                                            <li><span className="text-stone-500 w-6 inline-block">18</span> Billes</li>
                                            <li><span className="text-stone-500 w-8 inline-block">19-20</span> Autre</li>
                                        </ul>
                                    </div>

                                    {/* Etape 3 : Propriétés */}
                                    <div className="space-y-2">
                                        <strong className="block text-primary-300">3. Propriétés (d12)</strong>
                                        <p className="mb-1 text-[10px] text-stone-400">Si 1d6 &lt; Niv. Magie</p>
                                        <ul className="space-y-1 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                                            <li><span className="text-stone-500 w-8 inline-block">1-2</span> Affûtée</li>
                                            <li><span className="text-stone-500 w-6 inline-block">3</span> Fléau Morts</li>
                                            <li><span className="text-stone-500 w-6 inline-block">4</span> Fléau Dragons</li>
                                            <li><span className="text-stone-500 w-6 inline-block">5</span> Fléau Géants</li>
                                            <li><span className="text-stone-500 w-6 inline-block">6</span> Fléau Gobelins</li>
                                            <li><span className="text-stone-500 w-6 inline-block">7</span> Fléau Démons</li>
                                            <li><span className="text-stone-500 w-6 inline-block">8</span> Feu</li>
                                            <li><span className="text-stone-500 w-6 inline-block">9</span> Froid</li>
                                            <li><span className="text-stone-500 w-6 inline-block">10</span> Foudre</li>
                                            <li><span className="text-stone-500 w-8 inline-block">11-12</span> Spécial / Double</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* OBJETS DEFENSIFS */}
                        <div id="objets-defensifs" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-blue-600">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Objets Défensifs</h3>
                            <p className="mb-4 text-stone-300">Armures, boucliers, robes, capes, bracelets, anneaux.</p>

                            <div className="bg-stone-900/50 p-4 rounded border border-white/10 mb-6">
                                <h4 className="font-bold text-primary-200 mb-2">Règles Spécifiques</h4>
                                <ul className="list-disc ml-4 text-sm text-stone-300 space-y-1">
                                    <li><strong>Un seul bonus magique</strong> de DEF s'applique (le plus haut).</li>
                                    <li><em>Exemple :</em> Anneau +2 ne se cumule pas avec une Armure magique +1. (Mais se cumule avec le sort <em>Armure de mage</em>).</li>
                                    <li><strong>Effet Armure :</strong> Retranche son bonus aux pénalités (ex: tests AGI) mais ne change pas l'AGI max autorisée.</li>
                                    <li><strong>Boucliers :</strong> Le bonus ne se cumule pas avec l'armure en DEF. <em>Option :</em> Convertir le bonus inutilisé en RD contre les critiques.</li>
                                    <li><strong>Niveau de Magie :</strong> Égal au bonus + valeur des propriétés (chaque propriété vaut 1 niveau sauf mention).</li>
                                </ul>
                            </div>

                            <h4 className="font-bold text-lg mb-4 text-blue-300">Propriétés Spéciales</h4>
                            <div className="grid md:grid-cols-2 gap-4 text-sm text-stone-300 mb-6">
                                <div className="p-2 border-b border-white/5"><strong className="text-white">Action libre :</strong> Immunité ralenti/immobilisé/paralysie magique. +5 tests résistance physique.</div>
                                <div className="p-2 border-b border-white/5"><strong className="text-white">Défense :</strong> RD 2 (+1 niv). <strong>Supérieure :</strong> RD 4 (+2 niv).</div>
                                <div className="p-2 border-b border-white/5"><strong className="text-white">Mobile :</strong> Malus d'armure réduit de 4.</div>
                                <div className="p-2 border-b border-white/5"><strong className="text-white">Natation :</strong> +5 Natation, l'armure flotte.</div>
                                <div className="p-2 border-b border-white/5"><strong className="text-white">Ombre :</strong> +5 Discrétion.</div>
                                <div className="p-2 border-b border-white/5"><strong className="text-white">Protection :</strong> Divise par 2 DM critiques et sournoises.</div>
                                <div className="p-2 border-b border-white/5"><strong className="text-white">Résistance magie :</strong> +5 DEF (magie) ou tests résistance magie.</div>
                                <div className="p-2 border-b border-white/5"><strong className="text-white">Résistance [Elément] X :</strong> Réduit de X les DM de l'élément.</div>
                            </div>

                            <div className="bg-stone-900/30 p-4 rounded border border-white/5">
                                <h4 className="font-bold text-sm text-stone-400 mb-4 uppercase tracking-wide border-b border-white/10 pb-2">Génération Aléatoire - Défensif</h4>

                                <div className="grid md:grid-cols-2 gap-6 text-xs text-stone-300">
                                    {/* Etape 1 : Objets */}
                                    <div className="space-y-2">
                                        <strong className="block text-primary-300">1. Objets (d20)</strong>
                                        <ul className="space-y-1 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                                            <li><span className="text-stone-500 w-8 inline-block">1-2</span> Anneau/Cape prot.</li>
                                            <li><span className="text-stone-500 w-8 inline-block">3-4</span> Bracelets/Robe</li>
                                            <li><span className="text-stone-500 w-8 inline-block">5-6</span> Cuir</li>
                                            <li><span className="text-stone-500 w-8 inline-block">7-8</span> Cuir renforcé</li>
                                            <li><span className="text-stone-500 w-8 inline-block">9-10</span> Chemise mailles</li>
                                            <li><span className="text-stone-500 w-8 inline-block">11-13</span> Cotte mailles</li>
                                            <li><span className="text-stone-500 w-8 inline-block">14-15</span> Demi-plaque</li>
                                            <li><span className="text-stone-500 w-6 inline-block">16</span> Plaque complète</li>
                                            <li><span className="text-stone-500 w-8 inline-block">17-18</span> Petit bouclier</li>
                                            <li><span className="text-stone-500 w-8 inline-block">19-20</span> Grand bouclier</li>
                                        </ul>
                                    </div>

                                    {/* Etape 2 : Propriétés */}
                                    <div className="space-y-2">
                                        <strong className="block text-primary-300">2. Propriétés (d12)</strong>
                                        <p className="mb-1 text-[10px] text-stone-400">Si 1d6 &lt; Niv. Magie</p>
                                        <ul className="space-y-1 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                                            <li><span className="text-stone-500 w-6 inline-block">1</span> Action libre</li>
                                            <li><span className="text-stone-500 w-6 inline-block">2</span> Défense/Sup.</li>
                                            <li><span className="text-stone-500 w-6 inline-block">3</span> Natation</li>
                                            <li><span className="text-stone-500 w-6 inline-block">4</span> Ombre</li>
                                            <li><span className="text-stone-500 w-6 inline-block">5</span> Protection</li>
                                            <li><span className="text-stone-500 w-6 inline-block">6</span> Résist. Magie</li>
                                            <li><span className="text-stone-500 w-6 inline-block">7</span> Résist. Feu</li>
                                            <li><span className="text-stone-500 w-6 inline-block">8</span> Résist. Froid</li>
                                            <li><span className="text-stone-500 w-6 inline-block">9</span> Résist. Élec</li>
                                            <li><span className="text-stone-500 w-6 inline-block">10</span> Résist. Acide</li>
                                            <li><span className="text-stone-500 w-6 inline-block">11</span> Mobile</li>
                                            <li><span className="text-stone-500 w-6 inline-block">12</span> Spécial / Double</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* OBJETS POUVOIR & GRIMOIRES */}
                        <div id="objets-pouvoir" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Objets de Pouvoir & Grimoires</h3>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-bold text-amber-300 border-b border-amber-500/30 mb-3 pb-1">Objets de Pouvoir</h4>
                                    <p className="text-sm text-stone-300 mb-3">Procurent des pouvoirs magiques (souvent 1x/jour), calqués sur des capacités de classe.</p>
                                    <div className="bg-stone-900/50 p-3 rounded mb-4 border border-white/10 text-sm">
                                        <ul className="space-y-2 text-stone-300">
                                            <li><strong>Activation :</strong> Action gratuite (1x/tour) ou Action d'attaque (if sort d'attaque).</li>
                                            <li><strong>Niveau nécessaire :</strong> Égal au rang du sort dupliqué (ou somme des rangs).</li>
                                        </ul>
                                    </div>

                                    <div className="border border-white/10 rounded overflow-hidden">
                                        <div className="bg-stone-900/80 p-2 text-xs font-bold text-stone-400 uppercase tracking-wide border-b border-white/10">Génération Aléatoire</div>
                                        <div className="p-3 text-xs space-y-3 bg-stone-900/30 text-stone-300">
                                            <div>
                                                <strong className="text-primary-300 block mb-1">1. Rang du Pouvoir (d8)</strong>
                                                1-2: R1, 3-4: R2, 5-6: R3, 7: R4, 8: R5.
                                            </div>
                                            <div>
                                                <strong className="text-primary-300 block mb-1">2. Profil d'origine (d20)</strong>
                                                <div className="grid grid-cols-2 gap-1">
                                                    <span>1: Arquebusier</span><span>2: Barde</span>
                                                    <span>3: Barbare</span><span>4: Chevalier</span>
                                                    <span>5-6: Druide</span><span>7-8: Ensorceleur</span>
                                                    <span>9-10: Forgesort</span><span>11: Guerrier</span>
                                                    <span>12-13: Magicien</span><span>14: Moine</span>
                                                    <span>15-16: Sorcier</span><span>17-18: Prêtre</span>
                                                    <span>19: Rôdeur</span><span>20: Voleur</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-300 border-b border-amber-500/30 mb-3 pb-1">Grimoires de Pouvoir</h4>
                                    <p className="text-sm text-stone-300 mb-3">Contiennent des sorts inconnus. Utilisables par Mages (profane) et Mystiques (divin). Bardes (les deux).</p>
                                    <ul className="text-sm text-stone-300 space-y-2 mb-4 bg-stone-900/50 p-3 rounded border border-white/10">
                                        <li><strong>Condition :</strong> Avoir le niveau adéquat pour le rang du sort.</li>
                                        <li><strong>Coût :</strong> 1 PM quel que soit le niveau (Action Limitée).</li>
                                        <li><strong>Fréquence :</strong> 1 fois par jour par inscription du sort.</li>
                                        <li><strong>Niveau objet :</strong> (Somme des rangs inscrits) / 3.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* OBJETS DIVERS */}
                        <div id="objets-divers" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-green-500">
                            <h3 className="2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Autres Objets Magiques</h3>

                            <div className="space-y-8">
                                {/* Objets de Puissance */}
                                <div>
                                    <h4 className="font-bold text-lg text-green-300 mb-2 border-b border-white/5 pb-1">Objets de Puissance</h4>
                                    <p className="text-sm text-stone-300 mb-4">Augmentent une caractéristique (ex: Ceinture de Force). Objets mineurs augmentent caractéristiques secondaires.</p>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-stone-900/50 p-3 rounded text-sm text-stone-300 border border-white/10">
                                            <strong className="text-primary-200">Niveau de Magie</strong>
                                            <ul className="list-disc ml-4 mt-2 space-y-1">
                                                <li><strong>Carac. Principale :</strong> Bonus x 3 (Max +2/+3 conseillé).</li>
                                                <li><strong>DR / PC :</strong> 1 niv / point.</li>
                                                <li><strong>PM :</strong> 1 niv / 3 PM.</li>
                                                <li><strong>PV :</strong> 1 niv / 5 PV.</li>
                                            </ul>
                                        </div>
                                        <div className="bg-stone-900/50 p-3 rounded text-sm text-stone-300 border border-white/10">
                                            <strong className="text-primary-200">Génération (d12)</strong>
                                            <div className="grid grid-cols-3 gap-1 mt-2 text-xs">
                                                <span>1: AGI</span><span>2: CON</span><span>3: FOR</span>
                                                <span>4: PER</span><span>5: CHA</span><span>6: INT</span>
                                                <span>7: VOL</span><span>8: DR</span><span>9: PC</span>
                                                <span>10: PM</span><span>11: PV</span><span>12: Relancer</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Objets de Compétence */}
                                <div>
                                    <h4 className="font-bold text-lg text-green-300 mb-2 border-b border-white/5 pb-1">Objets de Compétence</h4>
                                    <p className="text-sm text-stone-300"><strong>Bonus +5</strong> sur un type de test unique (ex: Cape elfique pour discrétion). <strong>Niveau 1</strong>.</p>
                                </div>

                                {/* Objets Prestigieux */}
                                <div>
                                    <h4 className="font-bold text-lg text-green-300 mb-2 border-b border-white/5 pb-1">Objets Prestigieux</h4>
                                    <p className="text-sm text-stone-300 mb-2">Objets évolutifs possédant leur propre "Voie" (jusqu'à 5 rangs).</p>
                                    <div className="text-xs text-stone-400 mb-4 font-mono bg-stone-900/50 p-2 rounded border border-white/5">
                                        <strong>Conditions :</strong> Haut fait, exploit (niveau requis) ou connaissance spécifique.
                                    </div>

                                    <div className="border border-green-500/30 bg-green-900/10 p-4 rounded-lg">
                                        <div className="flex justify-between items-start mb-4">
                                            <h5 className="font-bold text-green-200 text-lg">Exemple : La Lame des Échos (Rapière)</h5>
                                            <span className="text-xs bg-green-900/50 px-2 py-1 rounded text-green-100 border border-green-500/30">Barde uniquement</span>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-green-500/20"></div>
                                            <div className="space-y-4">
                                                <div className="relative pl-8">
                                                    <div className="absolute left-0 w-4 h-4 rounded-full bg-green-900 border-2 border-green-500/50 text-[10px] flex items-center justify-center text-green-200 font-bold">1</div>
                                                    <strong className="block text-stone-200 text-sm">Lame exceptionnelle</strong>
                                                    <p className="text-xs text-stone-400">Bonus +1 attaque et DM.</p>
                                                </div>
                                                <div className="relative pl-8">
                                                    <div className="absolute left-0 w-4 h-4 rounded-full bg-green-900 border-2 border-green-500/50 text-[10px] flex items-center justify-center text-green-200 font-bold">2</div>
                                                    <strong className="block text-stone-200 text-sm">Amplification</strong>
                                                    <p className="text-xs text-stone-400">Double portée et +1d4 DM à Attaque sonore (Barde).</p>
                                                    <p className="text-[10px] text-green-400/70 mt-0.5 italic">Pré-requis: découvrir noms du forgeron et du premier barde.</p>
                                                </div>
                                                <div className="relative pl-8">
                                                    <div className="absolute left-0 w-4 h-4 rounded-full bg-green-900 border-2 border-green-500/50 text-[10px] flex items-center justify-center text-green-200 font-bold">3</div>
                                                    <strong className="block text-stone-200 text-sm">Focalisation</strong>
                                                    <p className="text-xs text-stone-400">Devient +2. Focalisation pour Zone de silence.</p>
                                                    <p className="text-[10px] text-green-400/70 mt-0.5 italic">Pré-requis: reproduire la note de l'arme (Test PER diff 30).</p>
                                                </div>
                                                <div className="relative pl-8">
                                                    <div className="absolute left-0 w-4 h-4 rounded-full bg-green-900 border-2 border-green-500/50 text-[10px] flex items-center justify-center text-green-200 font-bold">4</div>
                                                    <strong className="block text-stone-200 text-sm">Lame vibrante</strong>
                                                    <p className="text-xs text-stone-400">Action gratuite : devient affûtée pour le combat.</p>
                                                    <p className="text-[10px] text-green-400/70 mt-0.5 italic">Pré-requis: apprendre la mort du barde original.</p>
                                                </div>
                                                <div className="relative pl-8">
                                                    <div className="absolute left-0 w-4 h-4 rounded-full bg-green-900 border-2 border-green-500/50 text-[10px] flex items-center justify-center text-green-200 font-bold">5</div>
                                                    <strong className="block text-stone-200 text-sm">Vibration mortelle</strong>
                                                    <p className="text-xs text-stone-400">Inflige 1d12 DM quand elle vibre.</p>
                                                    <p className="text-[10px] text-green-400/70 mt-0.5 italic">Pré-requis: réhabiliter le nom du barde devant le roi.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </section>

                    {/* ============================== */}
                    {/* CHAPITRE 7 : OPPOSITION */}
                    {/* ============================== */}
                    <section id="opposition" className="mb-24">
                        <h2 className="text-3xl text-purple-400 mb-2 font-display border-b-2 border-purple-900/50 pb-2">Chapitre 7 : Opposition</h2>


                        {/* REGLES GENERALES */}
                        <div id="general-opposition" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-purple-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Règles Générales des Créatures</h3>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="font-bold text-primary-200 mb-2">Niveau de Créature (NC)</h4>
                                    <p className="text-sm text-stone-300 mb-2">Indicateur de puissance. Un groupe de 4 PJ affronte une créature de NC égal à leur niveau moyen (rencontre 'ordinaire').</p>
                                    <p className="text-xs text-stone-400 italic">Exemple : Un squelette (NC 1) est adapté pour un groupe de niveau 1.</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary-200 mb-2">Règles de Combat Specifiques</h4>
                                    <ul className="text-sm text-stone-300 space-y-1">
                                        <li><strong>Attaques Multiples :</strong> "(2 attaques)" signifie que toutes les attaques se font en une seule action.</li>
                                        <li><strong>Attaques Combinées :</strong> (Ex: "Morsure et griffes") 1 seul test, 1 seule application de DM.</li>
                                        <li><strong>Dommages :</strong> Bonus déjà inclus dans le profil.</li>
                                        <li><strong>RD (Réduction de Dommages) :</strong> Soustrait des DM reçus (min 1 infligé).</li>
                                        <li><strong>Carac. Supérieure (*) :</strong> +1d20 (dé bonus) aux tests de cette carac (sauf attaque).</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-bold text-primary-200 mb-2">Types de Créatures</h4>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div className="bg-stone-900/30 p-3 rounded border border-white/5">
                                        <strong className="block text-purple-300 mb-1">Vivante</strong>
                                        Animaux, humains, etc. Sensibles maladies/poisons.
                                    </div>
                                    <div className="bg-stone-900/30 p-3 rounded border border-white/5">
                                        <strong className="block text-purple-300 mb-1">Humanoïde</strong>
                                        Bipèdes, doués de parole.
                                    </div>
                                    <div className="bg-stone-900/30 p-3 rounded border border-white/5">
                                        <strong className="block text-purple-300 mb-1">Végétative</strong>
                                        Pas de respiration, immunités (maladies/poisons). Si "plante", immunité mental.
                                    </div>
                                    <div className="bg-stone-900/30 p-3 rounded border border-white/5">
                                        <strong className="block text-purple-300 mb-1">Non Vivante</strong>
                                        Morts-vivants, construits. Immunités CON, fatigue, mental (si sans esprit). Vision nuit.
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-primary-200 mb-2">Catégories de Taille</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="text-stone-400 bg-stone-900/50">
                                            <tr>
                                                <th className="p-2">Taille</th>
                                                <th className="p-2">Hauteur Max</th>
                                                <th className="p-2">Poids Max</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-300">
                                            <tr className="border-t border-white/5"><td>Minuscule</td><td>10 cm</td><td>0,5 kg</td></tr>
                                            <tr className="border-t border-white/5"><td>Très petite</td><td>50 cm</td><td>5 kg</td></tr>
                                            <tr className="border-t border-white/5"><td>Petite</td><td>1 m</td><td>50 kg</td></tr>
                                            <tr className="border-t border-white/5"><td>Moyenne</td><td>2 m</td><td>200 kg</td></tr>
                                            <tr className="border-t border-white/5"><td>Grande</td><td>3 m</td><td>2 t</td></tr>
                                            <tr className="border-t border-white/5"><td>Énorme</td><td>6 m</td><td>10 t</td></tr>
                                            <tr className="border-t border-white/5"><td>Colossale</td><td>-</td><td>-</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* BESTIAIRE */}
                        <div id="bestiaire" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-purple-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Bestiaire (Exemples)</h3>

                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* SQUELETTES */}
                                <div className="space-y-4">
                                    <div className="bg-stone-900/40 p-4 rounded border border-white/10">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h4 className="font-bold text-stone-100">Squelette de base</h4>
                                            <span className="text-xs font-bold text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded">NC 1</span>
                                        </div>
                                        <p className="text-xs text-stone-400 mb-2">Non-vivant, Moyenne</p>
                                        <div className="text-sm text-stone-300 space-y-1">
                                            <p><strong>Carac :</strong> FOR +4, AGI +2, CON +4, INT -2, PER +1, CHA -2</p>
                                            <p><strong>Combat :</strong> DEF 13, PV 9, Init 9</p>
                                            <p><strong>Attaque :</strong> Épée +4 (DM 1d6+1)</p>
                                            <p className="text-xs italic mt-2 text-stone-400">Capacités : Sans esprit (Immu mental), Résistance DM (1/2 sauf contondant), Réduction froid (5).</p>
                                        </div>
                                    </div>

                                    <div className="bg-stone-900/40 p-4 rounded border border-white/10">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h4 className="font-bold text-stone-100">Squelette Géant</h4>
                                            <span className="text-xs font-bold text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded">NC 4</span>
                                        </div>
                                        <p className="text-xs text-stone-400 mb-2">Non-vivant, Grande</p>
                                        <div className="text-sm text-stone-300 space-y-1">
                                            <p><strong>Carac :</strong> FOR +6, AGI +1, CON +6, INT -4, PER -2, CHA -4</p>
                                            <p><strong>Combat :</strong> DEF 18, PV 60, Init 9</p>
                                            <p><strong>Attaque :</strong> Massue à 2 mains +9 (DM 2d8+6)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* VAMPIRES */}
                                <div className="space-y-4">
                                    <div className="bg-stone-900/40 p-4 rounded border border-white/10">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h4 className="font-bold text-stone-100">Vampire</h4>
                                            <span className="text-xs font-bold text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded">NC 8</span>
                                        </div>
                                        <p className="text-xs text-stone-400 mb-2">Non-vivant</p>
                                        <div className="text-sm text-stone-300 space-y-1">
                                            <p><strong>Carac :</strong> FOR +5, AGI +4*, CON +5*, INT +4, PER +4*, CHA +4</p>
                                            <p><strong>Combat :</strong> DEF 20, PV 70, Init 17</p>
                                            <p><strong>Attaque :</strong> Griffes/Morsure (2 att) +11 (1d8+5 + absorp)</p>
                                            <p className="text-xs italic mt-2 text-stone-400">Capacités : Absorption (5 PV), Immortel (Brumes), Forme Gazeuse, Pattes d'araignée, Regard envoûtant (Diff 15), RD 10 (sauf argent/feu).</p>
                                        </div>
                                    </div>

                                    <div className="bg-stone-900/40 p-4 rounded border border-white/10">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h4 className="font-bold text-stone-100">Troll</h4>
                                            <span className="text-xs font-bold text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded">NC 5</span>
                                        </div>
                                        <p className="text-xs text-stone-400 mb-2">Grande</p>
                                        <div className="text-sm text-stone-300 space-y-1">
                                            <p><strong>Combat :</strong> DEF 19, PV 70 (RD 3), Init 10</p>
                                            <p><strong>Attaque :</strong> 2 Griffes +10 (1d6+6) ou Rocher +10</p>
                                            <p className="text-xs italic mt-2 text-stone-400">Capacités : Fauchage (critique), Régénération 5 (sauf feu/acide).</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CREATION CREATURES */}
                        <div id="creation-creatures" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-purple-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Création de Créatures</h3>

                            <div className="grid md:grid-cols-2 gap-8 mb-6">
                                <div>
                                    <h4 className="font-bold text-primary-200 mb-2 border-b border-primary-500/30 pb-1">1. Statistiques de Base</h4>
                                    <p className="text-sm text-stone-300 mb-2">Pour créer un monstre équilibré, utilisez ces formules basées sur le Niveau de Créature (NC).</p>
                                    <ul className="space-y-2 text-sm text-stone-300">
                                        <li className="flex justify-between items-center bg-stone-900/40 p-2 rounded"><span>Mod. Carac principal</span> <span className="font-mono text-purple-300 underline decoration-dotted" title="NC+3 jusqu'au Niv 10, puis +1/2 Niv">+3 à +15</span></li>
                                        <li className="flex justify-between items-center bg-stone-900/40 p-2 rounded"><span>Attaque (Contact/Dist)</span> <span className="font-mono text-purple-300">NC + Mod. (+3 min)</span></li>
                                        <li className="flex justify-between items-center bg-stone-900/40 p-2 rounded"><span>Dégâts Moyens</span> <span className="font-mono text-purple-300">NC x 3 (environ)</span></li>
                                        <li className="flex justify-between items-center bg-stone-900/40 p-2 rounded"><span>Défense</span> <span className="font-mono text-purple-300">12 + NC</span></li>
                                        <li className="flex justify-between items-center bg-stone-900/40 p-2 rounded"><span>Difficulté des Sorts</span> <span className="font-mono text-purple-300">10 + NC</span></li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary-200 mb-2 border-b border-primary-500/30 pb-1">2. Boss & Puissance</h4>
                                    <p className="text-sm text-stone-300 mb-3">Un boss est conçu pour affronter seul (ou avec peu d'aides) un groupe de 4 aventuriers.</p>
                                    <div className="space-y-3">
                                        <div className="bg-purple-900/20 p-2 rounded border border-purple-500/20">
                                            <strong className="text-purple-300 text-sm block">Boss (NC équivalent au Niv PJs)</strong>
                                            <ul className="text-xs text-stone-400 list-disc ml-4">
                                                <li><strong>PV :</strong> Multipliés par 3 à 5 (selon difficulté).</li>
                                                <li><strong>Initiative :</strong> 2 tours d'Init (ex: 20 et 10). Agit 2 fois par round.</li>
                                                <li><strong>Sauvegardes :</strong> Lance 2 dés et garde le meilleur.</li>
                                            </ul>
                                        </div>
                                        <div className="bg-stone-900/20 p-2 rounded border border-white/10">
                                            <strong className="text-stone-300 text-sm block">Sbires (Minions)</strong>
                                            <p className="text-xs text-stone-400">PV réduits (meurent en 1-2 coups). NC inférieur de 3 à 5 niveaux.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-2">
                                <h4 className="font-bold text-primary-200 mb-2">Table de Progression Rapide (Standard)</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-stone-900/50 text-stone-400">
                                            <tr>
                                                <th className="p-2 border border-white/10">NC</th>
                                                <th className="p-2 border border-white/10">Attaque</th>
                                                <th className="p-2 border border-white/10">DM Moyens</th>
                                                <th className="p-2 border border-white/10">Défense</th>
                                                <th className="p-2 border border-white/10">PV Moyens</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-300">
                                            {[
                                                [1, "+4", "6 (1d6+3)", 13, 15],
                                                [2, "+5", "9 (1d8+4)", 14, 25],
                                                [3, "+7", "12 (2d6+5)", 15, 35],
                                                [4, "+9", "15 (2d8+6)", 16, 50],
                                                [5, "+11", "18 (3d6+7)", 17, 65],
                                                [8, "+15", "27 (4d8+9)", 20, 110],
                                                [10, "+18", "33 (5d8+10)", 22, 140],
                                                [12, "+21", "39 (6d8+12)", 24, 170],
                                                [15, "+25", "48 (8d8+12)", 27, 220],
                                                [20, "+32", "65 (10d10+10)", 32, 400],
                                            ].map(([nc, att, dm, def, pv]) => (
                                                <tr key={nc} className="even:bg-white/5 border-t border-white/5">
                                                    <td className="p-2 border-r border-white/10 font-bold">{nc}</td>
                                                    <td className="p-2 border-r border-white/10 text-center">{att}</td>
                                                    <td className="p-2 border-r border-white/10">{dm}</td>
                                                    <td className="p-2 border-r border-white/10 text-center">{def}</td>
                                                    <td className="p-2 text-center">{pv}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </section>

                    {/* ============================== */}
                    {/* CHAPITRE 8 : MENEUR DE JEU */}
                    {/* ============================== */}
                    <section id="meneur-eu-jeu" className="mb-24">
                        <h2 className="text-3xl text-amber-500 mb-2 font-display border-b-2 border-amber-900/50 pb-2">Chapitre 8 : Devenir Meneur de Jeu</h2>


                        {/* ROLE DU MJ */}
                        <div id="role-mj" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Le Rôle du MJ</h3>

                            <div className="mb-6">
                                <p className="text-stone-300 italic mb-4">"Celui ou celle qui mène la partie et permet à l'aventure d'exister. Connaît les ressorts de l'histoire et assure que tout le monde passe un bon moment."</p>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-bold text-amber-200 mb-2">Tâches Principales</h4>
                                        <ul className="list-disc ml-5 text-sm text-stone-300 space-y-1">
                                            <li>Décrire les scènes, les actes et paroles des PNJ.</li>
                                            <li>Arbitrer les règles (jets de dés, caractéristiques).</li>
                                            <li>Improviser face aux actions imprévues des joueurs.</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-amber-200 mb-2">Pré-requis</h4>
                                        <p className="text-sm text-stone-300">Avoir déjà joué ou vu jouer une partie (ex: vidéos en ligne).</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PREPARATION */}
                        <div id="preparation-mj" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Avant la Première Partie</h3>

                            <div className="grid md:grid-cols-2 gap-6 text-sm text-stone-300">
                                <div>
                                    <strong className="block text-amber-300 mb-1">Maîtriser les Règles</strong>
                                    Indispensable pour gérer les PNJ et annoncer les jets. Connaître la création de perso pour aider les joueurs.
                                </div>
                                <div>
                                    <strong className="block text-amber-300 mb-1">Le Scénario</strong>
                                    Point de départ, but, lieux et PNJ. <em>Conseil :</em> Bien le lire et anticiper les PJ.
                                </div>
                                <div>
                                    <strong className="block text-amber-300 mb-1">L'Univers</strong>
                                    Commencer petit (village). Introduire le vaste monde plus tard.
                                </div>
                                <div>
                                    <strong className="block text-amber-300 mb-1">Matériel & Lieu</strong>
                                    Pièce isolée, table, écran MJ. Au moins deux sets de dés (MJ/Joueurs).
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-stone-900/50 rounded border border-white/10 text-sm text-stone-300">
                                <strong className="text-primary-200">Les Joueurs :</strong> Groupe idéal de 3-4 débutants. Durée conseillée : 3h max (fatigue).
                            </div>
                        </div>

                        {/* DEROULEMENT */}
                        <div id="deroulement-session" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Déroulement de la Partie</h3>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-lg text-amber-200 mb-2">1. Sessions Préliminaires</h4>
                                    <ul className="list-disc ml-5 text-sm text-stone-300 space-y-1">
                                        <li><strong>Session 0 (Création) :</strong> Prétirés ou création guidée (Familles différentes recommandées).</li>
                                        <li><strong>Consentement :</strong> Lister les thèmes à éviter (phobies, violence). Adapter aux enfants.</li>
                                        <li><strong>Style :</strong> Combat vs Subtilité ? S'accorder pour éviter les décalages.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-bold text-lg text-amber-200 mb-2">2. Démarrer</h4>
                                    <p className="text-sm text-stone-300 mb-2">Exposition théâtrale de la situation. Description des PJ (visuel uniquement). Puis la question rituelle :</p>
                                    <div className="text-center font-display text-xl text-white my-4">"Que faites-vous ?"</div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-lg text-amber-200 mb-2">3. En Jeu</h4>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm text-stone-300">
                                        <div className="bg-stone-900/30 p-3 rounded border border-white/5">
                                            <strong className="block text-primary-300 mb-1">Description</strong>
                                            Détails sensoriels (vue, ouïe, odeurs). Utiliser références connues (films).
                                        </div>
                                        <div className="bg-stone-900/30 p-3 rounded border border-white/5">
                                            <strong className="block text-primary-300 mb-1">Gestion de l'Imprévu</strong>
                                            Ne pas paniquer. Rester logique. Ne pas bloquer, mais rappeler la mission.
                                        </div>
                                        <div className="bg-stone-900/30 p-3 rounded border border-white/5">
                                            <strong className="block text-primary-300 mb-1">Séquence de Jeu</strong>
                                            Dialogue cyclique MJ/Joueurs. Couper court si discussions trop longues.
                                        </div>
                                        <div className="bg-stone-900/30 p-3 rounded border border-white/5">
                                            <strong className="block text-primary-300 mb-1">Gestion de Groupe</strong>
                                            Ordre réponses : Actions brèves → Tests simples → Actions complexes. Gérer sous-groupes par 5 min.
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-stone-500 italic">
                                        Note : Le temps est élastique (ellipses, ralentis combat). Les durées de capacités sont 'en jeu'.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MECANIQUE MJ */}
                        <div id="mecanique-mj" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-500">
                            <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Mécanique MJ : Le Test Passif</h3>
                            <p className="text-sm text-stone-300 mb-2">Pour la fluidité ou le suspense (cacher le résultat).</p>
                            <div className="bg-stone-900/50 p-3 rounded border-l-4 border-amber-300 text-sm text-stone-300">
                                Attribuer une valeur fixe (<strong>10</strong>) au jet de dé du PNJ, ou faire le jet caché pour le PJ.
                            </div>
                        </div>

                        {/* PROGRESSION */}
                        <div id="progression-recompenses" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Progression & Récompenses</h3>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-bold text-amber-200 mb-2">Gain de Niveau</h4>
                                    <p className="text-sm text-stone-300 mb-2">Le MJ décide quand les PJ montent de niveau. (Pas de compte d'XP fastidieux).</p>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm">
                                        <ul className="space-y-1 text-stone-300">
                                            <li><strong>Rythme rapide :</strong> 1 niveau par séance de 4h.</li>
                                            <li><strong>Rythme moyen :</strong> 1 niveau toutes les 2-3 séances.</li>
                                            <li><strong>Niv 1 à 5 :</strong> Progression rapide recommandée pour atteindre la spécialisation.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-200 mb-2">Trésors & Équipement</h4>
                                    <p className="text-sm text-stone-300 mb-2">Récompenser les PJ avec de l'or et des objets magiques.</p>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm text-stone-300">
                                        <p className="mb-1"><strong>Niveau de richesse :</strong> Au niveau L, un personnage devrait posséder pour environ <strong>L x 100 po</strong> d'équipement (dont objets magiques).</p>
                                        <p><em>Exemple Niv 5 :</em> Équipement total ~500 po (ex: Armure plaques, Arme +1, un accessoire).</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="font-bold text-amber-200 mb-2">Points de Chance (PC)</h4>
                                <p className="text-sm text-stone-300 mb-2">Les PC sont une ressource précieuse pour réussir les actions héroïques.</p>
                                <ul className="list-disc ml-5 text-sm text-stone-300">
                                    <li><strong>Début de partie :</strong> Max de PC.</li>
                                    <li><strong>Gain de niveau :</strong> Récupèrent tous leurs PC.</li>
                                    <li><strong>Récompense exceptionnelle :</strong> Le MJ peut rendre 1 PC pour une action d'éclat ou un bon roleplay.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* ============================== */}
                    {/* ANNEXE : GUIDE DE CONVERSION */}
                    {/* ============================== */}
                    <section id="conversion-guide" className="mb-24">
                        <h2 className="text-3xl text-stone-400 mb-2 font-display border-b-2 border-stone-800 pb-2">Annexe : Guide de Conversion COF1 {'>'} COF2</h2>

                        <div className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-stone-500">
                            <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Principes Généraux</h3>
                            <p className="text-sm text-stone-300 mb-4">L'impact est mineur. Les aventures COF1 sont jouables en COF2 avec des ajustements légers.</p>

                            <div className="grid md:grid-cols-2 gap-6 text-sm text-stone-300 mb-6">
                                <div className="space-y-3">
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10">
                                        <strong className="block text-primary-300 mb-1">Caractéristiques</strong>
                                        <ul className="list-disc ml-4 space-y-1">
                                            <li><strong>DEX</strong> devient <strong>AGI</strong> (Agilité).</li>
                                            <li><strong>SAG</strong> devient <strong>PER</strong> (Perception).</li>
                                            <li><strong>VOL</strong> (Volonté) est <strong>AJOUTÉE</strong>. <span className="text-stone-500 italic">(-4 peureux à +6 inflexible).</span></li>
                                        </ul>
                                    </div>
                                    <div className="bg-stone-900/50 p-3 rounded border border-white/10">
                                        <strong className="block text-primary-300 mb-1">Terminologie</strong>
                                        <ul className="list-disc ml-4 space-y-1">
                                            <li><strong>PV</strong> (Points de Vie) devient <strong>PV</strong> (Points de Vigueur).</li>
                                            <li><strong>Difficulté :</strong> Identique. Aucune conversion.</li>
                                            <li><strong>Initiative :</strong> Légèrement plus faible en COF2. (Conserver tel quel possible).</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="bg-stone-900/50 p-3 rounded border border-white/10">
                                    <strong className="block text-primary-300 mb-2">Conversion des Créatures</strong>
                                    <p className="mb-2">Pour chaque Rang de voie (ou pouvoir équivalent) :</p>
                                    <ul className="list-disc ml-4 space-y-1 mb-3">
                                        <li><strong>+1 Attaque</strong></li>
                                        <li><strong>+2 DM</strong> (ou converti en une Attaque supplémentaire si DM élevés).</li>
                                        <li><strong>+10 PV</strong></li>
                                    </ul>
                                    <div className="mt-2 pt-2 border-t border-white/5">
                                        <strong className="block text-primary-300 mb-1">Ajustement final par NC</strong>
                                        <div className="grid grid-cols-4 gap-1 text-xs text-center">
                                            <div className="bg-stone-800 p-1 rounded">NC 5-6 <br /><strong>-1 Att</strong></div>
                                            <div className="bg-stone-800 p-1 rounded">NC 9-10 <br /><strong>-3 Att</strong></div>
                                            <div className="bg-stone-800 p-1 rounded">NC 13-14 <br /><strong>-5 Att</strong></div>
                                            <div className="bg-stone-800 p-1 rounded">NC 19-20 <br /><strong>-8 Att</strong></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-stone-900/30 p-4 rounded border border-white/5">
                                <h4 className="font-bold text-stone-200 mb-2">Exemple : Médreï ar Maëdra (Anathazerïn)</h4>
                                <div className="grid md:grid-cols-2 gap-4 text-xs text-stone-400">
                                    <div>
                                        <strong className="block text-red-400 mb-1">COF 1 (Original)</strong>
                                        NC 14, FOR +8, DEX +4, CON +8, INT +6, SAG +5, CHA +5<br />
                                        DEF 28, PV 130<br />
                                        Att : +17 (1d6+5 venin)<br />
                                        Att : +17 (1d6+10 épée)
                                    </div>
                                    <div>
                                        <strong className="block text-green-400 mb-1">COF 2 (Converti)</strong>
                                        NC 14, FOR +8, <span className="text-white">AGI</span> +4, CON +8, INT +6, <span className="text-white">PER</span> +5, CHA +5, <span className="text-white">VOL +6</span><br />
                                        DEF 28, <span className="text-white">PV 190</span> (+60)<br />
                                        Att : <span className="text-white">+18</span> (1d6+5 venin)<br />
                                        Att : <span className="text-white">+18 (2 attaques)</span> (1d6+10 épée)
                                    </div>
                                </div>
                                <p className="mt-2 text-xs italic text-stone-500">Note : 6 rangs de voies (+6 Att, +60 PV, +12 DM). Les +12 DM sont convertis en une attaque supplémentaire. Ajustement NC 14 (-5 Att). Total Att : +17 +6 -5 = +18.</p>
                            </div>
                        </div>
                    </section>
                </div >
            </main >
        </div >
    );
};
