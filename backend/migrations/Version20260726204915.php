<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260726204915 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la visibilité privé/public aux monstres maison (partage communautaire).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE custom_creature ADD visibility VARCHAR(20) DEFAULT \'private\' NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE custom_creature DROP visibility');
    }
}
