<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Rétablit les caractéristiques négatives du bestiaire, perdues à l'import.
 *
 * Comparaison profil par profil du bestiaire servi avec celui du livre (Opposition) :
 * 62 créatures portent le même nom des deux côtés, et 30 d'entre elles divergent sur
 * 46 valeurs. TOUTES les divergences portent sur une valeur négative du livre — jamais
 * sur une positive, jamais sur la Défense, les PV ou l'Initiative, identiques partout.
 * Le plus souvent la valeur a disparu (le squelette voit son INT ‑4 servie à 0), parfois
 * elle a glissé (INT ‑1 servie ‑2).
 *
 * Ce n'est pas cosmétique : le MJ qui fait tester l'INT d'un squelette lance à +0 au lieu
 * de ‑4, soit quatre points d'écart sur un d20.
 *
 * Migration de données plutôt que rechargement des fixtures — celui-ci purge les tables et
 * emporterait le contenu des utilisateurs. Les fixtures sont corrigées à la source dans le
 * même commit. Les 157 créatures absentes du livre ne sont pas touchées : rien ne permet
 * de les vérifier, et les corriger au jugé serait inventer.
 */
final class Version20260811140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rétablit 46 caractéristiques négatives sur 30 créatures (COF2, Opposition).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 1, "FOR": 1, "PER": 0, "CHA": 0, "INT": 0, "VOL": -1}'::json WHERE name = 'Bandit de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 1, "FOR": 1, "PER": 0, "CHA": 0, "INT": -1, "VOL": -1}'::json WHERE name = 'Milicien'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 1, "FOR": 2, "PER": 0, "CHA": 0, "INT": -1, "VOL": 0}'::json WHERE name = 'Garde de la ville'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 1, "FOR": -1, "PER": 0, "CHA": 1, "INT": 3, "VOL": 3}'::json WHERE name = 'Sorcier'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 4, "FOR": 4, "PER": 2, "CHA": -2, "INT": -4, "VOL": -2}'::json WHERE name = 'Bison'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 4, "FOR": 4, "PER": 0, "CHA": -1, "INT": -4, "VOL": -2}'::json WHERE name = 'Cheval de selle'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 3, "CON": 5, "FOR": 5, "PER": 0, "CHA": -3, "INT": -4, "VOL": 2}'::json WHERE name = 'Requin'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 4, "FOR": 4, "PER": 0, "CHA": -2, "INT": -4, "VOL": 0}'::json WHERE name = 'Serpent constricteur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 3, "CON": 0, "FOR": -3, "PER": 2, "CHA": -2, "INT": -4, "VOL": -2}'::json WHERE name = 'Serpent venimeux'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 4, "CON": 3, "FOR": 3, "PER": 2, "CHA": -4, "INT": -4, "VOL": 0}'::json WHERE name = 'Araignée géante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 3, "FOR": 3, "PER": 2, "CHA": -1, "INT": -4, "VOL": 0}'::json WHERE name = 'Basilic'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 3, "CON": -2, "FOR": -2, "PER": 2, "CHA": 0, "INT": 1, "VOL": -1}'::json WHERE name = 'Démonet'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 2, "CON": 6, "FOR": 6, "PER": 0, "CHA": -2, "INT": -2, "VOL": 4}'::json WHERE name = 'Elémentaire d''eau, grand'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": -1, "CON": 12, "FOR": 12, "PER": 2, "CHA": 0, "INT": 0, "VOL": 0}'::json WHERE name = 'Géant du feu'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 8, "FOR": 8, "PER": 2, "CHA": -2, "INT": -4, "VOL": 2}'::json WHERE name = 'Geoselachis'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 3, "FOR": 3, "PER": 0, "CHA": -2, "INT": -2, "VOL": -2}'::json WHERE name = 'Gnoll de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 4, "FOR": 4, "PER": 0, "CHA": -1, "INT": -1, "VOL": -1}'::json WHERE name = 'Sergent gnoll'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 4, "FOR": 4, "PER": 0, "CHA": -1, "INT": -1, "VOL": 0}'::json WHERE name = 'Chef Gnoll'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 2, "CON": -1, "FOR": -1, "PER": 0, "CHA": -2, "INT": -2, "VOL": -2}'::json WHERE name = 'Gobelin de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 2, "CON": 0, "FOR": 0, "PER": 0, "CHA": -1, "INT": -1, "VOL": -1}'::json WHERE name = 'Gobelin élite'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 4, "FOR": 4, "PER": 2, "CHA": -4, "INT": 1, "VOL": 4}'::json WHERE name = 'Abomination'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 3, "CON": 6, "FOR": 6, "PER": 2, "CHA": 0, "INT": -3, "VOL": 1}'::json WHERE name = 'Griffon'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 8, "FOR": 8, "PER": 0, "CHA": -2, "INT": -4, "VOL": 2}'::json WHERE name = 'Cryohydre à dix têtes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 2, "CON": -1, "FOR": -1, "PER": 1, "CHA": -2, "INT": 0, "VOL": -2}'::json WHERE name = 'Kobold de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 3, "CON": 6, "FOR": 6, "PER": 2, "CHA": -2, "INT": 3, "VOL": 6}'::json WHERE name = 'Momie auguste'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 6, "FOR": 6, "PER": 2, "CHA": -2, "INT": -4, "VOL": 3}'::json WHERE name = 'Ourhible'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 1, "FOR": 1, "PER": 2, "CHA": -4, "INT": -4, "VOL": -2}'::json WHERE name = 'Rat géant'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 6, "FOR": 6, "PER": 2, "CHA": -4, "INT": -4, "VOL": 2}'::json WHERE name = 'Skrambler'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 1, "FOR": 1, "PER": -1, "CHA": -4, "INT": -4, "VOL": 6}'::json WHERE name = 'Squelette de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 5, "FOR": 5, "PER": 2, "CHA": -2, "INT": -4, "VOL": 2}'::json WHERE name = 'Worg'
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 1, "FOR": 1, "PER": 0, "CHA": 0, "INT": 0, "VOL": 0}'::json WHERE name = 'Bandit de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 1, "FOR": 1, "PER": 0, "CHA": 0, "INT": -2, "VOL": 0}'::json WHERE name = 'Milicien'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 1, "FOR": 2, "PER": 0, "CHA": 0, "INT": 0, "VOL": 0}'::json WHERE name = 'Garde de la ville'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 1, "FOR": 0, "PER": 0, "CHA": 1, "INT": 3, "VOL": 3}'::json WHERE name = 'Sorcier'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 4, "FOR": 4, "PER": 2, "CHA": -2, "INT": -4, "VOL": 0}'::json WHERE name = 'Bison'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 4, "FOR": 4, "PER": 0, "CHA": 0, "INT": -4, "VOL": 0}'::json WHERE name = 'Cheval de selle'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 3, "CON": 5, "FOR": 5, "PER": 0, "CHA": 0, "INT": 0, "VOL": 2}'::json WHERE name = 'Requin'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 4, "FOR": 4, "PER": 0, "CHA": -4, "INT": -4, "VOL": 0}'::json WHERE name = 'Serpent constricteur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 3, "CON": 0, "FOR": -3, "PER": 2, "CHA": -4, "INT": -4, "VOL": 0}'::json WHERE name = 'Serpent venimeux'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 4, "CON": 3, "FOR": 3, "PER": 2, "CHA": 0, "INT": 0, "VOL": 0}'::json WHERE name = 'Araignée géante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 3, "FOR": 3, "PER": 2, "CHA": 0, "INT": -4, "VOL": 0}'::json WHERE name = 'Basilic'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 3, "CON": 0, "FOR": 0, "PER": 2, "CHA": 0, "INT": 1, "VOL": 0}'::json WHERE name = 'Démonet'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 2, "CON": 6, "FOR": 6, "PER": 0, "CHA": -2, "INT": -4, "VOL": 4}'::json WHERE name = 'Elémentaire d''eau, grand'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 12, "FOR": 12, "PER": 2, "CHA": 0, "INT": 0, "VOL": 0}'::json WHERE name = 'Géant du feu'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 8, "FOR": 8, "PER": 2, "CHA": 0, "INT": 0, "VOL": 2}'::json WHERE name = 'Geoselachis'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 3, "FOR": 3, "PER": 0, "CHA": -2, "INT": -2, "VOL": 0}'::json WHERE name = 'Gnoll de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 4, "FOR": 4, "PER": 0, "CHA": 0, "INT": 0, "VOL": 0}'::json WHERE name = 'Sergent gnoll'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 4, "FOR": 4, "PER": 0, "CHA": -2, "INT": -2, "VOL": 0}'::json WHERE name = 'Chef Gnoll'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 2, "CON": -1, "FOR": -1, "PER": 0, "CHA": -2, "INT": -2, "VOL": 0}'::json WHERE name = 'Gobelin de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 2, "CON": 0, "FOR": 0, "PER": 0, "CHA": -2, "INT": -2, "VOL": 0}'::json WHERE name = 'Gobelin élite'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 4, "FOR": 4, "PER": 2, "CHA": 0, "INT": 1, "VOL": 4}'::json WHERE name = 'Abomination'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 3, "CON": 6, "FOR": 6, "PER": 2, "CHA": 0, "INT": -2, "VOL": 1}'::json WHERE name = 'Griffon'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 8, "FOR": 8, "PER": 0, "CHA": 0, "INT": 0, "VOL": 2}'::json WHERE name = 'Cryohydre à dix têtes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 2, "CON": -1, "FOR": -1, "PER": 1, "CHA": -2, "INT": 0, "VOL": 0}'::json WHERE name = 'Kobold de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 3, "CON": 6, "FOR": 6, "PER": 2, "CHA": 0, "INT": 3, "VOL": 6}'::json WHERE name = 'Momie auguste'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 6, "FOR": 6, "PER": 2, "CHA": 0, "INT": 0, "VOL": 3}'::json WHERE name = 'Ourhible'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 1, "FOR": 1, "PER": 2, "CHA": -4, "INT": -4, "VOL": 0}'::json WHERE name = 'Rat géant'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 6, "FOR": 6, "PER": 2, "CHA": 0, "INT": 0, "VOL": 2}'::json WHERE name = 'Skrambler'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 1, "FOR": 1, "PER": -2, "CHA": -4, "INT": -4, "VOL": 6}'::json WHERE name = 'Squelette de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 1, "CON": 5, "FOR": 5, "PER": 2, "CHA": -2, "INT": -2, "VOL": 2}'::json WHERE name = 'Worg'
        SQL);
    }
}
