#!/usr/bin/env node
/**
 * Standardize Profile JSON keys from French to English camelCase
 */

const fs = require('fs');
const path = require('path');

const profilesDir = path.join(__dirname, '../backend/data/Profils');

// Key mapping: French → English camelCase
const keyMap = {
    // Root level
    'classe': 'class',
    'maitrises': 'masteries',
    'equipement_depart': 'startingEquipment',
    'voies': 'paths',

    // Class level
    'nom': 'name',
    'description_generale': 'description',
    'statistiques': 'stats',
    'image_url': 'imageUrl',
    'note_legacy': 'noteLegacy',

    // Stats level
    'pv_par_niveau': 'hpPerLevel',
    'profil_type': 'profileType',
    'de_vie': 'hitDie',
    'carac_magique': 'magicStat',

    // Masteries level
    'armes': 'weapons',
    'armures': 'armors',
    'boucliers': 'shields',
    'contraintes': 'constraints',
    'special': 'special',
    'armes_armures': 'weaponsAndArmors',

    // Equipment level
    'objet': 'item',
    'stats': 'stats',
    'choix': 'choice',
    'ensemble': 'set',
    'exemples': 'examples',

    // Path level
    'capacites': 'abilities',
    'rang': 'rank',
    'type': 'type',
    'description_textuelle': 'description',
    'details': 'details'
};

// Recursive function to transform keys
function transformKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => transformKeys(item));
    }

    if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
            const newKey = keyMap[key] || key;
            newObj[newKey] = transformKeys(value);
        }
        return newObj;
    }

    return obj;
}

// Process all profile files
const files = fs.readdirSync(profilesDir).filter(f => f.endsWith('.json'));

let count = 0;
for (const file of files) {
    const filePath = path.join(profilesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const transformed = transformKeys(data);
    fs.writeFileSync(filePath, JSON.stringify(transformed, null, 4), 'utf-8');
    count++;
    console.log(`✅ ${file}`);
}

console.log(`\n✅ Transformed ${count} profile files`);

// Show sample
const samplePath = path.join(profilesDir, 'Barde.json');
const sample = JSON.parse(fs.readFileSync(samplePath, 'utf-8'));
console.log('\nSample (Barde.json structure):');
console.log(JSON.stringify(Object.keys(sample), null, 2));
console.log('class keys:', Object.keys(sample.class || {}));
