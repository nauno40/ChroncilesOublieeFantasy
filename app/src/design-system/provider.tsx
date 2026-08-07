import React from 'react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Contexte minimal attendu par les briques d'interface.
 *
 * Plusieurs d'entre elles rendent des liens (`ContentCard`, `Card`, `GlobalSearch`) et
 * lèvent une erreur hors d'un routeur. Ce fournisseur en pose un en mémoire : il ne
 * navigue nulle part, il rend seulement les liens rendables — c'est exactement ce dont
 * une maquette a besoin, et rien de plus.
 */
export const DesignSystemProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <MemoryRouter>
        {/* Le fond sombre et la couleur de texte de base : le design system est
            sombre par construction, et sans cette assise ses surfaces translucides
            (`glass-panel`, bordures à faible opacité) se posent sur du blanc. */}
        <div className="bg-stone-950 text-stone-200 font-body min-h-full">{children}</div>
    </MemoryRouter>
);
