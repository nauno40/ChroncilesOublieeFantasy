export interface StartingEquipmentItem {
    id: string; // Refers to an equipment ID (weapon, armor, material)
    type: 'weapon' | 'armor' | 'material'; // Optional: helps with lookup, but maybe just infer from ID? Prefer explicit or unique IDs.
    quantity?: number; // Default 1
    label?: string; // Optional override label?
}

// In Profile:
// startingEquipment: StartingEquipmentItem[];
