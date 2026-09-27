import React from 'react';
import { LegalLayout } from './LegalLayout';
import { LEGAL_INFO } from './legalInfo';

export const MentionsLegales: React.FC = () => (
    <LegalLayout title="Mentions légales">
        <h2>Éditeur du site</h2>
        <p>
            {LEGAL_INFO.exploitantNom} ({LEGAL_INFO.exploitantStatut}).<br />
            Adresse : {LEGAL_INFO.adressePostale}.<br />
            Contact : {LEGAL_INFO.contactEmail}.
        </p>

        <h2>Directeur de la publication</h2>
        <p>{LEGAL_INFO.exploitantNom}.</p>

        <h2>Hébergement</h2>
        <p>
            {LEGAL_INFO.hebergeurNom} — {LEGAL_INFO.hebergeurAdresse}.
            Le site n'est pas encore déployé en production à ce jour ; cette section sera complétée au
            moment de la mise en ligne effective.
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
            Chroniques Oubliées Fantasy est un jeu de rôle édité par Black Book Éditions. Ce site est un outil
            non officiel, développé de façon indépendante, s'appuyant sur le corpus de règles publié sous
            licence libre ORC (« Open RPG Creative License »). Il n'est ni édité ni approuvé par Black Book
            Éditions.
        </p>
        <p>
            Le code source du site n'est pas publié sous licence libre à ce jour. Le contenu communautaire
            (bibliothèque, monstres maison) publié par les membres leur appartient, dans les conditions
            prévues par les <a href="/cgu">conditions générales d'utilisation</a>.
        </p>

        <h2>Contact</h2>
        <p>Pour toute question relative au site : {LEGAL_INFO.contactEmail}.</p>
    </LegalLayout>
);
