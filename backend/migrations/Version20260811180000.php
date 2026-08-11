<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Rétablit les caractéristiques supérieures du bestiaire, perdues à l'import.
 *
 * « Lorsqu'un astérisque suit la valeur d'une caractéristique sur le profil d'une créature,
 * cela signifie qu'elle bénéficie d'un dé bonus à tous les tests de cette caractéristique.
 * Attention, ce dé bonus ne s'applique pas aux tests d'attaque » (Opposition).
 *
 * L'astérisque n'avait aucun champ où se poser : le MJ lançait un seul dé là où la créature
 * en méritait deux, sur TOUS ses tests de cette caractéristique.
 *
 * 57 créatures, 101 caractéristiques. Chaque profil du livre est apparié à une créature
 * servie par identité de nom, ou par un alias explicite dont la Défense, les PV et
 * l'Initiative sont identiques des deux côtés — « Chef orc » / « Chef orque » (20/60/10),
 * « Zombie humain » / « Zombi humain » (10/18/8), etc. Une correspondance de nom seule
 * n'aurait pas suffi : « Cheval de guerre » a la signature du « Cheval de selle » servi et
 * n'est donc PAS apparié, faute de certitude.
 *
 * Huit profils à astérisque n'ont aucun équivalent servi (aigle commun, animaux génériques,
 * ogre et orc de base, zombie choursette) : rien n'est inventé pour eux.
 *
 * Migration de données plutôt que rechargement des fixtures, qui purge les tables et
 * emporterait le contenu des utilisateurs. Les fixtures portent la même donnée.
 */
final class Version20260811180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rétablit 101 caractéristiques supérieures sur 57 créatures (COF2, Opposition).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE creature ADD stats_superior JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE custom_creature ADD stats_superior JSON DEFAULT NULL');
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "CON", "FOR"]'::json WHERE name = 'Araignée géante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Assassin'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI"]'::json WHERE name = 'Bandit de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Bandit vétéran'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["FOR"]'::json WHERE name = 'Basilic'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["FOR"]'::json WHERE name = 'Berserker orque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON"]'::json WHERE name = 'Bison'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON"]'::json WHERE name = 'Bison, Grand mâle'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON"]'::json WHERE name = 'Capitaine'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Chef Bandit'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Chef gobelin'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CHA"]'::json WHERE name = 'Chef kobold'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["FOR"]'::json WHERE name = 'Chef ogre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["FOR", "CHA"]'::json WHERE name = 'Chef orque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON"]'::json WHERE name = 'Cheval de selle'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Chimère'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "FOR", "PER"]'::json WHERE name = 'Crocodile'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["FOR"]'::json WHERE name = 'Cryohydre à dix têtes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Dragon des forêts'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "CON", "PER"]'::json WHERE name = 'Démonet'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON"]'::json WHERE name = 'Elémentaire d''eau, grand'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON", "FOR"]'::json WHERE name = 'Eléphant'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["PER"]'::json WHERE name = 'Garde du corps'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Geoselachis'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Gobelin de base'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Gobelin élite'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON"]'::json WHERE name = 'Golem de chair'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "CON", "FOR"]'::json WHERE name = 'Gorille'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["PER"]'::json WHERE name = 'Griffon'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["FOR"]'::json WHERE name = 'Géant du feu'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["FOR"]'::json WHERE name = 'Hydre à 5 têtes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Licorne'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Lion'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON", "PER"]'::json WHERE name = 'Loup'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "CON", "PER"]'::json WHERE name = 'Loup, mâle alpha'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON", "FOR"]'::json WHERE name = 'Momie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON", "FOR", "INT"]'::json WHERE name = 'Momie auguste'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["FOR"]'::json WHERE name = 'Orque noir'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON"]'::json WHERE name = 'Ourhible'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON"]'::json WHERE name = 'Ours brun'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "FOR"]'::json WHERE name = 'Ours noir'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON", "FOR"]'::json WHERE name = 'Ours polaire'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Panthère'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CHA"]'::json WHERE name = 'Prêtre kobold'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["PER"]'::json WHERE name = 'Rat géant'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON", "FOR"]'::json WHERE name = 'Rhinocéros'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON", "FOR"]'::json WHERE name = 'Sanglier'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["FOR"]'::json WHERE name = 'Sergent orque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["FOR", "PER"]'::json WHERE name = 'Serpent constricteur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "CON"]'::json WHERE name = 'Serpent venimeux'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Shaman gobelin'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "PER"]'::json WHERE name = 'Skrambler'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "CON", "PER"]'::json WHERE name = 'Vampire'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "CON", "PER"]'::json WHERE name = 'Vampire ancien'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "CON"]'::json WHERE name = 'Vampirien'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["CON", "PER"]'::json WHERE name = 'Vétéran ou garde de palais ducal'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats_superior = '["AGI", "CON", "PER"]'::json WHERE name = 'Worg'
        SQL);
        // Trois caractéristiques négatives de plus, du même défaut d'import que #217 : les
        // alias ont fait entrer dix créatures de plus dans le champ de la comparaison, et
        // deux d'entre elles divergeaient encore.
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 3, "FOR": 1, "PER": 3, "CHA": -1, "INT": 0, "VOL": 3}'::json
            WHERE name = 'Shaman orque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE creature SET stats = '{"AGI": 0, "CON": 3, "FOR": 4, "PER": 0, "CHA": -1, "INT": -1, "VOL": 1}'::json
            WHERE name = 'Sergent orque'
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE creature DROP stats_superior');
        $this->addSql('ALTER TABLE custom_creature DROP stats_superior');
    }
}
