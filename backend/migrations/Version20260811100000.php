<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Aligne le dé de vie servi sur celui de la famille, comme le veut COF2.
 *
 * « Le type du DR dépend de la famille du profil du PJ. Aventuriers : d8 ; Combattants :
 * d10 ; Mages : d6 ; Mystiques : d8 » (Création du personnage, §7). Il n'existe pas de dé
 * par profil : deux profils d'une même famille ont forcément le même.
 *
 * Quatre profils annonçaient pourtant autre chose — Barbare 1D12, Ensorceleur / Magicien /
 * Sorcier 1D4 : les dés de vie du barbare et du magicien de d20, hérités de l'export
 * d'origine. La fiche de classe les affichait tels quels, et le filtre « Dé de vie » de la
 * liste proposait donc des dés que COF2 n'emploie pas.
 *
 * Migration de données plutôt que rechargement des fixtures — celui-ci purge les tables et
 * emporterait le contenu des utilisateurs. `stats` est fusionné, jamais remplacé :
 * `hpPerLevel` et `profileType` restent intacts. Les fixtures sont corrigées à la source
 * dans le même commit, pour qu'un chargement neuf ne réintroduise pas l'écart.
 */
final class Version20260811100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Dé de vie des profils = dé de récupération de leur famille (COF2 §7).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE profile p
            SET stats = (
                COALESCE(p.stats, '{}'::jsonb::json)::jsonb
                || jsonb_build_object('hitDie', '1D' || substring(f.recovery_die from 2))
            )::json
            FROM family f
            WHERE p.family_id = f.id
              AND f.recovery_die IS NOT NULL
              AND p.stats::jsonb->>'hitDie' IS DISTINCT FROM '1D' || substring(f.recovery_die from 2)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // Les quatre valeurs d'origine, pour que la migration reste réversible telle quelle.
        $this->addSql(<<<'SQL'
            UPDATE profile
            SET stats = (stats::jsonb || '{"hitDie": "1D12"}'::jsonb)::json
            WHERE name = 'Barbare'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE profile
            SET stats = (stats::jsonb || '{"hitDie": "1D4"}'::jsonb)::json
            WHERE name IN ('Ensorceleur', 'Magicien', 'Sorcier')
        SQL);
    }
}
