import React from 'react';
import { EmptyState } from './EmptyState';

interface Item {
    id?: string;
    name: string;
    price?: string;
}

interface ItemTableProps {
    items: Item[];
    emptyMessage: string;
}

export const ItemTable: React.FC<ItemTableProps> = ({ items, emptyMessage }) => {
    if (items.length === 0) return <EmptyState message={emptyMessage} />;

    return (
        <div className="glass-panel rounded-xl overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-primary-300 font-display font-bold w-full">Nom</th>
                        <th className="text-right p-4 text-primary-300 font-display font-bold whitespace-nowrap">Prix</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={item.id || i} className="border-b border-white/5 hover:bg-stone-900/30 transition-colors">
                            <td className="p-4 text-stone-200 font-medium">{item.name}</td>
                            <td className="p-4 text-yellow-500/90 font-mono text-right whitespace-nowrap">{item.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
