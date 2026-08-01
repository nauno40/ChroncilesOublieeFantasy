import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Globe } from 'lucide-react';
import { PageContainer, PageShell, Loader } from '../components/common';
import { HomebrewFields, inputCls, inputErrCls, labelCls } from '../components/homebrew/HomebrewFields';
import { HomebrewFormPreview } from '../components/homebrew/HomebrewFormPreview';
import {
    HomebrewService,
    HOMEBREW_CATEGORIES,
    categoryLabel,
    categoryPath,
    cheminInterne,
    type HomebrewInput,
    type HomebrewVisibility,
} from '../services/homebrewService';
import { HOMEBREW_SCHEMAS, HOMEBREW_SHEET_CATEGORIES, hasStructuredSchema, pruneToSchema } from '../services/homebrewSchemas';
import { validateHomebrew, type HomebrewFieldError } from '../services/homebrewValidation';

type Data = Record<string, unknown>;

/**
 * Page de création/édition d'une entrée homebrew — remplace, pour ce cas d'usage, la
 * modale de HomebrewBrowser (supprimée) : une page pleine largeur est utilisable sur
 * mobile et laisse la place à la validation détaillée.
 *
 * Deux routes : `/bibliotheque/nouveau/:categorie` (création, catégorie verrouillée par
 * l'URL) et `/bibliotheque/:id/modifier` (édition, catégorie verrouillée par l'entrée
 * chargée).
 */
export const HomebrewForm: React.FC = () => {
    const { id, categorie } = useParams<{ id?: string; categorie?: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEdit = id !== undefined;

    const [loading, setLoading] = useState(isEdit);
    const [notFound, setNotFound] = useState(false);
    const [category, setCategory] = useState(categorie ?? '');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<HomebrewVisibility>('private');
    const [data, setData] = useState<Data>({});
    const [dirty, setDirty] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<HomebrewFieldError[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Chargement de l'entrée existante (édition uniquement).
    useEffect(() => {
        if (!isEdit || !id) return;
        HomebrewService.getById(id)
            .then(entry => {
                setCategory(entry.category);
                setName(entry.name);
                setDescription(entry.description ?? '');
                setVisibility(entry.visibility);
                setData(entry.data ?? {});
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [isEdit, id]);

    // Les erreurs ne sont recalculées en continu qu'après la première tentative
    // d'enregistrement — on n'affiche jamais d'erreur à un auteur qui n'a encore rien tenté.
    useEffect(() => {
        if (!submitted) return;
        setErrors(validateHomebrew(category, name, data));
    }, [submitted, category, name, data]);

    // Garde de fermeture d'onglet / rafraîchissement tant que le formulaire est modifié
    // et non enregistré. Ne couvre pas le bouton retour du navigateur : le blocage
    // d'historique de React Router exige un routeur de données (createBrowserRouter),
    // hors périmètre ici (l'app utilise BrowserRouter).
    useEffect(() => {
        if (!dirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [dirty]);

    const errorsByKey = useMemo(
        () => Object.fromEntries(errors.filter(e => e.key).map(e => [e.key, e.message] as const)),
        [errors],
    );
    const globalErrors = errors.filter(e => e.key === '');

    const categoryKnown = HOMEBREW_CATEGORIES.some(c => c.value === category);
    // Une redirection ne doit jamais quitter le site : seul un chemin interne (résolu
    // et vérifié par `cheminInterne`, qui compare l'origine plutôt que de filtrer par
    // préfixes) est accepté.
    const retourParam = searchParams.get('retour');
    const safeRetour = cheminInterne(retourParam);
    const destination = safeRetour || categoryPath(category);
    const previewSupported = HOMEBREW_SHEET_CATEGORIES.includes(category);

    // Catégories proposables à la création, transmises par HomebrewBrowser via `cats`
    // (ex. `cats=capacite,sort`) dès que le contexte d'origine en autorise plusieurs —
    // absent quand la catégorie est verrouillée sur une seule. En édition, la catégorie
    // reste toujours celle de l'entrée chargée : jamais de sélecteur.
    const catsParam = searchParams.get('cats');
    const selectableCategories = useMemo(() => {
        if (isEdit || !catsParam) return null;
        const values = catsParam.split(',').map(s => s.trim()).filter(Boolean);
        const options = HOMEBREW_CATEGORIES.filter(c => values.includes(c.value));
        return options.length > 1 ? options : null;
    }, [isEdit, catsParam]);

    if (loading) return <Loader />;

    if (!isEdit && !categoryKnown) {
        return (
            <PageContainer>
                <p className="text-stone-400">Catégorie inconnue.</p>
                <Link to="/bibliotheque" className="text-primary-400 hover:text-primary-300 text-sm underline">Retour à la Bibliothèque</Link>
            </PageContainer>
        );
    }

    if (isEdit && notFound) {
        return (
            <PageContainer>
                <p className="text-stone-400">Contenu introuvable.</p>
                <Link to="/bibliotheque" className="text-primary-400 hover:text-primary-300 text-sm underline">Retour à la Bibliothèque</Link>
            </PageContainer>
        );
    }

    const markDirty = () => setDirty(true);
    // Changer de catégorie vide les champs structurés (les schémas diffèrent d'une
    // catégorie à l'autre) mais préserve le nom et la description déjà saisis.
    const handleCategory = (v: string) => { setCategory(v); setData({}); markDirty(); };
    const handleName = (v: string) => { setName(v); markDirty(); };
    const handleDescription = (v: string) => { setDescription(v); markDirty(); };
    const handleVisibility = (v: HomebrewVisibility) => { setVisibility(v); markDirty(); };
    const handleData = (d: Data) => { setData(d); markDirty(); };

    const handleCancel = () => {
        if (dirty && !confirm('Abandonner les modifications non enregistrées ?')) return;
        navigate(destination);
    };

    const handleSave = async () => {
        const errs = validateHomebrew(category, name, data);
        setErrors(errs);
        if (errs.length > 0) {
            setSubmitted(true);
            // Une erreur transverse (ex. cohérence arme/armure) n'a pas de clé de champ :
            // elle vit dans le bandeau en tête de formulaire, pas dans un `champ-*`.
            const targetId = errs[0].key ? `champ-${errs[0].key}` : 'erreurs-formulaire';
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const payload: HomebrewInput = { category, name, description, visibility, data: pruneToSchema(category, data) };
            if (isEdit && id) await HomebrewService.update(Number(id), payload);
            else await HomebrewService.create(payload);
            setDirty(false);
            navigate(destination);
        } catch (e) {
            // L'auteur doit savoir que l'enregistrement a échoué — et garder sa saisie :
            // ni la navigation ni la remise à zéro du formulaire n'ont lieu ici. Le
            // message affiché reste générique : l'erreur brute vient de l'API (souvent
            // une exception Doctrine, ex. `SQLSTATE[22001]: … value too long for type
            // character varying(255)`) et ne doit ni s'afficher (illisible, fuite de
            // détails d'implémentation) ni être supposée avoir une cause unique — seul
            // le champ Nom est borné côté formulaire (`maxLength`), d'autres champs
            // peuvent dépasser des limites de colonnes côté serveur.
            console.error('Échec de l\'enregistrement homebrew :', e);
            setSaveError("L'enregistrement a échoué. Vérifiez la longueur de vos champs, puis réessayez.");
        } finally {
            setSaving(false);
        }
    };

    const title = isEdit
        ? `Modifier — ${name || '…'}`
        : selectableCategories
            ? 'Nouveau contenu communautaire'
            : `Nouveau — ${categoryLabel(category)}`;

    return (
        <PageContainer>
            <PageShell title={title} subtitle={selectableCategories ? undefined : categoryLabel(category)} />

            <div className={previewSupported ? 'lg:grid lg:grid-cols-2 lg:gap-8 items-start' : ''}>
                <div className={previewSupported ? '' : 'max-w-2xl'}>
                    {previewSupported && (
                        <button
                            onClick={() => setShowPreview(v => !v)}
                            className="lg:hidden mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm font-bold text-stone-300 hover:text-white hover:border-white/20"
                        >
                            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showPreview ? 'Masquer l\'aperçu' : 'Aperçu'}
                        </button>
                    )}

                    {previewSupported && showPreview && (
                        <div className="lg:hidden mb-6">
                            <HomebrewFormPreview category={category} name={name} description={description} data={data} />
                        </div>
                    )}

                    <div className="glass-panel rounded-2xl border border-white/5 p-6 space-y-4">
                        {(globalErrors.length > 0 || saveError) && (
                            <div id="erreurs-formulaire" className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-1">
                                {saveError && <p className="text-red-400 text-sm font-bold">{saveError}</p>}
                                {globalErrors.map((e, i) => <p key={i} className="text-red-400 text-sm">{e.message}</p>)}
                            </div>
                        )}

                        {selectableCategories && (
                            <div>
                                <label className={labelCls}>Catégorie</label>
                                <select
                                    value={category}
                                    onChange={e => handleCategory(e.target.value)}
                                    className={inputCls}
                                >
                                    {selectableCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                        )}

                        <div id="champ-name">
                            <label className={labelCls}>Nom</label>
                            <input
                                value={name}
                                onChange={e => handleName(e.target.value)}
                                placeholder="Nom du contenu"
                                maxLength={255}
                                autoFocus
                                className={errorsByKey.name ? inputErrCls : inputCls}
                            />
                            {errorsByKey.name && <p className="text-red-400 text-xs mt-1">{errorsByKey.name}</p>}
                        </div>

                        <div>
                            <label className={labelCls}>
                                Description {hasStructuredSchema(category) && <span className="text-stone-600 normal-case font-normal">(résumé court)</span>}
                            </label>
                            <textarea
                                value={description}
                                onChange={e => handleDescription(e.target.value)}
                                placeholder="Effet, règles, saveur…"
                                className={`${inputCls} min-h-[90px] resize-y leading-relaxed`}
                            />
                        </div>

                        {hasStructuredSchema(category) && (
                            <div className="border-t border-white/5 pt-4">
                                <p className="text-[11px] uppercase font-bold tracking-wider text-primary-400/70 mb-3">Détails — {categoryLabel(category)}</p>
                                <HomebrewFields
                                    schema={HOMEBREW_SCHEMAS[category] ?? []}
                                    data={data}
                                    onChange={handleData}
                                    errors={errorsByKey}
                                />
                            </div>
                        )}

                        <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={visibility === 'public'}
                                onChange={e => handleVisibility(e.target.checked ? 'public' : 'private')}
                                className="accent-primary-500 w-4 h-4"
                            />
                            <Globe size={14} className="text-green-500/70" /> Partager à la communauté (public)
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={handleCancel} disabled={saving} className="px-4 py-2 text-sm font-bold text-stone-400 hover:text-white disabled:opacity-50">Annuler</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm disabled:opacity-50">
                                {saving ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>

                {previewSupported && (
                    <div className="hidden lg:block lg:sticky lg:top-24">
                        <HomebrewFormPreview category={category} name={name} description={description} data={data} />
                    </div>
                )}
            </div>
        </PageContainer>
    );
};
