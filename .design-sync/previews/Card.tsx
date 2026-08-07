import React from 'react';
import { Card, Badge, imagePlaceholder } from 'app';

/** La carte de liste historique, avec son image et son repli. */
export const AvecImage = () => (
    <div className="w-[300px]">
        <Card to="/races/1" image={{ src: imagePlaceholder('Nain'), alt: 'Nain' }}>
            <h3 className="font-display font-bold text-stone-100">Nain</h3>
            <p className="text-sm text-stone-400 mt-1">Bâtisseurs obstinés des montagnes.</p>
        </Card>
    </div>
);

/** Sans image : la carte se réduit à son corps. */
export const SansImage = () => (
    <div className="w-[300px]">
        <Card onClick={() => {}}>
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-bold text-stone-100">Voie du bouclier</h3>
                <Badge variant="secondary" size="sm">Guerrier</Badge>
            </div>
        </Card>
    </div>
);
