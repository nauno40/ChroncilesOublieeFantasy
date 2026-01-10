import React from 'react';

interface RuleChapter5Props {
    scrollToSection: (e: React.MouseEvent<HTMLAnchorElement> | null, id: string) => void;
}

export const RuleChapter5: React.FC<RuleChapter5Props> = ({ scrollToSection }) => {
    return (
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
    );
};
