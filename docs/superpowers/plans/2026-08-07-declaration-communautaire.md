# Déclaration communautaire des états et invocations — plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE — utiliser superpowers:subagent-driven-development
> (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes
> utilisent la syntaxe à cases (`- [ ]`).

**But :** une capacité créée par un utilisateur peut déclarer les états qu'elle inflige et les
entités qu'elle invoque, et les affiche comme le fait une capacité officielle.

**Architecture :** deux types de champ (`etats`, `invocations`) dans le schéma piloté par
données ; les listes d'entités viennent de la page par une prop facultative, jamais du champ ;
l'affichage réutilise `CapabilityRefs`, déjà partagé avec la fiche de créature et le suivi de
combat.

**Pile :** React 19 + TypeScript + Vite, Tailwind v4 (thème CSS dans `src/index.css`, **pas** de
`tailwind.config.js`), Vitest.

## Contraintes globales

- **Code, commentaires et messages de commit en français**, conventionnels.
- **Contrat de dégradation propre :** un champ absent vaut `undefined` — jamais `null`, `""`,
  `0`, tableau ou objet vide. Une section sans donnée n'est pas rendue.
- **La valeur `0` est légitime**, jamais « vide ».
- **`required` est explicite**, jamais déduit — contrat établi au chantier des formulaires.
- **Une entité se choisit, elle ne se crée jamais** depuis ce formulaire.
- **Un champ présent dans un modèle et couvert par un test unitaire ne prouve rien sur son
  affichage.** Tout rendu se vérifie dans le DOM.
- **Tests de rendu :** environnement déclaré par fichier via `// @vitest-environment jsdom` ;
  `globals: true` n'est pas activé — importer explicitement `describe`/`it`/`expect`/`vi` depuis
  `vitest`, et appeler explicitement `afterEach(cleanup)`.
- **Portes, dans le conteneur** (le `node_modules` de l'hôte est incomplet), depuis la racine :
  ```
  docker compose exec -T frontend sh -lc 'npx vitest run'
  docker compose exec -T frontend sh -lc 'npx tsc -b'
  docker compose exec -T frontend sh -lc 'npx eslint .'
  ```
  Référence : **341 tests verts**, `tsc` propre, **46 problèmes eslint préexistants**. La porte
  est « aucune erreur **nouvelle** ».
- **L'API tourne sur le port 8001**, pas 8000 : le 8000 est occupé par un autre service et le
  front pointe sur 8001. Application `http://localhost:5173`, compte `nauno40@gmail.com` /
  `chroniques`, connexion par `POST /api/login_check` avec la clé **`email`**.
- **Commiter au fil de l'eau.** Ne pas pousser, ne pas créer de branche.
- **`HomebrewData` (`HomebrewFields.tsx:151`) n'est plus consommé nulle part** — vérifié par
  recherche. Ne pas l'étendre ; ne pas le supprimer non plus, ce serait hors périmètre.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `app/src/services/homebrewSchemas.ts` *(modifié)* | Deux types de champ, deux entrées au schéma `capacite` |
| `app/src/services/homebrewSchemas.test.ts` *(créé ou modifié)* | L'élagage conserve les deux clés |
| `app/src/components/homebrew/HomebrewFields.tsx` *(modifié)* | Prop `references`, rendu des deux champs |
| `app/src/components/homebrew/HomebrewFields.test.tsx` *(modifié)* | Leur test de rendu |
| `app/src/components/homebrew/CapabilityBlocks.tsx` *(modifié)* | Relaie `references` aux capacités d'une voie |
| `app/src/pages/HomebrewForm.tsx` *(modifié)* | Charge les références une fois et les transmet |
| `app/src/components/sheets/types.ts` *(modifié)* | `states`/`summons` sur les deux view-models |
| `app/src/components/sheets/adapters/fromHomebrew.ts` *(modifié)* | Les reporte depuis `data` |
| `app/src/components/sheets/{VoieSheet,CapaciteSheet}.tsx` *(modifiés)* | Prop `references`, rendu via `CapabilityRefs` |
| `app/src/pages/HomebrewDetail.tsx` *(modifié)* | Charge les références et les passe aux feuilles |

---

### Task 1 : Types de champ et schéma

**Files:**
- Modifier : `app/src/services/homebrewSchemas.ts`
- Modifier : `app/src/services/homebrewValidation.test.ts`

**Interfaces:**
- Consomme : `CapabilitySummon` (`app/src/types/normalized.ts`), déjà défini —
  `{ type: 'creature' | 'item'; ref: string; quantity?: number }`.
- Produit : `HomebrewFieldType` élargi de `'etats' | 'invocations'` ; deux entrées dans
  `HOMEBREW_SCHEMAS.capacite`, de clés `states` et `summons`.

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

Ajouter à `app/src/services/homebrewValidation.test.ts` :

```ts
describe('déclarations d’une capacité communautaire', () => {
    it('conserve states et summons à l’élagage', () => {
        // Sans entrée de schéma, pruneToSchema effacerait les deux clés à l'enregistrement.
        const data = {
            rank: 1, actionType: 'Attaque', effect: ['e'], details: ['d'],
            states: ['Renversé'],
            summons: [{ type: 'creature', ref: 'Loup', quantity: 2 }],
        };
        const elague = pruneToSchema('capacite', data);
        expect(elague.states).toEqual(['Renversé']);
        expect(elague.summons).toEqual([{ type: 'creature', ref: 'Loup', quantity: 2 }]);
    });

    it('écarte une invocation dont l’entité n’a pas été choisie', () => {
        // Une ligne ajoutée puis laissée vide ne vaut rien et polluerait la donnée.
        const data = {
            rank: 1, actionType: 'Attaque', effect: ['e'], details: ['d'],
            summons: [{ type: 'creature', ref: '', quantity: 1 }, { type: 'creature', ref: 'Loup' }],
        };
        expect(pruneToSchema('capacite', data).summons).toEqual([{ type: 'creature', ref: 'Loup' }]);
    });

    it('n’exige ni états ni invocations', () => {
        // Déclarer est facultatif : la plupart des capacités n'infligent rien.
        const data = { rank: 1, actionType: 'Attaque', effect: ['e'], details: ['d'] };
        expect(validateHomebrew('capacite', 'Frappe', data)).toEqual([]);
    });
});
```

Vérifier que `pruneToSchema` est bien importé en tête du fichier ; l'ajouter à l'import
existant depuis `./homebrewSchemas` si nécessaire.

- [ ] **Étape 2 : lancer les tests pour vérifier qu'ils échouent**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/services/homebrewValidation.test.ts'
```
Attendu : ÉCHEC — `elague.states` vaut `undefined`.

- [ ] **Étape 3 : élargir le type et le schéma**

Dans `app/src/services/homebrewSchemas.ts`, ligne 7 :

```ts
export type HomebrewFieldType = 'text' | 'textarea' | 'number' | 'bool' | 'select' | 'caracs' | 'lines' | 'image' | 'etats' | 'invocations';
```

Puis, dans `pruneToSchema`, écarter les invocations incomplètes — c'est le seul endroit qui
connaît à la fois le type du champ et la valeur, et il s'applique aussi aux capacités
imbriquées d'une voie via `pruneChildren` :

```ts
    for (const f of schema) {
        if (data[f.key] === undefined) continue;
        // Une ligne d'invocation dont l'entité n'a pas été choisie ne désigne rien : la
        // conserver polluerait la donnée et produirait un lien mort à l'affichage.
        if (f.type === 'invocations' && Array.isArray(data[f.key])) {
            out[f.key] = (data[f.key] as { ref?: string }[]).filter(s => s.ref);
            continue;
        }
        out[f.key] = data[f.key];
    }
```

Puis, dans `HOMEBREW_SCHEMAS.capacite`, après l'entrée `details` :

```ts
        // Déclarations facultatives, de même forme que celles des capacités officielles
        // (colonnes `Capability.states` / `summons`) : `etatsDeclares` et
        // `resoudreInvocation` s'y appliquent sans adaptation.
        { key: 'states', label: 'États infligés', type: 'etats', required: false },
        { key: 'summons', label: 'Invocations', type: 'invocations', required: false },
```

- [ ] **Étape 4 : lancer les tests puis les portes complètes**

```
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
```
Attendu : tous verts, `tsc` muet, eslint toujours à 46 problèmes.

**Si `tsc` signale un `switch` non exhaustif** dans `HomebrewFields.tsx`, c'est attendu : les
deux nouveaux types n'y sont pas encore traités et la Task 2 s'en charge. Ne pas ajouter de cas
vide pour faire taire le compilateur — si l'erreur bloque, s'arrêter et le signaler.

- [ ] **Étape 5 : commiter**

```bash
git add app/src/services/homebrewSchemas.ts app/src/services/homebrewValidation.test.ts
git commit -m "feat(homebrew): une capacité peut déclarer états et invocations

Deux entrées facultatives au schéma capacite. Sans elles, pruneToSchema
effacerait les clés à l'enregistrement."
```

---

### Task 2 : Saisie des deux champs

**Files:**
- Modifier : `app/src/components/homebrew/HomebrewFields.tsx`
- Modifier : `app/src/components/homebrew/HomebrewFields.test.tsx`

**Interfaces:**
- Consomme : les deux types de champ (Task 1) ; `HarmfulState` (`app/src/types/normalized.ts`,
  `{ id, name, description, image }`) ; `SourcesInvocation` et `resoudreInvocation`
  (`app/src/domain/capabilityRefs.ts`) — `SourcesInvocation` vaut
  `{ creatures: Creature[]; monstresMaison: CustomCreature[]; armes: Weapon[]; armures: Armor[]; communautaire: HomebrewEntry[] }`.
- Produit : la prop `references?: { etats: HarmfulState[]; sources: SourcesInvocation }` sur
  `HomebrewFields`, consommée par les Tasks 3.

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

Ajouter à `app/src/components/homebrew/HomebrewFields.test.tsx` :

```tsx
const ETATS: HarmfulState[] = [
    { id: '1', name: 'Renversé', description: '', image: '' },
    { id: '2', name: 'Aveuglé', description: '', image: '' },
];
const loup = { id: 7, name: 'Loup' } as unknown as Creature;
const REFERENCES = {
    etats: ETATS,
    sources: { creatures: [loup], monstresMaison: [], armes: [], armures: [], communautaire: [] },
};
const SCHEMA_DECLARATIONS = [
    { key: 'states', label: 'États infligés', type: 'etats' as const, required: false },
    { key: 'summons', label: 'Invocations', type: 'invocations' as const, required: false },
];

describe('HomebrewFields — déclarations', () => {
    it('ne rend aucun des deux champs sans références', () => {
        // Mieux vaut ne rien proposer qu'un sélecteur vide.
        render(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={{}} onChange={() => {}} />);
        expect(screen.queryByText('États infligés')).toBeNull();
        expect(screen.queryByText('Invocations')).toBeNull();
    });

    it('coche un état et remonte son nom canonique', () => {
        let recu: Record<string, unknown> | null = null;
        render(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={{}} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.click(screen.getByText('Renversé'));
        expect(recu!.states).toEqual(['Renversé']);
    });

    it('décoche un état déjà choisi', () => {
        let recu: Record<string, unknown> | null = null;
        render(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={{ states: ['Renversé'] }} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.click(screen.getByText('Renversé'));
        expect(recu!.states).toEqual([]);
    });

    it('conserve l’ordre du compendium, pas celui des clics', () => {
        // Deux capacités identiques doivent produire la même donnée.
        let recu: Record<string, unknown> | null = null;
        render(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={{ states: ['Aveuglé'] }} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.click(screen.getByText('Renversé'));
        expect(recu!.states).toEqual(['Renversé', 'Aveuglé']);
    });

    it('ajoute une ligne d’invocation vide, puis la renseigne', () => {
        let recu: Record<string, unknown> | null = null;
        const { rerender } = render(
            <HomebrewFields schema={SCHEMA_DECLARATIONS} data={{}} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.click(screen.getByText('Ajouter une invocation'));
        expect(recu!.summons).toEqual([{ type: 'creature', ref: '', quantity: 1 }]);

        rerender(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={recu!} onChange={d => { recu = d; }} references={REFERENCES} />);
        const choixEntite = screen.getByLabelText('Entité invoquée');
        fireEvent.change(choixEntite, { target: { value: 'Loup' } });
        expect((recu!.summons as unknown[])[0]).toMatchObject({ type: 'creature', ref: 'Loup' });
    });

    it('retire une ligne d’invocation', () => {
        let recu: Record<string, unknown> | null = null;
        const data = { summons: [{ type: 'creature', ref: 'Loup', quantity: 1 }] };
        render(<HomebrewFields schema={SCHEMA_DECLARATIONS} data={data} onChange={d => { recu = d; }} references={REFERENCES} />);
        fireEvent.click(screen.getByLabelText('Retirer cette invocation'));
        expect(recu!.summons).toEqual([]);
    });
});
```

Compléter les imports du fichier de test : `HarmfulState` et `Creature` depuis
`../../types/normalized`, et `fireEvent` depuis `@testing-library/react` s'ils manquent.

- [ ] **Étape 2 : lancer les tests pour vérifier qu'ils échouent**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/components/homebrew/HomebrewFields.test.tsx'
```
Attendu : ÉCHEC — la prop `references` n'existe pas et les champs ne sont pas rendus.

- [ ] **Étape 3 : porter la prop jusqu'au champ**

Dans `app/src/components/homebrew/HomebrewFields.tsx`, ajouter la prop à `HomebrewFields` et la
transmettre à `FieldInput` :

```tsx
    /** Entités existantes nécessaires aux champs `etats` et `invocations`. Absente, ces
     *  deux champs ne sont pas rendus : mieux vaut ne rien proposer qu'un sélecteur vide.
     *  Chargée par la page, jamais par le champ — ce composant reste présentationnel. */
    references?: { etats: HarmfulState[]; sources: SourcesInvocation };
```

`FieldInput` reçoit `references` en prop supplémentaire et la passe aux deux nouveaux cas.

- [ ] **Étape 4 : écrire les deux composants de saisie**

Toujours dans le même fichier, à côté de `LinesInput` :

```tsx
/** Choix multiple fermé sur les états du compendium : aucune saisie libre, donc aucune
 *  orthographe à résoudre — la valeur enregistrée est toujours le nom canonique. */
const EtatsInput: React.FC<{
    label: string;
    value: string[];
    etats: HarmfulState[];
    onChange: (v: string[]) => void;
}> = ({ label, value, etats, onChange }) => (
    <div>
        <div className={labelCls}>{label}</div>
        <div className="flex flex-wrap gap-1.5">
            {etats.map(etat => {
                const choisi = value.includes(etat.name);
                return (
                    <button
                        key={etat.id}
                        type="button"
                        // L'ordre stocké est celui du compendium, pas celui des clics :
                        // deux capacités identiques doivent produire la même donnée.
                        onClick={() => onChange(
                            etats.map(e => e.name).filter(n => (n === etat.name ? !choisi : value.includes(n))),
                        )}
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border transition-colors ${
                            choisi
                                ? 'bg-purple-900/50 text-purple-200 border-purple-500/40'
                                : 'bg-stone-950 text-stone-500 border-white/10 hover:text-stone-300'
                        }`}
                    >
                        {etat.name}
                    </button>
                );
            })}
        </div>
    </div>
);

/** Lignes d'invocation. Une entité se CHOISIT parmi les existantes : rien ne se crée ici,
 *  ce qui ferme l'enchaînement sans fin de formulaires. */
const InvocationsInput: React.FC<{
    label: string;
    value: CapabilitySummon[];
    sources: SourcesInvocation;
    onChange: (v: CapabilitySummon[]) => void;
}> = ({ label, value, sources, onChange }) => {
    const nomsCreatures = [
        ...sources.creatures.map(c => c.name),
        ...sources.monstresMaison.map(m => `custom-${m.id}`),
    ];
    const nomsObjets = [
        ...sources.armes.map(a => a.name),
        ...sources.armures.map(a => a.name),
        ...sources.communautaire.map(e => `homebrew-${e.id}`),
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
                            {(invocation.type === 'creature' ? nomsCreatures : nomsObjets)
                                .map(n => <option key={n} value={n}>{n}</option>)}
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
                            className="p-1 text-stone-500 hover:text-red-400"
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
```

Puis les deux cas dans le `switch` de `FieldInput`, **avant** le cas par défaut :

```tsx
        case 'etats':
            if (!references) return null;
            return (
                <EtatsInput
                    label={field.label}
                    value={(value as string[]) ?? []}
                    etats={references.etats}
                    onChange={onChange}
                />
            );
        case 'invocations':
            if (!references) return null;
            return (
                <InvocationsInput
                    label={field.label}
                    value={(value as CapabilitySummon[]) ?? []}
                    sources={references.sources}
                    onChange={onChange}
                />
            );
```

Compléter les imports du fichier : `HarmfulState`, `CapabilitySummon` depuis
`../../types/normalized`, `SourcesInvocation` depuis `../../domain/capabilityRefs`. `Plus` et
`X` de `lucide-react` sont déjà importés.

- [ ] **Étape 5 : lancer les tests puis les portes, et commiter**

```bash
docker compose exec -T frontend sh -lc 'npx vitest run src/components/homebrew/HomebrewFields.test.tsx'
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
git add app/src/components/homebrew/HomebrewFields.tsx app/src/components/homebrew/HomebrewFields.test.tsx
git commit -m "feat(homebrew): saisie des états infligés et des invocations

Choix multiple fermé sur les états du compendium — aucune saisie libre, donc
aucune orthographe à résoudre. Les invocations désignent des entités existantes,
choisies et jamais créées depuis ce formulaire."
```

---

### Task 3 : Chargement et relais des références

**Files:**
- Modifier : `app/src/pages/HomebrewForm.tsx`
- Modifier : `app/src/components/homebrew/CapabilityBlocks.tsx`

**Interfaces:**
- Consomme : la prop `references` de `HomebrewFields` (Task 2) ; `SourcesInvocation`
  (`app/src/domain/capabilityRefs.ts`) ; `DataService.getStates`, `getCreatures`, `getWeapons`,
  `getArmors` (`app/src/services/dataService.ts`) ; `getMonsters`
  (`app/src/services/monsterService.ts`) ; `HomebrewService.getAll`
  (`app/src/services/homebrewService.ts`).
- Produit : rien que d'autres tâches consomment.

- [ ] **Étape 1 : charger les références dans le formulaire**

Dans `app/src/pages/HomebrewForm.tsx`, à côté des autres états locaux :

```tsx
    // Entités existantes proposées par les champs `etats` et `invocations`. Chargées une
    // fois par la page : le champ reste présentationnel. Un échec laisse la collection
    // vide, ce qui masque le champ concerné sans bloquer la saisie du reste.
    const [references, setReferences] = useState<{ etats: HarmfulState[]; sources: SourcesInvocation }>({
        etats: [],
        sources: { creatures: [], monstresMaison: [], armes: [], armures: [], communautaire: [] },
    });

    useEffect(() => {
        Promise.all([
            DataService.getStates().catch(() => []),
            DataService.getCreatures().catch(() => []),
            DataService.getWeapons().catch(() => []),
            DataService.getArmors().catch(() => []),
            getMonsters().catch(() => []),
            HomebrewService.getAll().catch(() => []),
        ]).then(([etats, creatures, armes, armures, monstresMaison, communautaire]) => {
            setReferences({ etats, sources: { creatures, monstresMaison, armes, armures, communautaire } });
        });
    }, []);
```

Compléter les imports : `DataService` depuis `../services/dataService`, `getMonsters` depuis
`../services/monsterService`, `HarmfulState` depuis `../types/normalized`, `SourcesInvocation`
depuis `../domain/capabilityRefs`. `HomebrewService` est déjà importé.

- [ ] **Étape 2 : transmettre aux deux points de saisie**

Toujours dans `HomebrewForm.tsx`, ajouter `references={references}` :

- au `<HomebrewFields …>` qui rend les champs de l'entrée elle-même ;
- au `<CapabilityBlocks …>` qui rend les capacités d'une voie.

Puis, dans `app/src/components/homebrew/CapabilityBlocks.tsx`, ajouter la prop et la relayer :

```tsx
    /** Relayée telle quelle aux champs d'une capacité : sans elle, une capacité saisie
     *  dans une voie n'aurait pas les mêmes champs qu'une capacité autonome. */
    references?: { etats: HarmfulState[]; sources: SourcesInvocation };
```

et sur le `<HomebrewFields …>` interne : `references={references}`.

- [ ] **Étape 3 : lancer les portes complètes**

```
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
```
Attendu : tous verts, `tsc` muet, eslint toujours à 46 problèmes.

- [ ] **Étape 4 : vérifier à la main dans le navigateur**

Ouvrir `http://localhost:5173/bibliotheque/nouveau/capacite`, vérifier que « États infligés »
propose les 8 pastilles et que « Ajouter une invocation » produit une ligne dont le second
sélecteur liste des créatures. Puis ouvrir `/bibliotheque/nouveau/voie`, ajouter une capacité,
et vérifier que **son bloc porte les mêmes deux champs** — c'est le point que le relais assure.

- [ ] **Étape 5 : commiter**

```bash
git add app/src/pages/HomebrewForm.tsx app/src/components/homebrew/CapabilityBlocks.tsx
git commit -m "feat(homebrew): le formulaire fournit les entités aux champs de déclaration

Chargement unique par la page, relayé aux capacités imbriquées d'une voie pour
qu'elles offrent les mêmes champs qu'une capacité autonome."
```

---

### Task 4 : Affichage sur les feuilles

**Files:**
- Modifier : `app/src/components/sheets/types.ts`
- Modifier : `app/src/components/sheets/adapters/fromHomebrew.ts`
- Modifier : `app/src/components/sheets/CapaciteSheet.tsx`
- Modifier : `app/src/components/sheets/VoieSheet.tsx`
- Modifier : `app/src/pages/HomebrewDetail.tsx`
- Modifier : `app/src/components/sheets/adapters/adapters.test.ts`

**Interfaces:**
- Consomme : `CapabilityRefs` (`app/src/components/creature/CapabilityRefs.tsx`), de signature
  `({ capacite, etatsConnus, sources, onEtat })` où `capacite` est un
  `CustomCreatureCapability` (`{ name?, label?, description?, rank?, states?, summons? }`).
- Produit : `states`/`summons` sur `SheetCapabilityRef` et `CapaciteSheetVM` ; prop facultative
  `references` sur `VoieSheet` et `CapaciteSheet`.

- [ ] **Étape 1 : écrire le test d'adaptateur (il doit échouer)**

Ajouter à `app/src/components/sheets/adapters/adapters.test.ts` :

```ts
it('reporte les déclarations d’une capacité communautaire', () => {
    const entree = {
        id: 5, category: 'capacite', name: 'Souffle',
        data: {
            rank: 1,
            states: ['Renversé'],
            summons: [{ type: 'creature', ref: 'Loup', quantity: 2 }],
        },
    } as unknown as HomebrewEntry;
    const vm = homebrewToCapaciteVM(entree);
    expect(vm.states).toEqual(['Renversé']);
    expect(vm.summons).toEqual([{ type: 'creature', ref: 'Loup', quantity: 2 }]);
});
```

- [ ] **Étape 2 : lancer le test pour vérifier qu'il échoue**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/components/sheets/adapters/adapters.test.ts'
```
Attendu : ÉCHEC — `vm.states` vaut `undefined`.

- [ ] **Étape 3 : porter les deux clés jusqu'aux view-models**

Dans `app/src/components/sheets/types.ts`, ajouter aux interfaces `SheetCapabilityRef` **et**
`CapaciteSheetVM` :

```ts
    /** États infligés, déclarés — noms canoniques du compendium. */
    states?: string[];
    /** Entités invoquées, déclarées. */
    summons?: CapabilitySummon[];
```

Importer `CapabilitySummon` depuis `../../types/normalized` en tête du fichier.

Dans `app/src/components/sheets/adapters/fromHomebrew.ts`, dans `homebrewToCapaciteVM`, après
`detailLines` :

```ts
        // Déclarations facultatives, de même forme que celles des capacités officielles.
        states: Array.isArray(data.states) && data.states.length ? (data.states as string[]) : undefined,
        summons: Array.isArray(data.summons) && data.summons.length ? (data.summons as CapabilitySummon[]) : undefined,
```

Le contrat de dégradation propre impose `undefined` plutôt qu'un tableau vide.

- [ ] **Étape 4 : rendre les pastilles sur les deux feuilles**

`CapaciteSheet` et `VoieSheet` reçoivent une prop facultative :

```tsx
    /** Entités nécessaires à la résolution des liens de déclaration. Absente, aucune
     *  pastille : une feuille est pure et ne charge rien elle-même. */
    references?: { etats: HarmfulState[]; sources: SourcesInvocation };
```

Dans `CapaciteSheet`, sous le bloc des badges, rendre :

```tsx
{references && (
    <CapabilityRefs
        capacite={{ name: vm.name, states: vm.states, summons: vm.summons }}
        etatsConnus={references.etats}
        sources={references.sources}
    />
)}
```

Dans `VoieSheet`, rendre `CapabilityRefs` **à côté** de chaque carte, et non à l'intérieur :
`CapabilityCard` est partagée avec les fiches de peuple et de classe, qui n'ont pas de
références à lui donner — l'y faire entrer casserait ces deux fiches.

```tsx
{vm.capabilities!.map((cap, i) => (
    <div key={cap.id ?? i}>
        <CapabilityCard cap={cap} />
        {references && (
            <CapabilityRefs
                capacite={{ name: cap.name, states: cap.states, summons: cap.summons }}
                etatsConnus={references.etats}
                sources={references.sources}
            />
        )}
    </div>
))}
```

- [ ] **Étape 5 : charger et transmettre depuis la page**

Dans `app/src/pages/HomebrewDetail.tsx` :

```tsx
    const [references, setReferences] = useState<{ etats: HarmfulState[]; sources: SourcesInvocation }>({
        etats: [],
        sources: { creatures: [], monstresMaison: [], armes: [], armures: [], communautaire: [] },
    });

    useEffect(() => {
        // Un échec laisse la collection vide : la fiche s'affiche, sans pastille.
        Promise.all([
            DataService.getStates().catch(() => []),
            DataService.getCreatures().catch(() => []),
            DataService.getWeapons().catch(() => []),
            DataService.getArmors().catch(() => []),
            getMonsters().catch(() => []),
            HomebrewService.getAll().catch(() => []),
        ]).then(([etats, creatures, armes, armures, monstresMaison, communautaire]) => {
            setReferences({ etats, sources: { creatures, monstresMaison, armes, armures, communautaire } });
        });
    }, []);
```

Compléter les imports : `DataService` depuis `../services/dataService`, `getMonsters` depuis
`../services/monsterService`, `HarmfulState` depuis `../types/normalized`, `SourcesInvocation`
depuis `../domain/capabilityRefs`.

Puis ajouter `references={references}` sur `<VoieSheet …>` et sur `<CapaciteSheet …>`.

- [ ] **Étape 6 : lancer les portes complètes**

```
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
```
Attendu : tous verts, `tsc` muet, eslint toujours à 46 problèmes.

**Attention** : les tests de rendu existants des feuilles montent un view-model entièrement
rempli et vérifient que chaque valeur apparaît dans le DOM. Ils ne fournissent pas `references`,
donc aucune pastille — c'est le comportement attendu. **Si l'un d'eux échoue, ne pas l'affaiblir
sans comprendre** : c'est le filet qui a déjà attrapé deux champs peuplés mais jamais rendus.

- [ ] **Étape 7 : commiter**

```bash
git add app/src/components/sheets app/src/pages/HomebrewDetail.tsx
git commit -m "feat(compendium): une capacité communautaire affiche ses déclarations

Pastilles d'état et liens d'invocation sur la fiche d'une capacité et dans sa
voie, par le composant déjà partagé avec la fiche de créature et le suivi de
combat. La résolution reste à la page : une feuille est pure."
```

---

## Vérification finale (contrôleur)

- [ ] **Parcours navigateur**, desktop 1280×900 et mobile 390×844, via Docker :
  `docker run --rm --network host -v "$PWD/app/node_modules:/nm:ro" -v "<tmp>:/work" mcr.microsoft.com/playwright:v1.58.2-jammy node /work/<script>.mjs`,
  Playwright importé par `import pkg from '/nm/playwright-core/index.js'`. **API sur 8001.**
  1. Créer une capacité communautaire depuis `/bibliotheque/nouveau/capacite`, cocher un état,
     ajouter une invocation de créature, enregistrer.
  2. Sur sa fiche, vérifier la pastille d'état et le lien d'invocation, et que le lien mène à
     sa cible.
  3. Créer une voie contenant une capacité déclarante ; vérifier que la pastille apparaît
     **aussi** dans la carte au sein de la voie.
  4. Aucune erreur console, aucun débordement horizontal.
  **Attendre une condition, jamais `networkidle`** — et viser l'élément cherché, pas un mot qui
  apparaît aussi dans la navigation.
- [ ] **Non-régression** : une capacité sans déclaration n'affiche aucune pastille ; les autres
  catégories (race, classe, poison…) n'ont pas gagné de champ.
