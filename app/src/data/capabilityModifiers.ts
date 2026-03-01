
export interface Modifier {
    init?: number;
    def?: number;
}

export const CAPABILITY_MODIFIERS: Record<string, (rank: number) => Modifier> = {
    "Réflexes éclair": (rank: number) => ({
        init: 3,
        def: rank >= 5 ? 2 : 1
    }),
    "Murmures dans le vent": (_rank: number) => ({
        init: 1,
        def: 1
    }),
    "Divination": (rank: number) => {
        // "+1 en Init. et en DEF. Ce bonus augmente de +1 au rang 3... et de +1 chaque fois que ... atteint rang 5"
        // Simplified for now: +1 base, +1 at rank 3, +1 at rank 5.
        // Total: Rank 1-2: +1, Rank 3-4: +2, Rank 5: +3.
        let bonus = 1;
        if (rank >= 3) bonus += 1;
        if (rank >= 5) bonus += 1;
        return { init: bonus, def: bonus };
    },
    "Peau de pierre": (rank: number) => ({
        // Logic handled in sheet? Or simplified here: "+1 en DEF et ce bonus passe à +2 au rang 4"
        // The "Replace AGI with CON" part needs special handling in the sheet.
        // Here we just return the additive bonus part IF the replacement isn't used?
        // Let's just return the additive bonus for now.
        def: rank >= 4 ? 2 : 1
    }),
    "Armure de vent": (_rank: number) => ({
        // "s’il ne porte aucune armure... +2 DEF. Ce bonus passe à +3 au rang 5. S’il porte une armure... +1 en DEF."
        // We can't check armor here easily. 
        // We will return a base +1 (guaranteed). The extra +1/+2 if no armor needs logic in sheet.
        def: 1
    })
};
