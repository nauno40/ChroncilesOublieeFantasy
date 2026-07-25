<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260725111148 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE homebrew_entry (id SERIAL NOT NULL, owner_id INT NOT NULL, category VARCHAR(40) NOT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, visibility VARCHAR(20) DEFAULT \'private\' NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_7A9A1F047E3C61F9 ON homebrew_entry (owner_id)');
        $this->addSql('COMMENT ON COLUMN homebrew_entry.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN homebrew_entry.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE homebrew_entry ADD CONSTRAINT FK_7A9A1F047E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE homebrew_entry DROP CONSTRAINT FK_7A9A1F047E3C61F9');
        $this->addSql('DROP TABLE homebrew_entry');
    }
}
