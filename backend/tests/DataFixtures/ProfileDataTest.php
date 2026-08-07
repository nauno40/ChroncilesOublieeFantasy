<?php

namespace App\Tests\DataFixtures;

use App\DataFixtures\AppFixtures;
use PHPUnit\Framework\TestCase;

/**
 * Contrat des données de profil (`data/Profils/*.json`) et de la table de limites d'armure
 * qui les accompagne. Métier pur : ni DB, ni fixtures chargées — on lit les fichiers source,
 * là où une faute de frappe se glisse et ne se voit nulle part ailleurs.
 */
final class ProfileDataTest extends TestCase
{
    /** @return array<string, array<string, mixed>> nom de profil => contenu du fichier */
    private static function profils(): array
    {
        $dir = \dirname(__DIR__, 2).'/data/Profils';
        $out = [];
        foreach (glob($dir.'/*.json') as $fichier) {
            $data = json_decode(file_get_contents($fichier), true, flags: JSON_THROW_ON_ERROR);
            $out[$data['class']['name']] = $data;
        }
        self::assertNotEmpty($out, 'Aucun fichier de profil trouvé — chemin de données faux ?');

        return $out;
    }

    public function testChaqueProfilAUneLimiteDArmure(): void
    {
        // Une clé qui ne correspond à aucun profil (accent oublié, renommage) laisse
        // `armorMaxDef` à null : le front retombe alors sur une valeur par défaut, et un
        // magicien peut se retrouver en plaque sans que rien ne signale l'erreur.
        foreach (array_keys(self::profils()) as $nom) {
            $this->assertArrayHasKey(
                $nom,
                AppFixtures::ARMOR_MAX_DEF_BY_PROFILE,
                "Le profil « $nom » n'a pas de limite d'armure : elle resterait nulle en base."
            );
        }
    }

    public function testAucuneLimiteNeViseUnProfilInexistant(): void
    {
        $profils = array_keys(self::profils());
        foreach (array_keys(AppFixtures::ARMOR_MAX_DEF_BY_PROFILE) as $nom) {
            $this->assertContains($nom, $profils, "La limite d'armure « $nom » ne correspond à aucun profil.");
        }
    }

    public function testLesLimitesDArmureSuiventLeLivre(): void
    {
        // COF2, chapitres 4 à 7 (récapitulées au chapitre 9, § Armes et armures).
        // `-1` = aucune armure. Écrites ici en toutes lettres : ce test doit échouer si
        // quelqu'un « corrige » la table sans rouvrir le livre.
        $attendu = [
            'Magicien' => -1, 'Ensorceleur' => -1, 'Sorcier' => -1, 'Moine' => -1,
            'Forgesort' => 2, 'Voleur' => 2, 'Druide' => 2,
            'Barde' => 3, 'Rôdeur' => 3, 'Barbare' => 3,
            'Arquebusier' => 4, 'Prêtre' => 4,
            'Guerrier' => 5,
            'Chevalier' => 6,
        ];
        $reel = AppFixtures::ARMOR_MAX_DEF_BY_PROFILE;
        ksort($attendu);
        ksort($reel);
        $this->assertSame($attendu, $reel);
    }

    public function testSeulsLesProfilsLanceursDeSortsEnPortent(): void
    {
        // Le marqueur d'un sort est l'astérisque du type d'action (« Action (A)* »).
        // Le rôdeur, qu'on suppose souvent lanceur, n'en a aucun — et c'est ce que dit le
        // livre : la règle de surcoût de PM en armure ne nomme que ces sept profils.
        $lanceurs = [];
        foreach (self::profils() as $nom => $data) {
            foreach ($data['paths'] ?? [] as $voie) {
                foreach ($voie['abilities'] ?? [] as $capacite) {
                    if (str_contains($capacite['type'] ?? '', '*')) {
                        $lanceurs[$nom] = true;
                    }
                }
            }
        }
        $trouves = array_keys($lanceurs);
        sort($trouves);

        $this->assertSame(
            ['Barde', 'Druide', 'Ensorceleur', 'Forgesort', 'Magicien', 'Prêtre', 'Sorcier'],
            $trouves
        );
    }

    public function testChaqueProfilACinqVoiesDeCinqCapacites(): void
    {
        // Structure invariante de COF2 : 5 voies × 5 rangs. Une voie tronquée à l'import
        // se voit ici, pas trois écrans plus loin.
        foreach (self::profils() as $nom => $data) {
            $voies = $data['paths'] ?? [];
            $this->assertCount(5, $voies, "Le profil « $nom » n'a pas 5 voies.");
            foreach ($voies as $voie) {
                $rangs = array_column($voie['abilities'] ?? [], 'rank');
                $this->assertSame([1, 2, 3, 4, 5], $rangs, "La voie « {$voie['name']} » ($nom) n'a pas les rangs 1 à 5.");
            }
        }
    }
}
