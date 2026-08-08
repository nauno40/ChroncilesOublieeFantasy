import React from 'react';
import { TabGroup } from 'app';
import { Sword, Shield, Gem } from 'lucide-react';

/** Les sous-types d'une page d'équipement : le contenu suit l'onglet actif. */
export const SousTypes = () => (
    <div className="w-[560px]">
        <TabGroup
            tabs={[
                { id: 'armes', label: 'Armes', icon: Sword },
                { id: 'armures', label: 'Armures', icon: Shield },
                { id: 'materiel', label: 'Matériel', icon: Gem },
            ]}
        >
            {(actif) => (
                <p className="text-stone-400 text-sm mt-4">
                    Contenu de l’onglet <span className="text-primary-400 font-bold">{actif}</span>.
                </p>
            )}
        </TabGroup>
    </div>
);
