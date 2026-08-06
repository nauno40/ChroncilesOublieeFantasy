#!/usr/bin/env node
/**
 * Outil d'amorçage — À EXÉCUTER À LA MAIN, JAMAIS PAR L'APPLICATION.
 *
 * Propose une clé `states` sur chaque capacité de `backend/data/creatures.json`, à partir
 * des noms d'états trouvés dans son texte. Ce qui tourne en production ne lit qu'une
 * déclaration : cette détection n'est qu'une aide à la saisie, dont le résultat est relu
 * puis commité comme donnée.
 *
 * Deux sortes de signaux, tous deux de simples indices — jamais des vérités :
 *   - forme : la graphie du mot dépasse un simple accord (« aveuglées » face à « Aveuglé »).
 *   - sens  : la phrase qui porte l'état contient une tournure qui trahit typiquement une
 *             non-infliction — précondition (« si la cible est Surprise »), résistance
 *             (« éviter d'être »), immunité, ou un simple retrait (« s'en débarrasser »).
 *     Une capacité peut nommer un état sans jamais l'infliger à qui que ce soit : le
 *     rapprochement de forme ne voit rien de tel, d'où ce second passage sur le sens.
 *
 * Trois formes de fichiers, vérifiées sur les données réelles :
 *   - `backend/data/creatures.json` : `creature.capabilities[]`
 *   - `backend/data/Profils/*.json` : `paths[].abilities[]`
 *   - `backend/data/Races/*.json`   : `voies[].abilities[]`
 *
 * Usage :
 *   node scripts/declarer-etats.mjs                          # bestiaire, rapport seul
 *   node scripts/declarer-etats.mjs --ecrire                 # bestiaire, applique
 *   node scripts/declarer-etats.mjs <fichiers...>            # rapport sur ces fichiers
 *   node scripts/declarer-etats.mjs --ecrire <fichiers...>   # applique à ces fichiers
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FICHIER = 'backend/data/creatures.json';
const ETATS = ['Affaibli', 'Aveuglé', 'Étourdi', 'Immobilisé',
    'Paralysé', 'Ralenti', 'Renversé', 'Surpris'];

// Unifie aussi les apostrophes (courbe ’ vs droite ') pour que les tournures ci-dessous
// matchent quelle que soit celle utilisée dans la donnée source.
const normaliser = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '\'').toLowerCase();
const sansBalises = x => String(x ?? '').replace(/<[^>]+>/g, ' ');

// Tournures qui, dans la phrase portant le mot d'état, trahissent le plus souvent une
// non-infliction : précondition d'usage, résistance/immunité de la créature elle-même,
// cible déjà dans cet état en amont, ou simple retrait d'un état existant (soin). Une
// capacité peut nommer un état sans l'infliger à personne — c'est précisément ce que la
// relecture par forme ne voit pas. Écrites lisiblement (accents, apostrophes normales) ;
// normalisées ci-dessous avec le même `normaliser` que le texte, pour rester en phase.
const TOURNURES_SUSPECTES = [
    'éviter d\'être',
    'ne peut être', 'ne peut pas être',
    'immunis',
    's\'en débarrasser',
    'résist',
    'si la cible est',
    'par surprise',
    'de dos',
    'sur une cible surprise', // précondition : exploite un état déjà là, ne l'inflige pas
    'au ralenti', // adverbe usuel (« il chute au ralenti »), pas l'état de jeu Ralenti
].map(normaliser);

/** Découpage grossier en phrases, pour situer quelle phrase porte quel mot. */
const phrasesDe = texte => sansBalises(texte).split(/(?<=[.!?;])\s+/).filter(Boolean);

/** États cités par un texte, dans l'ordre des 8 noms connus, sans doublon. */
const etatsDuTexte = texte => {
    const mots = sansBalises(texte).match(/[A-Za-zÀ-ÿ]+/g) ?? [];
    const trouves = new Set();
    const suspectsForme = [];
    for (const mot of mots) {
        const n = normaliser(mot);
        for (const etat of ETATS) {
            const ne = normaliser(etat);
            if (!n.startsWith(ne)) continue;
            trouves.add(etat);
            // Au-delà d'un accord simple (« Renversée », « Immobilisées »), la forme
            // mérite un œil : « affaiblissements » n'est pas l'état Affaibli.
            if (n.length > ne.length + 1) suspectsForme.push({ mot, etat });
        }
    }

    // Sens : pour chaque phrase qui cite un des états trouvés, la phrase contient-elle
    // une tournure de non-infliction ? Simple indice à relire, jamais une conclusion.
    const suspectsSens = [];
    for (const phrase of phrasesDe(texte)) {
        const phraseNorm = normaliser(phrase);
        const etatsDeLaPhrase = [...trouves].filter(etat => phraseNorm.includes(normaliser(etat)));
        if (etatsDeLaPhrase.length === 0) continue;
        for (const tournure of TOURNURES_SUSPECTES) {
            if (!phraseNorm.includes(tournure)) continue;
            for (const etat of etatsDeLaPhrase) {
                suspectsSens.push({ etat, tournure, phrase: phrase.trim() });
            }
        }
    }

    return { etats: [...trouves], suspectsForme, suspectsSens };
};

/**
 * Capacités d'un document, quelle qu'en soit la forme, avec le nom de leur porteur pour
 * que le rapport soit lisible. Le chemin diffère d'une source à l'autre — chercher au
 * mauvais endroit rendrait un fichier silencieusement muet.
 */
const capacitesDuDocument = document => {
    const racine = Array.isArray(document) ? document : (document.data ?? document);
    const sortie = [];

    // Bestiaire : une liste de créatures portant `capabilities`.
    if (Array.isArray(racine)) {
        for (const creature of racine) {
            for (const cap of creature.capabilities ?? []) {
                sortie.push({ porteur: creature.name, cap });
            }
        }
        return sortie;
    }

    // Profils (`paths`) et peuples (`voies`) : des voies portant `abilities`.
    for (const cle of ['paths', 'voies']) {
        for (const voie of racine[cle] ?? []) {
            for (const cap of voie.abilities ?? []) {
                // `class` est un OBJET dans les profils (nom, description…), pas une chaîne.
                const source = racine.class?.name ?? racine.name ?? '?';
                sortie.push({ porteur: `${source} / ${voie.name}`, cap });
            }
        }
    }
    return sortie;
};

const ecrire = process.argv.includes('--ecrire');
const fichiers = process.argv.slice(2).filter(a => a !== '--ecrire');
if (fichiers.length === 0) fichiers.push(FICHIER);

let capacites = 0, declarees = 0;
const aRelireForme = [];
const aRelireSens = [];

/** Indentation du fichier, pour réécrire dans son propre format : imposer la nôtre
 *  produirait un diff de plusieurs milliers de lignes où se perdraient les quelques
 *  déclarations ajoutées — et une revue qui ne voit rien ne sert à rien. */
const indentationDe = brut => {
    const m = brut.match(/\n(\s+)"/);
    return m ? m[1].length : 2;
};

for (const chemin of fichiers) {
    const brut = readFileSync(chemin, 'utf8');
    const indentation = indentationDe(brut);
    const document = JSON.parse(brut);

    for (const { porteur, cap } of capacitesDuDocument(document)) {
        capacites++;
        const { etats, suspectsForme, suspectsSens } = etatsDuTexte(cap.description);
        if (etats.length === 0) continue;
        declarees++;
        cap.states = etats;
        const nom = cap.label ?? cap.name;
        for (const s of suspectsForme) {
            aRelireForme.push(`${porteur} / ${nom} : « ${s.mot} » → ${s.etat}`);
        }
        for (const s of suspectsSens) {
            aRelireSens.push(`${porteur} / ${nom} : « ${s.tournure} » à propos de ${s.etat} — « ${s.phrase} »`);
        }
    }

    if (ecrire) {
        writeFileSync(chemin, JSON.stringify(document, null, indentation) + '\n', 'utf8');
    }
}

console.log(`${fichiers.length} fichier(s), ${capacites} capacités, ${declarees} porteuses d'au moins un état.`);
console.log(`\n${aRelireForme.length} forme(s) à relire à la main :`);
for (const ligne of aRelireForme) console.log(`  - ${ligne}`);

console.log(`\n${aRelireSens.length} risque(s) de sens à relire à la main (précondition, résistance, retrait...) :`);
for (const ligne of aRelireSens) console.log(`  - ${ligne}`);

console.log(ecrire ? '\nFichiers mis à jour.' : '\nRapport seul — relancer avec --ecrire pour appliquer.');
