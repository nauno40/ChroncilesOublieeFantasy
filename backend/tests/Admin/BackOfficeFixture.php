<?php

namespace App\Tests\Admin;

use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\Capability;
use App\Entity\Character;
use App\Entity\CharacterVoie;
use App\Entity\Clue;
use App\Entity\Creature;
use App\Entity\CreatureFamily;
use App\Entity\CreatureVoie;
use App\Entity\CustomCreature;
use App\Entity\Encounter;
use App\Entity\Equipment;
use App\Entity\Family;
use App\Entity\Food;
use App\Entity\HarmfulState;
use App\Entity\HomebrewEntry;
use App\Entity\Lodging;
use App\Entity\Material;
use App\Entity\Mount;
use App\Entity\Poison;
use App\Entity\Profile;
use App\Entity\Quest;
use App\Entity\Race;
use App\Entity\Session;
use App\Entity\Trap;
use App\Entity\User;
use App\Entity\Voie;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Une ligne de chaque entité couverte par le back-office.
 *
 * Ce n'est pas du confort : sur une base vide, EasyAdmin n'a aucune entité à convertir en
 * chaîne pour ses listes déroulantes, et les pannes de rendu que les tests surveillent
 * disparaissent d'elles-mêmes.
 */
final class BackOfficeFixture
{
    /** @return array<string, object> nom de section => entité */
    public static function seed(EntityManagerInterface $em, User $owner): array
    {
        $family = (new Family())
            ->setName('Combattant')
            ->setDescription('Famille de test.')
            ->setBaseHp(6)
            ->setRecoveryDie('d6')
            ->setLuckPoints(3);

        $profile = (new Profile())->setName('Guerrier');
        $profile->setFamily($family);

        $race = (new Race())->setName('Humain')->setDescription('Race de test.');

        $voie = (new Voie())
            ->setName('Voie de l\'épée')
            ->setDescription('Voie de test.')
            ->setCategory('profil')
            ->setMaxRank(5);
        $voie->setProfile($profile);

        $capability = (new Capability())
            ->setName('Coup puissant')
            ->setDescription('Capacité de test.')
            ->setRank(1)
            ->setIsSpell(false)
            ->setLimited(false);
        $capability->setVoie($voie);

        $creatureFamily = (new CreatureFamily())->setName('Bêtes');

        $creature = (new Creature())
            ->setName('Loup')
            ->setNc(1.0)
            ->setHp(12)
            ->setDef(13)
            ->setInit(14);
        $creature->setFamily($creatureFamily);

        $creatureVoie = (new CreatureVoie())->setRank(1);
        $creatureVoie->setCreature($creature);
        $creatureVoie->setVoie($voie);

        $equipment = (new Equipment())->setName('Épée longue')->setType('weapon');
        $material = (new Material())->setName('Corde de chanvre');
        $food = (new Food())->setName('Ration de voyage');
        $lodging = (new Lodging())->setName('Auberge commune');
        $mount = (new Mount())->setName('Cheval de selle');
        $state = (new HarmfulState())->setName('Affaibli');
        $poison = (new Poison())->setName('Venin de vouivre');
        $trap = (new Trap())->setName('Fosse à pieux');

        $campaign = (new Campaign())->setName('Campagne de test');
        $campaign->setOwner($owner);

        $quest = (new Quest())
            ->setTitle('Retrouver la relique')
            ->setType('principale')
            ->setStatus('en cours')
            ->setShared(false);
        $quest->setCampaign($campaign);

        $clue = (new Clue())
            ->setContent('Une empreinte fraîche près de la rivière.')
            ->setStatus('découvert')
            ->setShared(false);
        $clue->setCampaign($campaign);

        $gameSession = (new Session())
            ->setTitle('Séance 1')
            ->setDate(new \DateTime('2026-08-14'));
        $gameSession->setCampaign($campaign);

        $encounter = (new Encounter())->setName('Embuscade des loups');
        $encounter->setCampaign($campaign);

        $membership = new CampaignMembership();
        $membership->setCampaign($campaign);
        $membership->setPlayer($owner);

        $character = (new Character())->setName('Aldric')->setLevel(1);
        $character->setOwner($owner);
        $character->setRace($race);
        $character->setProfile($profile);
        $character->setCaracs(['FOR' => 2, 'DEX' => 1]);

        $characterVoie = (new CharacterVoie())->setRank(2)->setSource('profil');
        $characterVoie->setCharacter($character);
        $characterVoie->setVoie($voie);

        $homebrew = (new HomebrewEntry())
            ->setCategory('voie')
            ->setName('Voie du chasseur de primes')
            ->setVisibility('public')
            ->setData(['rangs' => 5]);
        $homebrew->setOwner($owner);
        $homebrew->setCreatedAt(new \DateTimeImmutable());
        $homebrew->setUpdatedAt(new \DateTimeImmutable());

        $customCreature = (new CustomCreature())
            ->setName('Gobelin d\'égout')
            ->setNc(0.5)
            ->setHp(8)
            ->setDef(11)
            ->setInit(12);
        $customCreature->setOwner($owner);

        $entities = [
            'family' => $family,
            'profile' => $profile,
            'race' => $race,
            'voie' => $voie,
            'capability' => $capability,
            'creature-family' => $creatureFamily,
            'creature' => $creature,
            'creature-voie' => $creatureVoie,
            'equipment' => $equipment,
            'material' => $material,
            'food' => $food,
            'lodging' => $lodging,
            'mount' => $mount,
            'state' => $state,
            'poison' => $poison,
            'trap' => $trap,
            'campaign' => $campaign,
            'quest' => $quest,
            'clue' => $clue,
            'session' => $gameSession,
            'encounter' => $encounter,
            'membership' => $membership,
            'character' => $character,
            'character-voie' => $characterVoie,
            'homebrew' => $homebrew,
            'custom-creature' => $customCreature,
        ];

        foreach ($entities as $entity) {
            $em->persist($entity);
        }
        $em->flush();

        return $entities;
    }
}
