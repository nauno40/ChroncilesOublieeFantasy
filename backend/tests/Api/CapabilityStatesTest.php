<?php

namespace App\Tests\Api;

use App\Entity\Capability;
use App\Entity\Voie;

/**
 * Une capacité peut déclarer les états qu'elle inflige. La colonne doit traverser la
 * sérialisation : sans cela, le suivi de combat ne verrait jamais la déclaration.
 *
 * Les requêtes passent par le client de la classe de base. En rappeler `createClient()`
 * rebootait le noyau déjà démarré, ce qu'API Platform 4.1 déprécie — et `phpunit.dist.xml`
 * pose `failOnDeprecation`, donc la suite entière sortait en échec.
 */
final class CapabilityStatesTest extends ApiSecurityTestCase
{
    private function creerCapacite(?array $states, ?array $summons = null): Capability
    {
        $voie = new Voie();
        $voie->setName('Voie de test');
        $voie->setDescription('');
        $voie->setCategory('profil');
        // Colonnes non nulles de Voie : name, description, category, maxRank.
        $voie->setMaxRank(5);
        $this->em->persist($voie);

        $capacite = new Capability();
        $capacite->setName('Frappe étourdissante');
        $capacite->setDescription('La cible doit réussir un test ou être Étourdie.');
        $capacite->setRank(1);
        $capacite->setIsSpell(false);
        $capacite->setLimited(false);
        $capacite->setVoie($voie);
        $capacite->setStates($states);
        $capacite->setSummons($summons);
        $this->em->persist($capacite);
        $this->em->flush();

        return $capacite;
    }

    public function testLesEtatsDeclaresSontServisParLApi(): void
    {
        $capacite = $this->creerCapacite(['Étourdi']);
        $id = $capacite->getId();
        // Sans ce clear, la réponse pourrait provenir de l'identity map plutôt que de la base.
        $this->em->clear();

        $this->client->request('GET', "/api/capabilities/{$id}");

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['states' => ['Étourdi']]);
    }

    public function testUneCapaciteSansDeclarationNePortePasLaCle(): void
    {
        // L'API omet les valeurs nulles : l'absence de clé est le comportement attendu,
        // pas un défaut de sérialisation.
        $capacite = $this->creerCapacite(null);
        $id = $capacite->getId();
        $this->em->clear();

        $reponse = $this->client->request('GET', "/api/capabilities/{$id}");

        $this->assertResponseIsSuccessful();
        $this->assertArrayNotHasKey('states', $reponse->toArray());
    }

    public function testUneInvocationDeclareeEstServieTelleQuelle(): void
    {
        $capacite = $this->creerCapacite(null, [['type' => 'creature', 'ref' => 'Loup', 'quantity' => 2]]);
        $id = $capacite->getId();
        $this->em->clear();

        $this->client->request('GET', "/api/capabilities/{$id}");

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['summons' => [['type' => 'creature', 'ref' => 'Loup', 'quantity' => 2]]]);
    }
}
