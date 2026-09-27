import React from 'react';
import { LegalLayout } from './LegalLayout';
import { LEGAL_INFO, DERNIERE_MISE_A_JOUR } from './legalInfo';

export const CGU: React.FC = () => (
    <LegalLayout title="Conditions générales d'utilisation">
        <p><em>Dernière mise à jour : {DERNIERE_MISE_A_JOUR}</em></p>

        <h2>1. Objet</h2>
        <p>
            Chroniques Oubliées Fantasy — Compagnon (ci-après « le site ») est un outil numérique non officiel
            destiné aux joueurs et meneurs de jeu du jeu de rôle sur table Chroniques Oubliées Fantasy (COF2),
            édité sous licence ORC. Le site propose la gestion de personnages, d'outils de meneur de jeu
            (suivi de combat, lanceur de dés, panneau de sons), la consultation d'un compendium de règles, et
            une bibliothèque communautaire permettant à ses membres de créer et partager du contenu.
        </p>

        <h2>2. Acceptation</h2>
        <p>
            L'utilisation du site, avec ou sans compte, vaut acceptation pleine et entière des présentes
            conditions. Certaines fonctionnalités (créer et gérer des personnages, des campagnes, publier du
            contenu communautaire) exigent la création d'un compte.
        </p>

        <h2>3. Compte utilisateur</h2>
        <p>
            La création d'un compte requiert une adresse e-mail valide, confirmée par un lien envoyé à
            l'inscription. Chaque membre est responsable de la confidentialité de son mot de passe et de
            l'activité effectuée depuis son compte. Un membre peut supprimer son compte à tout moment depuis
            le site ; cette suppression est définitive et emporte la suppression des campagnes, personnages et
            contenus qu'il possède (voir la <a href="/confidentialite">politique de confidentialité</a> pour
            le détail).
        </p>

        <h2>4. Contenu communautaire</h2>
        <p>
            Un membre reste titulaire des droits sur le contenu qu'il crée (sorts, créatures, règles maison,
            etc.). En le rendant « public », il autorise le site à l'afficher aux autres membres et, pour
            certaines pages, aux visiteurs non connectés, ainsi qu'à permettre sa duplication par un autre
            membre pour son usage personnel. Cette autorisation cesse dès que le membre repasse son contenu en
            « privé » ou le supprime.
        </p>
        <p>Un membre s'engage à ne pas publier de contenu :</p>
        <ul>
            <li>illicite, diffamatoire, injurieux ou portant atteinte aux droits d'un tiers ;</li>
            <li>reproduisant des textes ou illustrations protégés du livre de règles officiel au-delà d'une courte citation ;</li>
            <li>à caractère commercial non autorisé.</li>
        </ul>
        <p>
            Tout membre peut signaler un contenu qu'il estime contraire à ces règles. Un contenu signalé peut
            être retiré par un administrateur ou un modérateur du site, qui peut également suspendre le compte
            à l'origine d'abus répétés.
        </p>

        <h2>5. Disponibilité et responsabilité</h2>
        <p>
            Le site est fourni « en l'état », à titre gratuit et non professionnel, sans garantie de
            disponibilité continue. Aucun engagement de disponibilité (SLA) n'est souscrit auprès d'un
            hébergeur à ce jour. L'éditeur ne saurait être tenu responsable d'une perte de données liée à un
            incident technique, sans préjudice de son obligation de moyens raisonnables pour la sécuriser
            (sauvegardes régulières une fois le site déployé en production).
        </p>

        <h2>6. Évolution des présentes conditions</h2>
        <p>
            Ces conditions peuvent être modifiées à tout moment ; la version en vigueur est celle publiée sur
            cette page, avec sa date de dernière mise à jour. Toute modification substantielle sera annoncée
            par un bandeau sur le site et, pour les membres inscrits, par e-mail.
        </p>

        <h2>7. Droit applicable</h2>
        <p>
            Les présentes conditions sont soumises au droit français. À défaut de résolution amiable, tout
            litige relève des tribunaux français compétents selon les règles de droit commun.
        </p>

        <h2>8. Contact</h2>
        <p>Pour toute question relative aux présentes conditions : {LEGAL_INFO.contactEmail}.</p>
    </LegalLayout>
);
