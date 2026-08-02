<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260802101936 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE homebrew_entry ADD parent_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE homebrew_entry ADD CONSTRAINT FK_7A9A1F04727ACA70 FOREIGN KEY (parent_id) REFERENCES homebrew_entry (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_7A9A1F04727ACA70 ON homebrew_entry (parent_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE homebrew_entry DROP CONSTRAINT FK_7A9A1F04727ACA70');
        $this->addSql('DROP INDEX IDX_7A9A1F04727ACA70');
        $this->addSql('ALTER TABLE homebrew_entry DROP parent_id');
    }
}
