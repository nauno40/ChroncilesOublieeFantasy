<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Mécaniques structurées d'un état préjudiciable (`HarmfulState.effects`).
 */
final class Version20260807180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Ajoute les mécaniques structurées d'un état préjudiciable (harmful_state.effects).";
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE harmful_state ADD effects JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE harmful_state DROP effects');
    }
}
