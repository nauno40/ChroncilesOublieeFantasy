import React from 'react';
import { LegalLayout } from './LegalLayout';

export const MentionsLegales: React.FC = () => (
    <LegalLayout title="Mentions légales">
        <h2>Éditeur du site</h2>
        <p>
            [À COMPLÉTER : nom et statut de l'éditeur (particulier, association, société), adresse postale,
            adresse e-mail de contact, et — si applicable — numéro SIRET.]
        </p>

        <h2>Directeur de la publication</h2>
        <p>[À COMPLÉTER]</p>

        <h2>Hébergement</h2>
        <p>[À COMPLÉTER : nom, adresse et contact de l'hébergeur retenu pour la mise en production.]</p>

        <h2>Propriété intellectuelle</h2>
        <p>
            Chroniques Oubliées Fantasy est un jeu de rôle édité par Black Book Éditions. Ce site est un outil
            non officiel, développé de façon indépendante, s'appuyant sur le corpus de règles publié sous
            licence libre ORC (« Open RPG Creative License »). Il n'est ni édité ni approuvé par Black Book
            Éditions.
        </p>
        <p>
            Le code source du site est [À COMPLÉTER : préciser la licence logicielle si elle est publiée, ou
            indiquer qu'il n'est pas public]. Le contenu communautaire (bibliothèque, monstres maison) publié
            par les membres leur appartient, dans les conditions prévues par les{' '}
            <a href="/cgu">conditions générales d'utilisation</a>.
        </p>

        <h2>Contact</h2>
        <p>Pour toute question relative au site : [À COMPLÉTER : adresse e-mail de contact].</p>
    </LegalLayout>
);
