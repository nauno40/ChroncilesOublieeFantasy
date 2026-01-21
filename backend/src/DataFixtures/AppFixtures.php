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
        $profiles = $this->loadRichProfiles($manager, $profileFamilies, $equipment);

        // 5.5 Load Shared/Racial Voies (Legacy & Races)
        $this->loadVoies($manager, $profiles, $races);

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
            $e->setBaseHp($item['baseHp'] ?? 4);
            $e->setRecoveryDie($item['recoveryDie'] ?? 'd8');
            $e->setLuckPoints($item['luckPoints'] ?? 0);
            $e->setManaStat($item['manaStat'] ?? null);
            $e->setSpecials($item['specials'] ?? null);
            
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

    private array $createdVoieKeys = [];

    private function loadRichProfiles(ObjectManager $manager, array $families, array $equipmentMap): array
    {
        // ... (existing map setup)
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

        $profileMap = [];

        foreach ($finder as $file) {
            $data = json_decode($file->getContents(), true);
            $classData = $data['class'];
            
            $e = new Profile();
            $name = $classData['name'];
            $e->setName($name);
            $e->setDescription($classData['description'] ?? '');
            
            // Stats
            $stats = $classData['stats'] ?? [];
            if (isset($stats['hitDie'])) {
                $e->setHitDie($stats['hitDie']);
            }
            if (isset($stats['magicStat'])) {
                $e->setMagicStat($stats['magicStat']); 
            }
            
            // Save remaining stats in JSON
            $extraStats = $stats;
            unset($extraStats['hitDie'], $extraStats['magicStat']);
            if (!empty($extraStats)) {
                $e->setStats($extraStats);
            }
            
            if (isset($classData['imageUrl'])) {
                $e->setImageUrl($classData['imageUrl']);
            }
            
            $famId = $familyMap[$name] ?? null;
            if ($famId && isset($families[$famId])) {
                $family = $families[$famId];
                $e->setFamily($family);
                if (!$e->getHitDie()) {
                     $e->setHitDie($family->getRecoveryDie()); 
                }
            }

            // Lore
            if (isset($classData['lore'])) {
                $e->setLore($classData['lore']);
            }
            
            // Notes from masteries
            $masteries = $data['masteries'] ?? [];
            $noteParts = [];
            
            if (!empty($masteries['special'])) {
                $noteParts[] = $masteries['special'];
            }
            
            if (!empty($masteries['weaponsAndArmors'])) {
                $noteParts[] = $masteries['weaponsAndArmors'];
            } else {
                if (!empty($masteries['weapons'])) $noteParts[] = $masteries['weapons'];
                if (!empty($masteries['armors'])) $noteParts[] = $masteries['armors'];
                if (!empty($masteries['shields'])) $noteParts[] = $masteries['shields'];
            }

            $note = implode("\n", $noteParts);

            if (isset($classData['noteLegacy'])) {
                $note .= "\n\n" . $classData['noteLegacy'];
            }
            $e->setNote(trim($note));

            if (isset($data['masteries'])) {
                $e->setMasteries($data['masteries']);
            }
            
            if (isset($data['startingEquipment'])) {
                $e->setStartingEquipment($data['startingEquipment']);
            }

            $e->setSkillPoints(2); 
            
            $manager->persist($e);
            
            $key = strtolower($file->getBasename('.json'));
            $profileMap[$key] = $e;
            
            // PATHS (Voies)
            if (isset($data['paths'])) {
                foreach ($data['paths'] as $voieData) {
                    $v = new Voie();
                    $v->setName($voieData['name']);
                    $v->setDescription($voieData['description'] ?? '');
                    $v->setProfile($e);
                    $v->setCategory('Personnage');
                    $v->setMaxRank(5);
                    
                    if (!empty($voieData['details'])) {
                        $v->setDetails($voieData['details']);
                    }

                    $manager->persist($v);
                    
                    $trackKey = $this->normalizeKey($name) . '_' . $this->normalizeKey($voieData['name']);
                    $this->createdVoieKeys[$trackKey] = true;

                    // ABILITIES (Capacites)
                    if (isset($voieData['abilities'])) {
                        foreach ($voieData['abilities'] as $capData) {
                            $c = new Capability();
                            $c->setName($capData['name']);
                            $c->setDescription($capData['description'] ?? '');
                            $c->setRank($capData['rank']);
                            $c->setVoie($v);
                            
                            $type = $capData['type'] ?? '';
                            $c->setLimited(str_contains(strtolower($type), 'limité'));
                            $c->setIsSpell(str_contains(strtolower($type), 'sort')); 
                            
                            if (!empty($capData['details'])) {
                                $c->setDetails($capData['details']);
                            }
                            
                            $manager->persist($c);
                        }
                    }
                }
            }
        }
        return $profileMap;
    }

    private function normalizeKey(string $str): string
    {
        $str = mb_strtolower($str);
        $str = str_replace(['’', '`', '´'], "'", $str);
        return trim($str);
    }



    private function loadCreatureFamilies(ObjectManager $manager): array
    {
        $data = $this->getData('families.json');
        $entities = [];
        $monsterToFamilyMap = [];

        foreach ($data as $item) {
            $e = new CreatureFamily();
            $e->setName($item['name'] ?? 'Unknown');
            $e->setDescription($item['text'] ?? null);
            $e->setImage($item['image'] ?? null);
            $e->setReference($item['id'] ?? null);
            
            $manager->persist($e);
            
            // Map family by ID (or name if ID missing) for linking
            $key = $item['id'] ?? $item['Famille'];
            $entities[$key] = $e;
            
            // Map monster names to this family
            if (isset($item['monsters']) && is_array($item['monsters'])) {
                foreach ($item['monsters'] as $monsterName) {
                    $monsterToFamilyMap[$monsterName] = $e;
                }
            }
        }
        
        // Return both the families map and the monster name map for loadCreatures
        return ['families' => $entities, 'monsterMap' => $monsterToFamilyMap];
    }

    private function loadRaces(ObjectManager $manager): array
    {
        $entities = [];
        $finder = new Finder();
        $finder->files()->in($this->dataDir . '/Races')->name('*.json');

        foreach ($finder as $file) {
            $item = json_decode($file->getContents(), true);
            
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
        // LEGACY FILE (voies.json) LOADING DISABLED
        // We now rely purely on Profils/*.json and Races/*.json for Voie definitions.
        
        $entities = [];

        // Link Races to Available Voies
        // Re-read from individual files to create Racial Voies
        $finder = new Finder();
        $finder->files()->in($this->dataDir . '/Races')->name('*.json');
        
        $raceItems = [];
        foreach ($finder as $file) {
            $raceItems[] = json_decode($file->getContents(), true);
        }

        // PASS 1: Create all embedded Racial Voies first
        foreach ($raceItems as $raceItem) {
            $raceEntity = $races[$raceItem['id']] ?? null;
            if ($raceEntity && isset($raceItem['voies'])) {
                foreach ($raceItem['voies'] as $voieData) {
                    $voieId = $voieData['id'];
                    $voie = $entities[$voieId] ?? new Voie();
                    if (!isset($entities[$voieId])) {
                        $manager->persist($voie);
                        $entities[$voieId] = $voie;
                    }
                    
                    $voie->setName($voieData['name']);
                    $voie->setDescription($voieData['description'] ?? '');
                    $voie->setCategory('Race');
                    $voie->setMaxRank(5);
                    $raceEntity->addAvailableVoie($voie);

                    if (!empty($voieData['details'])) {
                        $voie->setDetails($voieData['details']);
                    }
                    
                    if (isset($voieData['abilities'])) {
                        foreach ($voieData['abilities'] as $capData) {
                            $cap = new Capability();
                            $cap->setName($capData['name']);
                            $cap->setDescription($capData['description'] ?? '');
                            $cap->setRank($capData['rank']);
                            $type = $capData['type'] ?? '';
                            $cap->setLimited(str_contains(strtolower($type), 'limité'));
                            $cap->setIsSpell(str_contains(strtolower($type), 'sort'));
                            $cap->setVoie($voie);
                            if (!empty($capData['details'])) {
                                $cap->setDetails($capData['details']);
                            }
                            $manager->persist($cap);
                        }
                    }
                }
            }
        }

        // PASS 2: Link availableVoiesIds (may refer to voies created in Pass 1)
        foreach ($raceItems as $raceItem) {
            $raceEntity = $races[$raceItem['id']] ?? null;
            if ($raceEntity && isset($raceItem['availableVoiesIds'])) {
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
            $e->setCritical($item['critical'] ?? null);
            $e->setReload($item['reload'] ?? null);
            
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
            
            // Direct access - flat format
            $name = $item['name'] ?? 'Unknown';
            $e->setName($name);
            $e->setDescription($item['description'] ?? '');
            
            // Basic stats - direct integers
            $e->setNc($item['nc'] ?? 0);
            $e->setHp($item['hp'] ?? 0);
            $e->setDef($item['def'] ?? 10);
            $e->setInit($item['init'] ?? 10);
            
            // Stats array - already structured
            if (isset($item['stats'])) {
                $e->setStats($item['stats']);
            }
            
            // Special Abilities
            if (!empty($item['specialAbilities'])) {
                $e->setSpecialAbilities(['text' => $item['specialAbilities']]);
            }

            // Attacks - already flat array
            if (!empty($item['attacks'])) {
                $e->setAttacks($item['attacks']);
            }

            // Capabilities
            if (!empty($item['capabilities'])) {
                $e->setCapabilities($item['capabilities']);
            }

            // Picture - direct string
            if (!empty($item['picture'])) {
                $e->setPicture($item['picture']);
            }

            // Classification - direct strings
            $e->setCategory($item['category'] ?? null);
            $e->setEnvironment($item['environment'] ?? null);
            $e->setArchetype($item['archetype'] ?? null);
            $e->setSize($item['size'] ?? null);

            // Link Family by name
            if (isset($monsterMap[$name])) {
                $e->setFamily($monsterMap[$name]);
            }
            
            $manager->persist($e);
        }
    }
}
