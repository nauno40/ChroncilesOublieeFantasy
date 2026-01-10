import React from 'react';

export const RuleChapter1: React.FC = () => {
    return (
        <section id="bases" className="mb-24">
            <h2 className="text-3xl text-primary-300 mb-2 font-display border-b-2 border-primary-500/30 pb-2">Chapitre 1 : Les Règles de Base</h2>


            {/* LE TEST */}
            <div id="le-test" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-primary-500">
                <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">La Mécanique du Test</h3>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="bg-stone-900/50 p-4 rounded border border-white/10 flex-1 text-center font-bold text-lg text-primary-200">
                        <span className="block text-stone-500 text-sm uppercase mb-1">Formule</span>
                        d20 + Mod. Carac. + Modificateurs
                    </div>
                    <div className="bg-stone-900/50 p-4 rounded border border-white/10 flex-1 text-center font-bold text-lg text-primary-200">
                        <span className="block text-stone-500 text-sm uppercase mb-1">Résolution</span>
                        Si Résultat ≥ Difficulté (SD) : <strong>Réussite</strong><br />
                        <span className="text-sm font-normal text-stone-400">Sinon : Échec</span>
                    </div>
                </div>

                <div className="bg-stone-900/40 p-3 rounded border border-white/5 text-sm mb-4">
                    <strong className="text-primary-300 block mb-1">Exemple :</strong>
                    <p className="text-stone-300">
                        Krush (FOR +3) veut enfoncer une porte (Diff 15).<br />
                        Il lance le dé et obtient 11.<br />
                        <strong>Total :</strong> 11 (dé) + 3 (FOR) = <strong>14</strong>.<br />
                        14 est inférieur à 15 (SD), l'action échoue.
                    </p>
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
    );
};
