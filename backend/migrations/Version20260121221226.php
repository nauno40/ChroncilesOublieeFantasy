<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260121221226 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__capability AS SELECT id, voie_id, name, description, rank, is_spell, action_type, limited, effect, details FROM capability');
        $this->addSql('DROP TABLE capability');
        $this->addSql('CREATE TABLE capability (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, voie_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, description CLOB NOT NULL, rank INTEGER NOT NULL, is_spell BOOLEAN NOT NULL, action_type VARCHAR(50) DEFAULT NULL, limited BOOLEAN NOT NULL, effect CLOB DEFAULT NULL --(DC2Type:json)
        , details CLOB DEFAULT NULL --(DC2Type:json)
        , CONSTRAINT FK_96B1E230EAAC89CF FOREIGN KEY (voie_id) REFERENCES voie (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO capability (id, voie_id, name, description, rank, is_spell, action_type, limited, effect, details) SELECT id, voie_id, name, description, rank, is_spell, action_type, limited, effect, details FROM __temp__capability');
        $this->addSql('DROP TABLE __temp__capability');
        $this->addSql('CREATE INDEX IDX_96B1E230EAAC89CF ON capability (voie_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__profile AS SELECT id, family_id, name, description, note, lore, hit_die, weapons_auth, armor_auth, skill_points, magic_stat, starting_equipment, masteries, image_url, stats FROM profile');
        $this->addSql('DROP TABLE profile');
        $this->addSql('CREATE TABLE profile (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, family_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, note CLOB DEFAULT NULL, lore CLOB DEFAULT NULL --(DC2Type:json)
        , hit_die VARCHAR(10) NOT NULL, weapons_auth CLOB DEFAULT NULL --(DC2Type:json)
        , armor_auth CLOB DEFAULT NULL --(DC2Type:json)
        , skill_points INTEGER NOT NULL, magic_stat VARCHAR(10) DEFAULT NULL, starting_equipment CLOB DEFAULT NULL --(DC2Type:json)
        , masteries CLOB DEFAULT NULL --(DC2Type:json)
        , image_url VARCHAR(255) DEFAULT NULL, stats CLOB DEFAULT NULL --(DC2Type:json)
        , CONSTRAINT FK_8157AA0FC35E566A FOREIGN KEY (family_id) REFERENCES family (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO profile (id, family_id, name, description, note, lore, hit_die, weapons_auth, armor_auth, skill_points, magic_stat, starting_equipment, masteries, image_url, stats) SELECT id, family_id, name, description, note, lore, hit_die, weapons_auth, armor_auth, skill_points, magic_stat, starting_equipment, masteries, image_url, stats FROM __temp__profile');
        $this->addSql('DROP TABLE __temp__profile');
        $this->addSql('CREATE INDEX IDX_8157AA0FC35E566A ON profile (family_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__voie AS SELECT id, profile_id, name, description, category, max_rank, details FROM voie');
        $this->addSql('DROP TABLE voie');
        $this->addSql('CREATE TABLE voie (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, profile_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, description CLOB NOT NULL, category VARCHAR(50) NOT NULL, max_rank INTEGER NOT NULL, details CLOB DEFAULT NULL --(DC2Type:json)
        , CONSTRAINT FK_A57CE978CCFA12B8 FOREIGN KEY (profile_id) REFERENCES profile (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO voie (id, profile_id, name, description, category, max_rank, details) SELECT id, profile_id, name, description, category, max_rank, details FROM __temp__voie');
        $this->addSql('DROP TABLE __temp__voie');
        $this->addSql('CREATE INDEX IDX_A57CE978CCFA12B8 ON voie (profile_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__capability AS SELECT id, voie_id, name, description, rank, is_spell, action_type, limited, effect, details FROM capability');
        $this->addSql('DROP TABLE capability');
        $this->addSql('CREATE TABLE capability (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, voie_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, description CLOB NOT NULL, rank INTEGER NOT NULL, is_spell BOOLEAN NOT NULL, action_type VARCHAR(50) DEFAULT NULL, limited BOOLEAN NOT NULL, effect CLOB DEFAULT NULL --(DC2Type:json)
        , details CLOB DEFAULT NULL, CONSTRAINT FK_96B1E230EAAC89CF FOREIGN KEY (voie_id) REFERENCES voie (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO capability (id, voie_id, name, description, rank, is_spell, action_type, limited, effect, details) SELECT id, voie_id, name, description, rank, is_spell, action_type, limited, effect, details FROM __temp__capability');
        $this->addSql('DROP TABLE __temp__capability');
        $this->addSql('CREATE INDEX IDX_96B1E230EAAC89CF ON capability (voie_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__profile AS SELECT id, family_id, name, description, note, lore, hit_die, weapons_auth, armor_auth, skill_points, magic_stat, stats, starting_equipment, masteries, image_url FROM profile');
        $this->addSql('DROP TABLE profile');
        $this->addSql('CREATE TABLE profile (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, family_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, note CLOB DEFAULT NULL, lore CLOB DEFAULT NULL --(DC2Type:json)
        , hit_die VARCHAR(10) NOT NULL, weapons_auth CLOB DEFAULT NULL --(DC2Type:json)
        , armor_auth CLOB DEFAULT NULL --(DC2Type:json)
        , skill_points INTEGER NOT NULL, magic_stat VARCHAR(10) DEFAULT NULL, stats CLOB DEFAULT NULL, starting_equipment CLOB DEFAULT NULL --(DC2Type:json)
        , masteries CLOB DEFAULT NULL --(DC2Type:json)
        , image_url VARCHAR(255) DEFAULT NULL, CONSTRAINT FK_8157AA0FC35E566A FOREIGN KEY (family_id) REFERENCES family (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO profile (id, family_id, name, description, note, lore, hit_die, weapons_auth, armor_auth, skill_points, magic_stat, stats, starting_equipment, masteries, image_url) SELECT id, family_id, name, description, note, lore, hit_die, weapons_auth, armor_auth, skill_points, magic_stat, stats, starting_equipment, masteries, image_url FROM __temp__profile');
        $this->addSql('DROP TABLE __temp__profile');
        $this->addSql('CREATE INDEX IDX_8157AA0FC35E566A ON profile (family_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__voie AS SELECT id, profile_id, name, description, category, max_rank, details FROM voie');
        $this->addSql('DROP TABLE voie');
        $this->addSql('CREATE TABLE voie (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, profile_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, description CLOB NOT NULL, category VARCHAR(50) NOT NULL, max_rank INTEGER NOT NULL, details CLOB DEFAULT NULL, CONSTRAINT FK_A57CE978CCFA12B8 FOREIGN KEY (profile_id) REFERENCES profile (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO voie (id, profile_id, name, description, category, max_rank, details) SELECT id, profile_id, name, description, category, max_rank, details FROM __temp__voie');
        $this->addSql('DROP TABLE __temp__voie');
        $this->addSql('CREATE INDEX IDX_A57CE978CCFA12B8 ON voie (profile_id)');
    }
}
