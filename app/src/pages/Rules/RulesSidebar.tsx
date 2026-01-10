import React from 'react';

interface RulesSidebarProps {
    scrollToSection: (e: React.MouseEvent<HTMLAnchorElement> | null, id: string) => void;
}

export const RulesSidebar: React.FC<RulesSidebarProps> = ({ scrollToSection }) => {
    return (
        <aside className="hidden lg:block w-64 h-full overflow-y-auto border-r border-white/5 p-4 custom-scrollbar flex-shrink-0">
            <nav className="space-y-6 text-sm">
                <h2 className="text-lg font-bold text-primary-300/80 mb-4 px-2 font-display">Sommaire</h2>

                {/* Intro */}
                <div>
                    <div className="px-2 mb-2 pb-1 border-b border-white/5 text-xs font-bold text-stone-500 uppercase tracking-wider">Introduction</div>
                    <ul className="space-y-1">
                        <li><a href="#introduction" onClick={(e) => scrollToSection(e, 'introduction')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">Univers & Intro</a></li>
                    </ul>
                </div>
                {/* Règles */}
                <div>
                    <div className="px-2 mb-2 pb-1 border-b border-white/5 text-xs font-bold text-stone-500 uppercase tracking-wider">Règles</div>
                    <ul className="space-y-1">
                        <li><a href="#bases" onClick={(e) => scrollToSection(e, 'bases')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">1. Les Bases</a></li>
                        <li><a href="#combat" onClick={(e) => scrollToSection(e, 'combat')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">2. Le Combat</a></li>
                        <li><a href="#magie" onClick={(e) => scrollToSection(e, 'magie')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">3. Magie</a></li>
                        <li><a href="#environnement" onClick={(e) => scrollToSection(e, 'environnement')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">4. Environnement</a></li>
                        <li><a href="#aventure" onClick={(e) => scrollToSection(e, 'aventure')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">5. Aventure</a></li>
                    </ul>
                </div>
                {/* Monde & MJ */}
                <div>
                    <div className="px-2 mb-2 pb-1 border-b border-white/5 text-xs font-bold text-stone-500 uppercase tracking-wider">Avancé</div>
                    <ul className="space-y-1">
                        <li><a href="#objets-magiques" onClick={(e) => scrollToSection(e, 'objets-magiques')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">6. Objets Magiques</a></li>
                        <li><a href="#opposition" onClick={(e) => scrollToSection(e, 'opposition')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">7. Opposition</a></li>
                        <li><a href="#meneur-eu-jeu" onClick={(e) => scrollToSection(e, 'meneur-eu-jeu')} className="block px-2 py-1 rounded text-stone-400 hover:text-primary-300 hover:bg-white/5 transition-colors">8. Devenir MJ</a></li>
                    </ul>
                </div>
            </nav>
        </aside>
    );
};
