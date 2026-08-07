# Chroniques Oubliées Fantasy — conventions

Design system d'un compagnon de jeu de rôle : **sombre par construction**, accent doré,
titres en capitales serif. Ce qui suit est ce qu'il faut savoir pour construire avec.

## Envelopper — obligatoire

Tout ce que vous composez va **dans `DesignSystemProvider`**. Il pose deux choses dont le
reste dépend : un routeur en mémoire (plusieurs composants rendent des liens et lèvent une
erreur sans lui) et l'assise sombre (`bg-stone-950 text-stone-200 font-body`). Sans lui, les
surfaces translucides du système se posent sur du blanc et deviennent illisibles.

```jsx
<DesignSystemProvider>
  <PageContainer>
    <PageShell title="Peuples" subtitle="Les huit peuples jouables." icon={BookOpen} />
    {/* … */}
  </PageContainer>
</DesignSystemProvider>
```

## L'idiome : classes utilitaires Tailwind, sur un thème maison

Il n'y a **pas de props de style** sur les composants — on compose avec des classes
utilitaires, et les composants exposent `className` pour l'ajustement local. Le vocabulaire
propre à ce système, défini dans `@theme` :

| Famille | Noms réels | Usage |
|---|---|---|
| Accent | `primary-100` … `primary-900` (`text-primary-400`, `bg-primary-600`, `border-primary-500/40`) | l'or du système : valeurs actives, appels à l'action, titres |
| Fond | `stone-950` (assise), `stone-900` (surfaces), `stone-800` (bordures) | l'échelle sombre ; `stone-200`/`stone-400`/`stone-500` pour le texte |
| Typographie | `font-display` (Cinzel, titres en petites capitales), `font-body` (Inter, texte courant) | jamais l'inverse : un titre en `font-body` casse l'identité |
| Surface | `glass-panel` (classe maison : fond translucide + flou) | panneaux et cartes ; se combine avec `rounded-2xl border border-white/5` |

**Plancher typographique : 11 px.** Les intitulés et annotations descendent à
`text-[11px]`, jamais en dessous — c'est une décision prise après une revue de lisibilité,
pas une préférence.

Sémantique de couleur (états, badges) : `success` vert, `warning` jaune, `danger` rouge,
`info` bleu — passez-les par la prop `variant` de `Badge` plutôt qu'en classes.

## Où est la vérité

- `_ds/<dossier>/styles.css` et sa fermeture d'`@import` : toute la feuille compilée, avec
  l'échelle de couleurs, les polices et les classes maison. À lire avant de styler.
- `components/<groupe>/<Nom>/<Nom>.d.ts` : le contrat de props, extrait des sources.
- `components/<groupe>/<Nom>/<Nom>.prompt.md` : l'usage, composant par composant.

## Composer une page

Le gabarit est toujours le même : un `PageContainer` (largeur et rythme vertical), un
**seul** `PageShell` en tête, puis le contenu.

```jsx
<DesignSystemProvider>
  <PageContainer>
    <PageShell
      title="Créatures"
      subtitle="Le bestiaire officiel et celui de la communauté."
      icon={Ghost}
      tabs={<SourceTabs value={source} onChange={setSource} tabs={[
        { id: 'official', label: 'Officiel' },
        { id: 'community', label: 'Communauté' },
        { id: 'mine', label: 'Mes créations' },
      ]} />}
      search={{ value: q, onChange: setQ, placeholder: 'Rechercher une créature…' }}
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ContentCard onClick={ouvrir} media={<img src={url} alt="" className="w-full h-32 object-cover" />}>
        <h3 className="font-display font-bold text-stone-100">Roc</h3>
        <p className="text-sm text-stone-400 mt-1">Rapace colossal des hautes cimes.</p>
      </ContentCard>
    </div>
  </PageContainer>
</DesignSystemProvider>
```

Deux règles qui tiennent la cohérence de l'ensemble :

1. **Une seule tête par écran** — `PageShell`, jamais un en-tête composé à la main. Son
   `subtitle` dit *la fonction de la page*, pas un compte de résultats.
2. **Le contenu communautaire porte `AuthorTag`**, et rien d'autre ne le distingue du
   contenu officiel : même carte, même feuille, seule l'étiquette d'auteur change.

## Langue

L'interface est **en français**, y compris les libellés que vous écrivez. Un lexique fait
autorité côté application (`LEXIQUE`, exporté par le paquet) : « Peuples » et non
« Races », « Mes créations » et non « Mon contenu », capitale au premier mot seulement
(« Suivi de combat », « Objets magiques »).
