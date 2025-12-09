import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../src/data/materials.json');
const rawData = fs.readFileSync(inputPath, 'utf8');
const materials = JSON.parse(rawData);

// keywords that start the "notes" section
const splitKeywords = [
    'Durée :',
    'Portée :',
    'Nombre :',
    'Sans ces outils',
    'Soigne',
    '(15m)' // specific fix for rope
];

const refinedMaterials = materials.map(mat => {
    let name = mat.name;
    let notes = '';

    // Special case for parenthesis
    if (name.includes('(') && name.includes(')')) {
        const match = name.match(/^(.*?)(\(.*\))$/);
        if (match) {
            // Keep distinct logic if needed, but for now strict split is safer
        }
    }

    // Try to find the earliest split point
    let splitIndex = -1;
    let keywordFound = '';

    for (const kw of splitKeywords) {
        const idx = name.indexOf(kw);
        if (idx !== -1 && (splitIndex === -1 || idx < splitIndex)) {
            splitIndex = idx;
            keywordFound = kw;
        }
    }

    if (splitIndex !== -1) {
        notes = name.substring(splitIndex).trim();
        name = name.substring(0, splitIndex).trim();
    }

    // Clean formatting
    if (notes.startsWith('(') && notes.endsWith(')')) {
        notes = notes.slice(1, -1);
    }

    return {
        ...mat,
        name: name,
        notes: notes || undefined
    };
});

fs.writeFileSync(inputPath, JSON.stringify(refinedMaterials, null, 2));
console.log(`Refined ${refinedMaterials.length} materials.`);
