# Design — Transformations (override de stat-block)

- **Date :** 2026-07-18
- **Statut :** design validé, prêt pour le plan d'implémentation
- **Auteur :** nauno + Claude
- **Règles de référence :** design initial `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md` §7 #2

## 1. Contexte & objectif

Sixième sous-projet de la **Phase 5**. Certaines capacités transforment le personnage en
un **autre stat-block** — la forme animale du druide en est l'exemple type. Ce sous-projet
permet au joueur de déclarer des formes (pré-remplies depuis le bestiaire) et, tant qu'une
forme est active, de **remplacer** les statistiques de combat affichées du personnage par
celles de la forme. Piloté joueur, réutilise le bestiaire (comme les compagnons #1) et le
mécanisme de toggle (comme les états #3), mais **override** au lieu de composer.

## 2. Périmètre & non-objectifs

**Dans le périmètre :** modèle `playState.forms` ; helpers purs `formFromCreature`
(pré-remplissage bestiaire) et `activateForm` (toggle exclusif — une seule forme active) ;
override de `combatStats` (DEF/Init) et `maxHp` dans le hook quand une forme est active ; UI
`TransformationPanel` + bandeau « Transformé ». **Frontend uniquement**.

**Hors périmètre :** quelles capacités/attaques du personnage restent utilisables sous
forme (règles fines COF2) → laissé au joueur/MJ (notes) ; l'override des attaques
(contact/tir) et de la RD (restent celles du perso pour ce 1er cut) ; l'auto-dérivation
depuis un `effect` de transformation ; les caracs de la forme (on n'expose que DEF/Init/PV).

## 3. Décisions actées

| Décision | Choix | Raison |
|---|---|---|
| Source | **Piloté joueur** + pré-remplissage bestiaire | Cohérent avec compagnons #1 ; self-contained. |
| Exclusivité | **Une seule forme active** (global) | On ne peut être que dans une forme à la fois. |
| Override | **DEF / Init / PV max** remplacés par la forme quand active | Le cœur du stat-block de combat ; attaques/RD reportées. |
| Câblage | Override **dans le hook** (fonctions pures inchangées) | Un seul point de bascule ; sans forme = dérivation normale. |
| Localisation | **Frontend seul** | `playState` = JSONB opaque ; réutilise la lecture bestiaire. |

## 4. Modèle (`playState`)

Ajout dans `app/src/types/character.ts` :

```ts
export interface Form {
    name: string;
    ref?: string;                          // IRI créature bestiaire (si issu du compendium)
    hp: { current: number; max: number };
    def: number;
    init: number;
    active: boolean;
}
```

et dans `interface PlayState`, après `activeStates?` :

```ts
    forms?: Form[];                        // formes de transformation (une seule active)
```

## 5. Helpers purs (`cofRules.ts`)

```ts
// Pré-remplit une forme depuis une créature du bestiaire (réutilise companionFromCreature).
export const formFromCreature = (
  c: { id?: number; name?: string; hp?: number; def?: number; init?: number },
): Form => ({ ...companionFromCreature(c), active: false });

// (Dés)active une forme ; en activer une désactive toutes les autres (exclusivité globale).
export const activateForm = (
  forms: Form[] | undefined,
  idx: number,
  active: boolean,
): Form[] =>
  (forms ?? []).map((f, i) =>
    i === idx ? { ...f, active } : active ? { ...f, active: false } : f);
```

(`companionFromCreature` renvoie `{ name, ref?, hp, def, init }` — le spread + `active:false`
donne un `Form`.)

## 6. Override dans le hook (`useCharacterSheet.ts`)

```ts
const activeForm = (playState.forms ?? []).find(f => f.active);
```

Dans l'objet retourné :
- `combatStats` → `activeForm ? { init: activeForm.init, def: activeForm.def } : { init: combatStats.init + bonuses.init, def: combatStats.def + bonuses.def }`
- `maxHp` → `activeForm ? activeForm.hp.max : maxHp + bonuses.pv`
- exposer `activeForm` (pour le bandeau).

Sans forme active : comportement identique à aujourd'hui (objets + états composés). Les
fonctions pures `cofRules` restent inchangées ; aucune valeur dérivée persistée.

## 7. UI (`TransformationPanel`, nouveau)

- Récupère les créatures via `DataService.getCreatures()` (comme compagnons/Combat Tracker).
- **Ajout** d'une forme depuis le bestiaire (`formFromCreature`) ou custom.
- Chaque forme : **toggle actif** (via `activateForm` → exclusif), nom, **PV `current/max`**
  (−/+ bornés), DEF, Init, suppression.
- **Bandeau « Transformé : {nom} »** visible quand une forme est active.
- Écrit `playState.forms`. Placement : colonne équipement/jeu, style `glass-panel`.

## 8. Tests

- **Unitaires (`cofRules.test.ts`)** : `formFromCreature` (mappe bestiaire + `active:false`) ;
  `activateForm` (activer une forme désactive les autres ; désactiver n'affecte que la
  ciblée ; liste absente → `[]`).
- **Type-check / lint** : `tsc -b` 0 erreur ; lint sans nouvelle erreur (~133) ; aucun `any`.
- **E2E** : non-régression fiche (`character-sheet`).

## 9. Migration & compatibilité

- Ajout purement additif (`forms?` optionnel) ; aucune fiche à convertir ; aucune migration
  backend. Sans forme active, DEF/Init/PV sont identiques à aujourd'hui.

## 10. Critères de succès

- Le joueur déclare des formes (bestiaire ou custom), en active une (exclusive) ; DEF/Init/
  PV max affichés basculent sur la forme, avec un bandeau « Transformé » ; désactiver
  rétablit les stats du perso.
- Aucune valeur dérivée persistée ; fonctions pures inchangées ; sans forme = zéro
  régression.
- `tsc`, `vitest` et l'e2e de non-régression passent.

## 11. Suite

Dernière mécanique Phase 5 : capacités à choix (#6, compendium-driven). Puis les suivis
incrémentaux : override des attaques/RD sous forme, système de repos COF2 complet,
structuration des `effect.*` par capacité.
