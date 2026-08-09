#!/usr/bin/env node
/**
 * Confronte les types déclarés du front (`app/src/types/normalized.ts`) aux charges utiles
 * réellement servies par l'API.
 *
 * Deux écarts, et ils ne se valent pas :
 *
 * - **déclaré mais jamais servi** : le type autorise une lecture qui ne peut pas aboutir.
 *   C'est ainsi que le bestiaire a disparu de la recherche globale pendant des mois
 *   (`name[0].value`, forme d'export abandonnée) et que l'armure affichait un `defense`
 *   qui n'existe que sur une forme dérivée. À traiter comme un défaut potentiel.
 * - **servi mais non déclaré** : une donnée qu'on ne sait pas exploiter. Une occasion, pas
 *   un bug.
 *
 * Un champ « jamais servi » peut aussi n'être que le reflet d'une base de développement
 * périmée : vérifier la donnée avant de conclure au code mort.
 *
 * Usage : node scripts/audit-types-api.mjs [http://localhost:8000/api]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = process.argv[2] ?? 'http://localhost:8000/api';

/** type déclaré → collection servie */
const PAIRES = [
    ['Creature', 'creatures'], ['Race', 'races'], ['Profile', 'profiles'],
    ['Voie', 'voies'], ['Capacity', 'capabilities'], ['Weapon', 'equipment'],
    ['Armor', 'equipment'], ['Material', 'materials'], ['HarmfulState', 'states'],
    ['Poison', 'poisons'], ['Trap', 'traps'], ['Mount', 'mounts'],
];

const source = readFileSync(join(RACINE, 'app/src/types/normalized.ts'), 'utf8');

const champsDeclares = (nom) => {
    const m = source.match(new RegExp(`export interface ${nom} \\{([\\s\\S]*?)\\n\\}`));
    if (!m) return new Set();
    // Seuls les champs de PREMIER NIVEAU comptent : une propriété imbriquée (`stats.AGI`,
    // `masteries.weapons`) n'est pas un champ que l'API doit servir à la racine. Les
    // compter a produit huit faux « morts » sur Creature et failli faire supprimer les
    // sous-champs de masteries, que le compendium affiche.
    const champs = new Set();
    let profondeur = 0;
    for (const ligne of m[1].split('\n')) {
        const nu = ligne.trim();
        if (profondeur === 0) {
            const f = nu.match(/^(\w+)\??\s*:/);
            if (f) champs.add(f[1]);
        }
        profondeur += (ligne.match(/\{/g) ?? []).length - (ligne.match(/\}/g) ?? []).length;
    }
    return champs;
};

const champsServis = async (chemin) => {
    const r = await fetch(`${API}/${chemin}?pagination=false`, { headers: { Accept: 'application/ld+json' } });
    if (!r.ok) throw new Error(`${r.status} sur /${chemin}`);
    const d = await r.json();
    const membres = d.member ?? d['hydra:member'] ?? [];
    const champs = new Set();
    // Union sur toute la collection : un champ facultatif n'est servi que là où il vaut
    // quelque chose (API Platform omet les valeurs nulles).
    for (const e of membres) {
        for (const [k, v] of Object.entries(e)) {
            if (!k.startsWith('@') && v !== null) champs.add(k);
        }
    }
    return champs;
};

let ecarts = 0;
console.log(`API : ${API}\n`);
for (const [nom, chemin] of PAIRES) {
    let servis;
    try {
        servis = await champsServis(chemin);
    } catch (e) {
        console.log(`${nom.padEnd(14)} — inaccessible : ${e.message}`);
        continue;
    }
    const declares = champsDeclares(nom);
    const fantomes = [...declares].filter(c => !servis.has(c) && c !== 'id').sort();
    const inexploites = [...servis].filter(c => !declares.has(c) && c !== 'id').sort();

    console.log(`${nom.padEnd(14)} ${String(declares.size).padStart(3)} déclarés · ${String(servis.size).padStart(3)} servis`);
    if (fantomes.length) {
        ecarts += fantomes.length;
        console.log(`    déclarés mais jamais servis : ${fantomes.join(', ')}`);
    }
    if (inexploites.length) console.log(`    servis mais non déclarés    : ${inexploites.join(', ')}`);
}
console.log(`\n${ecarts} champ(s) déclarés que l'API ne sert jamais.`);
