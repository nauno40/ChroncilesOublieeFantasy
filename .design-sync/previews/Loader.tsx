import React from 'react';
import { Loader } from 'app';

/** Le chargement par défaut. */
export const ParDefaut = () => <Loader />;

/** Avec un libellé propre au contexte. */
export const AvecLibelle = () => <Loader label="Chargement du bestiaire…" />;
