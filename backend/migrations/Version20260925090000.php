<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Supprimer une campagne qui a des personnages rattachés répondait 409 : la clé étrangère
 * `character.campaign_id` (Version20260301194224) a été posée sans clause ON DELETE, donc
 * RESTRICT. Or une fiche appartient à son joueur — la campagne du MJ n'est qu'un
 * rattachement. ON DELETE SET NULL détache les fiches à la suppression de la campagne.
 */
final class Version20260925090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'character.campaign_id : ON DELETE SET NULL (supprimer une campagne détache ses fiches)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "character" DROP CONSTRAINT FK_937AB034F639F774');
        $this->addSql('ALTER TABLE "character" ADD CONSTRAINT FK_937AB034F639F774 FOREIGN KEY (campaign_id) REFERENCES campaign (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "character" DROP CONSTRAINT FK_937AB034F639F774');
        $this->addSql('ALTER TABLE "character" ADD CONSTRAINT FK_937AB034F639F774 FOREIGN KEY (campaign_id) REFERENCES campaign (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
