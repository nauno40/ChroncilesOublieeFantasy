import React from 'react';

export const RuleChapter4: React.FC = () => {
    return (
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
    );
};
