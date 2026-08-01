# Formulaires de création communautaire — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer et modifier un contenu communautaire depuis une page dédiée utilisable sur mobile, avec image, validation par catégorie et aperçu fidèle.

**Architecture:** La modale de `HomebrewBrowser` est remplacée par une page à deux routes (création, édition). La validation vit dans une fonction pure testable sans DOM. L'aperçu réutilise les feuilles partagées livrées au chantier précédent, de sorte que l'auteur voie exactement le rendu du lecteur.

**Tech Stack:** React 19 + TypeScript, React Router v6, Tailwind v4 (CSS-first, thème dans `src/index.css`, pas de `tailwind.config.js`), Vitest (fonctions pures en environnement Node ; rendu en jsdom déclaré par commentaire de tête), Playwright via Docker.

**Spec:** `docs/superpowers/specs/2026-08-01-formulaires-communautaires-design.md`

## Global Constraints

- **Image par URL uniquement.** Aucun envoi de fichier, aucun travail backend : `HomebrewEntry` n'a pas de colonne image et le serveur n'a aucun mécanisme d'upload. L'URL vit dans le JSON `data`, sous la clé `image` — déjà lue par les deux adaptateurs et rendue par `RaceSheet`/`ProfileSheet`.
- **Tout champ de règles est obligatoire**, sauf les six champs conditionnels de l'équipement (`damage`, `range`, `critical`, `acBonus`, `acMaxAgi`, `acPenalty`), qui s'excluent mutuellement. Ils sont remplacés par une règle de cohérence : bloc arme, ou bloc armure, ou aucun — jamais les deux.
- **`required` est explicite dans le schéma**, jamais déduit de `tab`. C'est ce qui rend le choix réversible d'une ligne.
- La valeur `0` est une valeur légitime et ne compte pas comme manquante. Un bloc de caractéristiques dont toutes les valeurs valent `0` compte, lui, comme vide.
- La validation ne se déclenche qu'à la **première tentative d'enregistrement**, puis en continu à chaque modification.
- Aucune condition liée à la provenance dans les feuilles partagées : l'aperçu les consomme telles quelles.
- Portes à chaque tâche : `docker compose exec -T frontend npx tsc -b` (0), `docker compose exec -T frontend npx eslint <fichiers touchés>` (0 nouvelle erreur — fond pré-existant d'environ 46 problèmes ailleurs), `docker compose exec -T frontend npx vitest run` (216 tests actuellement, plus les nouveaux).
- Vérification desktop (1280×900) **et** mobile (390×844) : 0 débordement horizontal, 0 erreur console. Compte de test `nauno40@gmail.com` / `chroniques`. Playwright via `mcr.microsoft.com/playwright:v1.58.2-jammy`, `--network host`, `-v $PWD/app/node_modules:/nm:ro`, script important `pkg from '/nm/playwright-core/index.js'`.

---

## Structure des fichiers

**Créés**

| Fichier | Responsabilité |
|---|---|
| `app/src/services/homebrewValidation.ts` | `hasValue` et `validateHomebrew` — fonctions pures |
| `app/src/services/homebrewValidation.test.ts` | Tests unitaires de la validation |
| `app/src/pages/HomebrewForm.tsx` | La page : chargement, saisie, validation, enregistrement, navigation |
| `app/src/components/homebrew/HomebrewFormPreview.tsx` | Colonne d'aperçu, alimentée par les feuilles partagées |

**Modifiés**

| Fichier | Changement |
|---|---|
| `app/src/services/homebrewSchemas.ts` | `required` explicite sur chaque champ ; type de champ `image` ; clé `image` sur `race` et `classe` |
| `app/src/components/homebrew/HomebrewFields.tsx` | Rendu du type `image` ; affichage des erreurs sous les champs ; `hasValue` importée au lieu d'être redéfinie |
| `app/src/components/homebrew/HomebrewBrowser.tsx` | Suppression de la modale ; le bouton « Créer » navigue |
| `app/src/components/homebrew/HomebrewList.tsx` | L'action « Modifier » navigue |
| `app/src/components/sheets/OwnerBar.tsx` | — (inchangé : il rend déjà le bouton si le gestionnaire existe) |
| `app/src/pages/HomebrewDetail.tsx` | Câble `onEdit` vers la route d'édition |
| `app/src/App.tsx` | Deux routes nouvelles |

---

## Task 1 : Validation pure et `required` explicite

**Files:**
- Modify: `app/src/services/homebrewSchemas.ts`
- Create: `app/src/services/homebrewValidation.ts`
- Create: `app/src/services/homebrewValidation.test.ts`
- Modify: `app/src/components/homebrew/HomebrewFields.tsx`

**Interfaces:**
- Consumes: `HOMEBREW_SCHEMAS`, `HomebrewFieldDef`, `CARAC_KEYS` (`homebrewSchemas.ts`).
- Produces :
  - `hasValue(v: unknown): boolean`
  - `interface HomebrewFieldError { key: string; message: string }`
  - `validateHomebrew(category: string, name: string, data: Record<string, unknown>): HomebrewFieldError[]`
  - `HomebrewFieldDef.required?: boolean`

- [ ] **Step 1 : Ajouter l'indicateur au type**

Dans `homebrewSchemas.ts`, sur `HomebrewFieldDef` :

```ts
    /**
     * Champ requis pour enregistrer. Explicite, jamais déduit de `tab` : c'est ce qui
     * rend le niveau d'exigence réversible sans refonte.
     */
    required?: boolean;
```

- [ ] **Step 2 : Marquer chaque champ**

Règle à appliquer : `required: true` sur **tous** les champs, **sauf** ceux listés ci-dessous qui reçoivent `required: false`.

- Champs de lore de `race` : `physicalTraits`, `publicPerception`, `roleplay`, `typicalNames`, `detailedDescription`.
- Champs de lore de `classe` : `note`, `lore`.
- Champs conditionnels d'`equipmentFields` (partagé par `equipement` et `objet-magique`) : `damage`, `range`, `critical`, `acBonus`, `acMaxAgi`, `acPenalty`.
- **Les trois champs booléens** : `limited` de `sort`, `isSpell` et `limited` de `capacite`. Une case à cocher porte toujours une valeur — `hasValue(false)` vaut `true` — donc les marquer obligatoires produirait une contrainte qui passe toujours. Les déclarer non requis est la formulation honnête.

Le schéma `etat` est vide (`etat: []`) : rien à marquer, aucune validation ne s'y appliquera au-delà du nom.

Décompte attendu après marquage, à vérifier : race 9, classe 8, poison 5, capacite 4, sort 4, piege 4, voie 3, equipement 7, objet-magique 7, etat 0.

- [ ] **Step 3 : Écrire les tests (ils doivent échouer)**

Créer `app/src/services/homebrewValidation.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { hasValue, validateHomebrew } from './homebrewValidation';
import { HOMEBREW_SCHEMAS } from './homebrewSchemas';

/** Construit une donnée qui remplit tous les champs requis d'une catégorie. */
const complet = (categorie: string): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const f of HOMEBREW_SCHEMAS[categorie] ?? []) {
        if (f.required === false) continue;
        if (f.type === 'number') out[f.key] = 3;
        else if (f.type === 'bool') out[f.key] = true;
        else if (f.type === 'caracs') out[f.key] = { AGI: 1 };
        else if (f.type === 'lines') out[f.key] = ['une ligne'];
        else if (f.type === 'select') out[f.key] = f.options?.[1]?.value ?? 'x';
        else out[f.key] = 'valeur';
    }
    return out;
};

describe('hasValue', () => {
    it('considère 0 comme une valeur renseignée', () => {
        expect(hasValue(0)).toBe(true);
    });
    it('rejette le vide sous toutes ses formes', () => {
        expect(hasValue(undefined)).toBe(false);
        expect(hasValue(null)).toBe(false);
        expect(hasValue('')).toBe(false);
        expect(hasValue('   ')).toBe(false);
        expect(hasValue([])).toBe(false);
        expect(hasValue(['', '  '])).toBe(false);
    });
    it('rejette un bloc de caractéristiques entièrement à zéro', () => {
        expect(hasValue({ AGI: 0, CON: 0 })).toBe(false);
        expect(hasValue({ AGI: 0, CON: 1 })).toBe(true);
    });
});

describe('validateHomebrew', () => {
    it('exige le nom quelle que soit la catégorie', () => {
        const erreurs = validateHomebrew('etat', '   ', {});
        expect(erreurs).toHaveLength(1);
        expect(erreurs[0].key).toBe('name');
    });

    it('ne signale rien quand tous les champs requis sont remplis', () => {
        for (const categorie of ['race', 'classe', 'voie', 'capacite', 'sort', 'poison', 'piege']) {
            expect(validateHomebrew(categorie, 'Nom', complet(categorie))).toEqual([]);
        }
    });

    it('signale exactement les champs requis manquants', () => {
        const erreurs = validateHomebrew('voie', 'Nom', {});
        expect(erreurs.map(e => e.key).sort()).toEqual(['category', 'details', 'maxRank']);
    });

    it('accepte 0 comme valeur d’un champ requis', () => {
        const data = { ...complet('capacite'), rank: 0 };
        expect(validateHomebrew('capacite', 'Nom', data)).toEqual([]);
    });

    it('n’exige pas les cases à cocher, qui portent toujours une valeur', () => {
        const sansBooleens = complet('capacite');
        delete sansBooleens.isSpell;
        delete sansBooleens.limited;
        expect(validateHomebrew('capacite', 'Nom', sansBooleens)).toEqual([]);
    });

    it('n’exige aucun champ pour un état, dont le schéma est vide', () => {
        expect(validateHomebrew('etat', 'Nom', {})).toEqual([]);
    });

    it('n’exige pas les champs conditionnels de l’équipement', () => {
        expect(validateHomebrew('equipement', 'Nom', complet('equipement'))).toEqual([]);
    });

    it('refuse un équipement mêlant bloc arme et bloc armure', () => {
        const data = { ...complet('objet-magique'), damage: '1d8', acBonus: 2 };
        const erreurs = validateHomebrew('objet-magique', 'Nom', data);
        expect(erreurs).toHaveLength(1);
        expect(erreurs[0].key).toBe('');
        expect(erreurs[0].message).toMatch(/arme/i);
        expect(erreurs[0].message).toMatch(/armure/i);
    });

    it('accepte un équipement ne renseignant qu’un seul bloc', () => {
        const arme = { ...complet('equipement'), damage: '1d8', critical: '20' };
        expect(validateHomebrew('equipement', 'Nom', arme)).toEqual([]);
        const armure = { ...complet('equipement'), acBonus: 3 };
        expect(validateHomebrew('equipement', 'Nom', armure)).toEqual([]);
    });
});
```

- [ ] **Step 4 : Lancer les tests pour les voir échouer**

```bash
docker compose exec -T frontend npx vitest run src/services/homebrewValidation.test.ts
```

Attendu : ÉCHEC — « Failed to resolve import "./homebrewValidation" ».

- [ ] **Step 5 : Écrire la validation**

Créer `app/src/services/homebrewValidation.ts` :

```ts
import { HOMEBREW_SCHEMAS } from './homebrewSchemas';

/**
 * Une valeur est-elle renseignée ? `0` compte comme une valeur ; un bloc de
 * caractéristiques entièrement à zéro compte comme vide. Ce prédicat était défini dans
 * HomebrewFields ; il est remonté ici pour que formulaire et validation partagent la
 * même sémantique.
 */
export const hasValue = (v: unknown): boolean => {
    if (v === undefined || v === null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    if (Array.isArray(v)) return v.some(x => x !== undefined && x !== null && String(x).trim() !== '');
    if (typeof v === 'object') return Object.values(v as Record<string, unknown>).some(x => Number(x) !== 0);
    return true;
};

export interface HomebrewFieldError {
    /** Clé du champ fautif, ou chaîne vide pour une erreur transverse. */
    key: string;
    message: string;
}

/** Champs de l'équipement qui s'excluent mutuellement (cf. spec). */
const CHAMPS_ARME = ['damage', 'range', 'critical'];
const CHAMPS_ARMURE = ['acBonus', 'acMaxAgi', 'acPenalty'];

export const validateHomebrew = (
    category: string,
    name: string,
    data: Record<string, unknown>,
): HomebrewFieldError[] => {
    const erreurs: HomebrewFieldError[] = [];

    if (!name || name.trim() === '') {
        erreurs.push({ key: 'name', message: 'Le nom est obligatoire.' });
    }

    for (const champ of HOMEBREW_SCHEMAS[category] ?? []) {
        if (champ.required === false) continue;
        if (!hasValue(data[champ.key])) {
            erreurs.push({ key: champ.key, message: `« ${champ.label} » est obligatoire.` });
        }
    }

    // Règle de cohérence : un équipement est une arme, ou une armure, ou ni l'un ni
    // l'autre — jamais les deux. Les champs correspondants sont donc non requis.
    if (category === 'equipement' || category === 'objet-magique') {
        const arme = CHAMPS_ARME.some(k => hasValue(data[k]));
        const armure = CHAMPS_ARMURE.some(k => hasValue(data[k]));
        if (arme && armure) {
            erreurs.push({
                key: '',
                message: "Renseignez soit les champs d'arme (dégâts, portée, critique), soit ceux d'armure (bonus de DEF, AGI max, malus) — pas les deux.",
            });
        }
    }

    return erreurs;
};
```

- [ ] **Step 6 : Faire consommer `hasValue` par le formulaire**

Dans `HomebrewFields.tsx`, supprimer la définition locale de `hasValue` (lignes 10-15) et l'importer :

```ts
import { hasValue } from '../../services/homebrewValidation';
```

Vérifier par recherche qu'aucun autre fichier ne redéfinit ce prédicat.

- [ ] **Step 7 : Lancer les tests pour les voir passer**

```bash
docker compose exec -T frontend npx vitest run src/services/homebrewValidation.test.ts
```

Attendu : les 9 tests passent.

- [ ] **Step 8 : Portes complètes puis commit**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/services src/components/homebrew
docker compose exec -T frontend npx vitest run
git add app/src/services app/src/components/homebrew/HomebrewFields.tsx
git commit -m "feat(homebrew): validation par catégorie et champs requis explicites"
```

---

## Task 2 : Champ image

**Files:**
- Modify: `app/src/services/homebrewSchemas.ts`
- Modify: `app/src/components/homebrew/HomebrewFields.tsx`
- Modify: `app/src/components/sheets/adapters/adapters.test.ts`

**Interfaces:**
- Consumes: `HomebrewFieldDef`, `hasValue` (Task 1).
- Produces: le type de champ `'image'` et la clé `image` dans les schémas `race` et `classe`.

- [ ] **Step 1 : Étendre le type de champ**

Dans `homebrewSchemas.ts`, ajouter `'image'` à l'union `HomebrewFieldType`.

- [ ] **Step 2 : Ajouter la clé aux deux schémas**

En tête des schémas `race` et `classe` — ce sont les seules catégories dont la fiche affiche une image :

```ts
        { key: 'image', label: 'Image (URL)', type: 'image', required: false, placeholder: 'https://…' },
```

`required: false` : une illustration n'est pas une règle de jeu.

- [ ] **Step 3 : Rendre le champ**

Dans `HomebrewFields.tsx`, ajouter un cas au `switch` de `FieldInput`. Le champ est une simple saisie d'URL doublée d'un aperçu, qui se masque si l'image ne charge pas — même repli que les feuilles :

```tsx
        case 'image': {
            const url = (value as string) ?? '';
            return (
                <div>
                    <label className={labelCls}>{field.label}</label>
                    <input type="url" className={inputCls} value={url} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
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
```

- [ ] **Step 4 : Vérifier que la couverture de schéma reste verte**

`adapters.test.ts` contient des tests qui bouclent sur `HOMEBREW_SCHEMAS[categorie]` et exigent que chaque clé de schéma atterrisse dans le view-model. La clé `image` est déjà lue par `homebrewToRaceVM` et `homebrewToProfileVM` : le test doit passer sans modification. Lance-le pour le confirmer :

```bash
docker compose exec -T frontend npx vitest run src/components/sheets/adapters/adapters.test.ts
```

Attendu : tous verts. **En cas d'échec, ne modifie pas le test** : c'est le signe que l'adaptateur ne mappe pas `image` pour l'une des deux catégories — corrige l'adaptateur.

- [ ] **Step 5 : Test de rendu du champ image**

Créer `app/src/components/homebrew/HomebrewFields.test.tsx`. Le filet de rendu posé en PR #149 s'utilise par commentaire de tête ; la configuration globale reste en Node.

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomebrewFields } from './HomebrewFields';
import type { HomebrewFieldDef } from '../../services/homebrewSchemas';

const schemaImage: HomebrewFieldDef[] = [
    { key: 'image', label: 'Image (URL)', type: 'image', required: false },
];

describe('HomebrewFields — champ image', () => {
    it('affiche un aperçu quand une URL est saisie', () => {
        render(<HomebrewFields schema={schemaImage} data={{ image: 'https://exemple.test/i.png' }} onChange={() => {}} />);
        const apercu = screen.getByAltText('Aperçu') as HTMLImageElement;
        expect(apercu.src).toBe('https://exemple.test/i.png');
    });

    it("n'affiche aucun aperçu sans URL", () => {
        render(<HomebrewFields schema={schemaImage} data={{}} onChange={() => {}} />);
        expect(screen.queryByAltText('Aperçu')).toBeNull();
    });
});
```

Lance-le, vérifie qu'il passe :

```bash
docker compose exec -T frontend npx vitest run src/components/homebrew/HomebrewFields.test.tsx
```

- [ ] **Step 6 : Portes puis commit**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/services src/components/homebrew
docker compose exec -T frontend npx vitest run
git add app/src/services/homebrewSchemas.ts app/src/components/homebrew
git commit -m "feat(homebrew): champ image (URL) sur race et classe"
```

---

## Task 3 : La page de formulaire

**Files:**
- Create: `app/src/pages/HomebrewForm.tsx`
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/homebrew/HomebrewFields.tsx`

**Interfaces:**
- Consumes: `validateHomebrew`, `HomebrewFieldError` (Task 1) ; `HomebrewService.getById/create/update`, `HomebrewInput`, `HOMEBREW_CATEGORIES`, `categoryLabel` (`services/homebrewService.ts`) ; `HOMEBREW_SCHEMAS`, `pruneToSchema` (`services/homebrewSchemas.ts`) ; `PageContainer`, `PageShell`, `Loader` (`components/common`).
- Produces: la page `HomebrewForm` et les routes `/bibliotheque/nouveau/:categorie` et `/bibliotheque/:id/modifier`.

- [ ] **Step 1 : Faire accepter les erreurs par les champs**

Dans `HomebrewFields.tsx`, la signature devient :

```tsx
export const HomebrewFields: React.FC<{
    schema: HomebrewFieldDef[];
    data: Data;
    onChange: (d: Data) => void;
    errors?: Record<string, string>;
}> = ({ schema, data, onChange, errors }) => {
```

Chaque champ est enveloppé d'un conteneur portant `id={`champ-${f.key}`}` (cible du défilement) et, si `errors?.[f.key]` existe, affiche le message dessous :

```tsx
<p className="text-red-400 text-xs mt-1">{errors[f.key]}</p>
```

Un champ en erreur reçoit en plus une bordure rouge. `errors` est optionnel : les appels existants restent valides.

- [ ] **Step 2 : Écrire la page**

Créer `app/src/pages/HomebrewForm.tsx`. Comportement attendu :

- La route d'édition (`/bibliotheque/:id/modifier`) charge l'entrée par `HomebrewService.getById` et pré-remplit ; la route de création (`/bibliotheque/nouveau/:categorie`) part d'un formulaire vide dont la catégorie est verrouillée par l'URL. Une catégorie inconnue affiche un message et un retour, sans planter.
- L'état local porte `name`, `description`, `visibility`, `data`, plus `submitted` (faux tant que l'auteur n'a pas tenté d'enregistrer) et `errors`.
- Les erreurs sont recalculées par `validateHomebrew` à chaque modification **une fois `submitted` vrai**, et jamais avant — conformément à la contrainte globale.
- À l'enregistrement : si `validateHomebrew` renvoie des erreurs, on passe `submitted` à vrai, on les affiche, et on fait défiler jusqu'au premier champ fautif via `document.getElementById(\`champ-${erreurs[0].key}\`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })`. Les erreurs transverses (clé vide) s'affichent en tête de formulaire. Sinon on appelle `HomebrewService.create` ou `update` avec `data: pruneToSchema(categorie, data)` puis on navigue vers la destination de retour.
- La destination de retour vient du paramètre de requête `retour`, à défaut la page de la catégorie. Réutilise la correspondance catégorie → chemin déjà écrite dans `HomebrewDetail.tsx` (`categoryPath`) plutôt que d'en écrire une seconde : sors-la dans un module partagé si nécessaire.
- Un formulaire modifié demande confirmation avant abandon (bouton « Annuler » et navigation arrière).
- L'en-tête utilise `PageShell` avec pour titre « Nouveau — <catégorie> » ou « Modifier — <nom> ».

- [ ] **Step 3 : Déclarer les routes**

Dans `App.tsx`, sous `<Route element={<Layout />}>`, à côté de la route `bibliotheque` existante :

```tsx
                <Route path="bibliotheque/nouveau/:categorie" element={<HomebrewForm />} />
                <Route path="bibliotheque/:id/modifier" element={<HomebrewForm />} />
```

Avec l'import paresseux, au format des autres pages :

```tsx
const HomebrewForm = lazy(() => import('./pages/HomebrewForm').then(m => ({ default: m.HomebrewForm })));
```

Attention à l'ordre : `bibliotheque/:id/modifier` ne doit pas capturer `bibliotheque/nouveau/...`. Place la route `nouveau` en premier et vérifie par navigation directe.

- [ ] **Step 4 : Test de rendu des messages d'erreur**

Ajouter à `app/src/components/homebrew/HomebrewFields.test.tsx` :

```tsx
describe('HomebrewFields — erreurs', () => {
    const schema: HomebrewFieldDef[] = [
        { key: 'speed', label: 'Vitesse', type: 'text', required: true },
    ];

    it('affiche le message sous le champ fautif', () => {
        render(<HomebrewFields schema={schema} data={{}} onChange={() => {}} errors={{ speed: '« Vitesse » est obligatoire.' }} />);
        expect(screen.getByText('« Vitesse » est obligatoire.')).toBeTruthy();
    });

    it("n'affiche rien quand il n'y a pas d'erreur", () => {
        render(<HomebrewFields schema={schema} data={{ speed: '10 m' }} onChange={() => {}} />);
        expect(screen.queryByText(/obligatoire/)).toBeNull();
    });

    it('expose une ancre de défilement par champ', () => {
        const { container } = render(<HomebrewFields schema={schema} data={{}} onChange={() => {}} />);
        expect(container.querySelector('#champ-speed')).toBeTruthy();
    });
});
```

- [ ] **Step 5 : Portes**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/pages/HomebrewForm.tsx src/App.tsx src/components/homebrew
docker compose exec -T frontend npx vitest run
```

- [ ] **Step 6 : Commit**

```bash
git add app/src/pages/HomebrewForm.tsx app/src/App.tsx app/src/components/homebrew
git commit -m "feat(homebrew): page de création et d'édition"
```

---

## Task 4 : Basculer les points d'entrée et retirer la modale

**Files:**
- Modify: `app/src/components/homebrew/HomebrewBrowser.tsx`
- Modify: `app/src/components/homebrew/HomebrewList.tsx`
- Modify: `app/src/pages/HomebrewDetail.tsx`

**Interfaces:**
- Consumes: les routes de la Task 3.
- Produces: plus aucune modale de formulaire dans l'application.

- [ ] **Step 1 : Recenser les points d'entrée**

```bash
grep -rn "openNew\|openEdit\|form.open" app/src/components/homebrew app/src/pages
```

Attendu : cinq occurrences dans `HomebrewBrowser.tsx` (bouton « Créer », lien de l'état vide, ouverture depuis `HomebrewList`) — **traite-les toutes**. Un point oublié laisserait un bouton mort, risque nommé par la spec.

- [ ] **Step 2 : Faire naviguer plutôt qu'ouvrir**

Dans `HomebrewBrowser.tsx` : `openNew` devient une navigation vers `/bibliotheque/nouveau/<categorie>?retour=<chemin courant>`, et `openEdit` vers `/bibliotheque/<id>/modifier?retour=<chemin courant>`. Le chemin courant s'obtient par `useLocation().pathname`. Supprimer ensuite l'état `form`, `handleSave`, `saving`, la modale et les imports devenus inutiles (`HomebrewFields`, `HOMEBREW_SCHEMAS`, `hasStructuredSchema`, `pruneToSchema`, `X`, `Globe` s'il n'est plus utilisé) — `tsc` les signalera.

- [ ] **Step 3 : Câbler « Modifier » sur la fiche**

Dans `HomebrewDetail.tsx`, fournir le gestionnaire manquant à `OwnerBar` :

```tsx
            onEdit={mine ? () => navigate(`/bibliotheque/${entry.id}/modifier?retour=${encodeURIComponent(location.pathname)}`) : undefined}
```

`OwnerBar` ne rend le bouton que si le gestionnaire existe : aucune modification du composant n'est nécessaire. C'est la dette explicitement laissée par le chantier précédent.

- [ ] **Step 4 : Portes**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/components/homebrew src/pages/HomebrewDetail.tsx
docker compose exec -T frontend npx vitest run
```

- [ ] **Step 5 : Commit**

```bash
git add app/src/components/homebrew app/src/pages/HomebrewDetail.tsx
git commit -m "feat(homebrew): les points d'entrée mènent à la page, la modale disparaît"
```

---

## Task 5 : Aperçu côté formulaire

**Files:**
- Create: `app/src/components/homebrew/HomebrewFormPreview.tsx`
- Modify: `app/src/pages/HomebrewForm.tsx`

**Interfaces:**
- Consumes: `RaceSheet`, `ProfileSheet`, `VoieSheet`, `CapaciteSheet` (`components/sheets`) ; `homebrewToRaceVM`, `homebrewToProfileVM`, `homebrewToVoieVM`, `homebrewToCapaciteVM` (`components/sheets/adapters/fromHomebrew`) ; `HomebrewEntry` (`services/homebrewService`).
- Produces: `HomebrewFormPreview` — signature `({ category, name, description, data }: { category: string; name: string; description: string; data: Record<string, unknown> }) => JSX.Element | null`.

- [ ] **Step 1 : Écrire l'aperçu**

Le composant fabrique un `HomebrewEntry` provisoire à partir de la saisie en cours, le passe à l'adaptateur communautaire de sa catégorie, et rend la feuille correspondante **sans bandeau propriétaire ni lien de retour** (`backTo` non fourni). Pour les catégories sans feuille dédiée — `poison`, `piege`, `etat`, `equipement`, `objet-magique`, `autre` — il renvoie `null` : c'est la limite assumée par la spec.

L'entrée provisoire n'est jamais enregistrée ; les champs absents du type (`id`, `authorId`, `createdAt`…) prennent des valeurs neutres.

- [ ] **Step 2 : Poser la mise en page à deux colonnes**

Dans `HomebrewForm.tsx` : sur écran large, `lg:grid lg:grid-cols-2 lg:gap-8`, formulaire à gauche, aperçu à droite dans un conteneur `lg:sticky lg:top-24` pour qu'il suive le défilement. Sous le point de rupture, une seule colonne : le formulaire, l'aperçu étant replié derrière un bouton « Aperçu » qui l'affiche au-dessus du formulaire.

Quand `HomebrewFormPreview` renvoie `null`, le formulaire occupe toute la largeur et le bouton « Aperçu » n'apparaît pas.

- [ ] **Step 3 : Portes**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/components/homebrew src/pages/HomebrewForm.tsx
docker compose exec -T frontend npx vitest run
```

- [ ] **Step 4 : Commit**

```bash
git add app/src/components/homebrew/HomebrewFormPreview.tsx app/src/pages/HomebrewForm.tsx
git commit -m "feat(homebrew): aperçu de la fiche pendant la saisie"
```

---

## Vérification finale

Parcours Playwright, desktop **et** mobile, connecté :

1. Depuis `/races`, onglet « Mes créations », bouton « Créer — Race / Peuple » → la page s'ouvre, la catégorie est verrouillée.
2. Enregistrer sans rien remplir → 10 erreurs (nom + 9 champs de règles), la page défile jusqu'au nom.
3. Remplir le nom seul puis enregistrer → 9 erreurs restantes.
4. Tout remplir, coller une URL d'image → l'aperçu du champ s'affiche, l'aperçu de fiche montre la race telle que la verra un lecteur.
5. Enregistrer → retour sur `/races`, la nouvelle race figure dans la liste.
6. Ouvrir sa fiche → « Modifier » navigue vers le formulaire pré-rempli ; modifier le nom, enregistrer, vérifier la mise à jour.
7. Créer un objet magique en renseignant dégâts **et** bonus de DEF → l'erreur de cohérence s'affiche en tête et l'enregistrement est bloqué.
8. Supprimer les contenus de test créés pendant ce parcours.

Attendu à chaque étape : 0 débordement horizontal, 0 erreur console. Puis :

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src
docker compose exec -T frontend npx vitest run
```
