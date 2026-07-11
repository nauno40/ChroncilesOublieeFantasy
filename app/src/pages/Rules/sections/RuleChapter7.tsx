import React from 'react';

export const RuleChapter7: React.FC = () => {
    return (
        <section id="opposition" className="mb-24">
            <h2 className="text-3xl text-red-500 mb-8 font-display border-b-2 border-red-900/50 pb-2">Chapitre 7 : L'Opposition (Bestiaire)</h2>

            <div id="creation-rencontres" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-red-600">
                <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Équilibrer les Rencontres</h3>


                <div className="grid md:grid-cols-2 gap-8 mb-6">
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-red-300">Niveau de Difficulté (ND)</h4>
                        <p className="text-sm text-stone-300 mb-2">Le ND (Niveau de Danger) correspond au niveau de la créature. Un groupe de 4 PJs de niveau X est sensé vaincre une rencontre de ND X en consommant 20-25% de ses ressources.</p>
                        <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm">
                            <strong className="text-primary-200 block mb-1">Calcul du ND de groupe</strong>
                            <ul className="space-y-1 text-stone-400 text-xs">
                                <li><strong>2 créatures ND X :</strong> ND X+2</li>
                                <li><strong>4 créatures ND X :</strong> ND X+4</li>
                                <li><strong>8 créatures ND X :</strong> ND X+6</li>
                                <li><strong>ND Boss Solo :</strong> PV x3, Init x2, 2 tours/round. ND = Niveau Boss +2.</li>
                            </ul>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-red-300">Écarts de Niveau</h4>
                        <ul className="list-disc ml-4 text-sm text-stone-300 space-y-2">
                            <li><strong>Monstres Faibles :</strong> Si ND &lt; Niveau PJ - 5, peu de menace (sauf en horde massive avec règle de "Piétinement").</li>
                            <li><strong>Monstres Puissants :</strong> Si ND &gt; Niveau PJ + 3, combat très mortel (One-shot possible).</li>
                            <li><strong>Boss :</strong> Privilégier un Boss accompagné de "sbires" (1 PV, meurent au 1er coup) pour dynamiser sans surcharger le ND.</li>
                        </ul>
                    </div>
                </div>
            </div>


            <div id="profils-creatures" className="glass-panel p-6 rounded-xl mb-8 border-l-4 border-l-red-600">
                <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Profils de Créatures</h3>
                <p className="text-sm text-stone-300 mb-4">Lecture d'un bloc stat de monstre.</p>

                <div className="bg-stone-950 p-4 rounded border border-stone-800 font-mono text-sm text-stone-400 mb-6 max-w-2xl mx-auto shadow-lg">
                    <div className="flex justify-between items-baseline mb-2 border-b border-stone-800 pb-2">
                        <strong className="text-xl text-red-400">Gros Orque</strong>
                        <span className="text-stone-500">NC 2</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-2 text-xs">
                        <div>
                            <span className="block"><strong className="text-stone-300">AGI</strong> +1 <strong className="text-stone-300">CON</strong> +2 <strong className="text-stone-300">FOR</strong> +3</span>
                            <span className="block"><strong className="text-stone-300">PER</strong> +0 <strong className="text-stone-300">CHA</strong> -1 <strong className="text-stone-300">INT</strong> -1 <strong className="text-stone-300">VOL</strong> +0</span>
                        </div>
                        <div className="text-right">
                            <span className="block"><strong className="text-stone-300">DEF</strong> 14</span>
                            <span className="block"><strong className="text-stone-300">PV</strong> 15</span>
                            <span className="block"><strong className="text-stone-300">Init</strong> 11</span>
                        </div>
                    </div>
                    <div className="mb-2">
                        <strong className="text-stone-300">Cimeterre +5</strong> (DM 1d6+3)
                    </div>
                    <div className="text-xs italic text-stone-500">
                        <strong>Capacité : Rage (1/combat).</strong> +2 Att/DM pendant 3 tours mais -2 DEF.
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-primary-300">Création Rapide</h4>
                        <p className="text-sm text-stone-300 mb-2">Formules par défaut pour improviser un monstre de Niveau X (NC X).</p>
                        <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-xs font-mono space-y-1 text-stone-400">
                            <div><strong>Attaque :</strong> +X</div>
                            <div><strong>DM Moyen :</strong> X + 2</div>
                            <div><strong>DEF :</strong> 10 + X</div>
                            <div><strong>PV :</strong> [X * 5] + 10 (ou NC* d8)</div>
                            <div><strong>Carac. Principale :</strong> +(NC/2 + 2)</div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-primary-300">Archétypes</h4>
                        <div className="space-y-2 text-xs text-stone-300">
                            <div className="flex justify-between border-b border-white/5 pb-1"><span><strong>Soldat :</strong> +2 Attaque, +2 DEF.</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-1"><span><strong>Brute :</strong> +2 DM, +50% PV, -2 DEF.</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-1"><span><strong>Furtif :</strong> +5 Init, Attaque sournoise (+1d6).</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-1"><span><strong>Lanceur de Sort :</strong> Sorts comme un PJ de niveau NC. Faibles PV.</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-1"><span><strong>Boss :</strong> Appliquer l'archétype "Boss" (x3 PV, etc).</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
