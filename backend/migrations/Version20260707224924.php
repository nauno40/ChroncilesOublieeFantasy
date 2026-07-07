<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260707224924 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la table password_reset_token (réinitialisation de mot de passe)';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE password_reset_token (id SERIAL NOT NULL, user_id INT NOT NULL, hashed_token VARCHAR(64) NOT NULL, expires_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6B7BA4B6BD2BA26B ON password_reset_token (hashed_token)');
        $this->addSql('CREATE INDEX IDX_6B7BA4B6A76ED395 ON password_reset_token (user_id)');
        $this->addSql('COMMENT ON COLUMN password_reset_token.expires_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE password_reset_token ADD CONSTRAINT FK_6B7BA4B6A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE password_reset_token DROP CONSTRAINT FK_6B7BA4B6A76ED395');
        $this->addSql('DROP TABLE password_reset_token');
    }
}
