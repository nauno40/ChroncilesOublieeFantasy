/**
 * Contrôle segmenté générique du design system (ex. filtre source Officiel /
 * Communauté / Mes créations — cf. `LEXIQUE`). Style unique, à passer
 * dans `PageShell.tabs`.
 */
export interface SegTab<T extends string> {
    id: T;
    label: string;
}

interface SourceTabsProps<T extends string> {
    tabs: SegTab<T>[];
    value: T;
    onChange: (id: T) => void;
}

export function SourceTabs<T extends string>({ tabs, value, onChange }: SourceTabsProps<T>) {
    return (
        <>
            {tabs.map(t => (
                <button
                    key={t.id}
                    onClick={() => onChange(t.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${value === t.id
                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                        : 'bg-stone-900/40 text-stone-500 border border-white/5 hover:text-stone-300'}`}
                >
                    {t.label}
                </button>
            ))}
        </>
    );
}
