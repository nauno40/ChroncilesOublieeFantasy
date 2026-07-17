# Design — Capacités à choix (tranche minimale : enregistrement du choix)

- **Date :** 2026-07-18
- **Statut :** design validé, prêt pour le plan d'implémentation
- **Auteur :** nauno + Claude
- **Règles de référence :** design initial `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md` §7 #6

## 1. Contexte & objectif

Dernière mécanique de la **Phase 5**. Certaines capacités offrent une **option à mémoriser**
(tatouages du moine, élixirs du forgesort, amélioration du golem, pactes du sorcier…). Cette
**tranche minimale** (choix actée avec l'utilisateur) permet au joueur d'**enregistrer et
d'afficher** son choix par capacité, dans `CharacterVoie.choices` (champ déjà writable). Elle
ne fait **pas** la résolution « ajout / remplacement de capacité » (sous-cas b/c), qui
demande une structuration de données reportée.

**Découverte d'exploration :** `Capability.details` est **déjà exposé** en lecture
(`race/profile/voie:read`) ; les ~12 capacités à options portent une clé `options_*`/`choix_*`
(prose). `CharacterVoie.choices` (JSON) est **déjà** en `character:read`/`character:write`.
→ **Aucun changement backend** ; sous-projet **frontend seul**.

## 2. Périmètre & non-objectifs

**Dans le périmètre :** helper pur `capabilityChoiceKey` (détecte qu'une capacité a un choix) ;
UI `ChoicesPanel` (champ de choix par capacité acquise à option, écrit `characterVoies[].choices`).
**Frontend uniquement**.

**Hors périmètre :** la **résolution** du choix (sous-cas b « appel à une autre capacité »,
c « remplacement ») → chantier structuré ultérieur ; toute dérivation depuis le choix (le
choix est un **texte enregistré**, pas un effet calculé) ; la structuration des options en
liste (elles restent de la prose, affichée en aide + saisie libre).

## 3. Décisions actées

| Décision | Choix | Raison |
|---|---|---|
| Portée | **Enregistrement + affichage** du choix (sous-cas a) | Data-free ; les sous-cas b/c demandent une structuration reportée. |
| Détection | Capacité « à choix » si `details` contient une clé `options_*`/`choix_*` | Cible les ~12 capacités concernées ; `details` déjà exposé. |
| Saisie | **Texte libre**, aidé par la prose des options | Les options ne sont pas une liste structurée. |
| Stockage | `characterVoies[].choices[<rang>]` (déjà writable, round-trip OK) | Champ existant ; par voie + rang de la capacité. |
| UI | **Panneau dédié** `ChoicesPanel` (ne touche pas `VoiesTree`) | `VoiesTree` déjà complexe (481 lignes). |
| Localisation | **Frontend seul** | Aucun changement backend nécessaire. |

## 4. Helper pur (`cofRules.ts`)

```ts
// Renvoie la clé de choix (`options_*`/`choix_*`) des details d'une capacité, sinon undefined.
export const capabilityChoiceKey = (
  details: Record<string, unknown> | undefined | null,
): string | undefined =>
  details ? Object.keys(details).find(k => /^(options|choix)/i.test(k)) : undefined;
```

## 5. UI (`ChoicesPanel`, nouveau)

- Reçoit `character`, `setCharacter`, et le compendium (`races`, `profiles`, `allVoies`).
- Construit une carte IRI → voie du compendium (avec `capabilities[].details`).
- Parcourt `character.characterVoies` (avec index) ; pour chaque voie résolue, chaque
  **capacité acquise** (rang `1..entry.rank`) dont `capabilityChoiceKey(cap.details)` est
  défini : affiche une ligne « {nom voie} — {nom capacité} » + la **prose des options** (aide)
  + un **champ texte** lié à `entry.choices?.[String(rang)]`.
- À la saisie : met à jour `characterVoies[idx].choices = { ...(choices||{}), [rang]: valeur }`.
- Si aucune capacité à choix : message « Aucune capacité à choix ». Placement : colonne
  équipement/jeu, style `glass-panel`.

## 6. Tests

- **Unitaires (`cofRules.test.ts`)** : `capabilityChoiceKey` — détecte `options_*`/`choix_*`,
  renvoie la 1ʳᵉ clé correspondante, `undefined` si absente / details vide / null.
- **Type-check / lint** : `tsc -b` 0 erreur ; lint sans nouvelle erreur (~133) ; aucun `any`.
- **E2E** : non-régression fiche (`character-sheet`).

## 7. Migration & compatibilité

- Aucun changement de modèle (`characterVoies[].choices` existe déjà, round-trip OK) ; aucune
  migration ; aucun changement backend. Purement additif (helper + UI).

## 8. Critères de succès

- Pour une capacité acquise à option (ex. Tatouages, Élixirs), le joueur voit un champ de
  choix (avec l'aide des options) et sa saisie persiste dans `characterVoies[].choices` ; elle
  se recharge à la réouverture.
- `capabilityChoiceKey` testé ; aucune valeur dérivée persistée (le choix est une saisie
  joueur) ; aucune régression.
- `tsc`, `vitest` et l'e2e passent.

## 9. Suite

**Phase 5 close** (les mécaniques data-free sont livrées). Le vrai #6 (résolution
add/remplacement contre le compendium — pactes sorcier, prêtre spécialiste) reste un
chantier structuré à part, avec les autres suivis incrémentaux (structuration des `effect.*`
par capacité, override attaques/RD sous forme, indicateur « 0 PV »).
