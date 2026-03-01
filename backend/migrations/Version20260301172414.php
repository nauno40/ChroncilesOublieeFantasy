<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260301172414 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE clue ADD content TEXT NOT NULL');
        $this->addSql('ALTER TABLE clue ADD found_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE clue ADD status VARCHAR(20) NOT NULL');
        $this->addSql('ALTER TABLE clue DROP name');
        $this->addSql('ALTER TABLE clue DROP description');
        $this->addSql('ALTER TABLE quest ADD type VARCHAR(20) NOT NULL');
        $this->addSql('ALTER TABLE quest ADD status VARCHAR(20) NOT NULL');
        $this->addSql('ALTER TABLE quest DROP completed');
        $this->addSql('ALTER TABLE session ADD duration VARCHAR(50) DEFAULT NULL');
        $this->addSql('ALTER TABLE session ADD level VARCHAR(10) DEFAULT NULL');
        $this->addSql('ALTER TABLE session RENAME COLUMN notes TO summary');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE session DROP duration');
        $this->addSql('ALTER TABLE session DROP level');
        $this->addSql('ALTER TABLE session RENAME COLUMN summary TO notes');
        $this->addSql('ALTER TABLE quest ADD completed BOOLEAN NOT NULL');
        $this->addSql('ALTER TABLE quest DROP type');
        $this->addSql('ALTER TABLE quest DROP status');
        $this->addSql('ALTER TABLE clue ADD name VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE clue ADD description TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE clue DROP content');
        $this->addSql('ALTER TABLE clue DROP found_at');
        $this->addSql('ALTER TABLE clue DROP status');
    }
}
