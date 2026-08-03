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
 * Usage :
 *   node scripts/declarer-etats.mjs            # rapport seul, n'écrit rien
 *   node scripts/declarer-etats.mjs --ecrire   # applique les déclarations au fichier
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

const creatures = JSON.parse(readFileSync(FICHIER, 'utf8'));
const liste = Array.isArray(creatures) ? creatures : creatures.data;

let capacites = 0, declarees = 0;
const aRelireForme = [];
const aRelireSens = [];

for (const creature of liste) {
    for (const cap of creature.capabilities ?? []) {
        capacites++;
        const { etats, suspectsForme, suspectsSens } = etatsDuTexte(cap.description);
        if (etats.length === 0) continue;
        declarees++;
        cap.states = etats;
        for (const s of suspectsForme) {
            aRelireForme.push(`${creature.name} / ${cap.label ?? cap.name} : « ${s.mot} » → ${s.etat}`);
        }
        for (const s of suspectsSens) {
            aRelireSens.push(`${creature.name} / ${cap.label ?? cap.name} : « ${s.tournure} » à propos de ${s.etat} — « ${s.phrase} »`);
        }
    }
}

console.log(`${capacites} capacités, ${declarees} porteuses d'au moins un état.`);
console.log(`\n${aRelireForme.length} forme(s) à relire à la main :`);
for (const ligne of aRelireForme) console.log(`  - ${ligne}`);

console.log(`\n${aRelireSens.length} risque(s) de sens à relire à la main (précondition, résistance, retrait...) :`);
for (const ligne of aRelireSens) console.log(`  - ${ligne}`);

if (process.argv.includes('--ecrire')) {
    writeFileSync(FICHIER, JSON.stringify(creatures, null, 2) + '\n', 'utf8');
    console.log(`\n${FICHIER} mis à jour.`);
} else {
    console.log('\nRapport seul — relancer avec --ecrire pour appliquer.');
}
