import React from 'react';

export const Home: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="glass-panel rounded-2xl p-8 border-primary-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl group-hover:bg-primary-600/20 transition-colors duration-500 transform translate-x-12 -translate-y-12"></div>
                <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 mb-2 relative z-10">Bienvenue, Maître de Jeu</h2>
                <p className="text-stone-300 max-w-lg relative z-10 text-lg leading-relaxed">
                    Vos chroniques commencent ici. Gérez vos campagnes, consultez le bestiaire et lancez des combats épiques avec style.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl border-white/5 text-center hover:border-primary-500/30 transition-all hover:-translate-y-1">
                    <span className="block text-4xl font-display font-bold text-primary-500 mb-2 drop-shadow-sm">0</span>
                    <span className="text-sm font-bold uppercase tracking-widest text-primary-400/70">Campagnes Actives</span>
                </div>
                <div className="glass-panel p-6 rounded-2xl border-white/5 text-center hover:border-primary-500/30 transition-all hover:-translate-y-1">
                    <span className="block text-4xl font-display font-bold text-primary-500 mb-2 drop-shadow-sm">1,200+</span>
                    <span className="text-sm font-bold uppercase tracking-widest text-primary-400/70">Créatures Référencées</span>
                </div>
            </div>
        </div>
    );
};
