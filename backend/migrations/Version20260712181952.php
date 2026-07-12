<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260712181952 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE character_voie (id SERIAL NOT NULL, character_id INT NOT NULL, voie_id INT NOT NULL, rank INT NOT NULL, source VARCHAR(20) NOT NULL, choices JSON DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_B280FDE01136BE75 ON character_voie (character_id)');
        $this->addSql('CREATE INDEX IDX_B280FDE0EAAC89CF ON character_voie (voie_id)');
        $this->addSql('ALTER TABLE character_voie ADD CONSTRAINT FK_B280FDE01136BE75 FOREIGN KEY (character_id) REFERENCES "character" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE character_voie ADD CONSTRAINT FK_B280FDE0EAAC89CF FOREIGN KEY (voie_id) REFERENCES voie (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "character" ADD play_state JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE "character" DROP COLUMN data');
        $this->addSql('ALTER TABLE "character" ADD caracs JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE character_voie DROP CONSTRAINT FK_B280FDE01136BE75');
        $this->addSql('ALTER TABLE character_voie DROP CONSTRAINT FK_B280FDE0EAAC89CF');
        $this->addSql('DROP TABLE character_voie');
        $this->addSql('ALTER TABLE "character" ADD data JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE "character" DROP caracs');
        $this->addSql('ALTER TABLE "character" DROP play_state');
    }
}
