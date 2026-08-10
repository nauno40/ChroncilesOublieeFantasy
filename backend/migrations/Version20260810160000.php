<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Déclare le plafond d'armure relevé par les deux capacités de barbare.
 *
 * COF2 : « le barbare peut désormais porter une chemise de mailles et utiliser toutes les
 * capacités des voies de barbare auparavant autorisées avec une armure de cuir renforcé »
 * (Tour de force, rang 2), puis la cotte de mailles (Briseur d'os, rang 5). Seule
 * « Autorité naturelle » (chevalier) portait son `armorCap` : un barbare de rang 2 en
 * chemise de mailles voyait donc ses capacités de barbare annoncées inutilisables, alors
 * que Tour de force les lui rend précisément accessibles.
 *
 * Migration de données plutôt que rechargement des fixtures : celui-ci purge les tables et
 * emporterait le contenu des utilisateurs. `effect` est fusionné, jamais remplacé — Tour de
 * force porte déjà son dé évolutif.
 */
final class Version20260810160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Déclare l'armorCap de Tour de force (4) et Briseur d'os (5).";
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE capability
            SET effect = COALESCE(effect, '{}'::jsonb::json)::jsonb || '{"armorCap": 4}'::jsonb
            WHERE name = 'Tour de force'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability
            SET effect = COALESCE(effect, '{}'::jsonb::json)::jsonb || '{"armorCap": 5}'::jsonb
            WHERE name = 'Briseur d’os'
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE capability
            SET effect = (effect::jsonb - 'armorCap')::json
            WHERE name IN ('Tour de force', 'Briseur d’os')
        SQL);
    }
}
