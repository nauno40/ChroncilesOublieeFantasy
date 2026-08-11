<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Le NC accueille le demi-niveau, et les quatre créatures du livre qui en portent un.
 *
 * COF2 emploie ½ pour les adversaires les plus faibles — la règle de l'attaque magique le
 * dit explicitement : « en ajoutant sa VOL à son NC (½ vaut 0) ». Bandit de base, milicien,
 * gobelin élite et rat géant sont des NC ½ dans le chapitre Opposition ; la colonne étant
 * entière, ils étaient servis NC 1, soit le double de leur puissance annoncée. Le budget
 * d'une rencontre les comptait donc deux fois trop cher.
 *
 * `custom_creature` suit la même colonne (trait partagé) : un MJ peut désormais donner ½ à
 * sa propre créature, comme le livre le fait pour les siennes.
 *
 * Portée : seules les créatures dont le nom est identique à un profil du livre sont
 * corrigées (cf. `scripts/audit-bestiaire.mjs`). Les 157 créatures servies absentes du
 * livre restent telles quelles — rien ne permet de les vérifier.
 */
final class Version20260811160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'NC en flottant + rétablit les quatre NC ½ du livre.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE creature ALTER COLUMN nc TYPE DOUBLE PRECISION');
        $this->addSql('ALTER TABLE custom_creature ALTER COLUMN nc TYPE DOUBLE PRECISION');
        $this->addSql(<<<'SQL'
            UPDATE creature SET nc = 0.5
            WHERE name IN ('Bandit de base', 'Milicien', 'Gobelin élite', 'Rat géant')
        SQL);
    }

    public function down(Schema $schema): void
    {
        // Les demi-niveaux ne survivent pas au retour en entier : ils remontent à 1, la
        // valeur servie jusqu'ici. Arrondir vers le bas les ferait passer pour des NC 0,
        // que le générateur de rencontres exclut.
        $this->addSql(<<<'SQL'
            UPDATE creature SET nc = 1 WHERE nc > 0 AND nc < 1
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE custom_creature SET nc = 1 WHERE nc > 0 AND nc < 1
        SQL);
        $this->addSql('ALTER TABLE creature ALTER COLUMN nc TYPE INT');
        $this->addSql('ALTER TABLE custom_creature ALTER COLUMN nc TYPE INT');
    }
}
