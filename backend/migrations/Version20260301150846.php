<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260301150846 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE campaign (id SERIAL NOT NULL, owner_id INT NOT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, notes TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_1F1512DD7E3C61F9 ON campaign (owner_id)');
        $this->addSql('CREATE TABLE capability (id SERIAL NOT NULL, voie_id INT NOT NULL, name VARCHAR(255) NOT NULL, description TEXT NOT NULL, rank INT NOT NULL, is_spell BOOLEAN NOT NULL, action_type VARCHAR(50) DEFAULT NULL, limited BOOLEAN NOT NULL, effect JSON DEFAULT NULL, details JSON DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_96B1E230EAAC89CF ON capability (voie_id)');
        $this->addSql('CREATE TABLE "character" (id SERIAL NOT NULL, race_id INT DEFAULT NULL, profile_id INT DEFAULT NULL, owner_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, level INT NOT NULL, data JSON DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_937AB0346E59D40D ON "character" (race_id)');
        $this->addSql('CREATE INDEX IDX_937AB034CCFA12B8 ON "character" (profile_id)');
        $this->addSql('CREATE INDEX IDX_937AB0347E3C61F9 ON "character" (owner_id)');
        $this->addSql('COMMENT ON COLUMN "character".created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN "character".updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE clue (id SERIAL NOT NULL, campaign_id INT NOT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_268AADD1F639F774 ON clue (campaign_id)');
        $this->addSql('CREATE TABLE creature (id SERIAL NOT NULL, family_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, nc INT NOT NULL, hp INT NOT NULL, def INT NOT NULL, init INT NOT NULL, stats JSON DEFAULT NULL, special_abilities JSON DEFAULT NULL, attacks JSON DEFAULT NULL, capabilities JSON DEFAULT NULL, picture VARCHAR(255) DEFAULT NULL, category VARCHAR(50) DEFAULT NULL, environment VARCHAR(50) DEFAULT NULL, archetype VARCHAR(50) DEFAULT NULL, size VARCHAR(50) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_2A6C6AF4C35E566A ON creature (family_id)');
        $this->addSql('CREATE TABLE creature_family (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, image VARCHAR(255) DEFAULT NULL, reference VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE creature_voie (id SERIAL NOT NULL, creature_id INT NOT NULL, voie_id INT NOT NULL, rank INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_3FD086F5F9AB048 ON creature_voie (creature_id)');
        $this->addSql('CREATE INDEX IDX_3FD086F5EAAC89CF ON creature_voie (voie_id)');
        $this->addSql('CREATE TABLE equipment (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, type VARCHAR(50) NOT NULL, price VARCHAR(50) DEFAULT NULL, weight DOUBLE PRECISION DEFAULT NULL, rarity VARCHAR(50) DEFAULT NULL, material VARCHAR(50) DEFAULT NULL, quality VARCHAR(50) DEFAULT NULL, damage VARCHAR(50) DEFAULT NULL, range VARCHAR(50) DEFAULT NULL, ac_bonus INT DEFAULT NULL, ac_max_agi INT DEFAULT NULL, ac_penalty INT DEFAULT NULL, critical VARCHAR(50) DEFAULT NULL, reload VARCHAR(50) DEFAULT NULL, properties JSON DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE family (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, description TEXT NOT NULL, base_hp INT NOT NULL, recovery_die VARCHAR(10) NOT NULL, luck_points INT NOT NULL, mana_stat VARCHAR(10) DEFAULT NULL, specials TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE food (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, price VARCHAR(50) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE harmful_state (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, image VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE lodging (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, price VARCHAR(50) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE material (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, price VARCHAR(50) DEFAULT NULL, notes TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE mount (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, price VARCHAR(50) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE profile (id SERIAL NOT NULL, family_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, note TEXT DEFAULT NULL, lore JSON DEFAULT NULL, hit_die VARCHAR(10) NOT NULL, weapons_auth JSON DEFAULT NULL, armor_auth JSON DEFAULT NULL, skill_points INT NOT NULL, magic_stat VARCHAR(10) DEFAULT NULL, stats JSON DEFAULT NULL, starting_equipment JSON DEFAULT NULL, masteries JSON DEFAULT NULL, image_url VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_8157AA0FC35E566A ON profile (family_id)');
        $this->addSql('CREATE TABLE quest (id SERIAL NOT NULL, campaign_id INT NOT NULL, title VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, completed BOOLEAN NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_4317F817F639F774 ON quest (campaign_id)');
        $this->addSql('CREATE TABLE race (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, description TEXT NOT NULL, modifiers JSON DEFAULT NULL, min_height INT DEFAULT NULL, max_height INT DEFAULT NULL, min_weight INT DEFAULT NULL, max_weight INT DEFAULT NULL, speed VARCHAR(50) DEFAULT NULL, detailed_description TEXT DEFAULT NULL, public_perception TEXT DEFAULT NULL, abilities TEXT DEFAULT NULL, starting_age INT DEFAULT NULL, life_expectancy INT DEFAULT NULL, physical_traits TEXT DEFAULT NULL, roleplay TEXT DEFAULT NULL, image VARCHAR(255) DEFAULT NULL, typical_names TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE session (id SERIAL NOT NULL, campaign_id INT NOT NULL, title VARCHAR(255) NOT NULL, date DATE NOT NULL, notes TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_D044D5D4F639F774 ON session (campaign_id)');
        $this->addSql('CREATE TABLE "user" (id SERIAL NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649E7927C74 ON "user" (email)');
        $this->addSql('CREATE TABLE voie (id SERIAL NOT NULL, profile_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, description TEXT NOT NULL, category VARCHAR(50) NOT NULL, max_rank INT NOT NULL, details JSON DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_A57CE978CCFA12B8 ON voie (profile_id)');
        $this->addSql('CREATE TABLE voie_race (voie_id INT NOT NULL, race_id INT NOT NULL, PRIMARY KEY(voie_id, race_id))');
        $this->addSql('CREATE INDEX IDX_6B04B790EAAC89CF ON voie_race (voie_id)');
        $this->addSql('CREATE INDEX IDX_6B04B7906E59D40D ON voie_race (race_id)');
        $this->addSql('CREATE TABLE messenger_messages (id BIGSERIAL NOT NULL, body TEXT NOT NULL, headers TEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, available_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, delivered_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_75EA56E0FB7336F0 ON messenger_messages (queue_name)');
        $this->addSql('CREATE INDEX IDX_75EA56E0E3BD61CE ON messenger_messages (available_at)');
        $this->addSql('CREATE INDEX IDX_75EA56E016BA31DB ON messenger_messages (delivered_at)');
        $this->addSql('COMMENT ON COLUMN messenger_messages.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN messenger_messages.available_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN messenger_messages.delivered_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE OR REPLACE FUNCTION notify_messenger_messages() RETURNS TRIGGER AS $$
            BEGIN
                PERFORM pg_notify(\'messenger_messages\', NEW.queue_name::text);
                RETURN NEW;
            END;
        $$ LANGUAGE plpgsql;');
        $this->addSql('DROP TRIGGER IF EXISTS notify_trigger ON messenger_messages;');
        $this->addSql('CREATE TRIGGER notify_trigger AFTER INSERT OR UPDATE ON messenger_messages FOR EACH ROW EXECUTE PROCEDURE notify_messenger_messages();');
        $this->addSql('ALTER TABLE campaign ADD CONSTRAINT FK_1F1512DD7E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE capability ADD CONSTRAINT FK_96B1E230EAAC89CF FOREIGN KEY (voie_id) REFERENCES voie (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "character" ADD CONSTRAINT FK_937AB0346E59D40D FOREIGN KEY (race_id) REFERENCES race (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "character" ADD CONSTRAINT FK_937AB034CCFA12B8 FOREIGN KEY (profile_id) REFERENCES profile (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "character" ADD CONSTRAINT FK_937AB0347E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE clue ADD CONSTRAINT FK_268AADD1F639F774 FOREIGN KEY (campaign_id) REFERENCES campaign (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE creature ADD CONSTRAINT FK_2A6C6AF4C35E566A FOREIGN KEY (family_id) REFERENCES creature_family (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE creature_voie ADD CONSTRAINT FK_3FD086F5F9AB048 FOREIGN KEY (creature_id) REFERENCES creature (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE creature_voie ADD CONSTRAINT FK_3FD086F5EAAC89CF FOREIGN KEY (voie_id) REFERENCES voie (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE profile ADD CONSTRAINT FK_8157AA0FC35E566A FOREIGN KEY (family_id) REFERENCES family (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE quest ADD CONSTRAINT FK_4317F817F639F774 FOREIGN KEY (campaign_id) REFERENCES campaign (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE session ADD CONSTRAINT FK_D044D5D4F639F774 FOREIGN KEY (campaign_id) REFERENCES campaign (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE voie ADD CONSTRAINT FK_A57CE978CCFA12B8 FOREIGN KEY (profile_id) REFERENCES profile (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE voie_race ADD CONSTRAINT FK_6B04B790EAAC89CF FOREIGN KEY (voie_id) REFERENCES voie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE voie_race ADD CONSTRAINT FK_6B04B7906E59D40D FOREIGN KEY (race_id) REFERENCES race (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE campaign DROP CONSTRAINT FK_1F1512DD7E3C61F9');
        $this->addSql('ALTER TABLE capability DROP CONSTRAINT FK_96B1E230EAAC89CF');
        $this->addSql('ALTER TABLE "character" DROP CONSTRAINT FK_937AB0346E59D40D');
        $this->addSql('ALTER TABLE "character" DROP CONSTRAINT FK_937AB034CCFA12B8');
        $this->addSql('ALTER TABLE "character" DROP CONSTRAINT FK_937AB0347E3C61F9');
        $this->addSql('ALTER TABLE clue DROP CONSTRAINT FK_268AADD1F639F774');
        $this->addSql('ALTER TABLE creature DROP CONSTRAINT FK_2A6C6AF4C35E566A');
        $this->addSql('ALTER TABLE creature_voie DROP CONSTRAINT FK_3FD086F5F9AB048');
        $this->addSql('ALTER TABLE creature_voie DROP CONSTRAINT FK_3FD086F5EAAC89CF');
        $this->addSql('ALTER TABLE profile DROP CONSTRAINT FK_8157AA0FC35E566A');
        $this->addSql('ALTER TABLE quest DROP CONSTRAINT FK_4317F817F639F774');
        $this->addSql('ALTER TABLE session DROP CONSTRAINT FK_D044D5D4F639F774');
        $this->addSql('ALTER TABLE voie DROP CONSTRAINT FK_A57CE978CCFA12B8');
        $this->addSql('ALTER TABLE voie_race DROP CONSTRAINT FK_6B04B790EAAC89CF');
        $this->addSql('ALTER TABLE voie_race DROP CONSTRAINT FK_6B04B7906E59D40D');
        $this->addSql('DROP TABLE campaign');
        $this->addSql('DROP TABLE capability');
        $this->addSql('DROP TABLE "character"');
        $this->addSql('DROP TABLE clue');
        $this->addSql('DROP TABLE creature');
        $this->addSql('DROP TABLE creature_family');
        $this->addSql('DROP TABLE creature_voie');
        $this->addSql('DROP TABLE equipment');
        $this->addSql('DROP TABLE family');
        $this->addSql('DROP TABLE food');
        $this->addSql('DROP TABLE harmful_state');
        $this->addSql('DROP TABLE lodging');
        $this->addSql('DROP TABLE material');
        $this->addSql('DROP TABLE mount');
        $this->addSql('DROP TABLE profile');
        $this->addSql('DROP TABLE quest');
        $this->addSql('DROP TABLE race');
        $this->addSql('DROP TABLE session');
        $this->addSql('DROP TABLE "user"');
        $this->addSql('DROP TABLE voie');
        $this->addSql('DROP TABLE voie_race');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
