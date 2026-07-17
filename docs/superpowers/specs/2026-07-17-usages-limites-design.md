# Design — Usages limités (suivi X/jour, /combat, /round)

- **Date :** 2026-07-17
- **Statut :** design validé, prêt pour le plan d'implémentation
- **Auteur :** nauno + Claude
- **Règles de référence :** design initial `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md` §7 #4

## 1. Contexte & objectif

Deuxième sous-projet de la **Phase 5**. De nombreuses capacités COF2 ont un **usage
limité** (X fois par jour, par combat, par round — ex. Phénix, Exécution mentale,
Paralysie). Ce sous-projet fournit un **tracker d'état de jeu** (aide de table) pour suivre
en séance « combien d'utilisations me reste-t-il », piloté par le joueur, sans dépendance
au compendium (`effect.usage` n'est peuplé sur aucune capacité — structuration = long
tail, comme pour les objets magiques #7).

**Aligné sur la vision produit** (aide de table MJ, suivi en séance) : c'est un compteur
que le joueur décrémente en jeu et remet à zéro selon la période.

## 2. Périmètre & non-objectifs

**Dans le périmètre :** modèle `playState.usages` ; helper pur testable `resetUsages` ; UI
`UsagesPanel` (liste éditable + compteurs + boutons de reset par période). **Frontend
uniquement**.

**Hors périmètre :** capacités **maintenues** (coût par round tant que la concentration
tient, ex. Strangulation 1 PM/round → à traiter avec les PM, plus tard) ; auto-dérivation
depuis `Capability.effect.usage` (structuration incrémentale) ; **système de repos COF2
complet** (récupération rapide/complète avec PV/PM/DR — sous-projet dédié : ici les boutons
ne remettent à zéro **que** les usages, ils ne touchent ni PV, ni PM, ni DR) ; aucun effet
sur les valeurs dérivées (c'est un pur compteur).

## 3. Décisions actées

| Décision | Choix | Raison |
|---|---|---|
| Source des usages | **Piloté joueur** (le joueur déclare ses usages depuis ses capacités) | `effect.usage` non peuplé ; self-contained, sans dépendance données (comme #7). |
| Reset | **Boutons par période** (repos long / fin de combat / nouveau round) | Suffit à l'aide de table ; ne préempte pas le futur système de repos complet. |
| Effet sur la fiche | **Aucun** (tracker pur) | Un usage limité ne modifie pas DEF/PV/attaques ; c'est du suivi. |
| Localisation | **Frontend seul** | `playState` = JSONB opaque, aucune migration. |

## 4. Modèle (`playState`)

Ajout dans `app/src/types/character.ts` :

```ts
export type UsagePeriod = 'jour' | 'combat' | 'round' | 'autre';
export interface Usage {
    name: string;
    max: number;
    used: number;
    per: UsagePeriod;
}
```

et dans `interface PlayState`, après `magicItems?`:

```ts
    usages?: Usage[];                      // suivi des capacités à usage limité (aide de table)
```

## 5. Helper pur (`cofRules.ts`)

Un seul helper **testable** pour la remise à zéro par période(s) :

```ts
// Remet `used` à 0 pour les usages dont la période figure dans `periods` (repos/reset).
export const resetUsages = (
  usages: Usage[] | undefined,
  periods: UsagePeriod[],
): Usage[] => (usages ?? []).map(u => (periods.includes(u.per) ? { ...u, used: 0 } : u));
```

Aucune autre dérivation : le tracker n'influence aucune valeur de jeu.

## 6. UI (`UsagesPanel`, nouveau)

- Liste éditable d'usages : **nom**, compteur **`used / max`** avec boutons **−/+** (bornés
  `0..max`), **max** éditable, sélecteur de **période** (`jour/combat/round/autre`),
  suppression. Un état actif visuel quand `used >= max` (épuisé).
- **Boutons de reset** (agissent uniquement sur les usages) :
  - « Repos long » → `resetUsages(usages, ['jour','combat','round'])`
  - « Fin de combat » → `resetUsages(usages, ['combat','round'])`
  - « Nouveau round » → `resetUsages(usages, ['round'])`
- Écrit `playState.usages`. Placement : colonne équipement/jeu, style `glass-panel`.

## 7. Tests

- **Unitaires (`cofRules.test.ts`)** : `resetUsages` — remet à zéro les périodes visées,
  laisse les autres, liste absente → `[]`, ne mute pas l'entrée d'origine (copie).
- **Type-check / lint** : `tsc -b` 0 erreur ; lint sans nouvelle erreur (~133) ; aucun `any`.
- **E2E** : non-régression fiche (`character-sheet`) ; le panneau rend sans casser la fiche.

## 8. Migration & compatibilité

- Ajout purement additif (`usages?` optionnel) ; aucune fiche à convertir ; aucune
  migration backend (JSONB opaque).

## 9. Critères de succès

- Le joueur ajoute un usage (ex. « Phénix — 1/jour », « Frappe — 3/combat »), décrémente
  en jeu (−/+ bornés), et remet à zéro via les boutons de période ; tout persiste dans
  `playState.usages`.
- Aucun effet sur les valeurs dérivées ; aucune valeur dérivée persistée (les usages sont
  de l'état de jeu, pas un calcul).
- `tsc`, `vitest` et l'e2e de non-régression passent.

## 10. Suite

Autres mécaniques Phase 5 (sous-projets dédiés) : compagnons/invocations (#1), états
activables (#3), substitution de carac (#5), capacités à choix (#6). Puis le **système de
repos COF2 complet** (récupération rapide/complète : PV, PM, DR, reset des usages `combat`/
`jour`) — qui réutilisera `resetUsages`.
