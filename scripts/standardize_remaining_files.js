#!/usr/bin/env node
/**
 * Standardize Remaining JSON files: families, profile_families, and Races/*.json
 */

const fs = require('fs');
const path = require('path');

// 1. Standardize families.json
const familiesPath = path.join(__dirname, '../backend/data/families.json');
if (fs.existsSync(familiesPath)) {
    const families = JSON.parse(fs.readFileSync(familiesPath, 'utf-8'));
    const standardizedFamilies = families.map(f => ({
        id: f.id,
        name: f.Famille || f.name,
        text: f.Text || f.description || f.text,
        image: f.Image || f.imageUrl || f.image,
        monsters: f.Monstres || f.monsters || []
    }));
    fs.writeFileSync(familiesPath, JSON.stringify(standardizedFamilies, null, 4), 'utf-8');
    console.log('✅ Standardized families.json');
}

// 2. Standardize profile_families.json
const profileFamiliesPath = path.join(__dirname, '../backend/data/profile_families.json');
if (fs.existsSync(profileFamiliesPath)) {
    const pFamilies = JSON.parse(fs.readFileSync(profileFamiliesPath, 'utf-8'));
    const standardizedPFamilies = pFamilies.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        baseHp: f.vigorPoints !== undefined ? f.vigorPoints : f.baseHp,
        recoveryDie: f.recoveryDie,
        luckPoints: f.luckPoints,
        specials: f.specials,
        manaStat: f.manaStat
    }));
    fs.writeFileSync(profileFamiliesPath, JSON.stringify(standardizedPFamilies, null, 4), 'utf-8');
    console.log('✅ Standardized profile_families.json');
}

// 3. Standardize Races/*.json
const racesDir = path.join(__dirname, '../backend/data/Races');
if (fs.existsSync(racesDir)) {
    const raceFiles = fs.readdirSync(racesDir).filter(f => f.endsWith('.json'));
    raceFiles.forEach(file => {
        const filePath = path.join(racesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (data.voies) {
            data.voies = data.voies.map(v => ({
                id: v.id,
                name: v.nom || v.name,
                description: v.description,
                details: v.details,
                abilities: (v.capacites || v.abilities || []).map(c => ({
                    name: c.nom || c.name,
                    rank: c.rang || c.rank,
                    description: c.description || c.description_textuelle,
                    type: c.type,
                    details: c.details
                }))
            }));
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
        console.log(`✅ Standardized Races/${file}`);
    });
}

// 4. Standardize Profils
const profilsDir = path.join(__dirname, '../backend/data/Profils');
if (fs.existsSync(profilsDir)) {
    const profilFiles = fs.readdirSync(profilsDir).filter(f => f.endsWith('.json'));
    profilFiles.forEach(file => {
        const filePath = path.join(profilsDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (data.class) {
            const c = data.class;
            data.class = {
                name: c.name,
                description: c.description || c.description_generale,
                imageUrl: c.imageUrl || c.image_url,
                note: c.note || c.note_legacy,
                stats: c.stats || c.statistiques || {},
                lore: c.lore
            };

            // Map common stat keys to English
            if (data.class.stats['Dé de Vie']) {
                data.class.stats.hitDie = data.class.stats['Dé de Vie'];
                delete data.class.stats['Dé de Vie'];
            }
        }

        if (data.voies) {
            data.voies = data.voies.map(v => ({
                name: v.name,
                description: v.description,
                abilities: (v.abilities || []).map(a => ({
                    rank: a.rank,
                    name: a.name,
                    type: a.type,
                    description: a.description,
                    details: a.details
                }))
            }));
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
        console.log(`✅ Standardized Profils/${file}`);
    });
}
