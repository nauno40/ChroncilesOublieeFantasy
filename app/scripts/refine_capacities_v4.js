import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../src/data/capacites.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const capacities = JSON.parse(rawData);

const activeKeywords = [
    '(L)', '(*)',
    'action standard', 'action de mouvement', 'action gratuite', 'action simple',
    'peut utiliser', 'peut lancer', 'peut effectuer', 'peut choisir', 'peut tirer',
    'réalise une attaque', 'fait une attaque', 'effectue une attaque',
    'attaque magique', 'attaque à distance', 'attaque au contact',
    'sur un test', 'en cas de réussite',
    'la créature parcourt', 'la créature attaque',
    'une fois par tour', 'une fois par combat',
    'inflige', 'subit',
    'faut un tour complet',
    'le magicien désigne', 'le magicien se concentre',
    'le prêtre désigne', 'le prêtre se concentre',
    'le druide désigne', 'le druide se concentre',
    'crache', 'souffle',
    'devient invisible', 'se rend invisible',
    'est capable de réaliser', 'est capable de lancer',
    'il peut', 'elle peut'
];

const passiveKeywords = [
    'gagne un bonus', 'obtient un bonus', 'reçoit un bonus',
    'est immunisé', 'insensible',
    'les dés de vie', '+ PV',
    'le personnage gagne', 'la créature gagne',
    'ajoute son mod', 'ajoute +',
    'permanent', 'toujours', 'constamment',
    'au rang'
];

// Specific overrides if heuristics fail
const forceActive = [
    'charge', 'charge_l', 'charge_brutale',
    'soins_moderes', 'soins_legers', 'soins_critiques',
    'lumiere', 'detection_de_la_magie', 'protection_contre_les_elements',
    'forme_darbre', 'nappe_de_brouillard', 'passage_vegetal',
    'deblocage', 'detection_des_pieges',
    'cri_de_guerre',
    'invisibilite', 'tir_parabolique', 'tir_mortel',
    'arme_dargent', 'arme_magique',
    'flash_magique', 'mur_de_force'
];

const forcePassive = [
    'sens_afftes', 'sens_aigus', 'defense', 'armure_naturelle',
    'mecanismes'
];


const updatedCapacities = capacities.map(cap => {
    let isActive = false;
    const desc = cap.description.toLowerCase();
    const name = cap.name.toLowerCase();
    const id = cap.id.toLowerCase();

    // 1. Check Forced Lists
    if (forceActive.some(k => id.includes(k))) return { ...cap, active: true };
    if (forcePassive.some(k => id.includes(k))) return { ...cap, active: false };

    // 2. Heuristics for ACTIVE
    if (activeKeywords.some(k => name.includes(k.toLowerCase()) || desc.includes(k.toLowerCase()))) {
        isActive = true;
    }

    // 3. Strong signals for PASSIVE (override active unless it contains explicit "Action")
    if (passiveKeywords.some(k => desc.includes(k.toLowerCase()))) {
        // If saying "Passive" things, double check it isn't an active buff

        const isAction = activeKeywords.some(k => desc.includes(k.toLowerCase())) || name.includes('(l)');
        // Special case: "Il peut appliquer ce bonus" shouldn't trigger active if it's just about applying a passive bonus
        const isJustApplyingBonus = desc.includes('appliquer ce bonus') || desc.includes('appliquer son bonus');

        if (!isAction || isJustApplyingBonus) {
            isActive = false;
        }
    }

    return {
        ...cap,
        active: isActive
    };
});

fs.writeFileSync(inputPath, JSON.stringify(updatedCapacities, null, 2));

console.log(`Processed ${updatedCapacities.length} capacities.`);
const activeCount = updatedCapacities.filter(c => c.active).length;
console.log(`Identified ${activeCount} active and ${updatedCapacities.length - activeCount} passive.`);
