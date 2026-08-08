import React from 'react';
import { Plus, X } from 'lucide-react';
import { CARAC_KEYS, type HomebrewFieldDef } from '../../services/homebrewSchemas';
import type { CapabilitySummon, HarmfulState } from '../../types/normalized';
import { resoudreEtat, type SourcesInvocation } from '../../domain/capabilityRefs';

/** Entités existantes nécessaires aux champs `etats` et `invocations`. Chargées par la
 *  page, jamais par le champ — ce composant reste présentationnel. */
export interface ReferencesDeclaration {
    etats: HarmfulState[];
    sources: SourcesInvocation;
}

type Data = Record<string, unknown>;

// Base commune, sans taille de police imposée : c'est celle-ci qu'utilisent telle quelle
// les champs principaux du formulaire (Nom/Description dans HomebrewForm.tsx). Les champs
// de schéma ci-dessous, plus denses, l'enrichissent de `text-sm` (fieldCls/fieldErrCls) —
// une seule définition fait autorité, chaque famille de champs garde la taille qu'elle a
// toujours eue.
export const inputCls = 'w-full bg-stone-950 border border-white/10 rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-primary-500';
export const inputErrCls = 'w-full bg-stone-950 border border-red-500/60 rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-red-500';
export const labelCls = 'text-[11px] uppercase font-bold text-stone-400 block mb-1';

/** Intitulé + champ. L'intitulé ENVELOPPE le champ : cliquer dessus y place le curseur,
 *  ce qu'un `<label>` posé à côté ne fait pas. Le point d'obligation évite de découvrir
 *  qu'un champ était requis au moment d'enregistrer. */
const Champ: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
    <label className="block">
        <span className={labelCls}>
            {label}
            {required && <span className="text-primary-400 ml-1" title="Champ obligatoire">*</span>}
        </span>
        {children}
    </label>
);


const fieldCls = `${inputCls} text-sm`;
const fieldErrCls = `${inputErrCls} text-sm`;

// =================== Formulaire ===================

export const HomebrewFields: React.FC<{
    schema: HomebrewFieldDef[];
    data: Data;
    onChange: (d: Data) => void;
    errors?: Record<string, string>;
    /** Préfixe d'ancre, ex. `capacites.2.` — sans quoi deux capacités produiraient
     *  deux `champ-rank` et le défilement irait au premier. */
    prefix?: string;
    /** Absente, les champs `etats` et `invocations` ne sont pas rendus : mieux vaut ne
     *  rien proposer qu'un sélecteur vide. */
    references?: ReferencesDeclaration;
}> = ({ schema, data, onChange, errors, prefix = '', references }) => {
    const set = (key: string, value: unknown) => onChange({ ...data, [key]: value });
    return (
        <div className="space-y-3">
            {schema.map(f => {
                const message = errors?.[f.key];
                return (
                    <div key={f.key} id={`champ-${prefix}${f.key}`}>
                        <FieldInput field={f} value={data[f.key]} onChange={v => set(f.key, v)} error={!!message} references={references} />
                        {message && <p className="text-red-400 text-xs mt-1">{message}</p>}
                    </div>
                );
            })}
        </div>
    );
};

const FieldInput: React.FC<{ field: HomebrewFieldDef; value: unknown; onChange: (v: unknown) => void; error?: boolean; references?: ReferencesDeclaration }> = ({ field, value, onChange, error, references }) => {
    const cls = error ? fieldErrCls : fieldCls;
    switch (field.type) {
        case 'etats':
            // Le contenu, pas seulement la présence de l'objet : un chargement en cours
            // ou en échec laisse la liste vide, et un choix multiple sans choix ne
            // propose rien tout en occupant l'écran.
            if (!references?.etats.length) return null;
            return (
                <EtatsInput
                    label={field.label}
                    value={(value as string[]) ?? []}
                    etats={references.etats}
                    onChange={onChange}
                />
            );
        case 'invocations': {
            const s = references?.sources;
            const aucuneEntite = !s || [s.creatures, s.monstresMaison, s.armes, s.armures, s.communautaire]
                .every(liste => liste.length === 0);
            if (aucuneEntite) return null;
            return (
                <InvocationsInput
                    label={field.label}
                    value={(value as CapabilitySummon[]) ?? []}
                    sources={references.sources}
                    onChange={onChange}
                />
            );
        }
        case 'textarea':
            return (
                <Champ label={field.label} required={field.required}>
                    <textarea className={`${cls} min-h-[80px] resize-y leading-relaxed`} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
                </Champ>
            );
        case 'number':
            return (
                <Champ label={field.label} required={field.required}>
                    <input type="number" className={cls} value={value === undefined || value === null ? '' : String(value)} onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} placeholder={field.placeholder} />
                </Champ>
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
                <Champ label={field.label} required={field.required}>
                    <select className={cls} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)}>
                        {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </Champ>
            );
        case 'caracs':
            return <CaracsInput label={field.label} value={(value as Record<string, number>) ?? {}} onChange={onChange} error={error} />;
        case 'lines':
            return <LinesInput label={field.label} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} placeholder={field.placeholder} error={error} />;
        case 'image': {
            const url = (value as string) ?? '';
            return (
                <Champ label={field.label} required={field.required}>
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
                </Champ>
            );
        }
        default:
            return (
                <Champ label={field.label} required={field.required}>
                    <input className={cls} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
                </Champ>
            );
    }
};

const CaracsInput: React.FC<{ label: string; value: Record<string, number>; onChange: (v: Record<string, number>) => void; error?: boolean }> = ({ label, value, onChange, error }) => (
    <div>
        {/* Un groupe de champs n'a pas d'intitulé au sens HTML : chaque case porte le sien
            (`aria-label`), et ce titre nomme le groupe. */}
        <div className={labelCls}>{label}</div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {CARAC_KEYS.map(k => (
                <label key={k} className="text-center block">
                    <span className="text-[11px] text-stone-400 mb-0.5 block">{k}</span>
                    <input type="number" aria-label={`${label} — ${k}`}
                        className={`w-full bg-stone-950 border rounded px-1 py-1 text-center text-stone-200 text-sm outline-none focus:border-primary-500 ${error ? 'border-red-500/60' : 'border-white/10'}`}
                        value={value[k] ?? 0} onChange={e => onChange({ ...value, [k]: Number(e.target.value) || 0 })} />
                </label>
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
            <div className={labelCls}>{label}</div>
            <div className={`space-y-1.5 ${emptyErr ? 'border border-red-500/60 rounded-lg p-2' : ''}`}>
                {value.map((line, i) => (
                    <div key={i} className="flex gap-1.5">
                        <input className={error ? fieldErrCls : fieldCls} aria-label={`${label} — ligne ${i + 1}`}
                            value={line} onChange={e => update(i, e.target.value)} placeholder={placeholder} />
                        <button type="button" onClick={() => remove(i)} className="text-stone-400 hover:text-red-400 px-2" aria-label="Retirer"><X size={16} /></button>
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...value, ''])} className="text-primary-400 hover:text-primary-300 text-xs font-bold flex items-center gap-1"><Plus size={13} /> Ajouter</button>
            </div>
        </div>
    );
};

// =================== Rendu lecture seule (fiche) ===================

/** Choix multiple fermé sur les états du compendium : aucune saisie libre, donc aucune
 *  orthographe à résoudre — la valeur enregistrée est toujours le nom canonique. */
const EtatsInput: React.FC<{
    label: string;
    value: string[];
    etats: HarmfulState[];
    onChange: (v: string[]) => void;
}> = ({ label, value, etats, onChange }) => {
    // Même correspondance dans les deux sens : l'affichage tolère l'accord (cf.
    // `resoudreEtat`), la reconstruction doit en faire autant.
    const dejaChoisi = (nom: string) => value.some(v => resoudreEtat(v, etats) === nom);
    return (
    <div>
        <div className={labelCls}>{label}</div>
        <div className="flex flex-wrap gap-1.5">
            {etats.map(etat => {
                const choisi = dejaChoisi(etat.name);
                return (
                    <button
                        key={etat.id}
                        type="button"
                        // L'ordre stocké est celui du compendium, pas celui des clics :
                        // deux capacités identiques doivent produire la même donnée.
                        onClick={() => onChange(
                            // `dejaChoisi` et non `value.includes` : une déclaration
                            // écrite à la main (« Renversée ») s'affiche cochée, elle ne
                            // doit pas disparaître quand l'auteur clique un autre état.
                            etats.map(e => e.name).filter(n => (n === etat.name ? !choisi : dejaChoisi(n))),
                        )}
                        className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded border transition-colors ${
                            choisi
                                ? 'bg-purple-900/50 text-purple-200 border-purple-500/40'
                                : 'bg-stone-950 text-stone-400 border-white/10 hover:text-stone-300'
                        }`}
                    >
                        {etat.name}
                    </button>
                );
            })}
        </div>
    </div>
    );
};

/** Lignes d'invocation. Une entité se CHOISIT parmi les existantes : rien ne se crée ici,
 *  ce qui ferme l'enchaînement sans fin de formulaires. */
const InvocationsInput: React.FC<{
    label: string;
    value: CapabilitySummon[];
    sources: SourcesInvocation;
    onChange: (v: CapabilitySummon[]) => void;
}> = ({ label, value, sources, onChange }) => {
    // La référence part en base, le libellé s'affiche : montrer `custom-12` à l'auteur
    // ne lui apprend rien. La bibliothèque étant toutes catégories confondues, on ne
    // propose en objets que ce qui en est un — sinon la liste offrirait des voies et
    // des races, y compris l'entrée en cours d'édition.
    const creaturesChoisissables = [
        ...sources.creatures.map(c => ({ ref: c.name, libelle: c.name })),
        ...sources.monstresMaison.map(m => ({ ref: `custom-${m.id}`, libelle: m.name })),
    ];
    const objetsChoisissables = [
        ...sources.armes.map(a => ({ ref: a.name, libelle: a.name })),
        ...sources.armures.map(a => ({ ref: a.name, libelle: a.name })),
        ...sources.communautaire
            .filter(e => e.category === 'objet-magique' || e.category === 'equipement')
            .map(e => ({ ref: `homebrew-${e.id}`, libelle: e.name })),
    ];
    const modifier = (i: number, patch: Partial<CapabilitySummon>) =>
        onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

    return (
        <div>
            <div className={labelCls}>{label}</div>
            <div className="space-y-2">
                {value.map((invocation, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                        <select
                            aria-label="Type d’invocation"
                            value={invocation.type}
                            onChange={e => modifier(i, { type: e.target.value as CapabilitySummon['type'], ref: '' })}
                            className={`${fieldCls} w-auto`}
                        >
                            <option value="creature">Créature</option>
                            <option value="item">Objet</option>
                        </select>
                        <select
                            aria-label="Entité invoquée"
                            value={invocation.ref}
                            onChange={e => modifier(i, { ref: e.target.value })}
                            className={`${fieldCls} flex-1 min-w-[140px]`}
                        >
                            <option value="">— à choisir —</option>
                            {(invocation.type === 'creature' ? creaturesChoisissables : objetsChoisissables)
                                .map(o => <option key={o.ref} value={o.ref}>{o.libelle}</option>)}
                        </select>
                        <input
                            aria-label="Quantité"
                            type="number"
                            min={1}
                            value={invocation.quantity ?? 1}
                            onChange={e => modifier(i, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                            className={`${fieldCls} w-20`}
                        />
                        <button
                            type="button"
                            aria-label="Retirer cette invocation"
                            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                            className="p-1 text-stone-400 hover:text-red-400"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => onChange([...value, { type: 'creature', ref: '', quantity: 1 }])}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-400 hover:text-primary-300"
                >
                    <Plus size={14} /> Ajouter une invocation
                </button>
            </div>
        </div>
    );
};
