<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Déclare les deux invocations officielles qui désignent une créature du bestiaire.
 *
 * La colonne `summons` existait depuis que le suivi de combat sait ajouter une créature
 * invoquée (déclaration, jamais détection), mais AUCUNE des 650 capacités officielles ne la
 * portait : la fonctionnalité ne servait que le contenu maison et communautaire.
 *
 * La raison n'est pas un oubli, et elle mérite d'être écrite ici pour qu'on ne rouvre pas la
 * question : **à COF2, une invocation porte son profil dans le texte du sort**, pas dans le
 * bestiaire. L'élémentaire du magicien, le démon du sorcier et le serviteur invisible de
 * l'ensorceleur ont leurs caractéristiques dans leur propre description, souvent dérivées du
 * niveau du lanceur (« PV [niv. du magicien × 5] ») ; les rattacher à une entrée du bestiaire
 * poserait sur la table un profil qui n'est pas le leur.
 *
 * Trois familles restent donc non déclarables, et c'est un résultat, pas une lacune :
 *   - profil dans le texte du sort (élémentaire, démon, serviteur invisible) ;
 *   - le livre laisse le CHOIX au joueur (« monture géante de son choix — mammouth,
 *     dinosaure, aigle géant, etc. », monture fantastique, grand félin, petit compagnon) :
 *     désigner une créature reviendrait à choisir à sa place ;
 *   - ce n'est pas une créature (Ténèbres, Mur de pierre, Armée des morts — des dégâts de
 *     zone, pas des squelettes à suivre en initiative).
 *
 * Vérifié objectivement : aucune capacité de créature du bestiaire n'invoque une autre
 * créature du bestiaire.
 *
 * Migration de données plutôt que rechargement des fixtures, qui purge les tables et
 * emporterait le contenu des utilisateurs. Les fixtures portent la même déclaration.
 */
final class Version20260812140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Déclare les invocations de « Animation des morts » et « Panthère ».';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE capability SET summons = '[{"type": "creature", "ref": "Zombi humain"}]'::json
            WHERE name = 'Animation des morts'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability SET summons = '[{"type": "creature", "ref": "Panthère"}]'::json
            WHERE name = 'Panthère'
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE capability SET summons = NULL
            WHERE name IN ('Animation des morts', 'Panthère')
        SQL);
    }
}
