<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Suite de l'audit du compendium officiel (2026-09-28), sur les catégories restantes
 * (équipement, nourriture/logement, races). Trois corrections ponctuelles + un ajout :
 *
 * - Suppression de « Katana » (armes) : aucune trace dans le livre de base, contrairement
 *   aux 34 autres armes servies qui correspondent toutes exactement.
 * - Prix corrigés pour Banquet (nourriture) et 3 lignes de logement (chambre de 4, dortoir,
 *   suite) : la base servait des fourchettes plus larges que le livre.
 * - Ajout de la « Voie du mage » (`03-peuples.md`, p. 60) : une voie de peuple de
 *   remplacement pour les 4 classes de la famille des mages, absente du compendium alors
 *   que le texte source est disponible. Rendue navigable dans le compendium (category =
 *   Race, 5 capacités) ; le choix « la prendre à la place de sa voie de peuple » reste une
 *   règle de création de personnage non outillée dans l'UI, hors du périmètre de cette
 *   correction de données.
 *
 * backend/data/weapons.json, food.json, lodging.json et le nouveau special_voies.json sont
 * mis à jour en parallèle (source pour les futurs environnements), ainsi que AppFixtures.php
 * (nouvelle méthode loadSpecialVoies()).
 */
final class Version20260928100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Compendium : corrige équipement/nourriture/logement, ajoute la Voie du mage (03-peuples.md)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("DELETE FROM equipment WHERE name = 'Katana'");
        $this->addSql("UPDATE food SET price = '10-20 pa' WHERE name = 'Banquet'");
        $this->addSql("UPDATE lodging SET price = '1 pa' WHERE name = 'Nuit (chambre de 4)'");
        $this->addSql("UPDATE lodging SET price = '5 pc' WHERE name = 'Nuit (dortoir)'");
        $this->addSql("UPDATE lodging SET price = '10-20 pa' WHERE name = 'Nuit (suite)'");
        $this->addSql("INSERT INTO voie (name, description, category, max_rank, details) VALUES ('Voie du mage', 'Les mages ne sont pas un peuple, un mage est simplement un personnage qui a choisi un profil de la famille des mages. Un personnage de la famille des mages (ensorceleur, forgesort, magicien, sorcier) peut choisir de remplacer sa voie de peuple par la voie du mage. Il renonce à ses racines en échange d''un plus grand pouvoir occulte. Il ne conserve que la capacité de rang 1 de sa voie de peuple, acquise dès la création du personnage. Ce choix doit être fait avant d''obtenir le rang 2 de la voie de peuple et il est définitif. Cette voie remplace la voie de peuple du personnage, elle occupe le même emplacement sur la fiche de personnage et son premier rang est gratuit comme n''importe quelle voie de peuple.', 'Race', 5, '{\"famille\":\"mages\"}')");
        $this->addSql("INSERT INTO capability (voie_id, name, description, rank, is_spell, action_type, limited) VALUES ((SELECT id FROM voie WHERE name = 'Voie du mage'), 'Capacité de peuple + occultisme', 'Le mage conserve sa capacité de peuple de rang 1. De plus, il ajoute son rang + 2 aux tests de connaissance et d''érudition en rapport avec la magie.', 1, false, 'Passif', false)");
        $this->addSql("INSERT INTO capability (voie_id, name, description, rank, is_spell, action_type, limited) VALUES ((SELECT id FROM voie WHERE name = 'Voie du mage'), 'Maîtrise de la magie', 'Le mage peut détecter la présence de magie (y compris la présence d''objets magiques) dans un rayon de 10 m. Un test d''INT difficulté [10 + rang du sort] permet de déterminer la fonction générale de l''enchantement. Il peut aussi tenter de dissiper un sort non permanent d''un rang maximal égal à ceux qu''il est capable de lancer en emportant un test opposé d''attaque magique contre l''auteur du sort.', 2, true, 'Action Limitée (L)*', true)");
        $this->addSql("INSERT INTO capability (voie_id, name, description, rank, is_spell, action_type, limited) VALUES ((SELECT id FROM voie WHERE name = 'Voie du mage'), 'Tour de magie', 'Le mage peut réaliser un tour de magie (portée 10 m) par round en action gratuite sans dépenser aucun PM. Par exemple, fermer une porte à distance, éteindre ou allumer une bougie en claquant des doigts. Il ne peut réaliser aucune action qui nécessite une valeur de caractéristique supérieure à 0 (par exemple, s''il faut au moins +1 ou un test de FOR pour pousser une porte lourde, ce sort ne permet pas de la fermer). Cette capacité ne peut produire aucun DM direct. De plus, le mage gagne +1 en DEF et +2 PM (en plus de celui gagné avec cette capacité ; au total, en apprenant ce sort, le mage acquiert donc 3 PM d''un coup).', 3, true, 'Action Gratuite (G)*', false)");
        $this->addSql("INSERT INTO capability (voie_id, name, description, rank, is_spell, action_type, limited) VALUES ((SELECT id FROM voie WHERE name = 'Voie du mage'), 'Esprit supérieur', 'Le mage augmente son INT et sa VOL de +1. Désormais, il obtient un dé bonus aux tests d''INT.', 4, false, 'Passif', false)");
        $this->addSql("INSERT INTO capability (voie_id, name, description, rank, is_spell, action_type, limited) VALUES ((SELECT id FROM voie WHERE name = 'Voie du mage'), 'Tempête de mana', 'Lorsqu''il lance un sort, le mage peut augmenter les DM de +1d4° (en cas de DM sur la durée, une seule fois) en payant +1 PM pour un sort à cible unique ou +3 PM pour un sort de zone (Explosion de feu, Foudre, etc.).', 5, false, 'Passif', false)");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("INSERT INTO equipment (name, type, damage, range, critical, price, is_ranged, reload) VALUES ('Katana', 'Contact', '1d10', '', '19', '12 pa', false, 'Pas d''action')");
        $this->addSql("DELETE FROM capability WHERE voie_id = (SELECT id FROM voie WHERE name = 'Voie du mage')");
        $this->addSql("DELETE FROM voie WHERE name = 'Voie du mage'");
        $this->addSql("UPDATE food SET price = '10-100 pa' WHERE name = 'Banquet'");
        $this->addSql("UPDATE lodging SET price = '1-2 pa' WHERE name = 'Nuit (chambre de 4)'");
        $this->addSql("UPDATE lodging SET price = '5-10 pc' WHERE name = 'Nuit (dortoir)'");
        $this->addSql("UPDATE lodging SET price = '10-50 pa' WHERE name = 'Nuit (suite)'");
    }
}
