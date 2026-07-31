# Iso officiel ↔ communautaire — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le contenu communautaire s'affiche exactement comme l'officiel — même barre de recherche, même compteur, mêmes fiches de détail — le seul écart visible étant le bandeau propriétaire.

**Architecture:** Chaque page officielle riche est scindée en un composant de présentation pur (« feuille ») dans `app/src/components/sheets/`, alimenté par un view-model normalisé, et une page réduite à charger → mapper → rendre. `HomebrewDetail` réutilise les mêmes feuilles via un adaptateur qui projette `entry.data`. Le delta communautaire passe par un unique composant `OwnerBar`.

**Tech Stack:** React 19 + TypeScript, Tailwind v4 (CSS-first, thème dans `src/index.css`, pas de `tailwind.config.js`), Vitest (fonctions pures uniquement), Playwright via Docker pour la vérification visuelle.

**Spec:** `docs/superpowers/specs/2026-07-31-iso-officiel-communautaire-design.md`

## Global Constraints

- Iso stricte sur 5 catégories seulement : `race`, `classe`, `voie`, `capacite`/`sort`, `creature`. Les 6 autres (`poison`, `piege`, `etat`, `equipement`, `objet-magique`, `autre`) gardent la fiche générique actuelle.
- Seul delta communautaire autorisé : bandeau propriétaire (auteur, visibilité, Dupliquer / Modifier / Supprimer). Aucune autre condition `if (homebrew)` dans une feuille.
- Les filtres propres aux pages officielles (dé de vie / magie sur Classes, type / classe sur Voies) ne sont **pas** répliqués côté communautaire.
- Dans les view-models, tous les champs sont optionnels sauf `name`. Un champ absent vaut `undefined` — jamais `null`, `""` ni `0` — et sa section n'est pas rendue.
- Extraction **sans retouche de style** : le JSX des pages officielles est déplacé tel quel dans les feuilles. Toute amélioration visuelle est hors périmètre.
- **Convention d'extraction** : pour les feuilles, le code de référence n'est pas reproduit dans ce plan — il *est* le JSX présent dans la page officielle citée. Le geste est mécanique et vérifiable : copier le bloc de rendu, remplacer les sources de données par `vm.<champ>`, entourer chaque bloc de sa garde de présence. `RaceSheet` (tâche 3) est donné intégralement et sert de patron de référence aux trois autres.
- Aucune nouvelle dépendance de test. Les tests sont unitaires sur les adaptateurs (fonctions pures) ; le rendu est vérifié par captures Playwright.
- Portes à chaque tâche : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx eslint <fichiers touchés>` (0 nouvelle erreur — le projet a un fond pré-existant d'environ 49 erreurs), `docker compose exec -T frontend npx vitest run` (tous verts).
- Vérification visuelle desktop (1280×900) **et** mobile (390×844) : 0 débordement horizontal, 0 erreur console (hors transitoire connu « GlobalSearch index build failed »).
- Compte de test : `nauno40@gmail.com` / `chroniques`. Playwright s'exécute via l'image Docker `mcr.microsoft.com/playwright:v1.58.2-jammy` avec `--network host` et `-v $PWD/app/node_modules:/nm:ro`, le script important `pkg from '/nm/playwright-core/index.js'`.

---

## Structure des fichiers

**Créés**

| Fichier | Responsabilité |
|---|---|
| `app/src/components/sheets/types.ts` | Les 4 view-models (`RaceSheetVM`, `ProfileSheetVM`, `VoieSheetVM`, `CapaciteSheetVM`) |
| `app/src/components/sheets/RaceSheet.tsx` | Rendu d'une race (JSX extrait de `RaceDetail`) |
| `app/src/components/sheets/ProfileSheet.tsx` | Rendu d'une classe (JSX extrait de `ClassDetail`) |
| `app/src/components/sheets/VoieSheet.tsx` | Rendu d'une voie (JSX extrait de `VoieDetail`) |
| `app/src/components/sheets/CapaciteSheet.tsx` | Rendu d'une capacité (JSX extrait de `CapaciteDetail`) |
| `app/src/components/sheets/OwnerBar.tsx` | Bandeau propriétaire — unique delta communautaire |
| `app/src/components/sheets/index.ts` | Barrel d'export |
| `app/src/components/sheets/adapters/fromOfficial.ts` | Entités API → VM (4 fonctions) |
| `app/src/components/sheets/adapters/fromHomebrew.ts` | `HomebrewEntry` → VM (4 fonctions) |
| `app/src/components/sheets/adapters/adapters.test.ts` | Tests unitaires des 8 adaptateurs |

**Modifiés**

| Fichier | Changement |
|---|---|
| `app/src/components/homebrew/HomebrewBrowser.tsx` | `<input>` maison → `SearchBar` partagé + sous-titre-compteur |
| `app/src/pages/RaceDetail.tsx` | Réduite à charger → mapper → `<RaceSheet/>` |
| `app/src/pages/ClassDetail.tsx` | Idem avec `<ProfileSheet/>` |
| `app/src/pages/VoieDetail.tsx` | Idem avec `<VoieSheet/>` |
| `app/src/pages/CapaciteDetail.tsx` | Idem avec `<CapaciteSheet/>` |
| `app/src/pages/HomebrewDetail.tsx` | Aiguille vers la feuille des 5 catégories iso, garde le rendu générique pour les 6 autres, pose `OwnerBar` |

---

## Task 1 : Barre de recherche et compteur unifiés

**Files:**
- Modify: `app/src/components/homebrew/HomebrewBrowser.tsx`

**Interfaces:**
- Consumes: `SearchBar` depuis `app/src/components/common` — signature `{ value: string; onChange: (v: string) => void; placeholder?: string; className?: string; autoFocus?: boolean }`.
- Produces: rien pour les tâches suivantes (tâche isolée).

- [ ] **Step 1 : Remplacer l'input maison par le composant partagé**

Dans `HomebrewBrowser.tsx`, l'import courant est :

```tsx
import { Plus, Globe, X, Search } from 'lucide-react';
import { Loader } from '../common';
```

Le remplacer par (`Search` n'est plus utilisé, `SearchBar` arrive) :

```tsx
import { Plus, Globe, X } from 'lucide-react';
import { Loader, SearchBar } from '../common';
```

- [ ] **Step 2 : Remplacer le bloc de recherche**

Remplacer ce bloc :

```tsx
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="w-full bg-stone-900/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-stone-200 outline-none focus:border-primary-500 text-sm" />
                </div>
                {tab === 'mine' && (
                    <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"><Plus size={16} /> {createLabel}</button>
                )}
            </div>
```

par celui-ci — `SearchBar` partagé, et le compteur au même format que les pages officielles (« 3 races trouvées ») :

```tsx
            <div className="flex flex-wrap items-center gap-3">
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Rechercher…"
                    className="flex-1 min-w-[200px]"
                />
                {tab === 'mine' && (
                    <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm px-4 py-3 rounded-xl transition-all whitespace-nowrap"><Plus size={16} /> {createLabel}</button>
                )}
            </div>

            <p className="text-stone-400 text-sm">
                {visible.length} résultat{visible.length > 1 ? 's' : ''}
            </p>
```

- [ ] **Step 3 : Portes**

```bash
cd /home/nauno/Projets/ChroncilesOublieeFantasy
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/components/homebrew/HomebrewBrowser.tsx
docker compose exec -T frontend npx vitest run
```

Attendu : `tsc` sans sortie ; `eslint` sans nouvelle erreur (le warning `cats` sur `useMemo` est pré-existant) ; 162 tests verts.

- [ ] **Step 4 : Vérification visuelle**

Script Playwright mesurant l'input des 3 onglets de `/races` — les trois doivent renvoyer les mêmes hauteur, rayon, bordure et taille de police :

```js
const m = await p.evaluate(() => {
  const i = document.querySelector('input[placeholder*="echerch"]');
  const s = getComputedStyle(i);
  return { h: Math.round(i.getBoundingClientRect().height), r: s.borderTopLeftRadius, b: s.borderTopColor, f: s.fontSize };
});
```

Attendu : valeurs identiques entre « Officiel », « Communauté » et « Mes créations ».

- [ ] **Step 5 : Commit**

```bash
git add app/src/components/homebrew/HomebrewBrowser.tsx
git commit -m "fix(homebrew): barre de recherche et compteur alignés sur l'officiel"
```

---

## Task 2 : View-models et adaptateurs

**Files:**
- Create: `app/src/components/sheets/types.ts`
- Create: `app/src/components/sheets/adapters/fromOfficial.ts`
- Create: `app/src/components/sheets/adapters/fromHomebrew.ts`
- Create: `app/src/components/sheets/adapters/adapters.test.ts`

**Interfaces:**
- Consumes: types `Race`, `Profile`, `Voie`, `Capacity` de `app/src/types/normalized.ts` ; type `HomebrewEntry` de `app/src/services/homebrewService.ts` (champs utilisés : `name`, `description`, `data`).
- Produces:
  - `RaceSheetVM`, `ProfileSheetVM`, `VoieSheetVM`, `CapaciteSheetVM` (`sheets/types.ts`)
  - `raceToVM(race: Race, voies?: Voie[]): RaceSheetVM`, `profileToVM(p: Profile, voies?: Voie[]): ProfileSheetVM`, `voieToVM(v: Voie, caps?: Capacity[]): VoieSheetVM`, `capacityToVM(c: Capacity, voieName?: string): CapaciteSheetVM` (`adapters/fromOfficial.ts`)
  - `homebrewToRaceVM(e: HomebrewEntry): RaceSheetVM`, `homebrewToProfileVM(e: HomebrewEntry): ProfileSheetVM`, `homebrewToVoieVM(e: HomebrewEntry): VoieSheetVM`, `homebrewToCapaciteVM(e: HomebrewEntry): CapaciteSheetVM` (`adapters/fromHomebrew.ts`)

- [ ] **Step 1 : Écrire les view-models**

Créer `app/src/components/sheets/types.ts` :

```ts
/**
 * View-models des feuilles de présentation. Tous les champs sont optionnels sauf
 * `name` : une entrée communautaire est partiellement remplie et la feuille doit se
 * dégrader proprement. Un champ absent vaut `undefined` — jamais `null`, `""` ni `0`,
 * qui feraient afficher une section vide.
 */

export interface SheetVoieRef {
    id?: string;
    name: string;
}

export interface RaceSheetVM {
    name: string;
    description?: string;
    image?: string;
    modifiers?: Record<string, number>;
    speed?: string;
    minHeight?: number;
    maxHeight?: number;
    minWeight?: number;
    maxWeight?: number;
    startingAge?: number;
    lifeExpectancy?: number;
    abilities?: string;
    physicalTraits?: string;
    publicPerception?: string;
    roleplay?: string;
    typicalNames?: string;
    detailedDescription?: string;
    voies?: SheetVoieRef[];
}

export interface ProfileSheetVM {
    name: string;
    description?: string;
    image?: string;
    family?: string;
    hitDie?: string;
    magicStat?: string;
    armorMaxDef?: number;
    stats?: Record<string, number>;
    weaponsAuth?: string[];
    armorAuth?: string[];
    startingEquipment?: string[];
    masteries?: string[];
    note?: string;
    lore?: string[];
    voies?: SheetVoieRef[];
}

export interface SheetCapabilityRef {
    rank?: number;
    name: string;
    description?: string;
    isSpell?: boolean;
}

export interface VoieSheetVM {
    name: string;
    description?: string;
    category?: string;
    maxRank?: number;
    profileName?: string;
    capabilities?: SheetCapabilityRef[];
}

export interface CapaciteSheetVM {
    name: string;
    description?: string;
    rank?: number;
    actionType?: string;
    isSpell?: boolean;
    limited?: boolean;
    effect?: string[];
    details?: string[];
    voieName?: string;
}
```

- [ ] **Step 2 : Écrire les tests des adaptateurs (ils doivent échouer)**

Créer `app/src/components/sheets/adapters/adapters.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { raceToVM, profileToVM, voieToVM, capacityToVM } from './fromOfficial';
import { homebrewToRaceVM, homebrewToProfileVM, homebrewToVoieVM, homebrewToCapaciteVM } from './fromHomebrew';
import type { Race, Profile, Voie, Capacity } from '../../../types/normalized';
import type { HomebrewEntry } from '../../../services/homebrewService';

// Fabrique une entrée homebrew minimale : seul le nom est renseigné.
const emptyEntry = (category: string): HomebrewEntry => ({
    id: 1, category, name: 'Sans détail', description: '', visibility: 'private',
    data: {}, authorId: 1, authorPseudo: 'Nauno',
} as HomebrewEntry);

describe('adaptateurs officiels', () => {
    it('projette une race complète', () => {
        const race = {
            id: '1', name: 'Elfe', description: 'Peuple sylvestre', detailedDescription: 'Longue histoire',
            publicPerception: 'Distants', abilities: 'Vision nocturne', startingAge: 20, lifeExpectancy: 400,
            physicalTraits: 'Élancés', typicalNames: 'Aelar', minHeight: 160, maxHeight: 190,
            minWeight: 50, maxWeight: 75, roleplay: 'Fier', image: '/elfe.webp',
            modifiers: [{ stat: 'AGI', value: 1 }, { stat: 'CON', value: -1 }],
        } as unknown as Race;
        const vm = raceToVM(race, [{ id: '9', name: 'Voie des Elfes' } as Voie]);
        expect(vm.name).toBe('Elfe');
        expect(vm.modifiers).toEqual({ AGI: 1, CON: -1 });
        expect(vm.startingAge).toBe(20);
        expect(vm.voies).toEqual([{ id: '9', name: 'Voie des Elfes' }]);
    });

    it('projette une capacité et sa voie', () => {
        const cap = { id: '3', name: 'Boule de feu', description: 'Explose', rank: 3, isSpell: true, limited: true } as Capacity;
        const vm = capacityToVM(cap, 'Voie du Feu');
        expect(vm).toMatchObject({ name: 'Boule de feu', rank: 3, isSpell: true, limited: true, voieName: 'Voie du Feu' });
    });

    it('projette une voie et ses capacités triées par rang', () => {
        const voie = { id: '9', name: 'Voie du Feu', description: 'Brûler', type: 'profil' } as unknown as Voie;
        const caps = [
            { id: '2', name: 'Rang 2', rank: 2 } as Capacity,
            { id: '1', name: 'Rang 1', rank: 1 } as Capacity,
        ];
        const vm = voieToVM(voie, caps);
        expect(vm.capabilities?.map(c => c.rank)).toEqual([1, 2]);
    });

    it('projette un profil', () => {
        const p = { id: 1, name: 'Guerrier', description: 'Brave', hitDie: '1D10', magicStat: null, armorMaxDef: 5 } as unknown as Profile;
        const vm = profileToVM(p);
        expect(vm).toMatchObject({ name: 'Guerrier', hitDie: '1D10', armorMaxDef: 5 });
        expect(vm.magicStat).toBeUndefined();
    });
});

describe('adaptateurs homebrew', () => {
    it('projette une race homebrew complète', () => {
        const entry = {
            ...emptyEntry('race'), name: 'Ondins', description: 'Peuple aquatique',
            data: { modifiers: { CON: 1 }, speed: '10 m', startingAge: 16, abilities: 'Respiration aquatique' },
        } as HomebrewEntry;
        const vm = homebrewToRaceVM(entry);
        expect(vm).toMatchObject({ name: 'Ondins', description: 'Peuple aquatique', speed: '10 m', startingAge: 16 });
        expect(vm.modifiers).toEqual({ CON: 1 });
    });

    it('laisse undefined tout champ absent (aucune section vide)', () => {
        const vm = homebrewToRaceVM(emptyEntry('race'));
        expect(vm.name).toBe('Sans détail');
        expect(vm.description).toBeUndefined();
        expect(vm.modifiers).toBeUndefined();
        expect(vm.startingAge).toBeUndefined();
        expect(vm.abilities).toBeUndefined();
        expect(vm.voies).toBeUndefined();
    });

    it('ne renvoie jamais de tableau vide pour les listes', () => {
        const vmProfile = homebrewToProfileVM(emptyEntry('classe'));
        expect(vmProfile.weaponsAuth).toBeUndefined();
        expect(vmProfile.masteries).toBeUndefined();
        const vmCapacite = homebrewToCapaciteVM(emptyEntry('sort'));
        expect(vmCapacite.effect).toBeUndefined();
        expect(vmCapacite.details).toBeUndefined();
    });

    it('projette une voie homebrew', () => {
        const entry = { ...emptyEntry('voie'), name: 'Voie du Gel', data: { category: 'profil', maxRank: 5 } } as HomebrewEntry;
        const vm = homebrewToVoieVM(entry);
        expect(vm).toMatchObject({ name: 'Voie du Gel', category: 'profil', maxRank: 5 });
    });
});
```

- [ ] **Step 3 : Lancer les tests pour vérifier l'échec**

```bash
docker compose exec -T frontend npx vitest run src/components/sheets/adapters/adapters.test.ts
```

Attendu : ÉCHEC — « Failed to resolve import "./fromOfficial" ».

- [ ] **Step 4 : Écrire l'adaptateur officiel**

Créer `app/src/components/sheets/adapters/fromOfficial.ts` :

```ts
import type { Race, Profile, Voie, Capacity } from '../../../types/normalized';
import type { RaceSheetVM, ProfileSheetVM, VoieSheetVM, CapaciteSheetVM, SheetVoieRef } from '../types';

/** Vide → undefined : une section sans contenu ne doit pas être rendue. */
const str = (v: unknown): string | undefined => {
    const s = typeof v === 'string' ? v.trim() : '';
    return s === '' ? undefined : s;
};
const num = (v: unknown): number | undefined => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined);
const list = (v: unknown): string[] | undefined => {
    if (!Array.isArray(v)) return undefined;
    const out = v.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).filter(Boolean);
    return out.length ? out : undefined;
};
const refs = (voies?: Voie[]): SheetVoieRef[] | undefined =>
    voies && voies.length ? voies.map(v => ({ id: String(v.id), name: v.name })) : undefined;

export const raceToVM = (race: Race, voies?: Voie[]): RaceSheetVM => ({
    name: race.name,
    description: str(race.description),
    image: str(race.image),
    modifiers: race.modifiers?.length
        ? Object.fromEntries(race.modifiers.filter(m => m.stat).map(m => [m.stat as string, m.value]))
        : undefined,
    minHeight: num(race.minHeight),
    maxHeight: num(race.maxHeight),
    minWeight: num(race.minWeight),
    maxWeight: num(race.maxWeight),
    startingAge: num(race.startingAge),
    lifeExpectancy: num(race.lifeExpectancy),
    abilities: str(race.abilities),
    physicalTraits: str(race.physicalTraits),
    publicPerception: str(race.publicPerception),
    roleplay: str(race.roleplay),
    typicalNames: str(race.typicalNames),
    detailedDescription: str(race.detailedDescription),
    voies: refs(voies),
});

export const profileToVM = (p: Profile, voies?: Voie[]): ProfileSheetVM => ({
    name: p.name,
    description: str(p.description),
    image: str(p.imageUrl),
    family: typeof p.family === 'string' ? str(p.family) : str((p.family as { name?: string } | undefined)?.name),
    hitDie: str(p.hitDie),
    magicStat: str(p.magicStat),
    armorMaxDef: num(p.armorMaxDef),
    stats: p.stats as Record<string, number> | undefined,
    startingEquipment: list(p.startingEquipment),
    masteries: p.masteries ? list(Object.values(p.masteries)) : undefined,
    note: str(p.note),
    voies: refs(voies),
});

export const voieToVM = (v: Voie, caps?: Capacity[]): VoieSheetVM => ({
    name: v.name,
    description: str(v.description),
    category: str(v.type),
    capabilities: caps && caps.length
        ? [...caps]
            .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
            .map(c => ({ rank: num(c.rank), name: c.name, description: str(c.description), isSpell: c.isSpell || undefined }))
        : undefined,
});

export const capacityToVM = (c: Capacity, voieName?: string): CapaciteSheetVM => ({
    name: c.name,
    description: str(c.description),
    rank: num(c.rank),
    isSpell: c.isSpell || undefined,
    limited: c.limited || undefined,
    voieName: str(voieName),
});
```

- [ ] **Step 5 : Écrire l'adaptateur homebrew**

Créer `app/src/components/sheets/adapters/fromHomebrew.ts` :

```ts
import type { HomebrewEntry } from '../../../services/homebrewService';
import type { RaceSheetVM, ProfileSheetVM, VoieSheetVM, CapaciteSheetVM } from '../types';

/**
 * Projection de `entry.data` (JSON libre, clés définies par services/homebrewSchemas.ts)
 * vers les view-models. Toute valeur vide devient `undefined` pour que la feuille
 * masque la section correspondante.
 */
const d = (e: HomebrewEntry): Record<string, unknown> => (e.data ?? {}) as Record<string, unknown>;

const str = (v: unknown): string | undefined => {
    const s = typeof v === 'string' ? v.trim() : '';
    return s === '' ? undefined : s;
};
const num = (v: unknown): number | undefined => {
    const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
    return Number.isNaN(n) ? undefined : n;
};
const bool = (v: unknown): boolean | undefined => (v === true ? true : undefined);
const list = (v: unknown): string[] | undefined => {
    if (Array.isArray(v)) {
        const out = v.map(x => (typeof x === 'string' ? x.trim() : String(x))).filter(Boolean);
        return out.length ? out : undefined;
    }
    const s = str(v);
    return s ? s.split('\n').map(l => l.trim()).filter(Boolean) : undefined;
};
const caracs = (v: unknown): Record<string, number> | undefined => {
    if (!v || typeof v !== 'object') return undefined;
    const out: Record<string, number> = {};
    for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
        const n = num(raw);
        if (n !== undefined && n !== 0) out[k] = n;
    }
    return Object.keys(out).length ? out : undefined;
};

export const homebrewToRaceVM = (e: HomebrewEntry): RaceSheetVM => {
    const data = d(e);
    return {
        name: e.name,
        description: str(e.description),
        image: str(data.image),
        modifiers: caracs(data.modifiers),
        speed: str(data.speed),
        minHeight: num(data.minHeight),
        maxHeight: num(data.maxHeight),
        minWeight: num(data.minWeight),
        maxWeight: num(data.maxWeight),
        startingAge: num(data.startingAge),
        lifeExpectancy: num(data.lifeExpectancy),
        abilities: str(data.abilities),
        physicalTraits: str(data.physicalTraits),
        publicPerception: str(data.publicPerception),
        roleplay: str(data.roleplay),
        typicalNames: str(data.typicalNames),
        detailedDescription: str(data.detailedDescription),
    };
};

export const homebrewToProfileVM = (e: HomebrewEntry): ProfileSheetVM => {
    const data = d(e);
    return {
        name: e.name,
        description: str(e.description),
        image: str(data.image),
        family: str(data.family),
        magicStat: str(data.magicStat),
        armorMaxDef: num(data.armorMaxDef),
        stats: caracs(data.stats),
        weaponsAuth: list(data.weaponsAuth),
        armorAuth: list(data.armorAuth),
        startingEquipment: list(data.startingEquipment),
        masteries: list(data.masteries),
        note: str(data.note),
        lore: list(data.lore),
    };
};

export const homebrewToVoieVM = (e: HomebrewEntry): VoieSheetVM => {
    const data = d(e);
    return {
        name: e.name,
        description: str(e.description),
        category: str(data.category),
        maxRank: num(data.maxRank),
        capabilities: list(data.details)?.map(l => ({ name: l })),
    };
};

export const homebrewToCapaciteVM = (e: HomebrewEntry): CapaciteSheetVM => {
    const data = d(e);
    return {
        name: e.name,
        description: str(e.description),
        rank: num(data.rank),
        actionType: str(data.actionType),
        isSpell: e.category === 'sort' ? true : bool(data.isSpell),
        limited: bool(data.limited),
        effect: list(data.effect),
        details: list(data.details),
    };
};
```

- [ ] **Step 6 : Lancer les tests pour vérifier le succès**

```bash
docker compose exec -T frontend npx vitest run src/components/sheets/adapters/adapters.test.ts
```

Attendu : les 8 tests passent.

- [ ] **Step 7 : Portes complètes**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/components/sheets
docker compose exec -T frontend npx vitest run
```

Attendu : `tsc` sans sortie, `eslint` sans erreur, 170 tests verts (162 + 8).

- [ ] **Step 8 : Commit**

```bash
git add app/src/components/sheets
git commit -m "feat(sheets): view-models et adaptateurs officiel/homebrew"
```

---

## Task 3 : `RaceSheet` et bascule des deux pages

**Files:**
- Create: `app/src/components/sheets/RaceSheet.tsx`
- Create: `app/src/components/sheets/index.ts`
- Modify: `app/src/pages/RaceDetail.tsx`
- Modify: `app/src/pages/HomebrewDetail.tsx`

**Interfaces:**
- Consumes: `RaceSheetVM` (`sheets/types.ts`), `raceToVM` (`adapters/fromOfficial.ts`), `homebrewToRaceVM` (`adapters/fromHomebrew.ts`).
- Produces: `RaceSheet` — signature `({ vm, backTo, backLabel, header }: { vm: RaceSheetVM; backTo?: string; backLabel?: string; header?: React.ReactNode }) => JSX.Element`. `header` reçoit le bandeau propriétaire en Task 6.

- [ ] **Step 1 : Capturer l'état actuel de la page officielle**

Avant toute modification, capturer `/races/<id>` d'une race officielle en desktop et mobile — ces images servent de référence avant/après.

```bash
# le script Playwright se connecte puis navigue vers la première race listée
# et enregistre ref_race_desktop.png / ref_race_mobile.png
```

- [ ] **Step 2 : Créer la feuille en déplaçant le JSX tel quel**

Créer `app/src/components/sheets/RaceSheet.tsx`. Le JSX est repris **sans retouche de style** de `RaceDetail.tsx` (héros masqué, grille 12 colonnes, portrait, statistiques vitales, onglets lore/règles), avec deux différences : il lit `vm` au lieu de `race`, et chaque section est conditionnée par la présence de sa donnée.

```tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { RaceSheetVM } from './types';

interface RaceSheetProps {
    vm: RaceSheetVM;
    backTo?: string;
    backLabel?: string;
    /** Bandeau propriétaire (contenu communautaire uniquement). */
    header?: React.ReactNode;
}

/** Image générique (initiale) quand aucune illustration n'est fournie. */
const placeholder = (name: string) =>
    `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="533"%3E%3Crect fill="%23292524" width="400" height="533"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="160" fill="%23f59e0b"%3E${name.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;

export const RaceSheet: React.FC<RaceSheetProps> = ({ vm, backTo, backLabel, header }) => {
    const [activeTab, setActiveTab] = useState<'lore' | 'rules'>('lore');
    const image = vm.image ?? placeholder(vm.name);
    const hasVitals = [vm.startingAge, vm.lifeExpectancy, vm.minHeight, vm.minWeight, vm.speed].some(v => v !== undefined);
    const hasLore = [vm.description, vm.detailedDescription, vm.physicalTraits, vm.publicPerception, vm.roleplay, vm.typicalNames].some(v => v !== undefined);
    const hasRules = vm.abilities !== undefined || vm.modifiers !== undefined || (vm.voies?.length ?? 0) > 0;

    return (
        <div className="min-h-screen pb-12 relative">
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
                <img src={image} alt={vm.name} className="w-full h-full object-cover object-top opacity-30" />
            </div>

            <div className="container mx-auto px-4 relative z-10 pt-6">
                <div className="mb-8">
                    {backTo && (
                        <Link to={backTo} className="inline-flex items-center text-stone-400 hover:text-white transition-colors group mb-6">
                            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-display font-medium tracking-wide text-sm uppercase">{backLabel}</span>
                        </Link>
                    )}
                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white drop-shadow-xl">{vm.name}</h1>
                    {header}
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                            <div className="aspect-[3/4] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-60 z-10"></div>
                                <img src={image} alt={vm.name} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                            </div>
                        </div>

                        {hasVitals && (
                            <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl">
                                <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-stone-700"></span>
                                    Statistiques Vitales
                                </h3>
                                <div className="space-y-4">
                                    {vm.startingAge !== undefined && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <span className="text-stone-400">Âge de départ</span>
                                            <span className="font-display text-xl text-primary-200">{vm.startingAge} ans</span>
                                        </div>
                                    )}
                                    {vm.lifeExpectancy !== undefined && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <span className="text-stone-400">Espérance de vie</span>
                                            <span className="font-display text-xl text-primary-200">{vm.lifeExpectancy} ans</span>
                                        </div>
                                    )}
                                    {vm.minHeight !== undefined && vm.maxHeight !== undefined && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <span className="text-stone-400">Taille</span>
                                            <span className="font-display text-xl text-primary-200">{vm.minHeight / 100}m - {vm.maxHeight / 100}m</span>
                                        </div>
                                    )}
                                    {vm.minWeight !== undefined && vm.maxWeight !== undefined && (
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <span className="text-stone-400">Poids</span>
                                            <span className="font-display text-xl text-primary-200">{vm.minWeight} - {vm.maxWeight} kg</span>
                                        </div>
                                    )}
                                    {vm.speed !== undefined && (
                                        <div className="flex justify-between items-center pb-2">
                                            <span className="text-stone-400">Vitesse</span>
                                            <span className="font-display text-xl text-primary-200">{vm.speed}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-8">
                        {hasLore && hasRules && (
                            <div className="flex items-center gap-8 border-b border-white/10 mb-8 px-2">
                                {(['lore', 'rules'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 text-lg font-display font-bold tracking-wide transition-all relative ${activeTab === tab ? 'text-white' : 'text-stone-500 hover:text-stone-300'}`}
                                    >
                                        {tab === 'lore' ? 'Légendes & Culture' : 'Règles & Capacités'}
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {hasLore && (!hasRules || activeTab === 'lore') && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {(vm.description || vm.detailedDescription) && (
                                    <div className="prose prose-invert prose-lg max-w-none">
                                        <div className="bg-gradient-to-b from-white/5 to-transparent p-8 rounded-2xl border border-white/5">
                                            {vm.description && <p className="lead text-xl text-primary-100 not-italic mb-6 leading-relaxed">{vm.description}</p>}
                                            {vm.detailedDescription && <p className="text-stone-300">{vm.detailedDescription}</p>}
                                        </div>
                                    </div>
                                )}
                                {vm.physicalTraits && (
                                    <div className="bg-stone-900/60 p-8 rounded-2xl border border-white/5">
                                        <h3 className="text-xl font-display font-bold text-white mb-4">Traits Physiques</h3>
                                        <p className="text-stone-300 leading-relaxed">{vm.physicalTraits}</p>
                                    </div>
                                )}
                                <div className="space-y-6">
                                    {vm.publicPerception && (
                                        <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                                            <h4 className="text-primary-400 font-bold mb-3 uppercase text-sm tracking-wider">Réputation</h4>
                                            <p className="text-stone-400 text-sm italic">"{vm.publicPerception}"</p>
                                        </div>
                                    )}
                                    {vm.roleplay && (
                                        <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                                            <h4 className="text-primary-400 font-bold mb-3 uppercase text-sm tracking-wider">Interprétation</h4>
                                            <p className="text-stone-400 text-sm italic">"{vm.roleplay}"</p>
                                        </div>
                                    )}
                                    {vm.typicalNames && (
                                        <div className="bg-stone-900/40 p-6 rounded-xl border border-white/5">
                                            <h4 className="text-stone-500 font-bold mb-3 uppercase text-sm tracking-wider flex items-center gap-2">
                                                <span className="w-8 h-[1px] bg-stone-700"></span>
                                                Noms Typiques
                                            </h4>
                                            <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line">{vm.typicalNames}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {hasRules && (!hasLore || activeTab === 'rules') && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="relative">
                                    <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                        <div className="size-2 rounded-full bg-primary-500/50"></div>
                                        Traits Raciaux
                                    </h3>
                                    <div className="bg-stone-900/60 rounded-2xl p-8 border border-white/5 relative overflow-hidden backdrop-blur-sm">
                                        {vm.modifiers && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-3">Caractéristiques</h4>
                                                <div className="flex flex-wrap gap-3">
                                                    {Object.entries(vm.modifiers).map(([stat, value]) => (
                                                        <div key={stat} className="px-4 py-2 rounded-lg bg-primary-600/20 border border-primary-500/30 text-primary-100 font-mono text-sm flex items-center gap-2">
                                                            <span className={`font-bold ${value > 0 ? 'text-primary-300' : 'text-red-300'}`}>
                                                                {value > 0 ? '+' : ''}{value}
                                                            </span>
                                                            <span className="uppercase tracking-wider opacity-90">{stat}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute top-0 right-0 p-32 bg-primary-900/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                        {vm.abilities && (
                                            <p className="text-stone-300 leading-relaxed whitespace-pre-line relative z-10 text-lg">{vm.abilities}</p>
                                        )}
                                    </div>
                                </div>

                                {vm.voies && vm.voies.length > 0 && (
                                    <div className="relative">
                                        <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                            <div className="size-2 rounded-full bg-primary-500/50"></div>
                                            Voies & Évolution
                                        </h3>
                                        <div className="space-y-4">
                                            {vm.voies.map(v => (
                                                <div key={v.name} className="flex items-baseline gap-4 border-b border-white/10 pb-4">
                                                    {v.id ? (
                                                        <Link to={`/voies/${v.id}`} className="text-3xl font-display font-bold text-primary-200 hover:text-primary-100 transition-colors">{v.name}</Link>
                                                    ) : (
                                                        <span className="text-3xl font-display font-bold text-primary-200">{v.name}</span>
                                                    )}
                                                    <span className="text-stone-500 text-sm font-mono uppercase tracking-wider">Voie Raciale</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
```

Créer `app/src/components/sheets/index.ts` :

```ts
export { RaceSheet } from './RaceSheet';
export type { RaceSheetVM, ProfileSheetVM, VoieSheetVM, CapaciteSheetVM } from './types';
```

- [ ] **Step 3 : Basculer la page officielle**

Dans `RaceDetail.tsx`, remplacer tout le `return (...)` (lignes 91 à 367) par un rendu de la feuille, en conservant le chargement existant (`race`, `raceVoies`, `raceCapacities`) :

```tsx
    return (
        <RaceSheet
            vm={raceToVM(race, raceVoies)}
            backTo="/races"
            backLabel="Retour aux Races"
        />
    );
```

Ajouter les imports `import { RaceSheet } from '../components/sheets';` et `import { raceToVM } from '../components/sheets/adapters/fromOfficial';`, puis retirer les imports devenus inutiles (`ArrowLeft`, `DynamicDetailsRenderer` si plus référencés — `tsc` les signalera).

- [ ] **Step 4 : Brancher la fiche communautaire**

Dans `HomebrewDetail.tsx`, avant le rendu générique existant, aiguiller la catégorie `race` :

```tsx
    if (entry.category === 'race') {
        return <RaceSheet vm={homebrewToRaceVM(entry)} backTo="/races" backLabel="Retour aux Races" />;
    }
```

- [ ] **Step 5 : Portes**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/components/sheets src/pages/RaceDetail.tsx src/pages/HomebrewDetail.tsx
docker compose exec -T frontend npx vitest run
```

Attendu : `tsc` sans sortie, `eslint` sans nouvelle erreur, 170 tests verts.

- [ ] **Step 6 : Vérification visuelle**

Trois contrôles Playwright, desktop et mobile :
1. `/races/<id>` officielle — comparer aux captures de référence de l'étape 1 : rendu identique.
2. `/homebrew/<id>` d'une race communautaire complète (« Ondins des profondeurs ») — même structure que l'officielle.
3. `/homebrew/<id>` d'une race quasi vide — aucune section vide, aucun onglet orphelin, pas de crash.

Attendu à chaque fois : 0 débordement horizontal, 0 erreur console.

- [ ] **Step 7 : Commit**

```bash
git add app/src/components/sheets app/src/pages/RaceDetail.tsx app/src/pages/HomebrewDetail.tsx
git commit -m "feat(sheets): RaceSheet partagée entre race officielle et communautaire"
```

---

## Task 4 : `ProfileSheet` et bascule des deux pages

**Files:**
- Create: `app/src/components/sheets/ProfileSheet.tsx`
- Modify: `app/src/components/sheets/index.ts`
- Modify: `app/src/pages/ClassDetail.tsx`
- Modify: `app/src/pages/HomebrewDetail.tsx`

**Interfaces:**
- Consumes: `ProfileSheetVM`, `profileToVM`, `homebrewToProfileVM`.
- Produces: `ProfileSheet` — signature `({ vm, backTo, backLabel, header }: { vm: ProfileSheetVM; backTo?: string; backLabel?: string; header?: React.ReactNode }) => JSX.Element`.

- [ ] **Step 1 : Capturer l'état actuel de `ClassDetail`**

Captures desktop et mobile d'une classe officielle, avant modification.

- [ ] **Step 2 : Lire la page à extraire**

Ouvrir `app/src/pages/ClassDetail.tsx` et relever : la structure du héros, les panneaux (dé de vie, caractéristique de magie, DEF max d'armure, stats de départ), les listes (armes/armures autorisées, équipement de départ, maîtrises) et la section voies. Le JSX est déplacé **tel quel**, seules les sources de données changent (`vm.*`) et chaque bloc est conditionné par `vm.<champ> !== undefined`.

- [ ] **Step 3 : Créer `ProfileSheet.tsx`**

Le composant suit exactement le patron de `RaceSheet` : props `{ vm, backTo, backLabel, header }`, image de secours via placeholder à l'initiale, drapeaux de présence (`hasStats`, `hasLists`, `hasLore`) calculés avant le rendu, aucune section rendue sans donnée, `header` inséré sous le titre. Les listes (`weaponsAuth`, `armorAuth`, `startingEquipment`, `masteries`, `lore`) sont rendues en `<ul>` uniquement si le tableau est présent.

Exporter dans `index.ts` :

```ts
export { ProfileSheet } from './ProfileSheet';
```

- [ ] **Step 4 : Basculer `ClassDetail` puis `HomebrewDetail`**

`ClassDetail` : conserver le chargement, remplacer le rendu par

```tsx
    return <ProfileSheet vm={profileToVM(profile, profileVoies)} backTo="/classes" backLabel="Retour aux Classes" />;
```

`HomebrewDetail` : ajouter l'aiguillage

```tsx
    if (entry.category === 'classe') {
        return <ProfileSheet vm={homebrewToProfileVM(entry)} backTo="/classes" backLabel="Retour aux Classes" />;
    }
```

- [ ] **Step 5 : Portes**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/components/sheets src/pages/ClassDetail.tsx src/pages/HomebrewDetail.tsx
docker compose exec -T frontend npx vitest run
```

- [ ] **Step 6 : Vérification visuelle**

Mêmes trois contrôles que la tâche 3, sur `/classes/<id>` officielle, une classe communautaire complète (« Berserker totémique ») et une classe quasi vide.

- [ ] **Step 7 : Commit**

```bash
git add app/src/components/sheets app/src/pages/ClassDetail.tsx app/src/pages/HomebrewDetail.tsx
git commit -m "feat(sheets): ProfileSheet partagée entre classe officielle et communautaire"
```

---

## Task 5 : `VoieSheet` et `CapaciteSheet`

**Files:**
- Create: `app/src/components/sheets/VoieSheet.tsx`
- Create: `app/src/components/sheets/CapaciteSheet.tsx`
- Modify: `app/src/components/sheets/index.ts`
- Modify: `app/src/pages/VoieDetail.tsx`
- Modify: `app/src/pages/CapaciteDetail.tsx`
- Modify: `app/src/pages/HomebrewDetail.tsx`

**Interfaces:**
- Consumes: `VoieSheetVM`, `CapaciteSheetVM`, `voieToVM`, `capacityToVM`, `homebrewToVoieVM`, `homebrewToCapaciteVM`.
- Produces: `VoieSheet` et `CapaciteSheet`, mêmes props que les feuilles précédentes (`{ vm, backTo, backLabel, header }`).

- [ ] **Step 1 : Captures de référence**

Desktop et mobile pour `/voies/<id>` et `/capacites/<id>` officielles.

- [ ] **Step 2 : Créer `VoieSheet.tsx`**

JSX déplacé depuis `VoieDetail.tsx`. Points spécifiques : la liste des capacités est rendue depuis `vm.capabilities` (déjà triée par rang par l'adaptateur), chaque entrée affichant la pastille de rang uniquement si `rank !== undefined` ; la section entière est masquée si `capabilities` est absent — cas fréquent d'une voie communautaire (l'adaptateur homebrew ne produit que des noms, sans rang, tant que la création imbriquée n'existe pas, chantier 3).

- [ ] **Step 3 : Créer `CapaciteSheet.tsx`**

JSX déplacé depuis `CapaciteDetail.tsx`. Les badges `isSpell` et `limited` ne sont rendus que si `true` ; `effect` et `details` en listes, masquées si absentes ; le lien vers la voie n'apparaît que si `voieName` est défini.

Exporter les deux dans `index.ts` :

```ts
export { VoieSheet } from './VoieSheet';
export { CapaciteSheet } from './CapaciteSheet';
```

- [ ] **Step 4 : Basculer les trois pages**

`VoieDetail` :

```tsx
    return <VoieSheet vm={voieToVM(voie, capacities)} backTo="/voies" backLabel="Retour aux Voies" />;
```

`CapaciteDetail` :

```tsx
    return <CapaciteSheet vm={capacityToVM(capacity, voie?.name)} backTo="/capacites" backLabel="Retour aux Capacités" />;
```

`HomebrewDetail` :

```tsx
    if (entry.category === 'voie') {
        return <VoieSheet vm={homebrewToVoieVM(entry)} backTo="/voies" backLabel="Retour aux Voies" />;
    }
    if (entry.category === 'capacite' || entry.category === 'sort') {
        return <CapaciteSheet vm={homebrewToCapaciteVM(entry)} backTo="/capacites" backLabel="Retour aux Capacités" />;
    }
```

- [ ] **Step 5 : Portes**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/components/sheets src/pages/VoieDetail.tsx src/pages/CapaciteDetail.tsx src/pages/HomebrewDetail.tsx
docker compose exec -T frontend npx vitest run
```

- [ ] **Step 6 : Vérification visuelle**

Officiel vs communautaire pour une voie (« Voie de l'Ours ») et une capacité (« Pas de brume »), plus le cas d'une voie sans capacité.

- [ ] **Step 7 : Commit**

```bash
git add app/src/components/sheets app/src/pages/VoieDetail.tsx app/src/pages/CapaciteDetail.tsx app/src/pages/HomebrewDetail.tsx
git commit -m "feat(sheets): VoieSheet et CapaciteSheet partagées"
```

---

## Task 6 : `OwnerBar` — le seul delta communautaire

**Files:**
- Create: `app/src/components/sheets/OwnerBar.tsx`
- Modify: `app/src/components/sheets/index.ts`
- Modify: `app/src/pages/HomebrewDetail.tsx`

**Interfaces:**
- Consumes: `AuthorTag` de `app/src/components/common` — signature `{ pseudo?: string | null; visibility?: 'public' | 'private'; size?: 'sm' | 'md' }`.
- Produces: `OwnerBar` — signature `({ pseudo, visibility, mine, duplicating, onEdit, onDelete, onDuplicate }: { pseudo?: string | null; visibility?: 'public' | 'private'; mine: boolean; duplicating?: boolean; onEdit?: () => void; onDelete?: () => void; onDuplicate?: () => void }) => JSX.Element`.

- [ ] **Step 1 : Créer le composant**

```tsx
import React from 'react';
import { Edit, Trash2, Copy } from 'lucide-react';
import { AuthorTag } from '../common';

interface OwnerBarProps {
    pseudo?: string | null;
    visibility?: 'public' | 'private';
    mine: boolean;
    duplicating?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
}

/**
 * Bandeau propriétaire : unique différence visuelle admise entre une fiche officielle
 * et une fiche communautaire. Toute autre divergence doit être refusée en revue.
 */
export const OwnerBar: React.FC<OwnerBarProps> = ({ pseudo, visibility, mine, duplicating, onEdit, onDelete, onDuplicate }) => (
    <div className="mt-4 flex flex-wrap items-center gap-3 glass-panel rounded-xl border border-white/5 px-4 py-2.5">
        <AuthorTag pseudo={pseudo} visibility={visibility} size="md" />
        <div className="flex items-center gap-2 ml-auto">
            {/* Un bouton n'est rendu que si son gestionnaire existe : pas d'action morte. */}
            {mine && onEdit && (
                <button onClick={onEdit} className="flex items-center gap-1.5 text-xs font-bold uppercase text-stone-400 hover:text-primary-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                    <Edit size={14} /> Modifier
                </button>
            )}
            {mine && onDelete && (
                <button onClick={onDelete} className="flex items-center gap-1.5 text-xs font-bold uppercase text-stone-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                    <Trash2 size={14} /> Supprimer
                </button>
            )}
            {!mine && onDuplicate && (
                <button onClick={onDuplicate} disabled={duplicating} className="flex items-center gap-1.5 text-xs font-bold uppercase text-stone-400 hover:text-primary-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50">
                    <Copy size={14} /> {duplicating ? 'Copie…' : 'Dupliquer chez moi'}
                </button>
            )}
        </div>
    </div>
);
```

Exporter dans `index.ts` :

```ts
export { OwnerBar } from './OwnerBar';
```

- [ ] **Step 2 : Poser le bandeau sur les 4 aiguillages**

Dans `HomebrewDetail.tsx`, construire le bandeau une fois et le passer en `header` à chaque feuille.

**Décision de périmètre :** on câble *Dupliquer* (contenu d'autrui) et *Supprimer* (mes créations, avec confirmation puis retour à la liste de la catégorie). *Modifier* n'est **pas** câblé ici : le formulaire d'édition vit dans la modale de `HomebrewBrowser` et sa refonte est l'objet du chantier 2. `OwnerBar` ne rendant un bouton que si son gestionnaire existe, aucune action morte n'apparaît. `handleDuplicate` et `handleDelete` sont écrits dans `HomebrewDetail` sur le modèle de ceux de `HomebrewBrowser` (`HomebrewService.create` avec `name: \`${entry.name} (copie)\`` et `visibility: 'private'` ; `HomebrewService.remove(entry.id)` après `confirm()`), suivis d'un `navigate(...)` vers la page de la catégorie.

```tsx
    const ownerBar = (
        <OwnerBar
            pseudo={entry.authorPseudo}
            visibility={entry.visibility}
            mine={entry.authorId === user?.id}
            duplicating={duplicating}
            onDuplicate={entry.authorId === user?.id ? undefined : handleDuplicate}
            onDelete={entry.authorId === user?.id ? handleDelete : undefined}
        />
    );

    if (entry.category === 'race') {
        return <RaceSheet vm={homebrewToRaceVM(entry)} backTo="/races" backLabel="Retour aux Races" header={ownerBar} />;
    }
```

Faire de même pour `classe`, `voie`, `capacite`/`sort`.

- [ ] **Step 3 : Portes**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/components/sheets src/pages/HomebrewDetail.tsx
docker compose exec -T frontend npx vitest run
```

- [ ] **Step 4 : Audit visuel final**

Pour les 4 catégories (race, classe, voie, capacité), capturer côte à côte officiel et communautaire, desktop et mobile. Vérifier que la **seule** différence est le bandeau propriétaire. Vérifier également qu'une fiche de créature (`/bestiary/<id>` vs créature communautaire) présente le même rapport.

- [ ] **Step 5 : Commit**

```bash
git add app/src/components/sheets app/src/pages/HomebrewDetail.tsx
git commit -m "feat(sheets): OwnerBar, unique delta des fiches communautaires"
```

---

## Vérification finale

Après la tâche 6, relancer sur les 5 catégories iso, desktop et mobile :

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src
docker compose exec -T frontend npx vitest run
```

Attendu : `tsc` sans sortie ; `eslint` sans **nouvelle** erreur par rapport au fond pré-existant (~49) ; 170 tests verts ; 0 débordement horizontal et 0 erreur console sur toutes les fiches vérifiées.
