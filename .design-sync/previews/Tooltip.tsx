import React from 'react';
import { Tooltip, Badge } from 'app';

/** L'infobulle se déclenche au survol : au repos, seul son déclencheur se voit.
 *  C'est l'état qu'une capture peut montrer honnêtement. */
export const SurUnBadge = () => (
    <div className="flex gap-3">
        <Tooltip content={{ name: 'Renversé', description: 'Att. -5, DEF -5 ; se relever coûte une action d’attaque.' }}>
            <Badge variant="danger">Renversé</Badge>
        </Tooltip>
        <Tooltip theme="amber" content={{ name: 'Affaibli', description: 'Dé malus à tous les tests.' }}>
            <Badge variant="warning">Affaibli</Badge>
        </Tooltip>
    </div>
);
