<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Commentaires (bibliothèque communautaire, monstres maison) — jalon C du site communautaire.
 * Même construction que favorite/content_report : pas de FK vers la cible (deux tables sans
 * ancêtre commun). Index (target_type, target_id) : la collection est systématiquement
 * filtrée par cible côté front (un fil de discussion par fiche), pas par auteur.
 */
final class Version20260927110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la table comment (commentaires sur du contenu communautaire)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE comment (id SERIAL NOT NULL, author_id INT NOT NULL, target_type VARCHAR(30) NOT NULL, target_id INT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_COMMENT_TARGET ON comment (target_type, target_id)');
        $this->addSql('CREATE INDEX IDX_COMMENT_AUTHOR ON comment (author_id)');
        $this->addSql('COMMENT ON COLUMN comment.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT FK_COMMENT_AUTHOR FOREIGN KEY (author_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE comment DROP CONSTRAINT FK_COMMENT_AUTHOR');
        $this->addSql('DROP TABLE comment');
    }
}
