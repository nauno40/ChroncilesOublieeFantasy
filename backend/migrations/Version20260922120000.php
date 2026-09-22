<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Vérification d'adresse e-mail à l'inscription (jalon A du site communautaire) : colonne
 * `is_verified` sur `user` (les comptes existants sont marqués vérifiés — on ne bloque pas
 * rétroactivement des comptes déjà en usage) + table `email_verification_token`, même
 * construction que `password_reset_token`.
 */
final class Version20260922120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Ajoute la vérification d'adresse e-mail (User.isVerified + email_verification_token)";
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" ADD is_verified BOOLEAN NOT NULL DEFAULT false');
        $this->addSql('UPDATE "user" SET is_verified = true');

        $this->addSql('CREATE TABLE email_verification_token (id SERIAL NOT NULL, user_id INT NOT NULL, hashed_token VARCHAR(64) NOT NULL, expires_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_EMAIL_VERIF_TOKEN ON email_verification_token (hashed_token)');
        $this->addSql('CREATE INDEX IDX_EMAIL_VERIF_USER ON email_verification_token (user_id)');
        $this->addSql('COMMENT ON COLUMN email_verification_token.expires_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE email_verification_token ADD CONSTRAINT FK_EMAIL_VERIF_USER FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE email_verification_token DROP CONSTRAINT FK_EMAIL_VERIF_USER');
        $this->addSql('DROP TABLE email_verification_token');
        $this->addSql('ALTER TABLE "user" DROP is_verified');
    }
}
