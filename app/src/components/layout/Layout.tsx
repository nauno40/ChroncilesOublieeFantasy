import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Book, Sword, Users, Home, BookOpen, GraduationCap, Sparkles, Zap, Package, Truck, UtensilsCrossed, AlertCircle, ScrollText } from 'lucide-react';
import clsx from 'clsx';
import type { NavItem } from './NavItem';
import { NavItemComponent } from './NavItem';
import { DiceRoller, GlobalNotes, Soundboard, DraggableWindow, GlobalSearch } from '../common';
import { useToggle } from '../../hooks/useToggle';
import { Dices, StickyNote, Music, Search } from 'lucide-react';

export const Layout: React.FC = () => {
    const location = useLocation();
    const [isDiceRollerOpen, toggleDiceRoller] = useToggle(false);
    const [isNotesOpen, toggleNotes] = useToggle(false);
    const [isSoundboardOpen, toggleSoundboard] = useToggle(false);
    const [isSearchOpen, toggleSearch] = useToggle(false);

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

    const navItems: NavItem[] = [
        { path: '/', icon: Home, label: 'Accueil' },
        { path: '/campaign', icon: Users, label: 'Campagne' },
        {
            path: '/references',
            icon: Book,
            label: 'Références',
            subItems: [
                { path: '/rules', icon: ScrollText, label: 'Règles' },
                { path: '/bestiary', icon: Book, label: 'Bestiaire' },
                { path: '/states', icon: AlertCircle, label: 'États' },
            ]
        },
        {
            path: '/characters',
            icon: GraduationCap,
            label: 'Personnages',
            subItems: [
                { path: '/races', icon: BookOpen, label: 'Races' },
                { path: '/classes', icon: GraduationCap, label: 'Classes' },
                { path: '/voies', icon: Sparkles, label: 'Voies' },
                { path: '/capacites', icon: Zap, label: 'Capacités' },
            ]
        },
        {
            path: '/gear',
            icon: Package,
            label: 'Équipement',
            subItems: [
                { path: '/equipment', icon: Package, label: 'Armes & Armures' },
                { path: '/mounts', icon: Truck, label: 'Montures' },
                { path: '/provisions', icon: UtensilsCrossed, label: 'Provisions' },
            ]
        },
        { path: '/tools', icon: Sword, label: 'Outils' },
    ];

    return (
        <div className="min-h-screen text-stone-200 font-sans flex flex-col md:flex-row">
            {/* Mobile Header - Visible only on small screens */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-20 p-4 pb-2 bg-gradient-to-b from-stone-950/95 to-transparent backdrop-blur-sm">
                <div className="glass-panel px-4 py-3 rounded-xl border-primary-500/20 flex justify-between items-center shadow-lg">
                    <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600 font-display tracking-wider drop-shadow-sm">
                        CHRONIQUES OUBLIÉES
                    </h1>
                    <button
                        onClick={toggleSearch}
                        className="p-2 text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                        <Search size={20} />
                    </button>
                </div>
            </header>

            {/* Desktop Sidebar - Visible on medium+ screens */}
            <aside className="hidden md:flex flex-col w-72 fixed left-0 top-0 bottom-0 z-30 p-4">
                <div className="glass-panel h-full rounded-2xl border-primary-500/20 flex flex-col shadow-2xl backdrop-blur-xl bg-stone-950/40">
                    <div className="p-6 border-b border-white/5">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600 font-display tracking-wider drop-shadow-sm leading-tight">
                            CHRONIQUES<br />OUBLIÉES
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
                                />
                            );
                        })}
                    </nav>

                    <div className="p-4 text-center border-t border-white/5">
                        <div className="text-xs text-stone-600 font-display">v1.0.0 Alpha</div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 px-4 pt-24 pb-28 md:pt-8 md:pb-8 md:pl-80 w-full overflow-x-hidden min-h-screen">
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
                                className={clsx(
                                    "flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative group",
                                    isActive ? "text-primary-400" : "text-stone-500 hover:text-stone-300"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-primary-500/10 rounded-full blur-md animate-pulse"></div>
                                )}

                                <Icon
                                    size={isActive ? 24 : 22}
                                    className={clsx(
                                        "transition-all duration-300 z-10",
                                        isActive && "scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                    )}
                                />
                                <span className={clsx("text-[10px] mt-1 font-semibold z-10 transition-colors", isActive ? "text-primary-300" : "text-stone-600")}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
            {/* Floating Action Buttons */}
            <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 flex items-end gap-4 flex-col">
                {/* Search Button (Mobile/Tablet only or if shortcut not known) */}
                <button
                    onClick={toggleSearch}
                    className="md:hidden bg-gradient-to-br from-stone-800 to-stone-900 border border-primary-500/30 text-primary-400 p-3 rounded-full shadow-xl hover:scale-110 transition-all duration-300 active:scale-95 group relative animate-in slide-in-from-right-8 fade-in-0 duration-500 delay-300"
                    title="Rechercher (Cmd+K)"
                >
                    <Search size={24} strokeWidth={2.5} />
                </button>

                {/* Soundboard Button */}
                <button
                    onClick={toggleSoundboard}
                    className="bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-400 hover:to-primary-600 text-stone-950 p-3 md:p-4 rounded-full shadow-xl shadow-primary-900/30 hover:shadow-primary-500/40 hover:scale-110 transition-all duration-300 active:scale-95 group relative animate-in slide-in-from-right-8 fade-in-0 duration-500 delay-200"
                    title="Soundboard"
                >
                    <Music size={24} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform duration-500" />
                </button>

                {/* Notes Button */}
                <button
                    onClick={toggleNotes}
                    className="bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-400 hover:to-primary-600 text-stone-950 p-3 md:p-4 rounded-full shadow-xl shadow-primary-900/30 hover:shadow-primary-500/40 hover:scale-110 transition-all duration-300 active:scale-95 group relative animate-in slide-in-from-right-8 fade-in-0 duration-500 delay-100"
                    title="Notes Globales"
                >
                    <StickyNote size={24} strokeWidth={2.5} className="group-hover:-rotate-12 transition-transform duration-500" />
                </button>

                {/* Dice Button */}
                <button
                    onClick={toggleDiceRoller}
                    className="bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-400 hover:to-primary-600 text-stone-950 p-3 md:p-4 rounded-full shadow-xl shadow-primary-900/30 hover:shadow-primary-500/40 hover:scale-110 transition-all duration-300 active:scale-95 group animate-in slide-in-from-right-8 fade-in-0 duration-500"
                    title="Lanceur de dés"
                >
                    <Dices size={28} strokeWidth={2.5} className="group-hover:rotate-180 transition-transform duration-700" />
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
