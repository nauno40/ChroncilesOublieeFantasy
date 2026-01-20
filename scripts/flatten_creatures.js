#!/usr/bin/env node
/**
 * Flatten creatures.json from Drupal format to simple flat format
 * 
 * Drupal format: "name": [{"value": "Troll"}]
 * Target format: "name": "Troll"
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../backend/data/creatures.json');
const outputPath = path.join(__dirname, '../backend/data/creatures_flat.json');

// Read the source file
const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// Helper to extract value from Drupal field format
function extractValue(field, type = 'string') {
    if (!field || !Array.isArray(field) || field.length === 0) {
        return type === 'number' ? 0 : null;
    }

    const item = field[0];

    // Handle the "label" preference (for category, environment, etc.)
    if (item.label) {
        return item.label;
    }

    // Handle regular value
    if (item.value !== undefined) {
        if (type === 'number') {
            return parseInt(item.value, 10) || 0;
        }
        // Strip HTML tags
        if (typeof item.value === 'string') {
            return item.value.replace(/<[^>]*>/g, '').trim();
        }
        return item.value;
    }

    return type === 'number' ? 0 : null;
}

// Transform each creature
const flatCreatures = data.map((creature, index) => {
    const flat = {
        // Basic Info
        id: index + 1, // Generate sequential ID
        name: extractValue(creature.name) || 'Unknown',
        description: [
            extractValue(creature.appearance),
            extractValue(creature.description)
        ].filter(Boolean).join('\n'),

        // Stats
        nc: extractValue(creature.level, 'number'),
        hp: extractValue(creature.health_point, 'number'),
        def: extractValue(creature.defense, 'number'),
        init: extractValue(creature.init, 'number'),

        // Ability modifiers
        stats: {
            FOR: extractValue(creature.str_mod, 'number'),
            DEX: extractValue(creature.agi_mod, 'number'),
            CON: extractValue(creature.con_mod, 'number'),
            INT: extractValue(creature.int_mod, 'number'),
            SAG: extractValue(creature.per_mod, 'number'),
            CHA: extractValue(creature.cha_mod, 'number')
        },

        // Classification
        category: extractValue(creature.category),
        environment: extractValue(creature.environment),
        archetype: extractValue(creature.archetype),
        size: extractValue(creature.size),

        // Special
        specialAbilities: extractValue(creature.special_capabilities),

        // Picture - extract token URL
        picture: creature.picture?.[0]?.creature_token_url || null,

        // Attacks (keep as structured data)
        attacks: creature.attacks?.[0]?.data || null,

        // Capabilities (keep as structured data)
        capabilities: creature.capabilities || null,

        // Family reference (keep ID if exists)
        familyId: creature.creature_family?.[0]?.target_id || null
    };

    return flat;
});

// Write output
fs.writeFileSync(outputPath, JSON.stringify(flatCreatures, null, 2), 'utf-8');

console.log(`✅ Transformed ${flatCreatures.length} creatures`);
console.log(`   Input:  ${inputPath}`);
console.log(`   Output: ${outputPath}`);

// Show sample
console.log('\nSample output (first creature):');
console.log(JSON.stringify(flatCreatures[0], null, 2));
