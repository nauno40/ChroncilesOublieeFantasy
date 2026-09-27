<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Tags libres sur le contenu communautaire (bibliothèque + bestiaire maison) — jalon B/C
 * du site communautaire (tags et tri « populaire »). Vocabulaire partagé (une seule table
 * `tag`) entre les deux ManyToMany : un même tag a du sens sur un sort comme sur une
 * créature. Pas de FK vers `tag` avec ON DELETE particulier : un tag n'est jamais supprimé
 * directement (TagResolver ne fait que find-or-create), seules les lignes des tables de
 * jonction disparaissent (ON DELETE CASCADE) quand l'entrée/créature elle-même est supprimée.
 */
final class Version20260927130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute tag + homebrew_entry_tag + custom_creature_tag (tags communautaires)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE tag (id SERIAL NOT NULL, name VARCHAR(30) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_TAG_NAME ON tag (name)');

        $this->addSql('CREATE TABLE homebrew_entry_tag (homebrew_entry_id INT NOT NULL, tag_id INT NOT NULL, PRIMARY KEY(homebrew_entry_id, tag_id))');
        $this->addSql('CREATE INDEX IDX_HOMEBREW_ENTRY_TAG_ENTRY ON homebrew_entry_tag (homebrew_entry_id)');
        $this->addSql('CREATE INDEX IDX_HOMEBREW_ENTRY_TAG_TAG ON homebrew_entry_tag (tag_id)');
        $this->addSql('ALTER TABLE homebrew_entry_tag ADD CONSTRAINT FK_HOMEBREW_ENTRY_TAG_ENTRY FOREIGN KEY (homebrew_entry_id) REFERENCES homebrew_entry (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE homebrew_entry_tag ADD CONSTRAINT FK_HOMEBREW_ENTRY_TAG_TAG FOREIGN KEY (tag_id) REFERENCES tag (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE custom_creature_tag (custom_creature_id INT NOT NULL, tag_id INT NOT NULL, PRIMARY KEY(custom_creature_id, tag_id))');
        $this->addSql('CREATE INDEX IDX_CUSTOM_CREATURE_TAG_CREATURE ON custom_creature_tag (custom_creature_id)');
        $this->addSql('CREATE INDEX IDX_CUSTOM_CREATURE_TAG_TAG ON custom_creature_tag (tag_id)');
        $this->addSql('ALTER TABLE custom_creature_tag ADD CONSTRAINT FK_CUSTOM_CREATURE_TAG_CREATURE FOREIGN KEY (custom_creature_id) REFERENCES custom_creature (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE custom_creature_tag ADD CONSTRAINT FK_CUSTOM_CREATURE_TAG_TAG FOREIGN KEY (tag_id) REFERENCES tag (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE homebrew_entry_tag DROP CONSTRAINT FK_HOMEBREW_ENTRY_TAG_ENTRY');
        $this->addSql('ALTER TABLE homebrew_entry_tag DROP CONSTRAINT FK_HOMEBREW_ENTRY_TAG_TAG');
        $this->addSql('ALTER TABLE custom_creature_tag DROP CONSTRAINT FK_CUSTOM_CREATURE_TAG_CREATURE');
        $this->addSql('ALTER TABLE custom_creature_tag DROP CONSTRAINT FK_CUSTOM_CREATURE_TAG_TAG');
        $this->addSql('DROP TABLE homebrew_entry_tag');
        $this->addSql('DROP TABLE custom_creature_tag');
        $this->addSql('DROP TABLE tag');
    }
}
