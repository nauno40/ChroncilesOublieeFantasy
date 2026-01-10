import React from 'react';

export const RuleChapter2: React.FC = () => {
    return (
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
    );
};
