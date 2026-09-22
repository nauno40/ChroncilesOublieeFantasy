<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Signalement de contenu communautaire (HomebrewEntry / CustomCreature) — jalon A du site
 * communautaire. Pas de FK vers la cible : `target_type` + `target_id` visent deux tables
 * différentes sans ancêtre commun, et un signalement doit pouvoir survivre à la
 * suppression de son sujet (ON DELETE CASCADE ne s'applique qu'aux deux FK vers `user`).
 */
final class Version20260922180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la table content_report (signalement de contenu communautaire)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE content_report (id SERIAL NOT NULL, reporter_id INT NOT NULL, resolved_by_id INT DEFAULT NULL, target_type VARCHAR(30) NOT NULL, target_id INT NOT NULL, reason TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT \'pending\', resolved_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_CONTENT_REPORT_REPORTER ON content_report (reporter_id)');
        $this->addSql('CREATE INDEX IDX_CONTENT_REPORT_RESOLVED_BY ON content_report (resolved_by_id)');
        $this->addSql('CREATE INDEX IDX_CONTENT_REPORT_TARGET ON content_report (target_type, target_id)');
        $this->addSql('COMMENT ON COLUMN content_report.resolved_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN content_report.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE content_report ADD CONSTRAINT FK_CONTENT_REPORT_REPORTER FOREIGN KEY (reporter_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE content_report ADD CONSTRAINT FK_CONTENT_REPORT_RESOLVED_BY FOREIGN KEY (resolved_by_id) REFERENCES "user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE content_report DROP CONSTRAINT FK_CONTENT_REPORT_REPORTER');
        $this->addSql('ALTER TABLE content_report DROP CONSTRAINT FK_CONTENT_REPORT_RESOLVED_BY');
        $this->addSql('DROP TABLE content_report');
    }
}
