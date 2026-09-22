<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * `data/weapons.json` et `data/armors.json` portent `requirements`/`comments`/`isRanged`
 * depuis toujours — un vrai texte de règles (« AGI max +3 », « seul le chevalier peut la
 * porter grâce à la capacité de rang 3 de la voie de la noblesse »), jamais lu par
 * `AppFixtures::loadEquipment()` ni porté par l'entité : ces trois champs restaient
 * silencieusement vides pour les 44 armes/armures officielles (repéré par
 * `scripts/audit-types-api.mjs`, qui les listait « déclarés côté front, jamais servis »).
 * Uniquement des colonnes nullable, sans donnée existante à corriger (jamais déployé) :
 * une migration de schéma suffit, les fixtures peuplent la donnée au prochain chargement.
 */
final class Version20260922200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Ajoute Equipment.requirements/comments/isRanged (armes et armures)";
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE equipment ADD requirements TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE equipment ADD comments TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE equipment ADD is_ranged BOOLEAN DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE equipment DROP requirements');
        $this->addSql('ALTER TABLE equipment DROP comments');
        $this->addSql('ALTER TABLE equipment DROP is_ranged');
    }
}
