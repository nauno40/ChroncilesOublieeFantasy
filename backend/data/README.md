# Data Files

## Structure

This directory contains both **legacy** and **normalized** data files.

### Normalized Files (✅ Use These)
- `voies.json` - Character paths with profile references
- `capacites.json` - Abilities with profile/voie references
- `weapons.json` - Weapons with IDs
- `armors.json` - Armors with IDs
- `materials.json` - Materials with IDs
- `food.json` - Food items with IDs
- `lodging.json` - Lodging options with IDs
- `mounts.json` - Mounts with IDs
- `states.json` - Harmful states with IDs

### Legacy Files (⚠️ Deprecated)
- `Voies.json` - Use `voies.json` instead
- `Capacités.json` - Use `capacites.json` instead
- `Armes.json` - Use `weapons.json` instead
- `Armures.json` - Use `armors.json` instead
- `Materiels.json` - Use `materials.json` instead
- `Nourriture.json` - Use `food.json` instead
- `Logements.json` - Use `lodging.json` instead
- `Montures.json` - Use `mounts.json` instead
- `Etats.json` - Use `states.json` instead

## Key Differences

1. **IDs**: All normalized files have unique `id` fields (slugs)
2. **Naming**: camelCase instead of PascalCase or French accents
3. **Relationships**: Explicit ID references instead of string matching
4. **Types**: Proper number types where appropriate

## Migration

See `/home/nauno/.gemini/antigravity/brain/3e8065a5-8897-4de2-9ee4-da983afbc0d9/migration_guide.md` for full migration guide.

## TypeScript Types

Import from `types/normalized.ts`:
```typescript
import type { Race, Profile, Voie, Capacity } from '../types/normalized';
```
