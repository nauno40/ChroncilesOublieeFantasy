<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Supprimer son propre compte (`DELETE /api/users/{id}`, déjà ouvert par l'expression de
 * sécurité `is_granted('ROLE_ADMIN') or object == user`) échouait en 500 pour quiconque
 * possédait une campagne, un personnage, un monstre maison ou une entrée de bibliothèque :
 * ces quatre clés étrangères vers `user` avaient été posées sans clause ON DELETE, donc
 * RESTRICT (violation de contrainte brute, pas une 409/403 lisible).
 *
 * Choix tranché avec l'utilisateur : CASCADE pour campaign/custom_creature/homebrew_entry —
 * supprimer son compte supprime ce qu'on possède, y compris le contenu communautaire publié
 * (même logique que la suppression d'un compte GitHub emporte ses dépôts non transférés) ;
 * un favori/commentaire d'un tiers pointant dessus devient orphelin et disparaît simplement
 * de l'affichage (déjà géré, cf. MyFavorites.tsx). SET NULL pour character.owner_id : cette
 * colonne est DÉJÀ nullable (fiches « legacy » sans propriétaire, cf. Character.php) — une
 * fiche détachée reste visible du MJ de sa campagne, cohérent avec ON DELETE SET NULL déjà
 * posé sur character.campaign_id (Version20260925090000) pour la même raison.
 */
final class Version20260927120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'FK owner_id (campaign/character/custom_creature/homebrew_entry) : ON DELETE CASCADE|SET NULL — la suppression de compte ne doit plus échouer en 500';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE campaign DROP CONSTRAINT FK_1F1512DD7E3C61F9');
        $this->addSql('ALTER TABLE campaign ADD CONSTRAINT FK_1F1512DD7E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE "character" DROP CONSTRAINT FK_937AB0347E3C61F9');
        $this->addSql('ALTER TABLE "character" ADD CONSTRAINT FK_937AB0347E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE custom_creature DROP CONSTRAINT FK_CFBE8D907E3C61F9');
        $this->addSql('ALTER TABLE custom_creature ADD CONSTRAINT FK_CFBE8D907E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE homebrew_entry DROP CONSTRAINT FK_7A9A1F047E3C61F9');
        $this->addSql('ALTER TABLE homebrew_entry ADD CONSTRAINT FK_7A9A1F047E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE campaign DROP CONSTRAINT FK_1F1512DD7E3C61F9');
        $this->addSql('ALTER TABLE campaign ADD CONSTRAINT FK_1F1512DD7E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE "character" DROP CONSTRAINT FK_937AB0347E3C61F9');
        $this->addSql('ALTER TABLE "character" ADD CONSTRAINT FK_937AB0347E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE custom_creature DROP CONSTRAINT FK_CFBE8D907E3C61F9');
        $this->addSql('ALTER TABLE custom_creature ADD CONSTRAINT FK_CFBE8D907E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE homebrew_entry DROP CONSTRAINT FK_7A9A1F047E3C61F9');
        $this->addSql('ALTER TABLE homebrew_entry ADD CONSTRAINT FK_7A9A1F047E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
