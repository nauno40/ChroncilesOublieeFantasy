import React from 'react';
import { Badge } from 'app';

/** Les sept variantes, dans le vocabulaire où elles servent. */
export const Variantes = () => (
    <div className="flex flex-wrap items-center gap-2">
        <Badge variant="primary">Rang 3</Badge>
        <Badge variant="secondary">Voie de profil</Badge>
        <Badge variant="success">Public</Badge>
        <Badge variant="warning">Usage limité</Badge>
        <Badge variant="danger">Renversé</Badge>
        <Badge variant="info">Sort</Badge>
        <Badge variant="outline">Prestige</Badge>
    </div>
);

/** Les trois tailles, à variante constante. */
export const Tailles = () => (
    <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm">Petit</Badge>
        <Badge size="md">Moyen</Badge>
        <Badge size="lg">Grand</Badge>
    </div>
);

/** En usage : la ligne de badges d'une capacité. */
export const SurUneCapacite = () => (
    <div className="flex flex-wrap items-center gap-2">
        <Badge variant="primary" size="sm">Rang 2</Badge>
        <Badge variant="info" size="sm">Sort</Badge>
        <Badge variant="warning" size="sm">Limitée</Badge>
        <Badge variant="danger" size="sm">Étourdi</Badge>
    </div>
);
