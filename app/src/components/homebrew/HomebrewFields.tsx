import React from 'react';
import { Plus, X } from 'lucide-react';
import { CARAC_KEYS, type HomebrewFieldDef } from '../../services/homebrewSchemas';
import { hasValue } from '../../services/homebrewValidation';

type Data = Record<string, unknown>;

export const inputCls = 'w-full bg-stone-950 border border-white/10 rounded-lg px-3 py-2 text-stone-200 text-sm outline-none focus:border-primary-500';
export const inputErrCls = 'w-full bg-stone-950 border border-red-500/60 rounded-lg px-3 py-2 text-stone-200 text-sm outline-none focus:border-red-500';
export const labelCls = 'text-[10px] uppercase font-bold text-stone-500 block mb-1';

// =================== Formulaire ===================

export const HomebrewFields: React.FC<{
    schema: HomebrewFieldDef[];
    data: Data;
    onChange: (d: Data) => void;
    errors?: Record<string, string>;
}> = ({ schema, data, onChange, errors }) => {
    const set = (key: string, value: unknown) => onChange({ ...data, [key]: value });
    return (
        <div className="space-y-3">
            {schema.map(f => {
                const message = errors?.[f.key];
                return (
                    <div key={f.key} id={`champ-${f.key}`}>
                        <FieldInput field={f} value={data[f.key]} onChange={v => set(f.key, v)} error={!!message} />
                        {message && <p className="text-red-400 text-xs mt-1">{message}</p>}
                    </div>
                );
            })}
        </div>
    );
};

const FieldInput: React.FC<{ field: HomebrewFieldDef; value: unknown; onChange: (v: unknown) => void; error?: boolean }> = ({ field, value, onChange, error }) => {
    const cls = error ? inputErrCls : inputCls;
    switch (field.type) {
        case 'textarea':
            return (
                <div>
                    <label className={labelCls}>{field.label}</label>
                    <textarea className={`${cls} min-h-[80px] resize-y leading-relaxed`} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
                </div>
            );
        case 'number':
            return (
                <div>
                    <label className={labelCls}>{field.label}</label>
                    <input type="number" className={cls} value={value === undefined || value === null ? '' : String(value)} onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} placeholder={field.placeholder} />
                </div>
            );
        case 'bool':
            return (
                <label className={`flex items-center gap-2 text-sm cursor-pointer ${error ? 'text-red-400' : 'text-stone-300'}`}>
                    <input type="checkbox" className={`w-4 h-4 ${error ? 'accent-red-500' : 'accent-primary-500'}`} checked={!!value} onChange={e => onChange(e.target.checked)} />
                    {field.label}
                </label>
            );
        case 'select':
            return (
                <div>
                    <label className={labelCls}>{field.label}</label>
                    <select className={cls} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)}>
                        {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            );
        case 'caracs':
            return <CaracsInput label={field.label} value={(value as Record<string, number>) ?? {}} onChange={onChange} error={error} />;
        case 'lines':
            return <LinesInput label={field.label} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} placeholder={field.placeholder} error={error} />;
        case 'image': {
            const url = (value as string) ?? '';
            return (
                <div>
                    <label className={labelCls}>{field.label}</label>
                    <input type="url" className={cls} value={url} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
                    {url.trim() !== '' && (
                        <img
                            src={url}
                            alt="Aperçu"
                            className="mt-2 h-32 w-full object-cover rounded-lg border border-white/10"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                            onLoad={e => { e.currentTarget.style.display = ''; }}
                        />
                    )}
                </div>
            );
        }
        default:
            return (
                <div>
                    <label className={labelCls}>{field.label}</label>
                    <input className={cls} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
                </div>
            );
    }
};

const CaracsInput: React.FC<{ label: string; value: Record<string, number>; onChange: (v: Record<string, number>) => void; error?: boolean }> = ({ label, value, onChange, error }) => (
    <div>
        <label className={labelCls}>{label}</label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {CARAC_KEYS.map(k => (
                <div key={k} className="text-center">
                    <div className="text-[10px] text-stone-500 mb-0.5">{k}</div>
                    <input type="number" className={`w-full bg-stone-950 border rounded px-1 py-1 text-center text-stone-200 text-sm outline-none focus:border-primary-500 ${error ? 'border-red-500/60' : 'border-white/10'}`}
                        value={value[k] ?? 0} onChange={e => onChange({ ...value, [k]: Number(e.target.value) || 0 })} />
                </div>
            ))}
        </div>
    </div>
);

const LinesInput: React.FC<{ label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; error?: boolean }> = ({ label, value, onChange, placeholder, error }) => {
    const update = (i: number, v: string) => onChange(value.map((x, idx) => (idx === i ? v : x)));
    const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
    // Aucune ligne saisie : pas d'<input> sur lequel poser une bordure rouge, donc le
    // conteneur lui-même porte le retour visuel d'erreur.
    const emptyErr = error && value.length === 0;
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <div className={`space-y-1.5 ${emptyErr ? 'border border-red-500/60 rounded-lg p-2' : ''}`}>
                {value.map((line, i) => (
                    <div key={i} className="flex gap-1.5">
                        <input className={error ? inputErrCls : inputCls} value={line} onChange={e => update(i, e.target.value)} placeholder={placeholder} />
                        <button type="button" onClick={() => remove(i)} className="text-stone-500 hover:text-red-400 px-2" aria-label="Retirer"><X size={16} /></button>
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...value, ''])} className="text-primary-400 hover:text-primary-300 text-xs font-bold flex items-center gap-1"><Plus size={13} /> Ajouter</button>
            </div>
        </div>
    );
};

// =================== Rendu lecture seule (fiche) ===================

export const HomebrewData: React.FC<{ schema: HomebrewFieldDef[]; data: Data }> = ({ schema, data }) => {
    const shown = schema.filter(f => hasValue(data[f.key]));
    if (shown.length === 0) return null;
    return (
        <div className="space-y-3 mt-4 border-t border-white/5 pt-4">
            {shown.map(f => <DataRow key={f.key} field={f} value={data[f.key]} />)}
        </div>
    );
};

const DataRow: React.FC<{ field: HomebrewFieldDef; value: unknown }> = ({ field, value }) => {
    if (field.type === 'caracs') {
        const v = value as Record<string, number>;
        return (
            <div>
                <div className={labelCls}>{field.label}</div>
                <div className="flex flex-wrap gap-1.5">
                    {CARAC_KEYS.filter(k => (v[k] ?? 0) !== 0).map(k => (
                        <span key={k} className="text-xs font-mono bg-stone-900/60 border border-white/10 rounded px-2 py-0.5 text-stone-300">{k} {v[k] > 0 ? '+' : ''}{v[k]}</span>
                    ))}
                </div>
            </div>
        );
    }
    if (field.type === 'lines') {
        const arr = (value as string[]).filter(x => x && x.trim() !== '');
        return (
            <div>
                <div className={labelCls}>{field.label}</div>
                <ul className="list-disc list-inside text-sm text-stone-300 space-y-0.5">
                    {arr.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
            </div>
        );
    }
    if (field.type === 'bool') {
        return <div className="text-sm text-stone-300"><span className="text-[10px] uppercase font-bold text-stone-500">{field.label} :</span> {value ? 'Oui' : 'Non'}</div>;
    }
    return (
        <div>
            <div className={labelCls}>{field.label}</div>
            <p className="text-sm text-stone-300 whitespace-pre-line">{String(value)}</p>
        </div>
    );
};
