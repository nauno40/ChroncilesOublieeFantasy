import React from 'react';
import { LegalLayout } from './LegalLayout';

export const Confidentialite: React.FC = () => (
    <LegalLayout title="Politique de confidentialité">
        <p><em>Dernière mise à jour : [À COMPLÉTER]</em></p>

        <h2>1. Responsable de traitement</h2>
        <p>[À COMPLÉTER : nom et contact de la personne ou entité responsable du traitement des données.]</p>

        <h2>2. Données collectées</h2>
        <p>Le site collecte uniquement les données nécessaires à son fonctionnement :</p>
        <ul>
            <li>à l'inscription : adresse e-mail, pseudo, mot de passe (jamais stocké en clair, uniquement sous forme hachée) ;</li>
            <li>le contenu que vous créez volontairement : campagnes, personnages, fiches de bibliothèque et de monstres maison, favoris, commentaires, signalements ;</li>
            <li>aucune autre donnée n'est collectée : le site ne dépose aucun cookie de mesure d'audience ni de publicité, et n'utilise aucun outil d'analyse tiers.</li>
        </ul>
        <p>
            La connexion repose sur un jeton d'authentification conservé dans le stockage local de votre
            navigateur (<code>localStorage</code>), jamais transmis à un tiers autre que le serveur du site.
        </p>

        <h2>3. Finalités</h2>
        <p>Vos données sont utilisées pour :</p>
        <ul>
            <li>vous permettre de créer un compte et de vous authentifier ;</li>
            <li>faire fonctionner les fonctionnalités que vous utilisez (campagnes, personnages, bibliothèque communautaire) ;</li>
            <li>
                vous envoyer les e-mails strictement nécessaires au service : confirmation d'adresse à
                l'inscription, réinitialisation de mot de passe, et notification quand quelqu'un commente ou met
                en favori un contenu que vous avez publié, ou quand un signalement que vous avez déposé est
                traité.
            </li>
        </ul>
        <p>Aucune de vos données n'est vendue, louée ou partagée à des fins commerciales ou publicitaires.</p>

        <h2>4. Base légale</h2>
        <p>
            Le traitement de vos données repose sur l'exécution du service que vous avez demandé en créant un
            compte (article 6.1.b du RGPD).
        </p>

        <h2>5. Durée de conservation</h2>
        <p>
            Vos données sont conservées tant que votre compte existe. Vous pouvez le supprimer à tout moment
            depuis le site ; cette suppression entraîne celle de vos campagnes, personnages et contenus
            communautaires publiés (voir le détail ci-dessous, §7).
        </p>

        <h2>6. Vos droits</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants sur vos données :</p>
        <ul>
            <li>
                <strong>droit d'accès et de portabilité</strong> : un bouton « Exporter mes données », accessible
                depuis votre profil une fois connecté, vous permet de télécharger l'intégralité de vos données
                (compte, campagnes, personnages, bibliothèque, favoris, commentaires, signalements) au format
                JSON ;
            </li>
            <li><strong>droit de rectification</strong> : directement depuis le site, pour les données que vous avez saisies ;</li>
            <li>
                <strong>droit à l'effacement</strong> : la suppression de votre compte, accessible depuis le
                site, efface définitivement vos campagnes, personnages, monstres maison et entrées de
                bibliothèque (y compris publiées). Vos fiches de personnage rattachées à la campagne d'un autre
                meneur de jeu sont détachées plutôt que supprimées, pour ne pas perturber sa partie en cours ;
            </li>
            <li><strong>droit d'opposition et de limitation</strong> : en nous contactant (coordonnées ci-dessous).</li>
        </ul>
        <p>
            Vous pouvez également introduire une réclamation auprès de la CNIL (
            <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">www.cnil.fr</a>) si vous estimez que
            vos droits ne sont pas respectés.
        </p>

        <h2>7. Sécurité</h2>
        <p>
            Les mots de passe sont stockés sous forme hachée, jamais en clair. [À COMPLÉTER : préciser le
            chiffrement des communications (HTTPS) une fois le site en production, et les mesures de sauvegarde
            mises en place.]
        </p>

        <h2>8. Contact</h2>
        <p>Pour exercer vos droits ou pour toute question relative à cette politique : [À COMPLÉTER : adresse e-mail de contact].</p>
    </LegalLayout>
);
