import React from 'react';

export const RuleChapter8: React.FC = () => {
    return (
        <section id="meneur-eu-jeu" className="mb-24">
            <h2 className="text-3xl text-emerald-400 mb-8 font-display border-b-2 border-emerald-900/50 pb-2">Chapitre 8 : Devenir Meneur de Jeu</h2>

            <div className="glass-panel p-6 rounded-xl border-l-4 border-l-emerald-600 mb-8">
                <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Les Commandements du MJ</h3>
                <div className="grid md:grid-cols-2 gap-6 text-sm text-stone-300">
                    <div>
                        <ul className="list-decimal ml-5 space-y-2">
                            <li><strong>Le Plaisir avant tout :</strong> L'objectif est l'amusement de tous, MJ inclus.</li>
                            <li><strong>Tu n'es pas l'ennemi :</strong> Tu mets des obstacles, mais tu veux voir les héros réussir (avec panache).</li>
                            <li><strong>Sois Juste :</strong> Ne triche pas contre les joueurs. (Mais tu peux tricher <em>pour</em> eux en secret si nécessaire).</li>
                            <li><strong>Rythme :</strong> Coupe les longueurs, ellispe les voyages ennuyeux, garde l'action vive.</li>
                            <li><strong>Improvisation :</strong> Les joueurs feront l'imprévisible. Dites "Oui, et..." ou "Oui, mais...". Ne bloquez pas.</li>
                        </ul>
                    </div>
                    <div>
                        <div className="bg-stone-900/50 p-4 rounded border border-white/10 italic text-stone-400 text-xs">
                            <p className="mb-2">"Les règles sont un guide, pas un carcan. Si une règle ralentit le jeu ou brise l'ambiance, ignorez-la ou changez-la."</p>
                            <p>-- Gygax (plus ou moins)</p>
                        </div>
                        <h4 className="font-bold mt-4 mb-2 text-emerald-300">Gérer l'échec</h4>
                        <p className="text-xs text-stone-300">
                            Un échec de dé ne doit pas bloquer l'histoire ("Vous ne trouvez pas la porte cachée, l'aventure s'arrête").<br />
                            Utilisez l'échec pour introduire une complication ("Vous ouvrez la porte, mais vous déclenchez le piège" ou "Cela prend tellement de temps que les gardes arrivent").
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-xl border-l-4 border-l-emerald-600">
                <h3 className="text-2xl font-bold mb-4 text-stone-200 border-b border-white/10 pb-2 font-display">Récompenser les Joueurs</h3>

                <div className="grid md:grid-cols-2 gap-8 mb-4">
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-primary-300">Expérience (XP) & Niveaux</h4>
                        <p className="text-sm text-stone-300 mb-2">Pas de comptabilité complexe d'XP par monstre.</p>
                        <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm">
                            <ul className="list-disc ml-4 space-y-1">
                                <li><strong>Méthode Rapide :</strong> 1 Niveau par scénario (ou séance de 4h intense).</li>
                                <li><strong>Méthode Lente :</strong> 1 Niveau tous les 2-3 scénarios (Campagne longue).</li>
                                <li><strong>Passage de Niveau :</strong> +PV, +1 Rang de Voie (ou Nouv. Voie), +1 Mod Carac (aux niv pairs).</li>
                            </ul>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-primary-300">Trésors & Objets</h4>
                        <p className="text-sm text-stone-300 mb-2">Les objets magiques font partie de la montée en puissance.</p>
                        <div className="bg-stone-900/50 p-3 rounded border border-white/10 text-sm">
                            <p className="mb-2"><strong>Par Niveau :</strong> Un personnage devrait obtenir :</p>
                            <ul className="list-disc ml-4 space-y-1 text-xs text-stone-400">
                                <li>Niv 1-4 : Quelques potions/parchemins, 1 objet mineur (+1).</li>
                                <li>Niv 5-10 : Armes/Armures +1 ou +2. Objets merveilleux utiles.</li>
                                <li>Niv 11+ : Artefacts majeurs.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
