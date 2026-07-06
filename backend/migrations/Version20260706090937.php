<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260706090937 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la table custom_creature (monstres « maison » créés par un MJ, owner-scopés)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE custom_creature (id SERIAL NOT NULL, owner_id INT NOT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, nc INT NOT NULL, hp INT NOT NULL, def INT NOT NULL, init INT NOT NULL, stats JSON DEFAULT NULL, special_abilities JSON DEFAULT NULL, attacks JSON DEFAULT NULL, capabilities JSON DEFAULT NULL, picture VARCHAR(255) DEFAULT NULL, category VARCHAR(50) DEFAULT NULL, environment VARCHAR(50) DEFAULT NULL, archetype VARCHAR(50) DEFAULT NULL, size VARCHAR(50) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_CFBE8D907E3C61F9 ON custom_creature (owner_id)');
        $this->addSql('ALTER TABLE custom_creature ADD CONSTRAINT FK_CFBE8D907E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE custom_creature DROP CONSTRAINT FK_CFBE8D907E3C61F9');
        $this->addSql('DROP TABLE custom_creature');
    }
}
