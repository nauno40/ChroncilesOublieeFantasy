const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../src/data');

// Helper to slugify text for IDs
const slugify = (text) => {
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '_')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '_')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
};

// 1. Load Data
const voies = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'voies.json'), 'utf8'));
const families = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'families.json'), 'utf8'));
const creatures = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'creatures.json'), 'utf8'));
const races = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'races.json'), 'utf8'));

// Map Voie Names to IDs
const voieMap = new Map();
voies.forEach(v => {
    voieMap.set(v.name.toLowerCase(), v.id);
    voieMap.set(slugify(v.name), v.id); // fallback
});
// Special manual mappings
voieMap.set('voie du prédateur', 'voie_du_predateur'); // canonical might change
voieMap.set('voie des créatures élémentaires', 'voie_des_creatures_elementaire_du_feu');
voieMap.set('voie des creatures elementaires', 'voie_des_creatures_elementaire_du_feu');
voieMap.set('voie du colosse', 'voie_du_colosse'); // ensure this exists

const cleanName = (name) => {
    return name.toLowerCase()
        .replace(/[.,:;()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

// 2. Refactor Families
// Add ID to each family
const familyMap = new Map(); // Name -> ID
families.forEach(f => {
    if (!f.id) {
        f.id = slugify(f.Famille);
    }
    familyMap.set(f.Famille, f.id);
});

// 3. Refactor Races
races.forEach(r => {
    // Try to find a Voie that matches the race name
    // e.g. "Elfe sylvain" -> "Voie de l'elfe sylvain"
    const raceName = r.name;
    const candidates = [
        `Voie de l'${raceName}`,
        `Voie du ${raceName}`,
        `Voie de la ${raceName}`,
        `Voie des ${raceName}s`
    ];

    // Also try direct approximate matching in voieMap keys
    for (const v of voies) {
        if (v.name.toLowerCase().includes(raceName.toLowerCase()) && v.type === 'Race') {
            r.voieId = v.id;
            break;
        }
    }
});

// 4. Refactor Creatures
creatures.forEach(c => {
    // A. Refactor Family
    // Check existing creature_family structure
    if (c.creature_family && c.creature_family.length > 0) {
        const famLabel = c.creature_family[0].label;
        if (famLabel && familyMap.has(famLabel)) {
            c.family_id = familyMap.get(famLabel);
        }
    }
    // If not found in structure, try to match by name? No, safer to stick to existing label.

    // B. Refactor Paths (Voies)
    // Structure: "paths": [{ "value": "<p><strong>Voie du colosse</strong> rang 1</p>" }]
    if (c.paths && c.paths.length > 0) {
        const newPaths = [];
        c.paths.forEach(pObj => {
            const html = pObj.value;
            if (!html) return;
            // simple parsing: look for "Voie ..." and "rang X"
            // Regex to capture "Voie ......" until "rang" or end of tag
            // Matches: <strong>Voie du colosse</strong> rang 1
            // or <strong>Voie du colosse</strong> rang 1<br />
            const regex = /Voie [^<]+|rang \d+/gi;
            // Better regex: extract the name inside strong/b or just "Voie X" text
            // Text often: "Voie du colosse rang 1"

            // Remove HTML tags to get pure text
            let text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            // Specific fix
            text = text.replace("capacité de rang", "rang").replace("rang 1 et rang 3", "rang 3");

            console.log(`Analyzing: "${text}"`);

            // Split by "Voie" if multiple?
            // Some HTML has multiple lines: <p>Voie A rang 1<br/>Voie B rang 2</p>
            const parts = text.split(/Voie /i).filter(s => s.trim().length > 0);

            console.log(`Parts found: ${parts.length}`);

            parts.forEach(part => {
                const fullPart = "Voie " + part;
                // Extract Rank
                const rankMatch = /rang\s+(\d+)/i.exec(fullPart);
                const rank = rankMatch ? parseInt(rankMatch[1]) : 1;

                // Extract Name: "Voie du colosse"
                // Usually everything before "rang"
                let name = fullPart.split(/rang/i)[0].trim();

                // Lookup ID
                const cleaned = cleanName(name);
                let id = voieMap.get(cleaned);

                if (!id) {
                    // Try slugify equivalence
                    id = voieMap.get(slugify(name));
                }

                if (!id) {
                    // Fuzzy search?
                    // iterate keys
                    for (const [k, v] of voieMap.entries()) {
                        // Check plural s
                        if (cleaned === k + 's' || cleaned + 's' === k) {
                            id = v;
                            break;
                        }
                    }
                }

                if (id) {
                    newPaths.push({
                        id: id,
                        rank: rank
                    });
                } else {
                    console.log(`Failed to find ID for Voie: "${name}" (cleaned: "${cleaned}")`);
                }
            });
        });

        if (newPaths.length > 0) {
            console.log(`Updated paths for creature: ${newPaths.length} items`);
            c.paths = newPaths; // Replace old structure with new structure
        } else {
            // console.log("No new paths created for creature");
        }
    }
});

// 5. Write Back
// Formatter using 4 spaces
const writeJSON = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 4));

writeJSON(path.join(DATA_DIR, 'families.json'), families);
writeJSON(path.join(DATA_DIR, 'races.json'), races);
writeJSON(path.join(DATA_DIR, 'creatures.json'), creatures);

console.log('Migration complete.');
