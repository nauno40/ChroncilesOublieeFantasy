import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Book, Sword, Users, Home, BookOpen, GraduationCap, Sparkles, Zap, Package, Truck, UtensilsCrossed, AlertCircle, ScrollText } from 'lucide-react';
import clsx from 'clsx';
import type { NavItem } from './NavItem';
import { NavItemComponent } from './NavItem';

export const Layout: React.FC = () => {
    const location = useLocation();

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
                </div>
            </header>

            {/* Desktop Sidebar - Visible on medium+ screens */}
            <aside className="hidden md:flex flex-col w-72 fixed left-0 top-0 bottom-0 z-30 p-4">
                <div className="glass-panel h-full rounded-2xl border-primary-500/20 flex flex-col shadow-2xl backdrop-blur-xl bg-stone-950/40">
                    <div className="p-6 border-b border-white/5">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600 font-display tracking-wider drop-shadow-sm leading-tight">
                            CHRONIQUES<br />OUBLIÉES
                        </h1>
                        <div className="text-[10px] font-mono text-primary-400/60 border border-primary-500/20 px-2 py-0.5 rounded-full inline-block mt-2 bg-primary-950/30">MJ TOOLKIT</div>
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
                                <span className={clsx("text-[10px] mt-1 font-medium z-10 transition-colors", isActive ? "text-primary-300" : "text-stone-600")}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};
