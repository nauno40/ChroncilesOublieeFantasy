import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Sword, Swords, Users, Home, BookOpen, GraduationCap, Sparkles, Zap, Package, Truck, UtensilsCrossed, AlertCircle, ScrollText, Skull, Footprints, Tent, Map, BookMarked, Ghost } from 'lucide-react';
import clsx from 'clsx';
import type { NavItem } from './NavItem';
import { NavItemComponent } from './NavItem';
import { DiceRoller, GlobalNotes, Soundboard, DraggableWindow, GlobalSearch } from '../common';
import { useToggle } from '../../hooks/useToggle';
import { Dices, StickyNote, Music, Search, LogOut, User as UserIcon, Wand2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { preloadRoute } from '../../routePreload';

export const Layout: React.FC = () => {
    const location = useLocation();
    const { logout, user } = useAuth();
    const [isDiceRollerOpen, toggleDiceRoller] = useToggle(false);
    const [isNotesOpen, toggleNotes] = useToggle(false);
    const [isSoundboardOpen, toggleSoundboard] = useToggle(false);
    const [isSearchOpen, toggleSearch] = useToggle(false);
    const [isFabOpen, toggleFab] = useToggle(false);

    const [openSection, setOpenSection] = React.useState<string | null>(null);

    // Keyboard shortcut for search
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleSearch();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSearch]);

    const navItems: NavItem[] = React.useMemo(() => [
        { path: '/', icon: Home, label: 'Accueil' },
        {
            // Pôle « mon contenu » : ce qui appartient au joueur/MJ connecté.
            path: '/ma-table',
            icon: Tent,
            label: 'Ma table',
            subItems: [
                { path: '/campaign', icon: Map, label: 'Campagnes' },
                { path: '/characters', icon: Users, label: 'Mes Personnages' },
            ]
        },
        {
            // Pôle « encyclopédie » : toutes les données de référence COF2.
            path: '/compendium',
            icon: BookMarked,
            label: 'Compendium',
            shortLabel: 'Compend.',
            subItems: [
                { path: '/rules', icon: ScrollText, label: 'Règles' },
                { path: '/races', icon: BookOpen, label: 'Races' },
                { path: '/classes', icon: GraduationCap, label: 'Classes' },
                { path: '/voies', icon: Sparkles, label: 'Voies' },
                { path: '/capacites', icon: Zap, label: 'Capacités & Sorts' },
                { path: '/creatures', icon: Ghost, label: 'Créatures' },
                { path: '/equipment', icon: Package, label: 'Armes & Armures' },
                { path: '/tools/magic-items', icon: Wand2, label: 'Objets magiques' },
                { path: '/mounts', icon: Truck, label: 'Montures' },
                { path: '/provisions', icon: UtensilsCrossed, label: 'Provisions' },
                { path: '/states', icon: AlertCircle, label: 'États' },
                { path: '/poisons', icon: Skull, label: 'Poisons' },
                { path: '/traps', icon: Footprints, label: 'Pièges' },
            ]
        },
        {
            // Pôle « table de jeu » : uniquement les vrais outils utilisés pendant la partie.
            path: '/aide-jeu',
            icon: Swords,
            label: 'Table de jeu',
            shortLabel: 'Table',
            subItems: [
                { path: '/tools/tracker', icon: Sword, label: 'Combat Tracker' },
                { path: '/tools/dice', icon: Dices, label: 'Dés' },
                { path: '/tools/soundboard', icon: Music, label: 'Ambiances' },
            ]
        },
    ], []);

    // Effect to set initial open section based on URL
    React.useEffect(() => {
        const currentItem = navItems.find(item =>
            item.subItems?.some(sub => location.pathname.startsWith(sub.path)) ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
        );

        if (currentItem && !openSection) {
            setOpenSection(currentItem.path);
        }
    }, [location.pathname, navItems]); // Intentionally not including openSection to allow user to close it

    const handleToggleSection = (path: string) => {
        setOpenSection(prev => prev === path ? null : path);
    };

    return (
        <div className="min-h-screen text-stone-200 font-sans flex flex-col md:flex-row">
            {/* Mobile Header - Visible only on small screens */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-20 p-4 pb-2 bg-gradient-to-b from-stone-950/95 to-transparent backdrop-blur-sm">
                <div className="glass-panel px-4 py-3 rounded-xl border-primary-500/20 flex justify-between items-center shadow-lg">
                    <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600 font-display tracking-wider drop-shadow-sm">
                        CHRONIQUES OUBLIÉES FANTASY
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleSearch}
                            className="p-2 text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                            <Search size={20} />
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Déconnexion"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Desktop Sidebar - Visible on medium+ screens */}
            <aside className="hidden md:flex flex-col w-72 fixed left-0 top-0 bottom-0 z-30 p-4">
                <div className="glass-panel h-full rounded-2xl border-primary-500/20 flex flex-col shadow-2xl backdrop-blur-xl bg-stone-950/40">
                    <div className="p-6 border-b border-white/5">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600 font-display tracking-wider drop-shadow-sm leading-tight">
                            CHRONIQUES<br />OUBLIÉES<br />FANTASY
                        </h1>
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-[10px] font-mono text-primary-400/60 border border-primary-500/20 px-2 py-0.5 rounded-full inline-block bg-primary-950/30">MJ TOOLKIT</div>
                            <button
                                onClick={toggleSearch}
                                className="flex items-center gap-2 text-xs text-stone-500 hover:text-primary-400 transition-colors px-2 py-1 rounded hover:bg-white/5 border border-transparent hover:border-white/5"
                                title="Rechercher (Cmd+K)"
                            >
                                <Search size={14} />
                                <span>Cmd+K</span>
                            </button>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <NavItemComponent
                                    key={item.path}
                                    item={item}
                                    isActive={isActive}
                                    isOpen={openSection === item.path}
                                    onToggle={() => handleToggleSection(item.path)}
                                />
                            );
                        })}
                    </nav>

                    <div className="p-4 mt-auto border-t border-white/5">
                        <div className="glass-panel p-3 rounded-xl border border-white/5 flex items-center gap-3 group/profile hover:border-primary-500/20 transition-colors">
                            <div className="size-10 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 group-hover/profile:bg-primary-500/20 transition-colors">
                                <UserIcon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold truncate text-stone-100">{user?.email?.split('@')[0]}</div>
                                <div className="text-[10px] text-stone-500 truncate">{user?.email}</div>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Déconnexion"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                        <div className="text-[10px] text-stone-600 font-display text-center pt-3 italic">v1.0.0 Alpha</div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            {/* pb-40 (mobile) : dégage la barre de nav basse ET le bouton flottant,
                pour que la dernière ligne de contenu puisse défiler au-dessus d'eux. */}
            <main className="flex-1 px-4 pt-24 pb-40 md:pt-8 md:pb-8 md:pl-80 w-full overflow-x-hidden min-h-screen">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation - Visible only on small screens */}
            <nav className="md:hidden fixed bottom-6 left-4 right-4 z-30">
                <div className="glass-panel rounded-2xl max-w-md mx-auto h-16 flex justify-around items-center px-2 border-primary-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl bg-stone-900/80">
                    {navItems.map((item) => {
                        // For mobile, show direct link for items without subitems, or link to first subitem
                        const targetPath = item.subItems && item.subItems.length > 0
                            ? item.subItems[0].path
                            : item.path;
                        const isActive = location.pathname === targetPath ||
                            (item.subItems && item.subItems.some(sub => location.pathname === sub.path));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={targetPath}
                                onMouseEnter={() => preloadRoute(targetPath)}
                                onTouchStart={() => preloadRoute(targetPath)}
                                className={clsx(
                                    "flex flex-col items-center justify-center flex-1 min-w-0 h-full transition-all duration-300 relative group",
                                    isActive ? "text-primary-400" : "text-stone-500 hover:text-stone-300"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-primary-500/10 rounded-full blur-md animate-pulse"></div>
                                )}

                                <Icon
                                    size={isActive ? 22 : 20}
                                    className={clsx(
                                        "transition-all duration-300 z-10 flex-none",
                                        isActive && "scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                    )}
                                />
                                <span className={clsx("text-[9px] mt-0.5 font-semibold z-10 transition-colors max-w-full truncate leading-none", isActive ? "text-primary-300" : "text-stone-600")}>
                                    {item.shortLabel ?? item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
            {/* Boutons flottants — repliables (au repos : un seul bouton, pour ne pas masquer le contenu). */}
            <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 flex items-end gap-3 flex-col">
                {isFabOpen && (
                    <>
                        {/* Recherche (mobile) */}
                        <button
                            onClick={() => { toggleSearch(); toggleFab(); }}
                            className="md:hidden bg-gradient-to-br from-stone-800 to-stone-900 border border-primary-500/30 text-primary-400 p-3 rounded-full shadow-xl active:scale-95 transition-all animate-in slide-in-from-bottom-2 fade-in-0"
                            title="Rechercher (Cmd+K)"
                        >
                            <Search size={22} strokeWidth={2.5} />
                        </button>
                        {/* Soundboard */}
                        <button
                            onClick={() => { toggleSoundboard(); toggleFab(); }}
                            className="bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-400 text-stone-950 p-3 md:p-3.5 rounded-full shadow-xl shadow-primary-900/30 hover:scale-110 active:scale-95 transition-all animate-in slide-in-from-bottom-2 fade-in-0"
                            title="Soundboard"
                        >
                            <Music size={22} strokeWidth={2.5} />
                        </button>
                        {/* Notes */}
                        <button
                            onClick={() => { toggleNotes(); toggleFab(); }}
                            className="bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-400 text-stone-950 p-3 md:p-3.5 rounded-full shadow-xl shadow-primary-900/30 hover:scale-110 active:scale-95 transition-all animate-in slide-in-from-bottom-2 fade-in-0"
                            title="Notes Globales"
                        >
                            <StickyNote size={22} strokeWidth={2.5} />
                        </button>
                        {/* Dés */}
                        <button
                            onClick={() => { toggleDiceRoller(); toggleFab(); }}
                            className="bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-400 text-stone-950 p-3 md:p-3.5 rounded-full shadow-xl shadow-primary-900/30 hover:scale-110 active:scale-95 transition-all animate-in slide-in-from-bottom-2 fade-in-0"
                            title="Lanceur de dés"
                        >
                            <Dices size={24} strokeWidth={2.5} />
                        </button>
                    </>
                )}
                {/* Bascule : ouvre/replie le bandeau d'outils */}
                <button
                    onClick={toggleFab}
                    className={clsx(
                        "p-3.5 md:p-4 rounded-full shadow-xl transition-all duration-300 active:scale-95 border",
                        isFabOpen
                            ? "bg-stone-800 text-stone-300 border-white/10 rotate-90"
                            : "bg-gradient-to-br from-primary-500 to-primary-700 text-stone-950 border-primary-400/20 hover:scale-110 shadow-primary-900/30",
                    )}
                    title={isFabOpen ? 'Fermer' : 'Outils (dés, notes, ambiance)'}
                    aria-expanded={isFabOpen}
                >
                    {isFabOpen ? <X size={24} strokeWidth={2.5} /> : <Wand2 size={24} strokeWidth={2.5} />}
                </button>
            </div>

            <DraggableWindow
                id="soundboard"
                title="Soundboard"
                isOpen={isSoundboardOpen}
                onClose={toggleSoundboard}
                defaultPosition={{ x: window.innerWidth - 350, y: window.innerHeight - 450 }}
                defaultSize={{ width: 320, height: 350 }}
            >
                <Soundboard isOpen={true} onClose={toggleSoundboard} />
            </DraggableWindow>

            <DraggableWindow
                id="global_notes"
                title="Notes Globales"
                isOpen={isNotesOpen}
                onClose={toggleNotes}
                defaultPosition={{ x: window.innerWidth - 700, y: window.innerHeight - 500 }}
                defaultSize={{ width: 350, height: 400 }}
            >
                <GlobalNotes isOpen={true} onClose={toggleNotes} />
            </DraggableWindow>

            <DraggableWindow
                id="dice_roller"
                title="Lanceur de Dés"
                isOpen={isDiceRollerOpen}
                onClose={toggleDiceRoller}
                defaultPosition={{ x: window.innerWidth - 400, y: 100 }}
                defaultSize={{ width: 320, height: 500 }}
            >
                <DiceRoller isOpen={true} onClose={toggleDiceRoller} mode="popup" />
            </DraggableWindow>

            <GlobalSearch isOpen={isSearchOpen} onClose={toggleSearch} />
        </div>
    );
};
