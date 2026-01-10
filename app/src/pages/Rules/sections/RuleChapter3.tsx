import React from 'react';

export const RuleChapter3: React.FC = () => {
    return (
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
    );
};
