<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Favoris (bibliothèque communautaire, monstres maison) — jalon C du site communautaire.
 * Même construction que content_report : pas de FK vers la cible (deux tables sans
 * ancêtre commun), unicité (user, target_type, target_id) pour empêcher un doublon.
 */
final class Version20260927100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la table favorite (favoris de contenu communautaire)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE favorite (id SERIAL NOT NULL, user_id INT NOT NULL, target_type VARCHAR(30) NOT NULL, target_id INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_favorite_user_target ON favorite (user_id, target_type, target_id)');
        $this->addSql('CREATE INDEX IDX_FAVORITE_USER ON favorite (user_id)');
        $this->addSql('COMMENT ON COLUMN favorite.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE favorite ADD CONSTRAINT FK_FAVORITE_USER FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE favorite DROP CONSTRAINT FK_FAVORITE_USER');
        $this->addSql('DROP TABLE favorite');
    }
}
