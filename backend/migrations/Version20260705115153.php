<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260705115153 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE campaign_membership (id SERIAL NOT NULL, campaign_id INT NOT NULL, player_id INT NOT NULL, joined_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_41E8F22DF639F774 ON campaign_membership (campaign_id)');
        $this->addSql('CREATE INDEX IDX_41E8F22D99E6F5DF ON campaign_membership (player_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_campaign_player ON campaign_membership (campaign_id, player_id)');
        $this->addSql('COMMENT ON COLUMN campaign_membership.joined_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE campaign_membership ADD CONSTRAINT FK_41E8F22DF639F774 FOREIGN KEY (campaign_id) REFERENCES campaign (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE campaign_membership ADD CONSTRAINT FK_41E8F22D99E6F5DF FOREIGN KEY (player_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE campaign ADD invite_code VARCHAR(16) DEFAULT NULL');
        $this->addSql("UPDATE campaign SET invite_code = upper(substr(md5(random()::text || id::text), 1, 8)) WHERE invite_code IS NULL");
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1F1512DD6F21F112 ON campaign (invite_code)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE campaign_membership DROP CONSTRAINT FK_41E8F22DF639F774');
        $this->addSql('ALTER TABLE campaign_membership DROP CONSTRAINT FK_41E8F22D99E6F5DF');
        $this->addSql('DROP TABLE campaign_membership');
        $this->addSql('DROP INDEX UNIQ_1F1512DD6F21F112');
        $this->addSql('ALTER TABLE campaign DROP invite_code');
    }
}
