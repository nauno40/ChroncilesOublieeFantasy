<?php

namespace App\Tests\DataFixtures;

use PHPUnit\Framework\TestCase;

/**
 * Contrat des états préjudiciables (`data/states.json`). Métier pur : on lit le fichier
 * source. Le livre en énumère dix ; le seed n'en portait que huit, et deux effets y
 * disaient autre chose que les règles — d'où ce test.
 */
final class StateDataTest extends TestCase
{
    /** @return array<string, array<string, mixed>> nom => état */
    private static function etats(): array
    {
        $fichier = \dirname(__DIR__, 2).'/data/states.json';
        $data = json_decode(file_get_contents($fichier), true, flags: JSON_THROW_ON_ERROR);
        $out = [];
        foreach ($data as $etat) {
            $out[$etat['name']] = $etat;
        }

        return $out;
    }

    public function testLesDixEtatsDuLivreSontPresents(): void
    {
        // COF2, partie 2, chapitre Combat, § États préjudiciables.
        $attendus = ['Affaibli', 'Aveuglé', 'Essoufflé', 'Étourdi', 'Immobilisé',
                     'Invalide', 'Paralysé', 'Ralenti', 'Renversé', 'Surpris'];
        $trouves = array_keys(self::etats());
        sort($attendus);
        sort($trouves);
        $this->assertSame($attendus, $trouves);
    }

    public function testChaqueEtatPorteSesMecaniques(): void
    {
        // Un état sans `effects` retomberait dans la saisie manuelle : la fiche ferait
        // ressaisir au joueur ce que le compendium sait déjà.
        foreach (self::etats() as $nom => $etat) {
            $this->assertArrayHasKey('effects', $etat, "L'état « $nom » n'a aucune mécanique structurée.");
            $this->assertNotEmpty($etat['effects'], "Les mécaniques de « $nom » sont vides.");
        }
    }

    /**
     * Les cibles de bonus doivent exister côté fiche (`ItemBonusTarget`) : une cible
     * inventée serait ignorée en silence par la dérivation.
     */
    public function testLesCiblesDeBonusSontConnues(): void
    {
        $connues = ['def', 'init', 'pv', 'rd', 'attaque', 'dm'];
        foreach (self::etats() as $nom => $etat) {
            foreach ($etat['effects']['bonuses'] ?? [] as $bonus) {
                $this->assertContains($bonus['target'], $connues, "Cible inconnue dans « $nom ».");
                $this->assertIsInt($bonus['value'], "Valeur non entière dans « $nom ».");
            }
        }
    }

    public function testLesEffetsCorrigesSuiventLeLivre(): void
    {
        $etats = self::etats();

        // « Immobilisé : pas de déplacement et dé malus aux tests d'ATTAQUE » — le seed
        // généralisait à tous les tests.
        $this->assertSame('attack', $etats['Immobilisé']['effects']['malusDie']);
        $this->assertTrue($etats['Immobilisé']['effects']['noMove']);

        // « Renversé : … nécessite une action d'ATTAQUE pour se relever » — le seed disait
        // action de mouvement, ce qui change ce que le joueur perd à son tour.
        $this->assertStringContainsString("action d'attaque", $etats['Renversé']['effects']['note']);

        // Affaibli : dé malus à TOUS les tests, lui.
        $this->assertSame('all', $etats['Affaibli']['effects']['malusDie']);
    }
}
