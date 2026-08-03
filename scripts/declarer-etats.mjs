#!/usr/bin/env node
/**
 * Outil d'amorçage — À EXÉCUTER À LA MAIN, JAMAIS PAR L'APPLICATION.
 *
 * Propose une clé `states` sur chaque capacité de `backend/data/creatures.json`, à partir
 * des noms d'états trouvés dans son texte. Ce qui tourne en production ne lit qu'une
 * déclaration : cette détection n'est qu'une aide à la saisie, dont le résultat est relu
 * puis commité comme donnée.
 *
 * Usage :
 *   node scripts/declarer-etats.mjs            # rapport seul, n'écrit rien
 *   node scripts/declarer-etats.mjs --ecrire   # applique les déclarations au fichier
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FICHIER = 'backend/data/creatures.json';
const ETATS = ['Affaibli', 'Aveuglé', 'Étourdi', 'Immobilisé',
    'Paralysé', 'Ralenti', 'Renversé', 'Surpris'];

const normaliser = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const sansBalises = x => String(x ?? '').replace(/<[^>]+>/g, ' ');

/** États cités par un texte, dans l'ordre des 8 noms connus, sans doublon. */
const etatsDuTexte = texte => {
    const mots = sansBalises(texte).match(/[A-Za-zÀ-ÿ]+/g) ?? [];
    const trouves = new Set();
    const suspects = [];
    for (const mot of mots) {
        const n = normaliser(mot);
        for (const etat of ETATS) {
            const ne = normaliser(etat);
            if (!n.startsWith(ne)) continue;
            trouves.add(etat);
            // Au-delà d'un accord simple (« Renversée », « Immobilisées »), la forme
            // mérite un œil : « affaiblissements » n'est pas l'état Affaibli.
            if (n.length > ne.length + 1) suspects.push({ mot, etat });
        }
    }
    return { etats: [...trouves], suspects };
};

const creatures = JSON.parse(readFileSync(FICHIER, 'utf8'));
const liste = Array.isArray(creatures) ? creatures : creatures.data;

let capacites = 0, declarees = 0;
const aRelire = [];

for (const creature of liste) {
    for (const cap of creature.capabilities ?? []) {
        capacites++;
        const { etats, suspects } = etatsDuTexte(cap.description);
        if (etats.length === 0) continue;
        declarees++;
        cap.states = etats;
        for (const s of suspects) {
            aRelire.push(`${creature.name} / ${cap.label ?? cap.name} : « ${s.mot} » → ${s.etat}`);
        }
    }
}

console.log(`${capacites} capacités, ${declarees} porteuses d'au moins un état.`);
console.log(`\n${aRelire.length} forme(s) à relire à la main :`);
for (const ligne of aRelire) console.log(`  - ${ligne}`);

if (process.argv.includes('--ecrire')) {
    writeFileSync(FICHIER, JSON.stringify(creatures, null, 2) + '\n', 'utf8');
    console.log(`\n${FICHIER} mis à jour.`);
} else {
    console.log('\nRapport seul — relancer avec --ecrire pour appliquer.');
}
