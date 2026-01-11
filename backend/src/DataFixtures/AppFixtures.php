<?php

namespace App\DataFixtures;

use App\Entity\Creature;
use App\Entity\CreatureFamily;
use App\Entity\Family;
use App\Entity\Profile;
use App\Entity\Race;
use App\Entity\Voie;
use App\Entity\Capability;
use App\Entity\Equipment;
use App\Entity\Material;
use App\Entity\HarmfulState;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\Finder\Finder;

class AppFixtures extends Fixture
{
    private string $dataDir;

    public function __construct()
    {
        // Docker environment (volume mounted at /app/data)
        if (is_dir('/app/data')) {
            $this->dataDir = '/app/data';
        } else {
            // Local environment (relative path)
            $this->dataDir = __DIR__ . '/../../data';
        }
    }

    public function load(ObjectManager $manager): void
    {
        // 1. Load Creature Families
        $familyContext = $this->loadCreatureFamilies($manager);
        
        // 2. Load Races
        $races = $this->loadRaces($manager);
        
        // 3. Load Equipment (Weapons, Armors, Materials)
        $equipment = $this->loadEquipment($manager);

        // 3.5 Load States
        $this->loadStates($manager);
        
        // 4. Load Profile Families
        $profileFamilies = $this->loadProfileFamilies($manager);

        // 5. Load Profiles (Rich Data) - Includes Voies and Capabilities
        $this->loadRichProfiles($manager, $profileFamilies, $equipment);

        // 6. Load Creatures
        $this->loadCreatures($manager, $familyContext['monsterMap']);
        
        $this->loadUsers($manager);

        $manager->flush();
    }

    private function getData(string $filename): array
    {
        $path = $this->dataDir . '/' . $filename;
        if (!file_exists($path)) {
            echo "Warning: File not found: $path\n";
            return [];
        }
        $content = file_get_contents($path);
        return json_decode($content, true);
    }
    
    // ... getValue ...

    private function getValue(array $item, string $key, $default = null)
    {
        if (isset($item[$key]) && is_array($item[$key]) && isset($item[$key][0]['value'])) {
            return $item[$key][0]['value'];
        }
        return $default;
    }

    private function getLabelOrValue(array $item, string $key, $default = null)
    {
        if (isset($item[$key]) && is_array($item[$key]) && !empty($item[$key])) {
             if (isset($item[$key][0]['label'])) {
                 return $item[$key][0]['label'];
             }
             if (isset($item[$key][0]['value'])) {
                 return $item[$key][0]['value'];
             }
        }
        return $default;
    }

    private function loadProfileFamilies(ObjectManager $manager): array
    {
        $data = $this->getData('profile_families.json');
        $entities = [];

        foreach ($data as $item) {
            $e = new Family();
            $e->setName($item['name']);
            $e->setDescription($item['description'] ?? '');
            $e->setBaseHp($item['vigorPoints'] ?? 4);
            $e->setRecoveryDie($item['recoveryDie'] ?? 'd8');
            $e->setLuckPoints($item['luckPoints'] ?? 0);
            $e->setManaStat($item['manaStat'] ?? null);
            
            $manager->persist($e);
            $id = strtolower(str_replace(['Famille des ', ' '], ['', '_'], $item['name'])); // "aventuriers", "combattants"... matches JSON mapping logic if needed
            // Actually, let's look at how we map. The Profiles JSON doesn't seem to explicitly say "Famille: Aventurier".
            // We might need to map by profile name or "class.profil_type"?
            // "Arquebusier.json" -> "profil_type": "Mercenaire".
            // Summary table in prompt: 
            // Arquebusier -> Aventuriers
            // Barbare -> Combattants
            // ...
            // I should construct a map of Class Name -> Family Object.
            $entities[$item['id']] = $e; 
        }
        return $entities;
    }

    private function loadRichProfiles(ObjectManager $manager, array $families, array $equipment): void
    {
        // Map Profile Name to Family ID based on user prompt/knowledge
        $familyMap = [
            'Arquebusier' => 'aventuriers',
            'Barde' => 'aventuriers',
            'Rôdeur' => 'aventuriers',
            'Voleur' => 'aventuriers',
            'Barbare' => 'combattants',
            'Chevalier' => 'combattants',
            'Guerrier' => 'combattants',
            'Ensorceleur' => 'mages',
            'Forgesort' => 'mages',
            'Magicien' => 'mages',
            'Sorcier' => 'mages',
            'Druide' => 'mystiques',
            'Moine' => 'mystiques',
            'Prêtre' => 'mystiques',
        ];

        $finder = new Finder();
        $finder->files()->in($this->dataDir . '/Profils')->name('*.json');

        foreach ($finder as $file) {
            $data = json_decode($file->getContents(), true);
            $classData = $data['classe'];
            
            $e = new Profile();
            $name = $classData['nom'];
            $e->setName($name);
            $e->setDescription($classData['description_generale'] ?? '');
            
            // Stats
            $stats = $classData['statistiques'] ?? [];
            if (isset($stats['de_vie'])) {
                $e->setHitDie($stats['de_vie']);
            }
            if (isset($stats['carac_magique'])) {
                $e->setMagicStat($stats['carac_magique']); 
            }
            if (isset($classData['image_url'])) {
                $e->setImageUrl($classData['image_url']);
            }
            
            $famId = $familyMap[$name] ?? null;
            if ($famId && isset($families[$famId])) {
                $family = $families[$famId];
                $e->setFamily($family);
                // Fallback Hit Die if not set
                if (!$e->getHitDie()) {
                     $e->setHitDie($family->getRecoveryDie()); 
                }
            }

            // Lore
            if (isset($classData['lore'])) {
                $e->setLore($classData['lore']);
            }
            
            // Notes logic
            // Concatenate legacy note if present
            $note = ($data['maitrises']['special'] ?? '') . "\n" . ($data['maitrises']['armes_armures'] ?? '');
            if (isset($classData['note_legacy'])) {
                $note .= "\n\n" . $classData['note_legacy'];
            }
            $e->setNote(trim($note));

            if (isset($data['maitrises'])) {
                $e->setMasteries($data['maitrises']);
            }
            
            // ... (rest of code)


            if (isset($data['maitrises'])) {
                $e->setMasteries($data['maitrises']);
            }

            if (isset($data['equipement_depart'])) {
                $e->setStartingEquipment($data['equipement_depart']);
            }

            $e->setSkillPoints(2); // Default
            
            $manager->persist($e);
            
            // VOIES
            if (isset($data['voies'])) {
                foreach ($data['voies'] as $voieData) {
                    $v = new Voie();
                    $v->setName($voieData['nom']);
                    $v->setDescription($voieData['description'] ?? '');
                    $v->setProfile($e);
                    $v->setCategory('Personnage');
                    $v->setMaxRank(5);
                    $manager->persist($v);
                    
                    if (isset($voieData['capacites'])) {
                        foreach ($voieData['capacites'] as $capData) {
                            $c = new Capability();
                            $c->setName($capData['nom']);
                            $c->setDescription($capData['description_textuelle'] ?? '');
                            $c->setRank($capData['rang']);
                            $c->setVoie($v);
                            
                            $type = $capData['type'] ?? '';
                            $c->setLimited(str_contains(strtolower($type), 'limité'));
                            $c->setIsSpell(str_contains(strtolower($type), 'sort') || isset($voieData['sorts'])); // Heuristics
                            
                            $manager->persist($c);
                        }
                    }
                }
            }
        }
    }

    private function loadCreatureFamilies(ObjectManager $manager): array
    {
        $data = $this->getData('families.json');
        $entities = [];
        $monsterToFamilyMap = [];

        foreach ($data as $item) {
            $e = new CreatureFamily();
            $e->setName($item['Famille'] ?? 'Unknown');
            $e->setDescription($item['Text'] ?? null);
            $e->setImage($item['Image'] ?? null);
            $e->setReference($item['id'] ?? null);
            
            $manager->persist($e);
            
            // Map family by ID (or name if ID missing) for linking
            $key = $item['id'] ?? $item['Famille'];
            $entities[$key] = $e;
            
            // Map monster names to this family
            if (isset($item['Monstres']) && is_array($item['Monstres'])) {
                foreach ($item['Monstres'] as $monsterName) {
                    $monsterToFamilyMap[$monsterName] = $e;
                }
            }
        }
        
        // Return both the families map and the monster name map for loadCreatures
        return ['families' => $entities, 'monsterMap' => $monsterToFamilyMap];
    }

    private function loadRaces(ObjectManager $manager): array
    {
        $data = $this->getData('races.json');
        $entities = [];

        foreach ($data as $item) {
            $e = new Race();
            $e->setName($item['name']);
            $e->setDescription($item['description'] ?? null);
            $e->setDetailedDescription($item['detailedDescription'] ?? null);
            $e->setPublicPerception($item['publicPerception'] ?? null);
            $e->setAbilities($item['abilities'] ?? null);
            $e->setStartingAge($item['startingAge'] ?? null);
            $e->setLifeExpectancy($item['lifeExpectancy'] ?? null);
            $e->setPhysicalTraits($item['physicalTraits'] ?? null);
            $e->setTypicalNames($item['typicalNames'] ?? null);
            
            // Unpack height
            if (isset($item['minHeight'])) {
                $e->setMinHeight($item['minHeight']);
            }
            if (isset($item['maxHeight'])) {
                $e->setMaxHeight($item['maxHeight']);
            }
            
            // Unpack weight
            if (isset($item['minWeight'])) {
                $e->setMinWeight($item['minWeight']);
            }
            if (isset($item['maxWeight'])) {
                $e->setMaxWeight($item['maxWeight']);
            }

            // Speed not in JSON usually, default to "Moyenne" or "20m"
            $e->setSpeed('20 m/tour'); 
            
            // Modifiers parsing
            if (isset($item['modifiers'])) {
                $e->setModifiers($item['modifiers']);
            } elseif (isset($item['characteristics'])) {
                 $e->setModifiers(['text' => $item['characteristics']]);
            }

            if (isset($item['roleplay'])) {
                $e->setRoleplay($item['roleplay']);
            }

            if (isset($item['image'])) {
                $e->setImage($item['image']);
            }

            $manager->persist($e);
            $entities[$item['id']] = $e;
        }
        return $entities;
    }



    private function loadVoies(ObjectManager $manager, array $profiles, array $races): array
    {
        $data = $this->getData('voies.json');
        $entities = [];

        foreach ($data as $item) {
            $e = new Voie();
            $e->setName($item['name']);
            $e->setDescription($item['description'] ?? ''); // Default to empty string
            $e->setCategory($item['type'] ?? 'Personnage');
            $e->setMaxRank(5); // Default for COF seems to be 5? Or should be dynamic? Standard is 5.
            
            if (!empty($item['profileId']) && isset($profiles[$item['profileId']])) {
                $e->setProfile($profiles[$item['profileId']]);
            }

            $manager->persist($e);
            $entities[$item['id']] = $e;
        }

        // Link Races to Available Voies
        $racesData = $this->getData('races.json');
        foreach ($racesData as $raceItem) {
            if (isset($raceItem['availableVoiesIds']) && isset($races[$raceItem['id']])) {
                $raceEntity = $races[$raceItem['id']];
                foreach ($raceItem['availableVoiesIds'] as $voieId) {
                    if (isset($entities[$voieId])) {
                        $raceEntity->addAvailableVoie($entities[$voieId]);
                    }
                }
            }
        }

        return $entities;
    }

    private function loadCapabilities(ObjectManager $manager, array $voies): void
    {
        $data = $this->getData('capacites.json');
        
        foreach ($data as $item) {
            $e = new Capability();
            $e->setName($item['name']);
            $e->setDescription($item['description'] ?? '');
            $e->setRank($item['rank']);
            
            // "voieId": "voie_de_la_divination"
            if (!empty($item['voieId']) && isset($voies[$item['voieId']])) {
                $e->setVoie($voies[$item['voieId']]);
            } else {
                continue; // Cannot save capability without voie (non-nullable in Entity)
            }
            
            $e->setIsSpell(false); // Default, need parser to detect spells
            $e->setLimited(str_contains($item['name'], '(L)'));
            
            $manager->persist($e);
        }
    }

    private function loadEquipment(ObjectManager $manager): array
    {
        $entities = [];
        
        // Weapons
        $weapons = $this->getData('weapons.json');
        foreach ($weapons as $item) {
            $e = new Equipment();
            $e->setName($item['name']);
            $e->setType($item['type'] ?? 'Weapon');
            $e->setPrice($item['price'] ?? null);
            $e->setDamage($item['damage'] ?? null);
            $e->setRange($item['range'] ?? null);
            
            $manager->persist($e);
            $entities[$item['id']] = $e;
        }

        // Armors
        $armors = $this->getData('armors.json');
        foreach ($armors as $item) {
             $e = new Equipment();
             $e->setName($item['name']);
             $e->setType($item['type'] ?? 'Armor');
             $e->setPrice($item['price'] ?? null);
             
             // Strip "+ " from defense string "+2 " -> 2
             $def = trim($item['defense'] ?? '');
             $def = (int) str_replace(['+', ' '], '', $def);
             $e->setAcBonus($def);
             
             $manager->persist($e);
             $entities[$item['id']] = $e;
        }

        // Materials
        $materials = $this->getData('materials.json');
        foreach ($materials as $item) {
            $e = new Material();
            $e->setName($item['name']);
            // Material entity does not have 'type', it's implicit
            $e->setPrice($item['price'] ?? null);
            $e->setNotes($item['notes'] ?? null);

            $manager->persist($e);
            // We don't need to add to $entities as they aren't referenced by ID elsewhere currently
            // $entities[$item['id']] = $e; 
        }

        // Mounts
        $mounts = $this->getData('mounts.json');
        foreach ($mounts as $item) {
            $e = new \App\Entity\Mount();
            $e->setName($item['name']);
            $e->setPrice($item['price'] ?? null);
            $manager->persist($e);
        }

        // Food
        $food = $this->getData('food.json');
        foreach ($food as $item) {
            $e = new \App\Entity\Food();
            $e->setName($item['name']);
            $e->setPrice($item['price'] ?? null);
            $manager->persist($e);
        }

        // Lodging
        $lodging = $this->getData('lodging.json');
        foreach ($lodging as $item) {
            $e = new \App\Entity\Lodging();
            $e->setName($item['name']);
            $e->setPrice($item['price'] ?? null);
            $manager->persist($e);
        }
        
        
        return $entities;
    }

    private function loadStates(ObjectManager $manager): void
    {
        $data = $this->getData('states.json');
        
        foreach ($data as $item) {
            $e = new HarmfulState();
            $e->setName($item['name']);
            $e->setDescription($item['description'] ?? null);
            $e->setImage($item['image'] ?? null);
            
            $manager->persist($e);
        }
    }

    private function loadUsers(ObjectManager $manager): void
    {
        $user = new \App\Entity\User();
        $user->setEmail('admin@example.com');
        $user->setRoles(['ROLE_ADMIN']);
        $user->setPassword('$2y$13$XyQ/DummyHashForNow...'); 
        
        $manager->persist($user);
    }

    private function loadCreatures(ObjectManager $manager, array $monsterMap): void
    {
        $data = $this->getData('creatures.json');
        
        foreach ($data as $item) {
            $e = new Creature();
            $name = $this->getValue($item, 'name', 'Unknown');
            $e->setName($name);
            
            // Combine appearance and description
            $desc = $this->getValue($item, 'appearance', '');
            $desc2 = $this->getValue($item, 'description', '');
            $e->setDescription($desc . "\n" . $desc2);
            
            // Basic stats
            $e->setNc((int)$this->getValue($item, 'level', 0));
            $e->setHp((int)$this->getValue($item, 'health_point', 0));
            $e->setDef((int)$this->getValue($item, 'defense', 10));
            $e->setInit((int)$this->getValue($item, 'init', 10));
            
            // Stats array
            $stats = [
                'FOR' => (int)$this->getValue($item, 'str_mod', 0),
                'DEX' => (int)$this->getValue($item, 'agi_mod', 0),
                'CON' => (int)$this->getValue($item, 'con_mod', 0),
                'INT' => (int)$this->getValue($item, 'int_mod', 0),
                'SAG' => (int)$this->getValue($item, 'per_mod', 0),
                'CHA' => (int)$this->getValue($item, 'cha_mod', 0),
            ];
            $e->setStats($stats);
            
            // Special Abilities (text)
            $specAbil = $this->getValue($item, 'special_capabilities', null);
            if ($specAbil) {
                 $e->setSpecialAbilities(['text' => $specAbil]);
            }

            // Attacks
            if (isset($item['attacks'][0]['data'])) {
                $e->setAttacks($item['attacks'][0]['data']);
            }

            // Capabilities (Array)
            if (isset($item['capabilities'])) {
                $e->setCapabilities($item['capabilities']);
            }

            // Picture (Token URL)
            if (isset($item['picture'][0]['creature_token_url'])) {
                $e->setPicture($item['picture'][0]['creature_token_url']);
            }

            // Expanded Details (Category, Environment, Archetype, Size)
            // Note: These are often array of objects with value/label
            $e->setCategory($this->getValue($item, 'category', null)); // Using value or label? Usually value map to translation.
            // Let's check `getValue` implementation. It takes the first item's 'value'.
            // The frontend displays the Label usually.
            // Let's modify getValue or use a specific logic.
            // JSON example: "category": [{"value": "humanoid", "label": "Humanoïde"}]
            // If I save "humanoid", frontend needs to translate. 
            // Better to save "Humanoïde" (label) for direct display? 
            // Or save structured data?
            // User requested "Category, Environment..." to be displayed.
            // Let's save the LABEL if available, fallback to VALUE.
            
            $e->setCategory($this->getLabelOrValue($item, 'category'));
            $e->setEnvironment($this->getLabelOrValue($item, 'environment'));
            $e->setArchetype($this->getLabelOrValue($item, 'archetype'));
            $e->setSize($this->getLabelOrValue($item, 'size'));

            // Link Family
            if (isset($monsterMap[$name])) {
                $e->setFamily($monsterMap[$name]);
            }
            
            $manager->persist($e);
        }
    }
}
