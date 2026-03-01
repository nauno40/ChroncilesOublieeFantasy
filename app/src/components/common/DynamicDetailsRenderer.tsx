import React from 'react';
import { HelpCircle as HelpIcon } from 'lucide-react';

interface DynamicDetailsRendererProps {
    details: any;
    className?: string;
}

export const DynamicDetailsRenderer: React.FC<DynamicDetailsRendererProps> = ({ details, className = "" }) => {
    if (!details) return null;

    return (
        <div className={`space-y-4 ${className}`}>
            {Object.entries(details).map(([key, value]: [string, any]) => {
                // Handle "statistiques_*" (e.g., Wolf, Mount, Familiar)
                if (key.startsWith('statistiques_')) {
                    const title = key.replace('statistiques_', '').replace(/_/g, ' ');
                    return (
                        <div key={key} className="bg-black/40 rounded-lg p-4 border border-white/10 text-sm">
                            <strong className="block text-primary-400 uppercase tracking-wider text-xs font-bold mb-3 border-b border-primary-500/20 pb-1">
                                Statistiques : {title}
                            </strong>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                {Object.entries(value).map(([statKey, statValue]: [string, any]) => (
                                    <div key={statKey} className="flex flex-col border-b border-white/5 pb-1">
                                        <span className="text-stone-500 text-[10px] uppercase font-bold">{statKey.replace(/_/g, ' ')}</span>
                                        <span className="text-stone-300 font-medium">{String(statValue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }

                // Handle "note_speciale" or "note"
                if (key === 'note_speciale' || key === 'note') {
                    return (
                        <div key={key} className="p-3 bg-yellow-900/10 border border-yellow-700/20 rounded-lg flex gap-3">
                            <div className="shrink-0 pt-0.5">
                                <HelpIcon className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div>
                                <span className="text-stone-300 text-sm italic">
                                    {String(value)}
                                </span>
                            </div>
                        </div>
                    );
                }

                // Handle "mecaniques_*"
                if (key.startsWith('mecaniques_')) {
                    return (
                        <div key={key} className="bg-primary-950/20 rounded-lg p-3 border border-primary-500/10 text-sm">
                            <strong className="block text-primary-300 mb-2 font-display text-xs uppercase tracking-wider">
                                Mécaniques {key.replace('mecaniques_', '').replace(/_/g, ' ')}
                            </strong>
                            <div className="space-y-2">
                                {Object.entries(value).map(([mechKey, mechValue]: [string, any]) => (
                                    <div key={mechKey} className="flex gap-2">
                                        <span className="text-primary-500 font-bold min-w-[80px] text-xs uppercase">{mechKey}:</span>
                                        <span className="text-stone-400 text-xs">{String(mechValue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }

                // Handle choices and options
                if (key === 'choix_capacite' || key === 'options_origines' || key.startsWith('choix_') || key.startsWith('options_')) {
                    const title = key.replace(/_/g, ' ');
                    return (
                        <div key={key} className="bg-primary-950/20 rounded-lg p-3 border border-primary-500/10 text-sm">
                            <strong className="block text-primary-300 mb-2 font-display text-xs uppercase tracking-wider">
                                {title}
                            </strong>
                            {Array.isArray(value) ? (
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                    {value.map((v: any, i: number) => <li key={i} className="text-stone-300">{String(v)}</li>)}
                                </ul>
                            ) : (
                                <span className="text-stone-300 italic">{String(value)}</span>
                            )}
                        </div>
                    );
                }

                // Default renderer for unknown keys
                return (
                    <div key={key} className="text-xs text-stone-500 border-l-2 border-white/10 pl-2">
                        <span className="font-bold uppercase mr-1">{key.replace(/_/g, ' ')}:</span>
                        <span className="italic">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                );
            })}
        </div>
    );
};
