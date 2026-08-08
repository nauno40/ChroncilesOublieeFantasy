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
use App\Service\CapabilityEffectBuilder;
use App\Entity\Material;
use App\Entity\HarmfulState;
use App\Entity\Poison;
use App\Entity\Trap;
use App\Entity\User;
use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\Quest;
use App\Entity\Clue;
use App\Entity\Session;
use App\Entity\Character;
use App\Entity\CharacterVoie;
use App\Entity\CustomCreature;
use App\Entity\HomebrewEntry;
use App\Entity\Encounter;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\Finder\Finder;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    /**
     * Seuil de DEF de l'armure la plus lourde autorisée par profil (COF2, chap. 4 à 7 ;
     * `-1` = aucune armure). Les clés sont les `class.name` EXACTS des fichiers de
     * `data/Profils/` — accents compris : une clé qui ne correspond à rien laisse
     * silencieusement `armorMaxDef` à null, et le front retombe alors sur une valeur par
     * défaut qui autoriserait n'importe quoi. Publique pour être vérifiable
     * (cf. tests/DataFixtures/ProfileDataTest.php).
     */
    public const ARMOR_MAX_DEF_BY_PROFILE = [
        'Barbare' => 3, 'Chevalier' => 6, 'Guerrier' => 5,
        'Magicien' => -1, 'Ensorceleur' => -1, 'Sorcier' => -1, 'Forgesort' => 2,
        'Druide' => 2, 'Moine' => -1, 'Prêtre' => 4,
        'Arquebusier' => 4, 'Barde' => 3, 'Rôdeur' => 3, 'Voleur' => 2,
    ];
    private string $dataDir;

    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly CapabilityEffectBuilder $effectBuilder,
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
        $this->loadPoisons($manager);
        $this->loadTraps($manager);
        
        // 4. Load Profile Families
        $profileFamilies = $this->loadProfileFamilies($manager);

        // 5. Load Profiles (Rich Data) - Includes Voies and Capabilities
        $profiles = $this->loadRichProfiles($manager, $profileFamilies, $equipment);

        // 5.5 Load Shared/Racial Voies (Legacy & Races)
        $this->loadVoies($manager, $profiles, $races);

        // 5.6 Load Prestige Voies (compendium, category = Prestige)
        $this->loadPrestigeVoies($manager);

        // 6. Load Creatures
        $this->loadCreatures($manager, $familyContext['monsterMap']);

        // Flush intermédiaire : les rencontres de démo (loadCampaignDemo) référencent
        // de vraies créatures SRD par leur id, qui n'existe qu'une fois flushé.
        $manager->flush();

        $mj = $this->loadUsers($manager);

        // 7. Données de démo « vivantes » : campagnes, quêtes, indices, séances,
        //    joueurs et personnages (owner = le MJ Nauno).
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
            if (isset($stats['magicStat'])) {
                $e->setMagicStat($stats['magicStat']);
            }

            // Le reste des stats part en JSON. `magicStat` a sa propre colonne, donc on
            // l'en retire ; `hitDie` était retiré aussi, sans colonne pour l'accueillir —
            // il disparaissait purement et simplement, et la fiche de classe ne pouvait
            // pas afficher le dé de vie qu'elle prévoyait.
            $extraStats = $stats;
            unset($extraStats['magicStat']);
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
            }

            if (isset(self::ARMOR_MAX_DEF_BY_PROFILE[$name])) {
                $e->setArmorMaxDef(self::ARMOR_MAX_DEF_BY_PROFILE[$name]);
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
                    $e->addVoie($v); // maintient la collection inverse (utilisée par seedCharacterVoies)
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
                            $this->effectBuilder->apply($c);
                            $c->setRank($capData['rank']);
                            $c->setVoie($v);
                            
                            $type = $capData['type'] ?? '';
                            $c->setLimited(str_contains(strtolower($type), 'limité'));
                            $c->setIsSpell(str_contains(strtolower($type), 'sort') || str_contains($type, '*')); 
                            
                            if (!empty($capData['details'])) {
                                $c->setDetails($capData['details']);
                            }
                            
                            // Déclarations facultatives (cf. spec 2026-08-03) : absentes du JSON, elles laissent
                            // les colonnes nulles. Les QUATRE sites qui construisent une Capability doivent les
                            // lire, sinon une partie du compendium resterait muette sans rien signaler.
                            $c->setStates($capData['states'] ?? null);
                            $c->setSummons($capData['summons'] ?? null);

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
        // Familles de créatures (bestiaire) → CreatureFamily. À ne pas confondre avec
        // profile_families.json (familles de profils) chargé dans l'entité Family.
        $data = $this->getData('creature_families.json');
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



    /**
     * Voies de prestige (chap. 8), transcrites depuis les règles. Ce sont des voies
     * autonomes du compendium (category = « Prestige »), non rattachées à un profil ni
     * à une race. Leurs 5 rangs affichés (1-5) correspondent aux rangs 4-8 du livre.
     */
    private function loadPrestigeVoies(ObjectManager $manager): void
    {
        $data = $this->getData('prestige_voies.json');

        foreach ($data as $item) {
            $voie = new Voie();
            $voie->setName($item['name']);
            $voie->setDescription($item['description'] ?? '');
            $voie->setCategory('Prestige');
            $voie->setMaxRank(5);
            // Famille + prérequis conservés dans details (rendus par DynamicDetailsRenderer).
            $voie->setDetails([
                'famille' => $item['family'] ?? null,
                'note_prerequis' => $item['prerequisite'] ?? null,
            ]);
            $manager->persist($voie);

            foreach ($item['abilities'] ?? [] as $capData) {
                $cap = new Capability();
                $cap->setName($capData['name']);
                $cap->setDescription($capData['description'] ?? '');
                $this->effectBuilder->apply($cap);
                $cap->setRank($capData['rank']); // slot 1-5 (= rang 4-8 du livre)
                $cap->setLimited(str_contains(strtolower($capData['name'] . ' ' . ($capData['description'] ?? '')), '(l)'));
                $cap->setIsSpell(str_contains($capData['name'], '*'));
                $cap->setVoie($voie);
                // Déclarations facultatives (cf. spec 2026-08-03) : absentes du JSON, elles laissent
                // les colonnes nulles. Les QUATRE sites qui construisent une Capability doivent les
                // lire, sinon une partie du compendium resterait muette sans rien signaler.
                $cap->setStates($capData['states'] ?? null);
                $cap->setSummons($capData['summons'] ?? null);

                $manager->persist($cap);
            }
        }
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
                            $this->effectBuilder->apply($cap);
                            $cap->setRank($capData['rank']);
                            $type = $capData['type'] ?? '';
                            $cap->setLimited(str_contains(strtolower($type), 'limité'));
                            $cap->setIsSpell(str_contains(strtolower($type), 'sort') || str_contains($type, '*'));
                            $cap->setVoie($voie);
                            if (!empty($capData['details'])) {
                                $cap->setDetails($capData['details']);
                            }
                            // Déclarations facultatives (cf. spec 2026-08-03) : absentes du JSON, elles laissent
                            // les colonnes nulles. Les QUATRE sites qui construisent une Capability doivent les
                            // lire, sinon une partie du compendium resterait muette sans rien signaler.
                            $cap->setStates($capData['states'] ?? null);
                            $cap->setSummons($capData['summons'] ?? null);

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
            $this->effectBuilder->apply($e);
            $e->setRank($item['rank']);
            
            // "voieId": "voie_de_la_divination"
            if (!empty($item['voieId']) && isset($voies[$item['voieId']])) {
                $e->setVoie($voies[$item['voieId']]);
            } else {
                continue; // Cannot save capability without voie (non-nullable in Entity)
            }
            
            $e->setIsSpell(false); // Default, need parser to detect spells
            $e->setLimited(str_contains($item['name'], '(L)'));
            
            // Déclarations facultatives (cf. spec 2026-08-03) : absentes du JSON, elles laissent
            // les colonnes nulles. Les QUATRE sites qui construisent une Capability doivent les
            // lire, sinon une partie du compendium resterait muette sans rien signaler.
            $e->setStates($item['states'] ?? null);
            $e->setSummons($item['summons'] ?? null);

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

             // Données numériques propres (spec §8) : defense/agiMax/penalty entiers.
             $e->setAcBonus($item['defense'] ?? null);
             $e->setAcMaxAgi($item['agiMax'] ?? null);
             $e->setAcPenalty($item['penalty'] ?? 0);

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
            $e->setEffects($item['effects'] ?? null);

            $manager->persist($e);
        }
    }

    private function loadPoisons(ObjectManager $manager): void
    {
        foreach ($this->getData('poisons.json') as $item) {
            $e = new Poison();
            $e->setName($item['name']);
            $e->setEffectFail($item['effectFail'] ?? null);
            $e->setEffectSuccess($item['effectSuccess'] ?? null);
            $e->setDuration($item['duration'] ?? null);
            $e->setDelay($item['delay'] ?? null);
            $e->setNote($item['note'] ?? null);

            $manager->persist($e);
        }
    }

    private function loadTraps(ObjectManager $manager): void
    {
        foreach ($this->getData('traps.json') as $item) {
            $e = new Trap();
            $e->setName($item['name']);
            $e->setDetectDifficulty($item['detectDifficulty'] ?? null);
            $e->setDisarmDifficulty($item['disarmDifficulty'] ?? null);
            $e->setEffect($item['effect'] ?? null);
            $e->setComplement($item['complement'] ?? null);

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
     * (admin) avec quêtes, indices, séances, joueurs membres et personnages.
     * Rechargé à chaque `doctrine:fixtures:load` (destructif).
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

        // Contenu « perso » de démo (Mes Monstres + Bibliothèque) pour visualiser
        // l'app bien remplie : du contenu de Nauno (privé + public) et du public
        // d'autres joueurs (pour peupler l'onglet Communauté).
        $this->loadHomebrewDemo($manager, $owner, $players);

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

        // Fabriques mutualisées (réutilisées pour toutes les campagnes).
        $mkQuest = function (Campaign $camp, string $title, ?string $desc, string $type, string $status, bool $shared) use ($manager): void {
            $q = new Quest();
            $q->setTitle($title);
            $q->setDescription($desc);
            $q->setType($type);
            $q->setStatus($status);
            $q->setShared($shared);
            $q->setCampaign($camp);
            $manager->persist($q);
        };
        $mkClue = function (Campaign $camp, string $content, string $status, string $when, bool $shared) use ($manager): void {
            $cl = new Clue();
            $cl->setContent($content);
            $cl->setStatus($status);
            $cl->setFoundAt(new \DateTime($when));
            $cl->setShared($shared);
            $cl->setCampaign($camp);
            $manager->persist($cl);
        };
        $mkSession = function (Campaign $camp, string $title, string $date, string $duration, string $level, string $summary) use ($manager): void {
            $s = new Session();
            $s->setTitle($title);
            $s->setDate(new \DateTime($date));
            $s->setDuration($duration);
            $s->setLevel($level);
            $s->setSummary($summary);
            $s->setCampaign($camp);
            $manager->persist($s);
        };
        $mkMember = function (Campaign $camp, User $player) use ($manager): void {
            $m = new CampaignMembership();
            $m->setCampaign($camp);
            $m->setPlayer($player);
            $manager->persist($m);
        };

        // Quêtes C1 — [titre, description, type, statut, partagée aux joueurs]
        foreach ([
            ['Retrouver la caravane disparue', "La caravane de Padrig n'est jamais arrivée à Bourg-Neige. Suivre sa piste dans les cols enneigés.", 'main', 'active', true],
            ['Le sceau brisé du temple', 'Enquêter sur le sceau profané du temple de Val-Gelé.', 'main', 'completed', true],
            ['Réveiller ou sceller la Liche', 'Le cœur du Prieuré recèle le tombeau de la Liche. Empêcher le Culte de l’éveiller.', 'main', 'active', true],
            ['La dette du forgeron', 'Le forgeron Halbrand doit de l’argent à un usurier peu recommandable.', 'secondary', 'active', false],
            ['Herboriste en détresse', 'Rapporter des baies de givre à l’herboriste avant la nuit.', 'secondary', 'completed', false],
            ['Le loup blanc des cimes', 'Une bête colossale rôde autour des bergeries. La traquer ou l’apaiser.', 'secondary', 'active', true],
            ['La rançon de Dame Ysolde', 'Des maîtres-chanteurs menacent de révéler le secret de la capitaine du guet.', 'secondary', 'failed', false],
        ] as [$t, $d, $ty, $st, $sh]) {
            $mkQuest($c1, $t, $d, $ty, $st, $sh);
        }

        // Indices C1 — [contenu, statut, trouvé le, partagé]
        foreach ([
            ['Une écaille de givre surnaturelle a été trouvée près des corps.', 'solved', '-30 days', true],
            ['Le symbole du Culte de l’Hiver gravé sur une pierre dressée.', 'unsolved', '-18 days', true],
            ['Un fragment de lettre mentionnant « le Prieuré » et une date.', 'unsolved', '-6 days', false],
            ['Des traces de pas nues dans la neige, malgré le froid mortel.', 'unsolved', '-4 days', true],
            ['Le sceau du temple porte la même rune que l’amulette du survivant.', 'solved', '-12 days', false],
        ] as [$c, $st, $w, $sh]) {
            $mkClue($c1, $c, $st, $w, $sh);
        }

        // Séances C1 (journal de campagne)
        foreach ([
            ['Séance 1 — Le départ', '-35 days', '3h', '1', "Les héros acceptent la mission de Padrig et quittent Val-Gelé. Première escarmouche contre des loups des glaces sur la route du col."],
            ['Séance 2 — Les neiges éternelles', '-21 days', '4h', '2', "Découverte de la caravane pillée. Un survivant évoque des silhouettes encapuchonnées. Le groupe trouve le symbole du Culte de l'Hiver."],
            ['Séance 3 — Le Prieuré', '-14 days', '3h30', '2', "Ascension jusqu'au Prieuré abandonné. Les portes sont scellées par une magie de givre. Cliffhanger : une voix murmure derrière la porte."],
            ['Séance 4 — Derrière la porte de givre', '-3 days', '4h', '3', "Le sceau cède. Le Prieuré grouille d'acolytes et de morts-vivants mineurs. Le groupe apprend que la Liche n'est pas encore éveillée — mais que le rituel a commencé."],
        ] as [$t, $dt, $du, $lv, $su]) {
            $mkSession($c1, $t, $dt, $du, $lv, $su);
        }

        foreach ($players as $p) {
            $m = new CampaignMembership();
            $m->setCampaign($c1);
            $m->setPlayer($p);
            $manager->persist($m);
        }

        $charDefs = [
            ['Aria la Vive', 3, ['AGI' => 2, 'CON' => 1, 'FOR' => 0, 'PER' => 1, 'CHA' => 0, 'INT' => 0, 'VOL' => 0], 28],
            ['Bjornsson', 4, ['AGI' => 0, 'CON' => 2, 'FOR' => 3, 'PER' => 0, 'CHA' => 0, 'INT' => -1, 'VOL' => 1], 44],
            ['Lyra Feuille-d’Argent', 3, ['AGI' => 1, 'CON' => 0, 'FOR' => 0, 'PER' => 1, 'CHA' => 1, 'INT' => 2, 'VOL' => 2], 24],
        ];
        foreach ($players as $i => $p) {
            [$name, $level, $caracs, $hp] = $charDefs[$i];
            $ch = new Character();
            $ch->setName($name);
            $ch->setLevel($level);
            $ch->setRace($pickRace($i));
            $ch->setProfile($pickProfile($i));
            $ch->setCaracs($caracs);
            $ch->setPlayState([
                'hp' => ['current' => $hp],
                'mana' => ['current' => 0],
                'luck' => ['current' => 3],
                'recovery' => ['used' => 0],
                'money' => ['po' => 0, 'pa' => 50, 'pc' => 0],
                'equipment' => [],
                'rp' => ['ideal' => '', 'flaw' => '', 'secret' => '', 'notes' => ''],
                'languages' => ['Commun'],
            ]);
            $ch->setOwner($p);
            // Pas de setCampaign : un personnage ne peut référencer qu'une campagne de son
            // propre owner (owner-scoping backend). Les joueurs sont reliés à la campagne du MJ
            // via CampaignMembership ; rattacher le perso à $c1 (propriété du MJ) rendrait toute
            // sauvegarde impossible (HTTP 400 « campagne introuvable »).
            $manager->persist($ch);
            // Voies & capacités (modèle Phase 2 : characterVoies par IRI). Sans elles, le perso
            // n'a aucune capacité ni voie de peuple (⇒ octroi absent). Réparties au budget du niveau.
            $this->seedCharacterVoies($manager, $ch, $level);
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
            ['Escorter le marchand Padrig', "Conduire le convoi de Padrig sain et sauf jusqu'à Fort-Halage.", 'main', 'active', true],
            ['La cargaison mystérieuse', "Un coffre scellé du convoi n'apparaît sur aucun manifeste. Découvrir son contenu.", 'main', 'active', false],
            ['Le péage du pont brisé', 'Négocier (ou forcer) le passage au pont tenu par la bande du Borgne.', 'secondary', 'active', true],
            ['Les chevaux volés', 'Retrouver les montures dérobées au dernier relais.', 'secondary', 'completed', false],
            ['La rixe du Sanglier', 'Démêler une bagarre qui a mal tourné à l’étape de nuit.', 'secondary', 'completed', true],
        ] as [$t, $d, $ty, $st, $sh]) {
            $mkQuest($c2, $t, $d, $ty, $st, $sh);
        }

        foreach ([
            ['Une empreinte de botte cloutée près du coffre forcé.', 'unsolved', '-2 days', true],
            ['Le sceau de cire du coffre porte un blason inconnu.', 'unsolved', '-1 days', false],
            ['Le péagiste a été vu parlant avec un homme encapuchonné.', 'solved', '-4 days', true],
        ] as [$c, $st, $w, $sh]) {
            $mkClue($c2, $c, $st, $w, $sh);
        }

        foreach ([
            ['Séance 1 — En route', '-6 days', '2h30', '1', 'Le convoi quitte la cité. Première nuit de veille, un éclaireur bandit est repéré près du campement.'],
            ['Séance 2 — Le pont brisé', '-1 days', '3h', '2', 'Confrontation au péage. Le groupe évite le combat en soudoyant la bande du Borgne, mais repère le coffre suspect chargé de nuit.'],
        ] as [$t, $dt, $du, $lv, $su]) {
            $mkSession($c2, $t, $dt, $du, $lv, $su);
        }

        // Deux des trois joueurs suivent aussi cette campagne.
        $mkMember($c2, $players[0]);
        $mkMember($c2, $players[2]);

        $npc = new Character();
        $npc->setName('Padrig le Marchand');
        $npc->setLevel(2);
        $npc->setRace($pickRace(3));
        $npc->setProfile($pickProfile(1));
        $npc->setCaracs(['AGI' => 0, 'CON' => 0, 'FOR' => 0, 'PER' => 1, 'CHA' => 2, 'INT' => 1, 'VOL' => 0]);
        $npc->setPlayState([
            'hp' => ['current' => 16],
            'mana' => ['current' => 0],
            'luck' => ['current' => 3],
            'recovery' => ['used' => 0],
            'money' => ['po' => 0, 'pa' => 50, 'pc' => 0],
            'equipment' => [],
            'rp' => ['ideal' => '', 'flaw' => '', 'secret' => '', 'notes' => ''],
            'languages' => ['Commun'],
        ]);
        $npc->setOwner($owner);
        $npc->setCampaign($c2); // $c2 appartient au MJ ($owner) : cohérent, sauvegarde OK.
        $manager->persist($npc);
        $this->seedCharacterVoies($manager, $npc, 2);

        // --- Personnages de démo variés (appartenant au MJ Nauno) pour peupler
        // « Mes Personnages » : races, profils et niveaux différents. Sans campagne
        // (owner-scoping : pas nécessaire, et évite tout couplage). ---
        $raceByName = [];
        foreach ($races as $r) {
            $raceByName[$r->getName()] = $r;
        }
        $profileByName = [];
        foreach ($profiles as $pr) {
            $profileByName[$pr->getName()] = $pr;
        }

        // [nom, niveau, race, profil, [AGI,CON,FOR,PER,CHA,INT,VOL], PV, campagne|null]
        // Quelques persos sont rattachés à une campagne du MJ (owner identique → OK) pour
        // peupler la section « Personnages » de la campagne ; les autres restent libres.
        $demoChars = [
            ['Thorgrim Poing-de-Fer', 5, 'Nain', 'Guerrier', [0, 2, 3, 0, -1, -1, 1], 48, $c1],
            ['Sylve Murmure-des-Bois', 3, 'Elfe sylvain', 'Rôdeur', [3, 1, 1, 2, 0, 0, 0], 26, $c1],
            ['Maître Aldric', 6, 'Humain', 'Magicien', [0, 0, -1, 1, 0, 3, 2], 30, $c1],
            ['Pipin Tourdefeuille', 2, 'Halfelin', 'Voleur', [3, 0, -1, 2, 1, 1, 0], 16, $c2],
            ['Frère Anselme', 4, 'Humain', 'Prêtre', [0, 1, 1, 1, 1, 0, 3], 34, $c2],
            ['Grosh la Hache', 7, 'Demi-orc', 'Barbare', [1, 3, 4, 0, -1, -1, 0], 78, null],
            ['Lumen Éclat-Vif', 4, 'Gnome', 'Forgesort', [1, 1, 0, 1, 0, 3, 1], 30, null],
            ['Dame Isolde', 3, 'Demi-elfe', 'Barde', [1, 0, 0, 1, 3, 1, 1], 24, null],
        ];
        foreach ($demoChars as [$name, $level, $raceName, $profName, $c, $hp, $camp]) {
            $ch = new Character();
            $ch->setName($name);
            $ch->setLevel($level);
            $ch->setRace($raceByName[$raceName] ?? $pickRace(0));
            $ch->setProfile($profileByName[$profName] ?? $pickProfile(0));
            $ch->setCaracs(['AGI' => $c[0], 'CON' => $c[1], 'FOR' => $c[2], 'PER' => $c[3], 'CHA' => $c[4], 'INT' => $c[5], 'VOL' => $c[6]]);
            if ($camp) {
                $ch->setCampaign($camp);
            }
            $ch->setPlayState([
                'hp' => ['current' => $hp],
                'mana' => ['current' => 0],
                'luck' => ['current' => 3],
                'recovery' => ['used' => 0],
                'money' => ['po' => 0, 'pa' => 50, 'pc' => 0],
                'equipment' => [],
                'rp' => ['ideal' => '', 'flaw' => '', 'secret' => '', 'notes' => ''],
                'languages' => ['Commun'],
            ]);
            $ch->setOwner($owner);
            $manager->persist($ch);
            $this->seedCharacterVoies($manager, $ch, $level);
        }

        // ============================================================
        // Campagne 3 — terminée (pour visualiser une campagne « archivée »)
        // ============================================================
        $c3 = new Campaign();
        $c3->setName('Le Tombeau des Rois-Sorciers');
        $c3->setDescription('Une expédition dans les catacombes oubliées où dormaient trois Rois-Sorciers. Campagne conclue.');
        $c3->setNotes("Épilogue : le tombeau a été rescellé, les Rois-Sorciers renvoyés au néant. Le Sceptre d'Onyx repose désormais au fond d'un lac de montagne.");
        $c3->setOwner($owner);
        $c3->setInviteCode('TOMBEAU1');
        $c3->setCreatedAt(new \DateTime('-120 days'));
        $c3->setUpdatedAt(new \DateTime('-58 days'));
        $manager->persist($c3);

        foreach ([
            ['Ouvrir le Tombeau', 'Franchir la herse runique qui garde l’entrée des catacombes.', 'main', 'completed', true],
            ['Les trois sceaux royaux', 'Résoudre les énigmes des trois Rois-Sorciers pour lever les sceaux.', 'main', 'completed', true],
            ['Détruire le Sceptre d’Onyx', 'Empêcher que l’artefact ne tombe entre de mauvaises mains.', 'main', 'completed', true],
            ['La bibliothèque engloutie', 'Récupérer les grimoires avant la montée des eaux.', 'secondary', 'completed', false],
            ['Le pacte du nécromancien', 'Négocier avec Vhorst — un marché qui a mal tourné.', 'secondary', 'failed', false],
        ] as [$t, $d, $ty, $st, $sh]) {
            $mkQuest($c3, $t, $d, $ty, $st, $sh);
        }

        foreach ([
            ['Chaque sceau royal répond à une énigme gravée dans une langue morte.', 'solved', '-110 days', true],
            ['Le nécromancien Vhorst manipulait le groupe depuis le début.', 'solved', '-75 days', true],
            ['Le Sceptre corrompt quiconque le porte plus d’une nuit.', 'solved', '-64 days', false],
        ] as [$c, $st, $w, $sh]) {
            $mkClue($c3, $c, $st, $w, $sh);
        }

        foreach ([
            ['Séance 1 — La descente', '-118 days', '3h', '1', 'Le groupe force la herse runique et pénètre les catacombes. Premiers pièges, premiers squelettes gardiens.'],
            ['Séance 2 — Les sceaux royaux', '-104 days', '4h', '2', 'Deux des trois énigmes résolues. Une salle inondée bloque l’accès au troisième sceau.'],
            ['Séance 3 — La bibliothèque engloutie', '-90 days', '3h30', '3', 'Course contre la montée des eaux pour sauver les grimoires. Rencontre avec le spectre d’un archiviste.'],
            ['Séance 4 — Le nécromancien démasqué', '-72 days', '4h', '4', 'Vhorst révèle son jeu et s’empare du Sceptre. Combat sur le pont-levis au-dessus du gouffre.'],
            ['Séance 5 — Le dernier Roi-Sorcier', '-58 days', '5h', '5', 'Affrontement final. Le Sceptre est jeté dans le lac souterrain, le tombeau rescellé. Fin de la campagne.'],
        ] as [$t, $dt, $du, $lv, $su]) {
            $mkSession($c3, $t, $dt, $du, $lv, $su);
        }

        foreach ($players as $p) {
            $mkMember($c3, $p);
        }

        // --- Rencontres de combat pré-remplies (roster de créatures SRD par campagne) ---
        $creatureByName = [];
        foreach ($manager->getRepository(Creature::class)->findAll() as $cr) {
            $creatureByName[$cr->getName()] = $cr;
        }
        $mkEncounter = function (Campaign $camp, string $name, ?string $notes, array $roster) use ($manager, $creatureByName): void {
            $combatants = [];
            foreach ($roster as [$cname, $qty]) {
                $cr = $creatureByName[$cname] ?? null;
                if (!$cr) {
                    continue; // créature absente du bestiaire : on l'ignore silencieusement
                }
                $combatants[] = [
                    'name' => $cr->getName(),
                    'source' => 'bestiary',
                    'referenceId' => (string) $cr->getId(),
                    'quantity' => $qty,
                    'initiative' => $cr->getInit(),
                    'hp' => $cr->getHp(),
                    'def' => $cr->getDef(),
                    'per' => $cr->getStats()['PER'] ?? 0,
                    'nc' => $cr->getNc(),
                ];
            }
            $e = new Encounter();
            $e->setName($name);
            $e->setNotes($notes);
            $e->setCombatants($combatants);
            $e->setCampaign($camp);
            $manager->persist($e);
        };

        // [campagne, nom, notes, [[créature, quantité], ...]]
        foreach ([
            [$c1, 'Meute de loups des glaces', 'Route du col, au crépuscule — ils encerclent le convoi.', [['Loup', 4]]],
            [$c1, 'Acolytes du Culte de l\'Hiver', 'Devant les portes scellées du Prieuré.', [['Bandit de base', 3], ['Bandit vétéran', 1]]],
            [$c1, 'Gardiens du sceau', 'Éveillés quand le sceau de givre se brise.', [['Squelette de base', 4], ['Goule', 1]]],
            [$c2, 'La bande du Borgne (péage)', 'Au pont brisé — la négociation peut éviter le combat.', [['Bandit vétéran', 2], ['Bandit de base', 3]]],
            [$c2, 'Rôdeurs nocturnes', 'Attaque surprise pendant la veille du campement.', [['Gnoll de base', 2], ['Orque noir', 1]]],
            [$c3, 'Gardiens squelettes du Tombeau', 'Première salle des catacombes.', [['Squelette de base', 6]]],
            [$c3, 'L\'archiviste spectral', 'Bibliothèque engloutie, dans la brume.', [['Spectre', 1], ['Squelette de géant', 1]]],
            [$c3, 'Vhorst et le dernier Roi-Sorcier', 'Combat final sur le pont-levis au-dessus du gouffre.', [['Momie', 1], ['Goule', 2], ['Ogre', 1]]],
        ] as [$camp, $name, $notes, $roster]) {
            $mkEncounter($camp, $name, $notes, $roster);
        }
    }

    /**
     * Sème les voies/capacités d'un personnage (modèle Phase 2 : `characterVoies` par IRI) :
     * la voie de peuple (rang min(2, niveau)) + les deux premières voies de profil, réparties
     * pour rester au budget de capacités du niveau (2 points/niveau ; rang 1 de peuple gratuit ;
     * capacityCost = 1 aux rangs 1-2, 2 au-delà). Sans cela, un perso seedé n'a aucune capacité.
     */
    private function seedCharacterVoies(ObjectManager $manager, Character $ch, int $level): void
    {
        $add = function (Voie $voie, int $rank, string $source) use ($manager, $ch): void {
            $cv = new CharacterVoie();
            $cv->setCharacter($ch);
            $cv->setVoie($voie);
            $cv->setRank(max(1, min(5, $rank)));
            $cv->setSource($source);
            $manager->persist($cv);
            $ch->addCharacterVoie($cv);
        };

        // Voie de peuple : rang min(2, niveau) — suffisant pour rendre visible l'octroi éventuel.
        $race = $ch->getRace();
        if ($race && !$race->getAvailableVoies()->isEmpty()) {
            $add($race->getAvailableVoies()->first(), min(2, $level), 'peuple');
        }

        // Deux voies de profil : la première au rang du niveau (cappé à 5), la seconde au rang 1.
        // Total ≈ budget : racial(1) + coût(rang niveau) + coût(rang 1) = 2×niveau.
        $profile = $ch->getProfile();
        if ($profile) {
            $voies = array_values($profile->getVoies()->toArray());
            if (isset($voies[0])) {
                $add($voies[0], $level, 'profil');
            }
            if (isset($voies[1])) {
                $add($voies[1], 1, 'profil');
            }
        }
    }

    /**
     * Contenu « perso » de démonstration : monstres maison (CustomCreature) et
     * entrées de bibliothèque (HomebrewEntry), pour visualiser l'app bien remplie.
     * Mélange privé/public côté Nauno + du public chez les autres joueurs (pour
     * peupler l'onglet Communauté). Rechargé (destructif) à chaque fixtures:load.
     *
     * @param User[] $players joueurs de démo [Alice, Bjorn, Lyra]
     */
    private function loadHomebrewDemo(ObjectManager $manager, User $nauno, array $players): void
    {
        [$alice, $bjorn, $lyra] = $players;

        // --- Monstres maison (« Mes Monstres ») ---
        // [owner, nom, NC, PV, DEF, Init, [AGI,CON,FOR,PER,CHA,INT,VOL], [attaque, atk, DM, spécial], catégorie, environnement, archétype, taille, visibilité]
        $creatures = [
            [$nauno, "Gnoll éclaireur", 1, 14, 13, 12, [2, 1, 2, 1, -1, -1, 0], ["Lance", "+3", "1d6+2", ""], "Vivante", "Plaine", "Rôdeur", "Moyen", "private"],
            [$nauno, "Ver des glaces", 2, 22, 12, 10, [0, 3, 2, 0, -2, -2, 0], ["Morsure gelée", "+4", "1d8", "CON ou Ralenti"], "Vivante", "Montagne", "Embusqué", "Grand", "private"],
            [$nauno, "Spectre du Prieuré", 4, 34, 15, 14, [3, 2, 1, 2, 1, 1, 3], ["Toucher glacial", "+7", "2d6", "Draine 1 PV max"], "Non-vivante", "Ruines", "Hanteur", "Moyen", "private"],
            [$nauno, "Golem de tourbe", 5, 60, 16, 8, [-1, 4, 4, 0, -3, -2, 1], ["Poing de boue", "+8", "2d8+4", "Agrippe"], "Artificielle", "Marais", "Gardien", "Grand", "private"],
            [$nauno, "Araignée-loup géante", 3, 28, 14, 15, [3, 2, 2, 2, -2, -1, 0], ["Morsure venimeuse", "+6", "1d8+2", "Poison FOR"], "Vivante", "Forêt", "Chasseur", "Grand", "private"],
            [$nauno, "Bandit des cols", 1, 16, 13, 12, [1, 1, 1, 1, 0, 0, 0], ["Arbalète", "+3", "1d8", ""], "Vivante", "Montagne", "Combattant", "Moyen", "private"],
            [$nauno, "Chauve-souris de sang", 1, 9, 14, 16, [4, 0, -1, 3, -2, -2, 0], ["Morsure", "+5", "1d4", "Draine 1 PV"], "Vivante", "Souterrain", "Nuée", "Très petit", "private"],
            [$nauno, "Élémentaire de givre mineur", 3, 30, 15, 11, [1, 3, 3, 0, -1, 0, 2], ["Éclat de gel", "+6", "1d10", "Zone 2m"], "Élémentaire", "Toundra", "Élémentaire", "Moyen", "private"],
            [$nauno, "Drake des cavernes", 6, 72, 17, 13, [2, 4, 4, 2, 1, 1, 2], ["Souffle acide", "+9", "3d6", "Ligne, DEX 1/2"], "Vivante", "Souterrain", "Dragon mineur", "Énorme", "public"],
            [$nauno, "Ogre à deux têtes", 5, 66, 14, 9, [0, 4, 5, 1, -2, -1, 1], ["Gourdin", "+8", "2d10+5", "Deux attaques"], "Vivante", "Colline", "Brute", "Grand", "public"],
            [$nauno, "Liche apprentie", 7, 58, 17, 14, [2, 3, 1, 2, 2, 4, 4], ["Rayon nécrotique", "+10", "3d8", "VOL ou affaibli"], "Non-vivante", "Ruines", "Mage", "Moyen", "public"],
            [$nauno, "Loup-garou alpha", 4, 40, 15, 15, [3, 3, 4, 2, 1, 0, 1], ["Griffes", "+7", "2d6+3", "Contagion"], "Métamorphe", "Forêt", "Prédateur", "Moyen", "public"],
            // Public d'autres joueurs → visibles dans l'onglet Communauté de Nauno
            [$alice, "Naïade des sources", 2, 20, 14, 13, [3, 2, 0, 2, 3, 1, 2], ["Fouet d'eau", "+5", "1d8", "Repousse"], "Fée", "Rivière", "Enchanteur", "Moyen", "public"],
            [$bjorn, "Troll des tourbières", 6, 80, 15, 10, [1, 5, 5, 1, -2, -1, 0], ["Grande griffe", "+9", "2d8+5", "Régénération"], "Vivante", "Marais", "Brute", "Grand", "public"],
            [$lyra, "Djinn mineur", 7, 62, 18, 16, [4, 3, 2, 3, 2, 3, 3], ["Bourrasque", "+10", "3d6", "Projette"], "Élémentaire", "Désert", "Génie", "Grand", "public"],
            [$alice, "Chevalier squelette", 3, 30, 16, 11, [1, 2, 3, 1, 0, 0, 1], ["Épée rouillée", "+6", "1d10+2", ""], "Non-vivante", "Ruines", "Combattant", "Moyen", "public"],
        ];
        foreach ($creatures as [$owner, $name, $nc, $hp, $def, $init, $st, $at, $cat, $env, $arch, $size, $vis]) {
            $c = new CustomCreature();
            $c->setOwner($owner);
            $c->setName($name);
            $c->setNc($nc);
            $c->setHp($hp);
            $c->setDef($def);
            $c->setInit($init);
            $c->setStats(['AGI' => $st[0], 'CON' => $st[1], 'FOR' => $st[2], 'PER' => $st[3], 'CHA' => $st[4], 'INT' => $st[5], 'VOL' => $st[6]]);
            $c->setAttacks([['name' => $at[0], 'atk' => $at[1], 'dm' => $at[2], 'special' => $at[3]]]);
            $c->setCategory($cat);
            $c->setEnvironment($env);
            $c->setArchetype($arch);
            $c->setSize($size);
            $c->setVisibility($vis);
            $manager->persist($c);
        }

        // --- Bibliothèque (« HomebrewEntry ») : toutes catégories, mix privé/public ---
        $now = new \DateTimeImmutable();
        // [owner, catégorie, nom, description, visibilité, âge en jours]
        $entries = [
            [$nauno, "race", "Peuple des Cendres", "Né des volcans : +2 FOR, résistance au feu, vulnérable au froid.", "public", 30],
            [$nauno, "race", "Homoncules affranchis", "Créatures alchimiques devenues libres : petite taille, immunité aux poisons.", "private", 12],
            [$nauno, "classe", "Danse-lame", "Combattant acrobate mêlant esquive et attaques en tourbillon.", "public", 28],
            [$nauno, "classe", "Invocateur du Pacte", "Mystique liant un familier démoniaque pour ses sorts.", "private", 9],
            [$nauno, "voie", "Voie du Gel", "Cinq capacités de magie de froid, du souffle glacé à l'armure de givre.", "private", 20],
            [$nauno, "voie", "Voie du Sang", "Sacrifie des PV pour amplifier ses sorts et régénérer ses alliés.", "public", 18],
            [$nauno, "sort", "Éclat de givre", "1d6 DM de froid, cible ralentie (test CON). Sort de rang 1.", "public", 25],
            [$nauno, "sort", "Chaînes d'ombre", "Entrave une cible à distance (VOL). Immobilisée 1d4 tours.", "private", 7],
            [$nauno, "sort", "Murmure vorace", "Draine 1d8 PV et soigne le lanceur de la moitié.", "private", 4],
            [$nauno, "capacite", "Réflexe du chat", "+2 en Initiative et à la DEF contre la première attaque d'un combat.", "private", 15],
            [$nauno, "capacite", "Frappe étourdissante", "Sur un critique, la cible perd sa prochaine action (VOL annule).", "public", 22],
            [$nauno, "objet-magique", "Lame de l'Aube", "Épée +1 qui inflige 1d6 DM de lumière supplémentaires aux morts-vivants.", "public", 27],
            [$nauno, "objet-magique", "Amulette du Revenant", "Une fois par jour, revient à 1 PV au lieu de tomber à 0.", "private", 11],
            [$nauno, "objet-magique", "Bottes du Zéphyr", "+3m de déplacement, ignore les terrains difficiles naturels.", "public", 6],
            [$nauno, "equipement", "Grappin pliable", "Grappin + 15m de corde de soie, se range dans une bourse. 20 po.", "private", 14],
            [$nauno, "equipement", "Ration elfique", "Une bouchée nourrit une journée entière. 5 po la portion.", "public", 3],
            [$nauno, "equipement", "Lanterne sourde", "Faisceau orientable occultable d'un geste. 12 po.", "private", 10],
            [$nauno, "poison", "Venin de mille-pattes", "Ingestion. CON ou -2 à toutes les actions pendant 1h.", "private", 8],
            [$nauno, "poison", "Sève noire", "Contact. CON ou paralysie 1d4 tours. Rare et coûteux.", "public", 17],
            [$nauno, "piege", "Fosse à pals", "DD modérée pour repérer. 2d6 DM + immobilisé.", "private", 13],
            [$nauno, "piege", "Rune explosive", "Se déclenche à l'approche : 3d6 DM de feu, zone 3m.", "public", 5],
            [$nauno, "etat", "Gelé jusqu'aux os", "-2 à toutes les actions et déplacement divisé par deux jusqu'à réchauffement.", "private", 2],
            [$nauno, "etat", "Marqué par l'ombre", "Les soins reçus sont réduits de moitié tant que la marque persiste.", "private", 1],
            [$nauno, "autre", "Table : rencontres hivernales", "1d20 de rencontres aléatoires pour les cols enneigés de Val-Gelé.", "public", 26],
            [$nauno, "autre", "PNJ : Dame Ysolde", "Capitaine du guet, loyale mais rongée par un secret. Accroche de campagne.", "private", 19],
            // Public d'autres joueurs → onglet Communauté
            [$alice, "race", "Ondins des profondeurs", "Peuple aquatique : respiration aquatique, vision dans le noir.", "public", 21],
            [$alice, "sort", "Vague déferlante", "Repousse et renverse les créatures dans un cône de 6m (FOR).", "public", 16],
            [$alice, "objet-magique", "Trident des marées", "Arme +1, invoque un jet d'eau sous pression 1/jour.", "public", 9],
            [$alice, "etat", "Trempé", "Vulnérable au froid et à la foudre jusqu'à séchage.", "public", 4],
            [$bjorn, "classe", "Berserker totémique", "Guerrier qui puise la rage d'un animal-totem pour se transformer.", "public", 23],
            [$bjorn, "voie", "Voie de l'Ours", "Endurance surhumaine, cri de guerre et étreinte broyeuse.", "public", 20],
            [$bjorn, "equipement", "Hache runique", "Hache à deux mains gravée de runes naines. +1 DM. 80 po.", "public", 12],
            [$bjorn, "piege", "Chausse-trappe", "Semé au sol : 1d4 DM et déplacement réduit jusqu'aux soins.", "public", 7],
            [$lyra, "sort", "Illusion parfaite", "Crée une image mobile indiscernable du réel (INT pour percer).", "public", 15],
            [$lyra, "capacite", "Pas de brume", "Se téléporte à 5m dans un endroit visible, 1/combat.", "public", 8],
            [$lyra, "objet-magique", "Voile d'invisibilité", "Rend invisible 1d4 tours ou jusqu'à la première attaque.", "public", 5],
            [$lyra, "poison", "Larmes de lune", "Inhalation. CON ou endormi 1d6 tours ; le dormeur se réveille au moindre bruit.", "public", 11],
        ];

        // Champs structurés (data) de démo, par nom d'entrée — fidèles au schéma de la
        // catégorie (cf. homebrewSchemas.ts). Couvre toutes les catégories structurées,
        // Mon contenu ET Communauté. Les entrées non listées restent en description seule.
        $dataByName = [
            "Peuple des Cendres" => ['modifiers' => ['FOR' => 2, 'CON' => 1, 'AGI' => -1], 'speed' => '10 m', 'minHeight' => 160, 'maxHeight' => 190, 'minWeight' => 60, 'maxWeight' => 100, 'startingAge' => 16, 'lifeExpectancy' => 80, 'abilities' => "Résistance au feu ; vulnérabilité au froid.", 'physicalTraits' => "Peau grise craquelée, yeux de braise.", 'publicPerception' => "Craints et respectés, nés des cendres volcaniques.", 'roleplay' => "Fiers, taciturnes, liés au feu.", 'typicalNames' => "Ember, Cinder, Ashka, Pyra, Brand."],
            "Homoncules affranchis" => ['modifiers' => ['INT' => 1, 'AGI' => 1, 'FOR' => -2], 'speed' => '8 m', 'startingAge' => 1, 'lifeExpectancy' => 40, 'abilities' => "Immunité aux poisons ; n'a pas besoin de dormir.", 'physicalTraits' => "Petite créature de porcelaine et de rouages.", 'typicalNames' => "Unit-7, Cendrillon, Écho."],
            "Danse-lame" => ['family' => 'Combattants', 'note' => "Combattant acrobate, mêlant esquive et attaques en tourbillon.", 'lore' => ["Née dans les arènes du Sud."], 'weaponsAuth' => ['Épées', 'Dagues', 'Rapières'], 'armorAuth' => ['Cuir simple', 'Cuir renforcé'], 'armorMaxDef' => 3, 'stats' => ['AGI' => 2, 'FOR' => 1, 'CON' => 1], 'startingEquipment' => ['Deux rapières', 'Armure de cuir', 'Bourse (30 po)'], 'masteries' => ['Esquive', 'Attaque en tourbillon']],
            "Invocateur du Pacte" => ['family' => 'Mystiques', 'magicStat' => 'CHA', 'note' => "Lie un familier démoniaque pour amplifier ses sorts.", 'armorMaxDef' => 2, 'stats' => ['CHA' => 2, 'VOL' => 1, 'CON' => 1], 'startingEquipment' => ['Dague', 'Grimoire du pacte', 'Robe'], 'masteries' => ['Sorts de pacte', 'Lien du familier']],
            "Voie du Gel" => ['category' => 'profil', 'maxRank' => 5, 'details' => ['Rang 1 — Souffle glacé : 1d6 DM de froid.', 'Rang 2 — Armure de givre : +2 DEF.', 'Rang 3 — Cône de gel : 2d6, zone.', 'Rang 4 — Emprise glaciale : immobilise.', 'Rang 5 — Blizzard : 3d6 en zone large.']],
            "Voie du Sang" => ['category' => 'profil', 'maxRank' => 5, 'details' => ['Rang 1 — Offrande : sacrifie 2 PV pour +1d6 DM.', 'Rang 2 — Transfusion : soigne un allié.', 'Rang 3 — Frénésie sanguine.']],
            "Éclat de givre" => ['rank' => 1, 'actionType' => 'Attaque', 'limited' => false, 'effect' => ['1d6 DM de froid.', 'Cible ralentie (CON annule).'], 'details' => ['Portée 15 m.', 'Zone de 3 m.']],
            "Chaînes d'ombre" => ['rank' => 2, 'actionType' => 'Limitée', 'limited' => true, 'effect' => ['Immobilise la cible 1d4 tours (VOL annule).'], 'details' => ['Portée 20 m.']],
            "Murmure vorace" => ['rank' => 2, 'actionType' => 'Attaque', 'limited' => false, 'effect' => ['Draine 1d8 PV.', 'Soigne le lanceur de la moitié.']],
            "Réflexe du chat" => ['rank' => 1, 'actionType' => 'Passive', 'isSpell' => false, 'limited' => false, 'effect' => ['+2 en Initiative.', '+2 DEF contre la première attaque du combat.']],
            "Frappe étourdissante" => ['rank' => 2, 'actionType' => 'Attaque', 'isSpell' => false, 'limited' => true, 'effect' => ['Sur un critique, la cible perd sa prochaine action (VOL annule).']],
            "Lame de l'Aube" => ['type' => 'Arme (épée longue)', 'rarity' => 'Rare', 'price' => '1500 po', 'weight' => 1.5, 'material' => 'Acier béni', 'quality' => 'Exceptionnelle', 'damage' => '1d8+1', 'critical' => '19-20', 'properties' => ["+1d6 DM de lumière contre les morts-vivants.", "Brille sur commande (lumière vive)."]],
            "Amulette du Revenant" => ['type' => 'Amulette', 'rarity' => 'Très rare', 'price' => '3000 po', 'weight' => 0.1, 'properties' => ["1/jour : revient à 1 PV au lieu de tomber à 0."]],
            "Bottes du Zéphyr" => ['type' => 'Bottes', 'rarity' => 'Peu commun', 'price' => '400 po', 'properties' => ["+3 m de déplacement.", "Ignore les terrains difficiles naturels."]],
            "Grappin pliable" => ['type' => 'Outil', 'price' => '20 po', 'weight' => 1.0, 'properties' => ["Corde de soie de 15 m.", "Se replie dans une bourse."]],
            "Ration elfique" => ['type' => 'Nourriture', 'price' => '5 po', 'weight' => 0.2, 'properties' => ["Une bouchée nourrit une journée entière."]],
            "Venin de mille-pattes" => ['effectFail' => "-2 à toutes les actions pendant 1 heure.", 'effectSuccess' => "Aucun effet.", 'duration' => '1 heure', 'delay' => 'Immédiat', 'note' => "Ingestion. Bon marché."],
            "Sève noire" => ['effectFail' => "Paralysie 1d4 tours.", 'effectSuccess' => "Ralenti 1 tour.", 'duration' => '1d4 tours', 'delay' => '1 tour', 'note' => "Contact. Rare et coûteux."],
            "Larmes de lune" => ['effectFail' => "Endormi 1d6 tours.", 'effectSuccess' => "Étourdi 1 tour.", 'duration' => '1d6 tours', 'delay' => '1 tour', 'note' => "Inhalation. Le dormeur se réveille au moindre bruit."],
            "Fosse à pals" => ['detectDifficulty' => 'DIF 15 (PER)', 'disarmDifficulty' => 'DIF 12', 'effect' => "2d6 DM et cible immobilisée.", 'complement' => "Recouverte de feuillage."],
            "Rune explosive" => ['detectDifficulty' => 'DIF 18 (INT)', 'disarmDifficulty' => 'DIF 16', 'effect' => "3d6 DM de feu, zone de 3 m.", 'complement' => "Se déclenche à l'approche."],
            // Communauté (autres joueurs)
            "Ondins des profondeurs" => ['modifiers' => ['CON' => 1, 'PER' => 1, 'FOR' => -1], 'speed' => '8 m (nage 12 m)', 'abilities' => "Respiration aquatique ; vision dans le noir.", 'physicalTraits' => "Peau bleutée, mains palmées, branchies.", 'typicalNames' => "Nael, Ondine, Coris, Maree."],
            "Trident des marées" => ['type' => 'Arme (trident)', 'rarity' => 'Rare', 'price' => '1200 po', 'damage' => '1d8', 'properties' => ["1/jour : invoque un jet d'eau sous pression (2d6, repousse)."]],
            "Berserker totémique" => ['family' => 'Combattants', 'note' => "Puise la rage d'un animal-totem pour se transformer.", 'armorMaxDef' => 3, 'stats' => ['FOR' => 2, 'CON' => 2, 'AGI' => 1], 'weaponsAuth' => ['Haches', 'Masses', 'Armes à deux mains'], 'masteries' => ['Rage totémique', 'Peau d\'écorce']],
            "Voie de l'Ours" => ['category' => 'profil', 'maxRank' => 5, 'details' => ['Rang 1 — Endurance de l\'ours : +5 PV.', 'Rang 2 — Cri de guerre.', 'Rang 3 — Étreinte broyeuse.']],
            "Illusion parfaite" => ['rank' => 3, 'actionType' => 'Limitée', 'limited' => true, 'effect' => ["Crée une image mobile indiscernable du réel.", "INT pour percer l'illusion."]],
            "Voile d'invisibilité" => ['type' => 'Cape', 'rarity' => 'Très rare', 'price' => '5000 po', 'properties' => ["Rend invisible 1d4 tours ou jusqu'à la première attaque."]],
        ];

        foreach ($entries as [$owner, $cat, $name, $desc, $vis, $age]) {
            $e = new HomebrewEntry();
            $e->setOwner($owner);
            $e->setCategory($cat);
            $e->setName($name);
            $e->setDescription($desc);
            $e->setVisibility($vis);
            if (isset($dataByName[$name])) {
                $e->setData($dataByName[$name]);
            }
            $e->setCreatedAt($now->modify("-{$age} days"));
            $e->setUpdatedAt($now->modify("-{$age} days"));
            $manager->persist($e);
        }
    }
}
