import React from 'react';

export const RuleConversion: React.FC = () => {
    return (
        <section id="conversion-guide" className="mb-24">
            <h2 className="text-3xl text-stone-400 mb-8 font-display border-b-2 border-stone-700/50 pb-2">Annexe : Guide de Conversion COF1 &gt; COF2</h2>

            <div className="glass-panel p-6 rounded-xl border-l-4 border-l-stone-600">
                <h3 className="text-2xl font-bold mb-6 text-stone-200 border-b border-white/10 pb-2 font-display">Principes Généraux</h3>
                <p className="text-sm text-stone-300 mb-4">
                    COF2 reste très compatible avec la v1. Vous pouvez jouer des campagnes V1 (Anathazerïn, Invincible) avec les règles V2 avec peu d'adaptation.
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-6">
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-primary-300">Personnages (PJs)</h4>
                        <ul className="list-disc ml-4 text-sm text-stone-300 space-y-2">
                            <li><strong>Attaque :</strong> Le Bonus d'Attaque (Base) disparaît. Remplacé par Niveau + Mod. Carac. (Les scores finaux sont proches).</li>
                            <li><strong>Défense :</strong> 10 + AGI + Autres. (Plus de "Defense de base" par classe).</li>
                            <li><strong>PV :</strong> Légère augmentation (Dés de vie &rarr; Points de vigueur fixes + CON).</li>
                            <li><strong>Voies :</strong> Réorganisées en 5 Voies par Profil. Adapter les anciennes voies manquantes en Voies de Prestige si nécessaire.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-primary-300">Monstres & PNJ</h4>
                        <ul className="list-disc ml-4 text-sm text-stone-300 space-y-2">
                            <li><strong>NC :</strong> Inchangé.</li>
                            <li><strong>Attaque :</strong> +NC à l'attaque (à la place de l'ancien bonus).</li>
                            <li><strong>DM :</strong> Inchangés.</li>
                            <li><strong>DEF :</strong> Inchangée (ou recalculer 10 + NC + Mod).</li>
                            <li><strong>PV :</strong> Peuvent être conservés ou recalculés selon la formule V2.</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-stone-900/50 p-4 rounded border border-white/10">
                    <h4 className="font-bold text-lg mb-2 text-stone-200">Point de Vigilance : La Magie</h4>
                    <p className="text-sm text-stone-300 mb-2">
                        La gestion des PM (Mana) change radicalement (Sorts limités par jour en v1 &rarr; Coût en Mana en v2).
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-xs text-stone-400">
                        <div>
                            <strong>PNJ Lanceurs de sorts :</strong> Donnez-leur simplement un pool de PM = NC x 5 (ou infini pour simplifier, tant qu'ils ne spam pas les ultimes).
                        </div>
                        <div>
                            <strong>Objets (Baguettes) :</strong> En v1, charges = sorts quotidiens. En v2, charges = utilisation de PM ou charges fixes (1d20).
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
