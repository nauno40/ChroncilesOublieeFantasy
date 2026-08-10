<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Corrige la description de l'état « Affaibli », héritée d'une autre édition.
 *
 * COF2 dit « Dé malus à tous les tests » (chapitre « Combat », § États préjudiciables) :
 * on lance un second d20 et on garde le plus faible. La description servie annonçait
 * « d12 pour tous les tests au lieu du d20 », qui est la règle de COF1 — un joueur qui la
 * lisait jetait le mauvais dé. Les mécaniques structurées (`effects.malusDie`), elles,
 * étaient déjà justes : seule la phrase était fausse.
 *
 * Migration de données plutôt que rechargement des fixtures : celui-ci purge les tables et
 * emporterait le contenu des utilisateurs.
 */
final class Version20260810120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Corrige la description de l'état « Affaibli » (dé malus, et non d12).";
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE harmful_state
            SET description = 'Dé malus à tous les tests'
            WHERE name = 'Affaibli' AND description LIKE 'd12%'
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE harmful_state
            SET description = 'd12 pour tous les tests au lieu du d20'
            WHERE name = 'Affaibli' AND description = 'Dé malus à tous les tests'
        SQL);
    }
}
