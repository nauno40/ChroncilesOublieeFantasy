<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260707092327 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la table encounter (rencontres préparées, enfant de campaign)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE encounter (id SERIAL NOT NULL, campaign_id INT NOT NULL, name VARCHAR(255) NOT NULL, notes TEXT DEFAULT NULL, combatants JSON DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_69D229CAF639F774 ON encounter (campaign_id)');
        $this->addSql('ALTER TABLE encounter ADD CONSTRAINT FK_69D229CAF639F774 FOREIGN KEY (campaign_id) REFERENCES campaign (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE encounter DROP CONSTRAINT FK_69D229CAF639F774');
        $this->addSql('DROP TABLE encounter');
    }
}
