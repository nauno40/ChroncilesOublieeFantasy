import React, { useState } from 'react';
import clsx from 'clsx';

interface Tab {
    id: string;
    label: string;
    icon?: React.ElementType;
}

interface TabGroupProps {
    tabs: Tab[];
    defaultTab?: string;
    onTabChange?: (tabId: string) => void;
    children: (activeTab: string) => React.ReactNode;
    className?: string;
}

export const TabGroup: React.FC<TabGroupProps> = ({
    tabs,
    defaultTab,
    onTabChange,
    children,
    className
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        onTabChange?.(tabId);
    };

    return (
        <div className={clsx('space-y-6', className)}>
            {/* Tab Navigation */}
            <div className="glass-panel rounded-xl p-2 flex gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={clsx(
                                'flex items-center gap-2 px-4 py-2 rounded-lg font-display font-bold transition-all whitespace-nowrap',
                                isActive
                                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
                            )}
                        >
                            {Icon && <Icon size={18} />}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>
                {children(activeTab)}
            </div>
        </div>
    );
};
