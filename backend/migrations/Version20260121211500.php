<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260121211500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE "character" (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, race_id INTEGER DEFAULT NULL, profile_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, level INTEGER NOT NULL, data CLOB DEFAULT NULL --(DC2Type:json)
        , created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , updated_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , CONSTRAINT FK_937AB0346E59D40D FOREIGN KEY (race_id) REFERENCES race (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_937AB034CCFA12B8 FOREIGN KEY (profile_id) REFERENCES profile (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_937AB0346E59D40D ON "character" (race_id)');
        $this->addSql('CREATE INDEX IDX_937AB034CCFA12B8 ON "character" (profile_id)');
        $this->addSql('CREATE TABLE food (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(255) NOT NULL, price VARCHAR(50) DEFAULT NULL)');
        $this->addSql('CREATE TABLE lodging (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(255) NOT NULL, price VARCHAR(50) DEFAULT NULL)');
        $this->addSql('CREATE TABLE mount (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(255) NOT NULL, price VARCHAR(50) DEFAULT NULL)');
        $this->addSql('ALTER TABLE capability ADD COLUMN details CLOB DEFAULT NULL');
        $this->addSql('CREATE TEMPORARY TABLE __temp__creature AS SELECT id, family_id, name, description, nc, hp, def, init, stats, special_abilities, attacks, capabilities, picture, category, archetype, environment, size FROM creature');
        $this->addSql('DROP TABLE creature');
        $this->addSql('CREATE TABLE creature (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, family_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, nc INTEGER NOT NULL, hp INTEGER NOT NULL, def INTEGER NOT NULL, init INTEGER NOT NULL, stats CLOB DEFAULT NULL --(DC2Type:json)
        , special_abilities CLOB DEFAULT NULL --(DC2Type:json)
        , attacks CLOB DEFAULT NULL --(DC2Type:json)
        , capabilities CLOB DEFAULT NULL --(DC2Type:json)
        , picture VARCHAR(255) DEFAULT NULL, category VARCHAR(50) DEFAULT NULL, archetype VARCHAR(50) DEFAULT NULL, environment VARCHAR(50) DEFAULT NULL, size VARCHAR(50) DEFAULT NULL, CONSTRAINT FK_2A6C6AF4C35E566A FOREIGN KEY (family_id) REFERENCES creature_family (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO creature (id, family_id, name, description, nc, hp, def, init, stats, special_abilities, attacks, capabilities, picture, category, archetype, environment, size) SELECT id, family_id, name, description, nc, hp, def, init, stats, special_abilities, attacks, capabilities, picture, category, archetype, environment, size FROM __temp__creature');
        $this->addSql('DROP TABLE __temp__creature');
        $this->addSql('CREATE INDEX IDX_2A6C6AF4C35E566A ON creature (family_id)');
        $this->addSql('ALTER TABLE equipment ADD COLUMN critical VARCHAR(50) DEFAULT NULL');
        $this->addSql('ALTER TABLE equipment ADD COLUMN reload VARCHAR(50) DEFAULT NULL');
        $this->addSql('ALTER TABLE profile ADD COLUMN stats CLOB DEFAULT NULL');
        $this->addSql('ALTER TABLE voie ADD COLUMN details CLOB DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE "character"');
        $this->addSql('DROP TABLE food');
        $this->addSql('DROP TABLE lodging');
        $this->addSql('DROP TABLE mount');
        $this->addSql('CREATE TEMPORARY TABLE __temp__capability AS SELECT id, voie_id, name, description, rank, is_spell, action_type, limited, effect FROM capability');
        $this->addSql('DROP TABLE capability');
        $this->addSql('CREATE TABLE capability (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, voie_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, description CLOB NOT NULL, rank INTEGER NOT NULL, is_spell BOOLEAN NOT NULL, action_type VARCHAR(50) DEFAULT NULL, limited BOOLEAN NOT NULL, effect CLOB DEFAULT NULL --(DC2Type:json)
        , CONSTRAINT FK_96B1E230EAAC89CF FOREIGN KEY (voie_id) REFERENCES voie (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO capability (id, voie_id, name, description, rank, is_spell, action_type, limited, effect) SELECT id, voie_id, name, description, rank, is_spell, action_type, limited, effect FROM __temp__capability');
        $this->addSql('DROP TABLE __temp__capability');
        $this->addSql('CREATE INDEX IDX_96B1E230EAAC89CF ON capability (voie_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__creature AS SELECT id, family_id, name, description, nc, hp, def, init, stats, special_abilities, attacks, capabilities, picture, category, environment, archetype, size FROM creature');
        $this->addSql('DROP TABLE creature');
        $this->addSql('CREATE TABLE creature (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, family_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, nc INTEGER NOT NULL, hp INTEGER NOT NULL, def INTEGER NOT NULL, init INTEGER NOT NULL, stats CLOB DEFAULT NULL --(DC2Type:json)
        , special_abilities CLOB DEFAULT NULL --(DC2Type:json)
        , attacks CLOB DEFAULT NULL --(DC2Type:json)
        , capabilities CLOB DEFAULT NULL --(DC2Type:json)
        , picture VARCHAR(255) DEFAULT NULL, category VARCHAR(100) DEFAULT NULL, environment VARCHAR(100) DEFAULT NULL, archetype VARCHAR(100) DEFAULT NULL, size VARCHAR(100) DEFAULT NULL, CONSTRAINT FK_2A6C6AF4C35E566A FOREIGN KEY (family_id) REFERENCES creature_family (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO creature (id, family_id, name, description, nc, hp, def, init, stats, special_abilities, attacks, capabilities, picture, category, environment, archetype, size) SELECT id, family_id, name, description, nc, hp, def, init, stats, special_abilities, attacks, capabilities, picture, category, environment, archetype, size FROM __temp__creature');
        $this->addSql('DROP TABLE __temp__creature');
        $this->addSql('CREATE INDEX IDX_2A6C6AF4C35E566A ON creature (family_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__equipment AS SELECT id, name, description, type, price, weight, rarity, material, quality, damage, range, ac_bonus, ac_max_agi, ac_penalty, properties FROM equipment');
        $this->addSql('DROP TABLE equipment');
        $this->addSql('CREATE TABLE equipment (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, type VARCHAR(50) NOT NULL, price VARCHAR(50) DEFAULT NULL, weight DOUBLE PRECISION DEFAULT NULL, rarity VARCHAR(50) DEFAULT NULL, material VARCHAR(50) DEFAULT NULL, quality VARCHAR(50) DEFAULT NULL, damage VARCHAR(50) DEFAULT NULL, range VARCHAR(50) DEFAULT NULL, ac_bonus INTEGER DEFAULT NULL, ac_max_agi INTEGER DEFAULT NULL, ac_penalty INTEGER DEFAULT NULL, properties CLOB DEFAULT NULL --(DC2Type:json)
        )');
        $this->addSql('INSERT INTO equipment (id, name, description, type, price, weight, rarity, material, quality, damage, range, ac_bonus, ac_max_agi, ac_penalty, properties) SELECT id, name, description, type, price, weight, rarity, material, quality, damage, range, ac_bonus, ac_max_agi, ac_penalty, properties FROM __temp__equipment');
        $this->addSql('DROP TABLE __temp__equipment');
        $this->addSql('CREATE TEMPORARY TABLE __temp__profile AS SELECT id, family_id, name, description, note, lore, hit_die, weapons_auth, armor_auth, skill_points, magic_stat, starting_equipment, masteries, image_url FROM profile');
        $this->addSql('DROP TABLE profile');
        $this->addSql('CREATE TABLE profile (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, family_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, note CLOB DEFAULT NULL, lore CLOB DEFAULT NULL --(DC2Type:json)
        , hit_die VARCHAR(10) NOT NULL, weapons_auth CLOB DEFAULT NULL --(DC2Type:json)
        , armor_auth CLOB DEFAULT NULL --(DC2Type:json)
        , skill_points INTEGER NOT NULL, magic_stat VARCHAR(10) DEFAULT NULL, starting_equipment CLOB DEFAULT NULL --(DC2Type:json)
        , masteries CLOB DEFAULT NULL --(DC2Type:json)
        , image_url VARCHAR(255) DEFAULT NULL, CONSTRAINT FK_8157AA0FC35E566A FOREIGN KEY (family_id) REFERENCES family (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO profile (id, family_id, name, description, note, lore, hit_die, weapons_auth, armor_auth, skill_points, magic_stat, starting_equipment, masteries, image_url) SELECT id, family_id, name, description, note, lore, hit_die, weapons_auth, armor_auth, skill_points, magic_stat, starting_equipment, masteries, image_url FROM __temp__profile');
        $this->addSql('DROP TABLE __temp__profile');
        $this->addSql('CREATE INDEX IDX_8157AA0FC35E566A ON profile (family_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__voie AS SELECT id, profile_id, name, description, category, max_rank FROM voie');
        $this->addSql('DROP TABLE voie');
        $this->addSql('CREATE TABLE voie (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, profile_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, description CLOB NOT NULL, category VARCHAR(50) NOT NULL, max_rank INTEGER NOT NULL, CONSTRAINT FK_A57CE978CCFA12B8 FOREIGN KEY (profile_id) REFERENCES profile (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO voie (id, profile_id, name, description, category, max_rank) SELECT id, profile_id, name, description, category, max_rank FROM __temp__voie');
        $this->addSql('DROP TABLE __temp__voie');
        $this->addSql('CREATE INDEX IDX_A57CE978CCFA12B8 ON voie (profile_id)');
    }
}
