import React from 'react';

export const RuleChapter6: React.FC = () => {
    return (
        <section id="objets-magiques" className="mb-24">
            <h2 className="text-3xl text-purple-400 mb-8 font-display border-b-2 border-purple-900/50 pb-2">Chapitre 6 : Objets Magiques</h2>

            <div id="potions-parchemins" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-purple-600">
                <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Potions & Parchemins</h3>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* POTIONS */}
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-purple-300">Potions</h4>
                        <p className="text-sm text-stone-300 mb-2">Boire une potion est une <strong>Action de Mouvement (M)</strong>.</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="bg-stone-900/50 text-purple-300">
                                        <th className="p-2 border border-white/10">Type</th>
                                        <th className="p-2 border border-white/10">Prix</th>
                                        <th className="p-2 border border-white/10">Effet</th>
                                    </tr>
                                </thead>
                                <tbody className="text-stone-300">
                                    <tr className="even:bg-white/5"><td className="p-2 border border-white/10">Soins (Léger/Mod/Sup)</td><td className="p-2 border border-white/10">50/200/500</td><td className="p-2 border border-white/10">Recup. 1d8+1 / 2d8+5 / 3d8+9 PV</td></tr>
                                    <tr className="even:bg-white/5"><td className="p-2 border border-white/10">Mana (Petite/Moy/Gd)</td><td className="p-2 border border-white/10">50/150/300</td><td className="p-2 border border-white/10">Recup. 1d4 / 1d6+2 / 2d6+5 PM</td></tr>
                                    <tr className="even:bg-white/5"><td className="p-2 border border-white/10">Guerisseur</td><td className="p-2 border border-white/10">50</td><td className="p-2 border border-white/10">+5 au test de guérison (maladie/poison)</td></tr>
                                    <tr className="even:bg-white/5"><td className="p-2 border border-white/10">Invisible/Vol/Amour</td><td className="p-2 border border-white/10">Variable</td><td className="p-2 border border-white/10">Simule le sort correspondant</td></tr>
                                    <tr className="even:bg-white/5"><td className="p-2 border border-white/10">Renaissance</td><td className="p-2 border border-white/10">Rare</td><td className="p-2 border border-white/10">Ramène à 1 PV un mort récent</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PARCHEMINS */}
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-purple-300">Parchemins</h4>
                        <p className="text-sm text-stone-300 mb-2">Contiennent un sort prêt à l'emploi. Activer = Temps incantation du sort (min Attaque A).</p>
                        <div className="bg-purple-900/10 p-3 rounded border border-purple-500/20 text-sm mb-4">
                            <ul className="list-disc ml-4 text-xs text-stone-300 space-y-1">
                                <li><strong>Utilisateur :</strong> Mage ou Prêtre (selon nature). Sinon : Test INT diff 15 (+ Rang sort).</li>
                                <li><strong>Coût :</strong> Niv Sort x 50 pa (Nal 1 et 2) ou x 100 pa (Niv 3-5).</li>
                                <li><strong>Usage unique :</strong> Le parchemin tombe en poussière.</li>
                                <li><strong>Apprentissage :</strong> Permet d'apprendre le sort (si classe compatible) en le recopiant (coût x2).</li>
                            </ul>
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-purple-300">Baguettes (Charge)</h4>
                        <p className="text-sm text-stone-300">Comme un parchemin mais réutilisable (1d20 charges, ou infinie si mineur). Action L ou A pour activer.</p>
                    </div>
                </div>
            </div>

            <div id="equipement-magique" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-purple-600">
                <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Armes & Armures Magiques</h3>

                <div className="grid md:grid-cols-2 gap-8 mb-6">
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-primary-300">Bonus Altération (+1 à +5)</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="bg-stone-900/50 text-purple-300">
                                        <th className="p-2 border border-white/10">Bonus</th>
                                        <th className="p-2 border border-white/10">Effet</th>
                                        <th className="p-2 border border-white/10">Niveau Est.</th>
                                        <th className="p-2 border border-white/10">Prix Moyen</th>
                                    </tr>
                                </thead>
                                <tbody className="text-stone-300">
                                    <tr className="even:bg-white/5"><td className="p-2 border border-white/10 font-bold text-green-300">+1</td><td className="p-2 border border-white/10">+1 Att/DM ou DEF</td><td className="p-2 border border-white/10">3</td><td className="p-2 border border-white/10">500 pa</td></tr>
                                    <tr className="even:bg-white/5"><td className="p-2 border border-white/10 font-bold text-blue-300">+2</td><td className="p-2 border border-white/10">+2 Att/DM ou DEF</td><td className="p-2 border border-white/10">6</td><td className="p-2 border border-white/10">2 000 pa</td></tr>
                                    <tr className="even:bg-white/5"><td className="p-2 border border-white/10 font-bold text-purple-300">+3</td><td className="p-2 border border-white/10">+3 Att/DM ou DEF</td><td className="p-2 border border-white/10">9</td><td className="p-2 border border-white/10">8 000 pa</td></tr>
                                    <tr className="even:bg-white/5"><td className="p-2 border border-white/10 font-bold text-orange-300">+4</td><td className="p-2 border border-white/10">+4 Att/DM ou DEF</td><td className="p-2 border border-white/10">12</td><td className="p-2 border border-white/10">30 000 pa</td></tr>
                                    <tr className="even:bg-white/5"><td className="p-2 border border-white/10 font-bold text-red-300">+5</td><td className="p-2 border border-white/10">+5 Att/DM ou DEF</td><td className="p-2 border border-white/10">15+</td><td className="p-2 border border-white/10">100 000+ pa</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-primary-300">Propriétés Spéciales</h4>
                        <p className="text-sm text-stone-400 mb-2">Peuvent remplacer ou s'ajouter aux bonus. Coût équivalent (+1 = Prop niv 1).</p>
                        <div className="space-y-2 text-xs text-stone-300">
                            <div className="bg-stone-900/30 p-2 rounded">
                                <strong>Arme flamboyante (+1d6 feu) :</strong> Équivaut à une arme +2 (Prix).
                            </div>
                            <div className="bg-stone-900/30 p-2 rounded">
                                <strong>Armure de l'Ours (+2 RD) :</strong> Équivaut à une armure +3.
                            </div>
                            <div className="bg-stone-900/30 p-2 rounded">
                                <strong>Vampirique :</strong> Rend PV = 1/2 DM. (Très rare/Maudit).
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-900/20 p-4 rounded border border-purple-500/20">
                    <h4 className="font-bold text-purple-300 mb-2">Objets Merveilleux</h4>
                    <ul className="grid md:grid-cols-2 gap-2 text-xs text-stone-300">
                        <li><strong>Anneau de Protection :</strong> +1 à +5 DEF (cumulable).</li>
                        <li><strong>Cape elfique :</strong> Avantage Discrétion.</li>
                        <li><strong>Bottes de sept lieues :</strong> Vitesse x2, pas de fatigue.</li>
                        <li><strong>Sac sans fond :</strong> Contient bcp, poids fixe.</li>
                        <li><strong>Amulette de CON :</strong> +2 à +6 en CON.</li>
                        <li><strong>Pierre porte-bonheur :</strong> +1 à tous les tests de sauvegarde.</li>
                    </ul>
                </div>
            </div>

            {/* BUTIN */}
            <div id="tables-butin" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-amber-500">
                <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Générateur de Butin</h3>
                <p className="text-sm text-stone-300 mb-4">Pour une rencontre ou un coffre (niv = niveau moyen du groupe ou boss). Lancez 1d20.</p>

                <div className="grid md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-stone-900/40 p-2 rounded border border-white/5">
                        <strong className="block text-primary-200 mb-2 border-b border-white/10 pb-1">Trésor Monétaire (= Niv x X)</strong>
                        <ul className="space-y-1 text-stone-400 font-mono">
                            <li>1-5: Rien</li>
                            <li>6-10: 1d6 x 10 pa</li>
                            <li>11-15: 1d6 x 50 pa</li>
                            <li>16-19: 1d6 x 100 pa</li>
                            <li>20: 1d6 x 500 pa + Objet</li>
                        </ul>
                    </div>
                    <div className="bg-stone-900/40 p-2 rounded border border-white/5">
                        <strong className="block text-primary-200 mb-2 border-b border-white/10 pb-1">Type d'Objet (Si "Objet")</strong>
                        <ul className="space-y-1 text-stone-400 font-mono">
                            <li>1-8: Potion</li>
                            <li>9-14: Parchemin</li>
                            <li>15-17: Arme Magique</li>
                            <li>18-19: Armure Magique</li>
                            <li>20: Objet Merveilleux</li>
                        </ul>
                    </div>
                    <div className="bg-stone-900/40 p-2 rounded border border-white/5">
                        <strong className="block text-primary-200 mb-2 border-b border-white/10 pb-1">Puissance de l'Objet</strong>
                        <ul className="space-y-1 text-stone-400 font-mono">
                            <li>Niv 1-4: Bonus +1 / Mineur</li>
                            <li>Niv 5-9: Bonus +2 / Moyen</li>
                            <li>Niv 10-14: Bonus +3 / Majeur</li>
                            <li>Niv 15+: Bonus +4/+5 / Légendaire</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};
