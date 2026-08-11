<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Rétablit le type d'action des capacités officielles, que les fixtures lisaient sans le
 * stocker.
 *
 * `AppFixtures` lit la clé `type` du JSON (« Action (A)* », « Action Limitée (L) »…) pour en
 * déduire `limited` et `isSpell`, puis la jette : `setActionType()` n'était appelé nulle part.
 * La colonne restait donc NULLE pour les 350 capacités officielles qui en déclarent un.
 *
 * Conséquence silencieuse : la concentration accrue (« lorsqu'il utilise un sort qui nécessite
 * une action d'attaque (A), le personnage peut se concentrer plus longtemps pour réduire le
 * coût du sort de 2 PM ») ne s'appliquait à AUCUN sort officiel, faute de savoir lequel se
 * lance en (A). 67 capacités y avaient droit.
 *
 * Trouvé en rejouant les fixtures avant d'ajouter l'intégration continue : un test E2E qui
 * passait depuis toujours s'est mis à échouer, parce qu'il s'appuyait sur une donnée que
 * rien dans le dépôt ne sait reproduire.
 *
 * L'appariement porte sur le couple (voie, capacité) et non sur le seul nom : sept
 * capacités héroïques portent le même nom dans des voies différentes.
 */
final class Version20260812090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Rétablit le type d'action de 350 capacités officielles.";
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Artilleur' AND c.name = 'Mécanismes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Artilleur' AND c.name = 'Arme à répétition'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Artilleur' AND c.name = 'Tir de barrage'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Modification'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Artilleur' AND c.name = 'Canon double'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Artilleur' AND c.name = 'Couleuvrine'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Explosifs' AND c.name = 'Tir de grenaille'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (Longue)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Explosifs' AND c.name = 'Démolition'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Explosifs' AND c.name = 'Poudre puissante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Explosifs' AND c.name = 'Piège explosif'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Explosifs' AND c.name = 'Boulet explosif'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Mercenaire' AND c.name = 'Pilier de bar'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Mercenaire' AND c.name = 'Mort ou vif'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Mercenaire' AND c.name = 'Combattant aguerri'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Mercenaire' AND c.name = 'Constitution héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Mercenaire' AND c.name = 'Combat de masse'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pistolero' AND c.name = 'Plus vite que son ombre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pistolero' AND c.name = 'Ajuster le tir'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pistolero' AND c.name = 'Tir double'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pistolero' AND c.name = 'Agilité héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pistolero' AND c.name = 'As de la gâchette'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Précision' AND c.name = 'Joli coup'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Précision' AND c.name = 'Défaut dans la cuirasse'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Précision' AND c.name = 'Tir précis'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Précision' AND c.name = 'Tireur d’élite'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Précision' AND c.name = 'Tir fatal'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Brute' AND c.name = 'Argument de taille'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Brute' AND c.name = 'Tour de force'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Brute' AND c.name = 'Attaque brutale'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Brute' AND c.name = 'Force héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Brute' AND c.name = 'Briseur d’os'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pagne' AND c.name = 'Vigueur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pagne' AND c.name = 'Peau de pierre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pagne' AND c.name = 'Tatouages'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pagne' AND c.name = 'Constitution héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pagne' AND c.name = 'Peau d’acier'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pourfendeur' AND c.name = 'Réflexes éclair'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pourfendeur' AND c.name = 'Charge'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Action Gratuite'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pourfendeur' AND c.name = 'Enchaînement'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pourfendeur' AND c.name = 'Déchaînement d’acier'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Pourfendeur' AND c.name = 'Attaque tourbillon'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Primitif' AND c.name = 'Proche de la nature'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Primitif' AND c.name = 'Armure de vent'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Primitif' AND c.name = 'Vigilance'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Primitif' AND c.name = 'Résistance à la magie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Primitif' AND c.name = 'Vitalité débordante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Rage' AND c.name = 'Cri de guerre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Réaction'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Rage' AND c.name = 'Défier la mort'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Rage' AND c.name = 'Rage du berserk'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Réaction'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Rage' AND c.name = 'Même pas mal'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Rage' AND c.name = 'Furie du berserk'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Escrime' AND c.name = 'Précision'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Escrime' AND c.name = 'Feinte'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Escrime' AND c.name = 'Intelligence du combat'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Escrime' AND c.name = 'Attaque flamboyante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Escrime' AND c.name = 'Botte mortelle'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L) - Sort*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Musicien' AND c.name = 'Chant des héros'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L) - Sort*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Musicien' AND c.name = 'Chant de réconfort'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A) - Sort*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Musicien' AND c.name = 'Attaque sonore'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A) - Sort*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Musicien' AND c.name = 'Zone de silence'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A) - Sort*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Musicien' AND c.name = 'Danse irrésistible'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Saltimbanque' AND c.name = 'Acrobate'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Saltimbanque' AND c.name = 'Grâce féline'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Saltimbanque' AND c.name = 'Lanceur de couteau'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Saltimbanque' AND c.name = 'Liberté d’action'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Saltimbanque' AND c.name = 'Esquive acrobatique'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Séduction' AND c.name = 'Charmant'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Séduction' AND c.name = 'Dentelles et rapière'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (Sociale)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Séduction' AND c.name = 'Baratineur de génie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Séduction' AND c.name = 'Charisme héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A) - Sort*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Séduction' AND c.name = 'Suggestion'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Vagabond' AND c.name = 'Rumeurs et légendes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Vagabond' AND c.name = 'Éclectique'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (Spéciale)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Vagabond' AND c.name = 'Attirail'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A) - Sort*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Vagabond' AND c.name = 'Compréhension des langues'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A) - Sort*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Vagabond' AND c.name = 'Déguisement'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Cavalier' AND c.name = 'Fidèle monture'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Cavalier' AND c.name = 'Cavalier émérite'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Cavalier' AND c.name = 'Charge'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Cavalier' AND c.name = 'Monture magique'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Action Gratuite'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Cavalier' AND c.name = 'Monture fantastique'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Guerre' AND c.name = 'Armure sur mesure'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Guerre' AND c.name = 'Encaisser un coup'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Guerre' AND c.name = 'Frappe du justicier'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Guerre' AND c.name = 'Force héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Guerre' AND c.name = 'Mon armure est une arme'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Preux' AND c.name = 'Ignorer la douleur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Preux' AND c.name = 'Piqûres d’insectes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Preux' AND c.name = 'Laissez‑le‑moi'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Preux' AND c.name = 'Charisme héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Preux' AND c.name = 'Seul contre tous'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Meneur d''Hommes' AND c.name = 'Sans peur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Meneur d''Hommes' AND c.name = 'Intercepter'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Meneur d''Hommes' AND c.name = 'Exemplaire'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Meneur d''Hommes' AND c.name = 'Charge fantastique'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Meneur d''Hommes' AND c.name = 'Ordre de bataille'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Noblesse' AND c.name = 'Éduqué'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Noblesse' AND c.name = 'Écuyer'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Noblesse' AND c.name = 'Autorité naturelle'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Noblesse' AND c.name = 'Massacrer la piétaille'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif (Spécial)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Noblesse' AND c.name = 'Formation d’élite'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Animaux' AND c.name = 'Langage des animaux'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Animaux' AND c.name = 'Petit compagnon'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Animaux' AND c.name = 'Nuée d’insectes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Animaux' AND c.name = 'Masque du prédateur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Animaux' AND c.name = 'Forme animale'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Fauve' AND c.name = 'Vitesse du félin'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Fauve' AND c.name = 'Panthère'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Fauve' AND c.name = 'Attaque bondissante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif (Amélioration)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Fauve' AND c.name = 'Grand félin'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif (Limité)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Fauve' AND c.name = 'Les sept vies du chat'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Nature' AND c.name = 'Maître de la survie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Nature' AND c.name = 'Terrains difficiles'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Nature' AND c.name = 'Bâton de druide'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Nature' AND c.name = 'Constitution héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Nature' AND c.name = 'Résistant'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Protecteur' AND c.name = 'Baies magiques'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Rituel (30 min)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Protecteur' AND c.name = 'Forêt vivante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Rituel (10 min)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Protecteur' AND c.name = 'Régénération'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Protecteur' AND c.name = 'Perception héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Protecteur' AND c.name = 'Forme d’arbre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Végétaux' AND c.name = 'Peau d’écorce'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Végétaux' AND c.name = 'Prison végétale'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Végétaux' AND c.name = 'Flèche vivante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Végétaux' AND c.name = 'Animation d’un arbre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Végétaux' AND c.name = 'Porte végétale'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Air' AND c.name = 'Murmures dans le vent'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Air' AND c.name = 'Sous tension'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Air' AND c.name = 'Télékinésie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Air' AND c.name = 'Foudre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Air' AND c.name = 'Forme éthérée'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Divination' AND c.name = 'Divination'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Divination' AND c.name = 'Détection de l’invisible'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Divination' AND c.name = 'Clairvoyance'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Divination' AND c.name = 'Perception héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Début de round'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Divination' AND c.name = 'Prescience'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Envoûteur' AND c.name = 'Injonction'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Envoûteur' AND c.name = 'Sommeil'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Envoûteur' AND c.name = 'Confusion'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Envoûteur' AND c.name = 'Amitié'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Envoûteur' AND c.name = 'Domination'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Illusions' AND c.name = 'Mirage'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Illusions' AND c.name = 'Image décalée'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Illusions' AND c.name = 'Sort illusoire'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Illusions' AND c.name = 'Imitation'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Illusions' AND c.name = 'Exécution mentale'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Invocation' AND c.name = 'Choc'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Invocation' AND c.name = 'Serviteur invisible'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Invocation' AND c.name = 'Arme de mana'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Invocation' AND c.name = 'Porte dimensionnelle'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Invocation' AND c.name = 'Mur de mana'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Action Limitée'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Artefacts' AND c.name = 'Bâton de mage'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Artefacts' AND c.name = 'Ouverture ‑ fermeture'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Artefacts' AND c.name = 'Sac sans fond'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Artefacts' AND c.name = 'Frappe des arcanes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Artefacts' AND c.name = 'Artefact étrange'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Élixirs' AND c.name = 'Fortifiant'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Élixirs' AND c.name = 'Feu grégeois'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Élixirs' AND c.name = 'Élixir de guérison'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Élixirs' AND c.name = 'Élixirs mineurs'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Élixirs' AND c.name = 'Élixirs majeurs'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Métal' AND c.name = 'Morsure de la forge'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Métal' AND c.name = 'Métal brûlant'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Métal' AND c.name = 'Magnétisme'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Métal' AND c.name = 'Métal hurlant'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Métal' AND c.name = 'Endurer'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Golem' AND c.name = 'Grosse tête'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Golem' AND c.name = 'Golem'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Golem' AND c.name = 'Protecteur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Golem' AND c.name = 'Statuette'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif (Amélioration)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Golem' AND c.name = 'Golem supérieur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Runes' AND c.name = 'Runes de défense'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Runes' AND c.name = 'Rune de puissance'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Runes' AND c.name = 'Rune de protection'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Runes' AND c.name = 'Rune d’énergie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Rituel (10 min)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Runes' AND c.name = 'Rune de garde'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Bouclier' AND c.name = 'Protéger un allié'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Bouclier' AND c.name = 'Parer un coup'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Bouclier' AND c.name = 'Défense au bouclier'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Réaction (Spécial)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Bouclier' AND c.name = 'Absorber un sort'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Bouclier' AND c.name = 'Renvoi de sort'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Combat' AND c.name = 'Vivacité'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Combat' AND c.name = 'Manœuvre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Action Limitée'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Combat' AND c.name = 'Attaque puissante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Combat' AND c.name = 'Double attaque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Combat' AND c.name = 'Attaque circulaire'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Maître d''Armes' AND c.name = 'Armes de prédilection'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Maître d''Armes' AND c.name = 'Science du critique'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Maître d''Armes' AND c.name = 'Spécialisation'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Maître d''Armes' AND c.name = 'Attaque parfaite'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Maître d''Armes' AND c.name = 'Riposte'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Résistance' AND c.name = 'Robustesse'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Résistance' AND c.name = 'Résilient'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Résistance' AND c.name = 'Armure lourde'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Résistance' AND c.name = 'Constitution héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Résistance' AND c.name = 'Dur à cuire'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Soldat' AND c.name = 'Teigneux'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Soldat' AND c.name = 'Prouesse'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Soldat' AND c.name = 'Piqûre de rappel'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Soldat' AND c.name = 'Force héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Soldat' AND c.name = 'Rempart'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie des Arcanes' AND c.name = 'Projectile de mana'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie des Arcanes' AND c.name = 'Lévitation'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie des Arcanes' AND c.name = 'Forme gazeuse'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie des Arcanes' AND c.name = 'Accélération'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie des Arcanes' AND c.name = 'Désintégration'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Destructrice' AND c.name = 'Arc de feu'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Destructrice' AND c.name = 'Saper les forces'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Destructrice' AND c.name = 'Flèche de feu'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Destructrice' AND c.name = 'Explosion de feu'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Destructrice' AND c.name = 'Appel de la foudre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Élémentaire' AND c.name = 'Asphyxie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Élémentaire' AND c.name = 'Maîtrise des éléments'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A) ou (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Élémentaire' AND c.name = 'Arme élémentaire'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Élémentaire' AND c.name = 'Respiration aquatique'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Élémentaire' AND c.name = 'Armure de pierre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Protectrice' AND c.name = 'Armure de mana'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Protectrice' AND c.name = 'Chute ralentie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Protectrice' AND c.name = 'Déphasage'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Protectrice' AND c.name = 'Cercle de protection'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Protectrice' AND c.name = 'Interruption du temps'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Universelle' AND c.name = 'Lumière'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Universelle' AND c.name = 'Familier'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A) ou (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Universelle' AND c.name = 'Invisibilité'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Universelle' AND c.name = 'Vol'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Magie Universelle' AND c.name = 'Téléportation'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Énergie Vitale' AND c.name = 'Mains d’énergie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Énergie Vitale' AND c.name = 'Projection du ki'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Énergie Vitale' AND c.name = 'Invulnérable'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M) / Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Énergie Vitale' AND c.name = 'Pression mortelle'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Énergie Vitale' AND c.name = 'Ascétisme'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Maîtrise' AND c.name = 'Agilité du singe'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Maîtrise' AND c.name = 'Griffes du tigre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Maîtrise' AND c.name = 'Morsure du serpent'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Maîtrise' AND c.name = 'Fureur du dragon'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Action Gratuite'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Maîtrise' AND c.name = 'Moment de perfection'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Méditation' AND c.name = 'Pacifisme'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (Méditation 10 min)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Méditation' AND c.name = 'Transe de guérison'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Méditation' AND c.name = 'Maîtrise du ki'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Méditation' AND c.name = 'Volonté héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Méditation' AND c.name = 'Projection mentale'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Poing' AND c.name = 'Poings de fer'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Poing' AND c.name = 'Peau de fer'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Poing' AND c.name = 'Parade de projectiles'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Poing' AND c.name = 'Déluge de coups'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Poing' AND c.name = 'Puissance du ki'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Vent' AND c.name = 'Pas du vent'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Vent' AND c.name = 'Course du vent'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Vent' AND c.name = 'Course des airs'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Vent' AND c.name = 'Agilité héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Vent' AND c.name = 'Passe‑muraille'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Foi' AND c.name = 'Prédicateur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Foi' AND c.name = 'Miracle mineur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M) ou Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Foi' AND c.name = 'Arme de lumière'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Foi' AND c.name = 'Ailes célestes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Foi' AND c.name = 'Foudres divines'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Guerre Sainte' AND c.name = 'Arme bénie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Guerre Sainte' AND c.name = 'Bouclier de la foi'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Guerre Sainte' AND c.name = 'Châtiment divin'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Guerre Sainte' AND c.name = 'Marteau de la foi'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Guerre Sainte' AND c.name = 'Mot de pouvoir'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Prière' AND c.name = 'Bénédiction'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Prière' AND c.name = 'Sanctuaire'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Prière' AND c.name = 'Destruction du mal'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Prière' AND c.name = 'Volonté héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Prière' AND c.name = 'Intervention divine'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Soins' AND c.name = 'Récupération mineure'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Soins' AND c.name = 'Vigueur divine'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Soins' AND c.name = 'Récupération majeure'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Réaction'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Soins' AND c.name = 'Phénix'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Rituel (10 min)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie des Soins' AND c.name = 'Rétablissement'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Spiritualité' AND c.name = 'Vêtements sacrés'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Spiritualité' AND c.name = 'Augure'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Spiritualité' AND c.name = 'Délivrance'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Spiritualité' AND c.name = 'Charisme héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Spiritualité' AND c.name = 'Marche des plans'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Archer' AND c.name = 'Archer émérite'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Archer' AND c.name = 'Tir chirurgical'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Action Limitée (Option)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Archer' AND c.name = 'Dans le mille'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Archer' AND c.name = 'Tir rapide'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Archer' AND c.name = 'Flèche de mort'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Compagnon Animal' AND c.name = 'Le loup'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Compagnon Animal' AND c.name = 'Travail d’équipe'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Compagnon Animal' AND c.name = 'Lien empathique'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif (Amélioration)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Compagnon Animal' AND c.name = 'Loup alpha'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Compagnon Animal' AND c.name = 'Tactiques de meute'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Survie' AND c.name = 'Survie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Action'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Survie' AND c.name = 'Nature nourricière'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Survie' AND c.name = 'Grand pas'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Survie' AND c.name = 'Constitution héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Survie' AND c.name = 'Increvable'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Traqueur' AND c.name = 'Éclaireur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Traqueur' AND c.name = 'Attaque éclair'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Traqueur' AND c.name = 'Chasseur émérite'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Traqueur' AND c.name = 'Perception héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Traqueur' AND c.name = 'Repli'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Combat à Deux Armes' AND c.name = 'Attaque à suivre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Combat à Deux Armes' AND c.name = 'Parade croisée'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Combat à Deux Armes' AND c.name = 'Droite ‑ gauche'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Combat à Deux Armes' AND c.name = 'Combattant héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Combat à Deux Armes' AND c.name = 'Double peine'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M) ou Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Démon' AND c.name = 'Malédiction'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Démon' AND c.name = 'Beauté de la succube'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Démon' AND c.name = 'Pacte démoniaque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Démon' AND c.name = 'Aspect du démon'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Démon' AND c.name = 'Invocation d’un démon'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Mort' AND c.name = 'Siphon des âmes'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Mort' AND c.name = 'Masque mortuaire'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Mort' AND c.name = 'Baiser du vampire'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A) ou (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Mort' AND c.name = 'Peur'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Mort' AND c.name = 'Briser les cœurs'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Outre-Tombe' AND c.name = 'Un pied dans la tombe'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Outre-Tombe' AND c.name = 'Armure d’os'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Outre-Tombe' AND c.name = 'Animation des morts'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Outre-Tombe' AND c.name = 'Ensevelissement'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Outre-Tombe' AND c.name = 'Armée des morts'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Sang' AND c.name = 'Saignements'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Sang' AND c.name = 'Sang mordant'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Sang' AND c.name = 'Exsangue'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Sang' AND c.name = 'Rituel de sang'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Sang' AND c.name = 'Lien de sang'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Sombre Magie' AND c.name = 'Ténèbres'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Sombre Magie' AND c.name = 'Reptation'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Sombre Magie' AND c.name = 'Strangulation'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)*'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Sombre Magie' AND c.name = 'Manteau d’ombre'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de la Sombre Magie' AND c.name = 'Pacte ténébreux'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Assassin' AND c.name = 'Discrétion'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Assassin' AND c.name = 'Attaque sournoise'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action (A)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Assassin' AND c.name = 'Attaque par surprise'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action de Mouvement (M)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Assassin' AND c.name = 'Disparition'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Assassin' AND c.name = 'Ouverture mortelle'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Aventurier' AND c.name = 'Baratin'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Aventurier' AND c.name = 'Provocation'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Aventurier' AND c.name = 'Souplesse du félin'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Aventurier' AND c.name = 'Charisme héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Limitée (L)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie de l''Aventurier' AND c.name = 'Attaque paralysante'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Déplacement' AND c.name = 'Agile'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Déplacement' AND c.name = 'Réflexes félins'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Déplacement' AND c.name = 'Acrobaties'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Déplacement' AND c.name = 'Agilité héroïque'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Déplacement' AND c.name = 'Esquive de la magie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Roublard' AND c.name = 'Doigts agiles'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Roublard' AND c.name = 'Aux aguets'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Roublard' AND c.name = 'Feindre la mort'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Roublard' AND c.name = 'Expert en criminalité'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif / Action'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Roublard' AND c.name = 'Maître du poison'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Spadassin' AND c.name = 'Attaque en finesse'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Spadassin' AND c.name = 'Esquive fatale'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Spadassin' AND c.name = 'Frappe chirurgicale'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Action Gratuite (G)'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Spadassin' AND c.name = 'Ambidextrie'
        SQL);
        $this->addSql(<<<'SQL'
            UPDATE capability c SET action_type = 'Passif'
            FROM voie v WHERE c.voie_id = v.id AND v.name = 'Voie du Spadassin' AND c.name = 'Botte secrète'
        SQL);
    }

    public function down(Schema $schema): void
    {
        // La colonne n'a jamais été peuplée avant cette migration : la vider la remet
        // exactement dans son état d'origine.
        $this->addSql('UPDATE capability SET action_type = NULL');
    }
}
