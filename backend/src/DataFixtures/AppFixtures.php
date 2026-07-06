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
use App\Entity\User;
use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\Quest;
use App\Entity\Clue;
use App\Entity\Session;
use App\Entity\Character;
use App\Entity\CustomCreature;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\Finder\Finder;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    private string $dataDir;

    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
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
        
        $mj = $this->loadUsers($manager);

        // 7. Données de démo « vivantes » : campagnes, quêtes, indices, séances,
        //    joueurs, personnages et monstres maison (owner = le MJ Nauno).
        $this->loadCampaignDemo($manager, $mj, $races, $profiles);

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
                            $c->setIsSpell(str_contains(strtolower($type), 'sort') || str_contains($type, '*')); 
                            
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
                            $cap->setIsSpell(str_contains(strtolower($type), 'sort') || str_contains($type, '*'));
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

    /**
     * Crée les comptes de base et renvoie le MJ propriétaire des données de démo.
     */
    private function loadUsers(ObjectManager $manager): User
    {
        // Compte admin générique (login de secours).
        $admin = new User();
        $admin->setEmail('admin@example.com');
        $admin->setPseudo('Maître du Jeu');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'admin'));
        $manager->persist($admin);

        // Compte personnel de Nauno — MJ propriétaire des campagnes de démo.
        // Mot de passe de dev à changer après première connexion.
        $nauno = new User();
        $nauno->setEmail('nauno40@gmail.com');
        $nauno->setPseudo('Nauno');
        $nauno->setRoles(['ROLE_ADMIN']);
        $nauno->setPassword($this->passwordHasher->hashPassword($nauno, 'chroniques'));
        $manager->persist($nauno);

        return $nauno;
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

    /**
     * Données de démo pour rendre l'application vivante : deux campagnes du MJ
     * (admin) avec quêtes, indices, séances, joueurs membres, personnages et
     * monstres maison. Rechargé à chaque `doctrine:fixtures:load` (destructif).
     *
     * @param array<int|string, Race>    $races    map des races chargées
     * @param array<string, Profile>     $profiles map des profils chargés
     */
    private function loadCampaignDemo(ObjectManager $manager, User $owner, array $races, array $profiles): void
    {
        $raceList = array_values($races);
        $profileList = array_values($profiles);
        $pickRace = fn (int $i): ?Race => $raceList[$i % max(1, count($raceList))] ?? null;
        $pickProfile = fn (int $i): ?Profile => $profileList[$i % max(1, count($profileList))] ?? null;

        // --- Joueurs ---
        $players = [];
        foreach ([
            ['alice@example.com', 'Alice'],
            ['bjorn@example.com', 'Bjorn'],
            ['lyra@example.com', 'Lyra'],
        ] as [$email, $pseudo]) {
            $p = new User();
            $p->setEmail($email);
            $p->setPseudo($pseudo);
            $p->setRoles([]);
            $p->setPassword($this->passwordHasher->hashPassword($p, 'password'));
            $manager->persist($p);
            $players[] = $p;
        }

        // ============================================================
        // Campagne 1 — riche (« un peu de tout »)
        // ============================================================
        $c1 = new Campaign();
        $c1->setName('Les Ombres de Val-Gelé');
        $c1->setDescription("Un hiver interminable étouffe la vallée de Val-Gelé. Des caravanes disparaissent, un culte oublié se réveille, et le Prieuré sur les hauteurs n'a plus donné signe de vie depuis deux lunes.");
        $c1->setNotes("Fil rouge : le Culte de l'Hiver cherche à réveiller la Liche du Prieuré.\nPNJ clés : Padrig (marchand), Dame Ysolde (guet).\nRécompense finale : le Sceau de Givre.");
        $c1->setOwner($owner);
        $c1->setInviteCode('VALGELE1');
        $c1->setCreatedAt(new \DateTime('-40 days'));
        $c1->setUpdatedAt(new \DateTime('-2 days'));
        $manager->persist($c1);

        foreach ([
            ['Retrouver la caravane disparue', "La caravane de Padrig n'est jamais arrivée à Bourg-Neige. Suivre sa piste dans les cols enneigés.", 'main', 'active'],
            ['Le sceau brisé du temple', 'Enquêter sur le sceau profané du temple de Val-Gelé.', 'main', 'completed'],
            ['La dette du forgeron', 'Le forgeron Halbrand doit de l’argent à un usurier peu recommandable.', 'secondary', 'active'],
            ['Herboriste en détresse', 'Rapporter des baies de givre à l’herboriste avant la nuit.', 'secondary', 'completed'],
        ] as [$title, $desc, $type, $status]) {
            $q = new Quest();
            $q->setTitle($title);
            $q->setDescription($desc);
            $q->setType($type);
            $q->setStatus($status);
            $q->setCampaign($c1);
            $manager->persist($q);
        }

        foreach ([
            ['Une écaille de givre surnaturelle a été trouvée près des corps.', 'solved', '-30 days'],
            ['Le symbole du Culte de l’Hiver gravé sur une pierre dressée.', 'unsolved', '-18 days'],
            ['Un fragment de lettre mentionnant « le Prieuré » et une date.', 'unsolved', '-6 days'],
        ] as [$content, $status, $when]) {
            $cl = new Clue();
            $cl->setContent($content);
            $cl->setStatus($status);
            $cl->setFoundAt(new \DateTime($when));
            $cl->setCampaign($c1);
            $manager->persist($cl);
        }

        foreach ([
            ['Séance 1 — Le départ', '-35 days', '3h', '1', "Les héros acceptent la mission de Padrig et quittent Val-Gelé. Première escarmouche contre des loups des glaces sur la route du col."],
            ['Séance 2 — Les neiges éternelles', '-21 days', '4h', '2', "Découverte de la caravane pillée. Un survivant évoque des silhouettes encapuchonnées. Le groupe trouve le symbole du Culte de l'Hiver."],
            ['Séance 3 — Le Prieuré', '-7 days', '3h30', '2', "Ascension jusqu'au Prieuré abandonné. Les portes sont scellées par une magie de givre. Cliffhanger : une voix murmure derrière la porte."],
        ] as [$title, $date, $duration, $level, $summary]) {
            $s = new Session();
            $s->setTitle($title);
            $s->setDate(new \DateTime($date));
            $s->setDuration($duration);
            $s->setLevel($level);
            $s->setSummary($summary);
            $s->setCampaign($c1);
            $manager->persist($s);
        }

        foreach ($players as $p) {
            $m = new CampaignMembership();
            $m->setCampaign($c1);
            $m->setPlayer($p);
            $manager->persist($m);
        }

        $charDefs = [
            ['Aria la Vive', 3, ['FOR' => 11, 'AGI' => 15, 'CON' => 12, 'INT' => 10, 'PER' => 13, 'CHA' => 9, 'VOL' => 10], 28, 15, 16, ['name' => 'Arc court', 'atkMod' => 5, 'dmg' => '1d6+2', 'special' => '']],
            ['Bjornsson', 4, ['FOR' => 16, 'AGI' => 11, 'CON' => 15, 'INT' => 8, 'PER' => 10, 'CHA' => 10, 'VOL' => 12], 44, 16, 11, ['name' => 'Hache à deux mains', 'atkMod' => 7, 'dmg' => '1d12+3', 'special' => '']],
            ['Lyra Feuille-d’Argent', 3, ['FOR' => 9, 'AGI' => 12, 'CON' => 11, 'INT' => 14, 'PER' => 13, 'CHA' => 13, 'VOL' => 15], 24, 13, 12, ['name' => 'Bâton runique', 'atkMod' => 3, 'dmg' => '1d6', 'special' => 'Sortilèges']],
        ];
        foreach ($players as $i => $p) {
            [$name, $level, $stats, $hp, $def, $init, $weapon] = $charDefs[$i];
            $ch = new Character();
            $ch->setName($name);
            $ch->setLevel($level);
            $ch->setRace($pickRace($i));
            $ch->setProfile($pickProfile($i));
            $ch->setData($this->buildCharacterData($stats, $hp, $def, $init, $weapon));
            $ch->setOwner($p);
            $ch->setCampaign($c1);
            $manager->persist($ch);
        }

        foreach ([
            ['Loup des Glaces', 2, 18, 13, 12, ['FOR' => 13, 'DEX' => 14, 'CON' => 12, 'INT' => 3, 'SAG' => 12, 'CHA' => 6], [['name' => 'Morsure gelée', 'atk' => '+5', 'dm' => '1d6+2', 'special' => 'CON ou Ralenti']], 'Vivante', 'Montagne', 'Rapide', 'Moyen'],
            ['Liche du Prieuré', 8, 90, 18, 14, ['FOR' => 10, 'DEX' => 12, 'CON' => 16, 'INT' => 18, 'SAG' => 16, 'CHA' => 15], [['name' => 'Toucher glacial', 'atk' => '+10', 'dm' => '2d6+4', 'special' => 'Draine 1 niveau']], 'Non-vivante', 'Souterrain', 'Puissant', 'Moyen'],
        ] as [$name, $nc, $hp, $def, $init, $stats, $attacks, $cat, $env, $arch, $size]) {
            $cc = new CustomCreature();
            $cc->setName($name);
            $cc->setNc($nc);
            $cc->setHp($hp);
            $cc->setDef($def);
            $cc->setInit($init);
            $cc->setStats($stats);
            $cc->setAttacks($attacks);
            $cc->setCategory($cat);
            $cc->setEnvironment($env);
            $cc->setArchetype($arch);
            $cc->setSize($size);
            $cc->setOwner($owner);
            $manager->persist($cc);
        }

        // ============================================================
        // Campagne 2 — plus légère (variété)
        // ============================================================
        $c2 = new Campaign();
        $c2->setName('La Route des Caravanes');
        $c2->setDescription('Escorte marchande le long de la Route des Caravanes, entre embuscades de bandits et péages douteux.');
        $c2->setNotes('Ton plus léger, orienté voyage et négociation.');
        $c2->setOwner($owner);
        $c2->setInviteCode('CARAVAN1');
        $c2->setCreatedAt(new \DateTime('-12 days'));
        $c2->setUpdatedAt(new \DateTime('-1 day'));
        $manager->persist($c2);

        foreach ([
            ['Escorter le marchand Padrig', 'main', 'active'],
            ['Le péage du pont brisé', 'secondary', 'active'],
        ] as [$title, $type, $status]) {
            $q = new Quest();
            $q->setTitle($title);
            $q->setType($type);
            $q->setStatus($status);
            $q->setCampaign($c2);
            $manager->persist($q);
        }

        $s2 = new Session();
        $s2->setTitle('Séance 1 — En route');
        $s2->setDate(new \DateTime('-3 days'));
        $s2->setDuration('2h30');
        $s2->setLevel('1');
        $s2->setSummary('Le convoi quitte la cité. Première nuit de veille, un éclaireur bandit est repéré près du campement.');
        $s2->setCampaign($c2);
        $manager->persist($s2);

        $npc = new Character();
        $npc->setName('Padrig le Marchand');
        $npc->setLevel(2);
        $npc->setRace($pickRace(3));
        $npc->setProfile($pickProfile(1));
        $npc->setData($this->buildCharacterData(['FOR' => 10, 'AGI' => 10, 'CON' => 11, 'INT' => 13, 'PER' => 12, 'CHA' => 15, 'VOL' => 11], 16, 11, 10, ['name' => 'Dague', 'atkMod' => 2, 'dmg' => '1d4', 'special' => '']));
        $npc->setOwner($owner);
        $npc->setCampaign($c2);
        $manager->persist($npc);
    }

    /**
     * Construit la structure `data` (JSON) d'un personnage conforme à ce qu'attend
     * le frontend (cf. CharacterData / useCharacterSheet), pour des fiches valides.
     *
     * @param array<string, int> $stats  les 7 caractéristiques COF (FOR, AGI, CON, INT, PER, CHA, VOL)
     * @param array{name: string, atkMod: int, dmg: string, special: string} $weapon
     * @return array<string, mixed>
     */
    private function buildCharacterData(array $stats, int $hp, int $def, int $init, array $weapon): array
    {
        $mods = [];
        foreach ($stats as $key => $value) {
            $mods[$key] = intdiv($value - 10, 2);
        }

        return [
            'stats' => $stats,
            'modifiers' => $mods,
            'hp' => ['current' => $hp, 'max' => $hp],
            'mp' => ['current' => 0, 'max' => 0],
            'attack' => [
                'contact' => $mods['FOR'],
                'distance' => $mods['AGI'],
                'magic' => $mods['INT'],
                'weapons' => [$weapon],
            ],
            'def' => $def,
            'init' => $init,
            'rp' => ['ideal' => '', 'flaw' => ''],
            'luck' => ['current' => 3, 'max' => 3],
            'protection' => [
                'armor' => ['name' => '', 'def' => 0],
                'shield' => ['name' => '', 'def' => 0],
            ],
            'recovery' => ['die' => 'd8', 'value' => 4],
            'voies' => [
                'racial' => ['name' => '', 'ranks' => [false, false, false, false, false]],
                'profile' => [],
                'prestige' => [],
            ],
            'money' => ['pa' => 50],
            'equipment' => [],
        ];
    }
}
