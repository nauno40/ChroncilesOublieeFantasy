#!/usr/bin/env node
/**
 * Confronte le bestiaire servi (`backend/data/creatures.json`) au bestiaire du livre
 * (`doc/getRulesFullToMD/partie3-mj/03-bestiaire-opposition.md`), profil par profil.
 *
 * C'est cet outil qui a trouvé que 30 créatures sur les 62 vérifiables portaient
 * 46 caractéristiques fausses — toutes des valeurs NÉGATIVES du livre, disparues (INT ‑4
 * servie 0) ou glissées (INT ‑1 servie ‑2). Jamais une positive, jamais la Défense, les PV
 * ou l'Initiative. Quatre points d'écart sur un d20 pour un test d'INT de squelette.
 *
 * Il reste utile après coup, comme garde : les fixtures et le livre doivent rester
 * d'accord, et rien d'autre ne le vérifie — ni PHPUnit ni Vitest ne voient `doc/`, aucun
 * de leurs conteneurs ne le monte.
 *
 * Ce que l'outil NE FAIT PAS : il ne touche à rien. Il compare et rend compte. Les
 * corrections passent par une migration de données (recharger les fixtures purgerait le
 * contenu des utilisateurs) et par les fixtures elles-mêmes.
 *
 * Portée : les créatures appariées au livre, par identité de nom ou par un ALIAS explicite
 * dont la Défense, les PV et l'Initiative concordent (l'outil vérifie cette concordance et
 * proteste si elle se rompt). Le fichier servi compte 219 créatures ; celles qui ne viennent
 * pas du livre ne sont pas vérifiables ici, et leur silence n'est pas un satisfecit.
 *
 *   node scripts/audit-bestiaire.mjs            # écarts seulement
 *   node scripts/audit-bestiaire.mjs --tout     # + ce qui concorde et ce qui n'est pas apparié
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Le livre écrit ses négatifs avec un tiret insécable (U+2011) — celui-là même dont la
 *  perte explique probablement l'import. Les trois variantes reviennent au signe ASCII. */
const signeNormal = s => s.replace(/[‑−–]/g, '-');

const cle = nom => nom
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');

/** Découpe le chapitre en blocs de titre (### ou ####), chaque bloc gardant ses lignes. */
const blocsDuLivre = texte => {
    const blocs = new Map();
    let titre = null;
    for (const ligne of texte.split('\n')) {
        const t = /^#{3,4} (.+)$/.exec(ligne.trim());
        if (t) {
            titre = t[1].trim();
            if (!blocs.has(titre)) blocs.set(titre, []);
        } else if (titre) blocs.get(titre).push(ligne);
    }
    return blocs;
};

const champ = (lignes, nom) => {
    const re = new RegExp(`^- \\*\\*${nom} ?:\\*\\* (.+)$`);
    for (const l of lignes) {
        const m = re.exec(l.trim());
        if (m) return m[1].trim();
    }
    return undefined;
};

/**
 * « AGI +3* | CON +3 | … » → { AGI: { valeur: 3, superieure: true }, … }
 *
 * L'astérisque marque une caractéristique supérieure : « un dé bonus à tous les tests de
 * cette caractéristique ». Elle est servie sous `statsSuperior`, et l'outil la compare comme
 * il compare les valeurs.
 */
const caracsDuLivre = ligne => {
    const out = {};
    for (const part of (ligne ?? '').split('|')) {
        const m = /^(AGI|CON|FOR|PER|CHA|INT|VOL)\s*([+-]?\d+)(\*?)/.exec(signeNormal(part.trim()));
        if (m) out[m[1]] = { valeur: Number(m[2]), superieure: m[3] === '*' };
    }
    return out;
};

/** « 1/2 » est un NC valide (« ½ vaut 0 » pour l'attaque magique) ; la colonne est entière. */
const nombre = s => {
    if (s === undefined) return undefined;
    const t = signeNormal(s).trim();
    if (t.startsWith('1/2') || t.startsWith('½')) return 0.5;
    const m = /^([+-]?\d+)/.exec(t);
    return m ? Number(m[1]) : undefined;
};

/**
 * Profils du livre dont la créature servie porte un autre nom.
 *
 * Chaque paire est justifiée par l'égalité de la Défense, des PV et de l'Initiative — que
 * l'outil revérifie à chaque exécution : un alias qui cesserait de concorder est signalé
 * plutôt que silencieusement suivi. Une ressemblance de nom ne suffirait pas, et une
 * concordance de signature non plus : « Cheval de guerre » a exactement la signature du
 * « Cheval de selle » servi et n'est donc PAS apparié, faute de certitude.
 */
const ALIAS = {
    'Grand mâle': 'Bison, Grand mâle',
    'Mâle alpha': 'Loup, mâle alpha',
    'Hydre à cinq têtes': 'Hydre à 5 têtes',
    'Orc noir': 'Orque noir',
    'Berserker orc': 'Berserker orque',
    'Shaman orc': 'Shaman orque',
    'Sergent orc': 'Sergent orque',
    'Chef orc': 'Chef orque',
    'Squelette géant': 'Squelette de géant',
    'Zombie humain': 'Zombi humain',
};

const tout = process.argv.includes('--tout');

const livre = blocsDuLivre(readFileSync(
    join(racine, 'doc/getRulesFullToMD/partie3-mj/03-bestiaire-opposition.md'), 'utf8'));
const servies = JSON.parse(readFileSync(join(racine, 'backend/data/creatures.json'), 'utf8'));
const parCle = new Map(servies.map(c => [cle(c.name), c]));

let compares = 0, divergentes = 0, valeurs = 0, superieures = 0;
const nonApparies = [];

for (const [titre, lignes] of livre) {
    const caracs = caracsDuLivre(champ(lignes, 'Caractéristiques'));
    if (Object.keys(caracs).length === 0) continue;          // titre de section, pas un profil
    const servie = parCle.get(cle(ALIAS[titre] ?? titre));
    if (!servie) { nonApparies.push(titre); continue; }
    compares++;

    const ecarts = [];
    // Un alias ne vaut que par la concordance qui l'a justifié : si elle se rompt, c'est
    // qu'on n'apparie plus la même créature, et poursuivre la comparaison écrirait des
    // corrections sur le mauvais profil.
    if (ALIAS[titre]) {
        const sigLivre = ['Défense', 'Points de vigueur', 'Initiative'].map(n => nombre(champ(lignes, n)));
        const sigServi = [servie.def, servie.hp, servie.init];
        if (String(sigLivre) !== String(sigServi)) {
            ecarts.push(`ALIAS « ${titre} » → « ${ALIAS[titre]} » : DEF/PV/Init ${sigLivre} contre ${sigServi} — appariement à revoir`);
        }
    }
    for (const [nomLivre, colonne] of [['NC', 'nc'], ['Défense', 'def'], ['Points de vigueur', 'hp'], ['Initiative', 'init']]) {
        const attendu = nombre(champ(lignes, nomLivre));
        if (attendu !== undefined && servie[colonne] !== attendu) {
            ecarts.push(`${colonne} : livre ${attendu}, servi ${servie[colonne]}`);
        }
    }
    for (const [k, { valeur }] of Object.entries(caracs)) {
        if ((servie.stats ?? {})[k] !== valeur) {
            ecarts.push(`${k} : livre ${valeur}, servi ${(servie.stats ?? {})[k]}`);
            valeurs++;
        }
    }
    const sup = Object.entries(caracs).filter(([, c]) => c.superieure).map(([k]) => k);
    superieures += sup.length;
    const servieSup = servie.statsSuperior ?? [];
    // Comparaison d'ensembles : l'ordre n'a pas de sens pour une liste de caractéristiques.
    const manquantes = sup.filter(k => !servieSup.includes(k));
    const enTrop = servieSup.filter(k => !sup.includes(k));
    if (manquantes.length) ecarts.push(`caractéristiques supérieures manquantes : ${manquantes.join(', ')}`);
    if (enTrop.length) ecarts.push(`caractéristiques supérieures en trop : ${enTrop.join(', ')}`);

    if (ecarts.length) {
        divergentes++;
        console.log(`\n${titre}`);
        for (const e of ecarts) console.log(`  ${e}`);
        if (sup.length && tout) console.log(`  caractéristiques supérieures (non servies) : ${sup.join(', ')}`);
    } else if (tout) {
        console.log(`\n${titre}\n  concorde${sup.length ? ` — caractéristiques supérieures (non servies) : ${sup.join(', ')}` : ''}`);
    }
}

console.log(`\n${compares} créatures comparées, ${divergentes} divergentes sur ${valeurs} valeurs.`);
console.log(`${superieures} caractéristiques supérieures dans le livre, sur les profils appariés.`);
if (nonApparies.length) {
    console.log(`${nonApparies.length} profils du livre sans créature de même nom (variantes, noms différents) — non vérifiés.`);
    if (tout) for (const t of nonApparies) console.log(`  ${t}`);
}
console.log(`${servies.length - compares} créatures servies absentes du livre — non vérifiables ici.`);

// Sortie non nulle sur écart : utilisable comme garde.
process.exit(divergentes > 0 ? 1 : 0);
