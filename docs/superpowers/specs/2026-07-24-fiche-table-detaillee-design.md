# Fiche de personnage de table — refonte détaillée

**Date :** 2026-07-24
**Branche :** `feat/fiche-table-detaillee`
**Objectif :** transformer la fiche imprimable/PDF (aujourd'hui « essentiel » 1-2 pages) en une
**fiche de table complète et vivante** — descriptions de capacités intégrales, meilleure
organisation, cases de suivi à remplir — utilisable pour jouer autour d'une table sans le livre.

## Décisions (actées avec l'utilisateur)

- **Capacités : descriptions complètes** (nom + rang + description intégrale + dé évolutif résolu + badge « Sort · N PM »).
- **Fiche « vivante »** : PV/PM/PC en « courant / max », cases à cocher pour usages limités, zone de notes libres.
- **Toutes les sections** : combat, ressources, voies & capacités, équipement, aide de table (états/usages/compagnons), roleplay & physique, inventaire/argent/notes.
- **Approche inchangée** : print-CSS + PDF natif du navigateur, **aucune dépendance**, route `/characters/:id/print`, thème clair, même dérivation (`useCharacterSheet`) ⇒ valeurs identiques à l'écran. Multi-pages assumé (≈ 3-5 pages).

## Organisation (ordre = fréquence de consultation en jeu)

1. **En-tête** — nom · peuple · profil · niveau · famille.
2. **Caractéristiques** — 7 valeurs finales + bonus aux tests.
3. **Combat** (proéminent) — DEF · Initiative · Réduction de Dommages ; PV en « courant ⬚ / max ».
   **Attaques** en tableau : Contact / Distance / Magie (valeur = niveau + carac + bonus), puis une
   ligne par arme (`name` · `atkMod` signé · `dmg` · `special`).
4. **Ressources trackables** — PV (courant/max), PM (si mage : courant/max + rappel PM/sort), PC/Chance,
   Dé de récupération, Dé évolutif. Valeurs courantes depuis `playState` ; cases/champs à remplir.
5. **Voies & capacités** — par voie (peuple/profil/prestige/octroi) : en-tête + rang atteint ; chaque
   capacité acquise (`isCapabilityGrantedByEntry`) : **Rang N — Nom**, badge « Sort · N PM » si `isSpell`,
   **description complète** (`capability.description`), dé évolutif résolu (`getResolvedDice`), option de
   choix retenue (`entry.choices[rang]`) si présente.
6. **Équipement** — protection (armure DEF + AGI max, bouclier DEF) ; inventaire (`equipment[]`) ;
   bourse (po/pa/pc) ; objets magiques (`magicItems` : nom, cible, valeur, équipé).
7. **Aide de table** — états actifs (`activeStates` : nom, cible/valeur, actif) ; usages limités
   (`usages` : nom, `used`/`max` en cases à cocher, période) ; compagnons (`companions` : nom, PV, DEF, Init, notes).
8. **Personnage & notes** — roleplay (`rp` : idéal / trait / secret) ; physique (`physical` : âge/taille/poids) ;
   langues (base + suppl.) & talents ; **zone de notes libres** (lignes vides à remplir + `rp.notes` si présent).

## Architecture

- **Un seul fichier** `pages/PrintableCharacterSheet.tsx` réécrit. Sous-composants présentationnels
  définis **au niveau module** (évite `react-hooks/static-components`) : `StatBox`, `Section`,
  `Field`, `CheckBoxes` (rangée de cases pour usages), `BlankLines` (lignes à remplir).
- **Aucune logique de règles nouvelle** : on lit les valeurs dérivées de `useCharacterSheet`
  (`finalStats`, `combatStats`, `maxHp`, `damageReduction`, `luckPoints`, `manaPoints`,
  `recoveryDieString`, `evolutiveDie`, `bonuses`, `caracTestBonuses`, `getResolvedDice`) et les
  données brutes de `character.playState` / du compendium (`buildVoieIndex`). Terminologie COF2
  fidèle (Défense, Initiative, Points de Vie/Mana/Chance, Réduction de Dommages, Dé de Récupération).
- **Print-CSS** (déjà en place dans `index.css`) : `.no-print`, marges A4, `break-inside: avoid` par bloc
  (une capacité / un compagnon ne se coupe pas). Ajouter au besoin des styles de case à cocher et de
  lignes pointillées imprimables.

## Définition de « fini » (DoD)

- La fiche affiche les 8 sections ci-dessus, capacités avec **descriptions complètes**.
- PV/PM/PC montrés en courant/max ; usages en cases à cocher ; zone de notes présente.
- Valeurs identiques à la fiche écran (même dérivation).
- Aperçu d'impression propre : pas de contrôles, thème clair, sauts de page corrects (pas de bloc coupé).
- `tsc -b` = 0, `vitest run` vert, `npm run lint` = 0 nouvelle erreur.

## Hors périmètre

- Lib PDF / vrai `.pdf` téléchargé (approche B, écartée).
- Personnalisation par l'utilisateur (choix des sections, réordonnancement).
- Impression multi-personnages ; formes de transformation détaillées (juste mentionnées si actives).
