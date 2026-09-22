<?php

namespace App\Tests\Api;

use App\Entity\Capability;
use App\Entity\Equipment;
use App\Entity\Profile;
use App\Entity\Voie;

/**
 * Verrouille le contrat de l'API du compendium dont dépend le moteur de règles du front :
 * la structure `Capability.effect` (evolutiveDie / bonuses / choiceOptions / armorCap) doit
 * être exposée via `voie:read`, et `Profile.armorMaxDef` via l'API des profils. Un changement
 * de nom de champ ou de groupe de sérialisation casserait silencieusement la dérivation front.
 */
final class CompendiumContractTest extends ApiSecurityTestCase
{
    public function testVoieExposesCapabilityStructuredEffect(): void
    {
        $voie = new Voie();
        $voie->setName('Voie du test');
        $voie->setDescription('Voie de test.');
        $voie->setCategory('profil');
        $voie->setMaxRank(5);
        $this->em->persist($voie);

        $cap = new Capability();
        $cap->setName('Capacité de test');
        $cap->setDescription('Une capacité.');
        $cap->setRank(1);
        $cap->setIsSpell(false);
        $cap->setLimited(false);
        $cap->setEffect([
            'evolutiveDie' => ['count' => 1],
            'bonuses' => [['target' => 'def', 'scalesWith' => 'fixed', 'value' => 1]],
            'choiceOptions' => [['label' => 'Option A']],
            'armorCap' => 7,
        ]);
        $cap->setVoie($voie);
        $this->em->persist($cap);
        $this->em->flush();
        // Relecture fraîche depuis la BDD (sinon l'API sérialise la collection en mémoire, vide).
        $voieId = $voie->getId();
        $this->em->clear();

        $response = $this->client->request('GET', '/api/voies/'.$voieId);
        $this->assertResponseStatusCodeSame(200);
        $data = json_decode($response->getContent(), true);

        $this->assertArrayHasKey('capabilities', $data);
        $this->assertCount(1, $data['capabilities']);

        $effect = $data['capabilities'][0]['effect'];
        $this->assertSame(1, $effect['evolutiveDie']['count']);
        $this->assertSame('def', $effect['bonuses'][0]['target']);
        $this->assertSame('fixed', $effect['bonuses'][0]['scalesWith']);
        $this->assertSame(1, $effect['bonuses'][0]['value']);
        $this->assertSame('Option A', $effect['choiceOptions'][0]['label']);
        $this->assertSame(7, $effect['armorCap']);
    }

    public function testProfileExposesArmorMaxDef(): void
    {
        $profile = new Profile();
        $profile->setName('Profil de test');
        $profile->setArmorMaxDef(4);
        $this->em->persist($profile);
        $this->em->flush();

        $response = $this->client->request('GET', '/api/profiles/'.$profile->getId());
        $this->assertResponseStatusCodeSame(200);
        $data = json_decode($response->getContent(), true);

        $this->assertSame(4, $data['armorMaxDef']);
    }

    /**
     * `data/weapons.json` et `data/armors.json` portent `requirements`/`comments`/`isRanged`
     * depuis toujours (un vrai texte de règles, ex. « AGI max +3 »), silencieusement jamais lu
     * par `AppFixtures::loadEquipment()` ni exposé jusqu'ici (scripts/audit-types-api.mjs).
     * `isRanged` prend au passage l'alias `isIsRanged()` qu'exige le PropertyAccessor d'un
     * back-office éditable pour une propriété déjà préfixée `is` (même besoin que
     * `Capability::isIsSpell()`) — ce test verrouille que la sérialisation JSON en sort bien
     * sous le nom `isRanged`, pas `isIsRanged`.
     */
    public function testEquipmentExposesRequirementsCommentsAndIsRanged(): void
    {
        $weapon = new Equipment();
        $weapon->setName('Épée de test');
        $weapon->setType('Contact');
        $weapon->setRequirements('Valeur minimale de +1 en FOR');
        $weapon->setComments('Arme à deux mains');
        $weapon->setIsRanged(false);
        $this->em->persist($weapon);
        $this->em->flush();

        $response = $this->client->request('GET', '/api/equipment/'.$weapon->getId());
        $this->assertResponseStatusCodeSame(200);
        $data = json_decode($response->getContent(), true);

        $this->assertSame('Valeur minimale de +1 en FOR', $data['requirements']);
        $this->assertSame('Arme à deux mains', $data['comments']);
        $this->assertFalse($data['isRanged']);
    }
}
