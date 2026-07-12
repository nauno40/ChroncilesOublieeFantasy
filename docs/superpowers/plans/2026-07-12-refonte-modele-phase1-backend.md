# Refonte du modèle de données — Phase 1 (schéma backend) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser le nouveau schéma relationnel/JSONB du personnage côté backend (entité `CharacterVoie`, colonnes `caracs`/`playState`, nettoyage `Profile`, données d'armures numériques, `effect.evolutiveDie` auto-détecté), en rupture nette, sans conserver l'ancien `Character.data`.

**Architecture:** Approche hybride (spec §3) : relations FK pour ce qui sera agrégé (peuple, profil, voies via `CharacterVoie`), JSONB pour l'état de jeu mutable (`playState`) et les caracs de base (`caracs`). Le backend reste déclaratif (API Platform) ; la dérivation vit côté front (phase 2+). Rupture nette : on modifie les entités, on régénère une migration, on recharge les fixtures.

**Tech Stack:** Symfony 7.4, API Platform 4.2, Doctrine ORM 3, PostgreSQL 15, PHPUnit. Commandes exécutées dans le conteneur : `docker compose exec -T backend <cmd>`.

**Référence :** spec `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md`.

## Global Constraints

- Rupture nette : **aucun** script de migration de données ; les fixtures seedées sont réécrites au nouveau format (spec §9).
- Le champ `Character.data` est **supprimé** et remplacé par `caracs` (JSON) + `playState` (JSON) + relation `characterVoies`.
- Groupes de sérialisation existants conservés : `character:read` / `character:write`.
- Sécurité par opération inchangée (owner-scoping via `CharacterStateProcessor` + expressions `security:`).
- Les tests `backend/tests/Api/*` doivent passer après chaque tâche qui les touche.
- PHP 8.3, typage strict des entités (propriétés typées Doctrine).

## File Structure

- **Create** `backend/src/Entity/CharacterVoie.php` — entité de jointure Character↔Voie (rang, source, choix).
- **Create** `backend/src/Repository/CharacterVoieRepository.php` — repository standard.
- **Modify** `backend/src/Entity/Character.php` — `caracs`/`playState` JSON, `characterVoies` OneToMany, suppression de `data`.
- **Modify** `backend/src/Entity/Profile.php` — suppression `hitDie`/`skillPoints`, ajout `armorMaxDef` (seuil) + `weaponsAuth` structuré.
- **Modify** `backend/src/Entity/Voie.php` — expose `characterVoies` inverse (non sérialisé).
- **Modify** `backend/data/armors.json` — `defense`/`agiMax` en entiers.
- **Modify** `backend/src/DataFixtures/AppFixtures.php` — armures (acMaxAgi/acPenalty), profils (plus de hitDie/skillPoints, `armorMaxDef`/`weaponsAuth`), Character seedés au nouveau format, `effect.evolutiveDie` auto-détecté.
- **Modify** `backend/tests/Api/CharacterSecurityTest.php`, `CharacterSharingTest.php` — payloads au nouveau format.
- **Create** `backend/migrations/VersionXXXX.php` — migration générée (rupture nette).

---

### Task 1 : Entité `CharacterVoie`

**Files:**
- Create: `backend/src/Entity/CharacterVoie.php`
- Create: `backend/src/Repository/CharacterVoieRepository.php`
- Modify: `backend/src/Entity/Character.php` (relation inverse — ajoutée en Task 2)

**Interfaces:**
- Produces: `CharacterVoie` avec `getRank(): ?int`, `setRank(int)`, `getSource(): ?string`, `setSource(string)`, `getVoie(): ?Voie`, `setVoie(?Voie)`, `getCharacter(): ?Character`, `setCharacter(?Character)`, `getChoices(): ?array`, `setChoices(?array)`. Valeurs de `source` : `profil|peuple|prestige|hybride`.

- [ ] **Step 1 : Écrire le repository**

```php
<?php
// backend/src/Repository/CharacterVoieRepository.php
namespace App\Repository;

use App\Entity\CharacterVoie;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CharacterVoie>
 */
class CharacterVoieRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CharacterVoie::class);
    }
}
```

- [ ] **Step 2 : Écrire l'entité**

```php
<?php
// backend/src/Entity/CharacterVoie.php
namespace App\Entity;

use App\Repository\CharacterVoieRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CharacterVoieRepository::class)]
class CharacterVoie
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['character:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'characterVoies')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Character $character = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['character:read', 'character:write'])]
    private ?Voie $voie = null;

    #[ORM\Column]
    #[Groups(['character:read', 'character:write'])]
    private ?int $rank = 0;

    // profil | peuple | prestige | hybride
    #[ORM\Column(length: 20)]
    #[Groups(['character:read', 'character:write'])]
    private ?string $source = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['character:read', 'character:write'])]
    private ?array $choices = null;

    public function getId(): ?int { return $this->id; }

    public function getCharacter(): ?Character { return $this->character; }
    public function setCharacter(?Character $character): static { $this->character = $character; return $this; }

    public function getVoie(): ?Voie { return $this->voie; }
    public function setVoie(?Voie $voie): static { $this->voie = $voie; return $this; }

    public function getRank(): ?int { return $this->rank; }
    public function setRank(int $rank): static { $this->rank = $rank; return $this; }

    public function getSource(): ?string { return $this->source; }
    public function setSource(string $source): static { $this->source = $source; return $this; }

    public function getChoices(): ?array { return $this->choices; }
    public function setChoices(?array $choices): static { $this->choices = $choices; return $this; }
}
```

- [ ] **Step 3 : Valider le mapping Doctrine**

Run: `docker compose exec -T backend bin/console doctrine:schema:validate --skip-sync`
Expected: `[OK] The mapping files are correct.` (le mapping compile ; « database is not in sync » est attendu et ignoré à ce stade).

- [ ] **Step 4 : Commit**

```bash
git add backend/src/Entity/CharacterVoie.php backend/src/Repository/CharacterVoieRepository.php
git commit -m "feat(character): entité de jointure CharacterVoie (voie par FK + rang + source)"
```

---

### Task 2 : `Character` — `caracs`, `playState`, `characterVoies` ; suppression de `data`

**Files:**
- Modify: `backend/src/Entity/Character.php`
- Modify: `backend/src/Entity/Voie.php` (aucune inverse nécessaire — `CharacterVoie.voie` est unidirectionnel ; pas de changement ici, laissé tel quel)

**Interfaces:**
- Consumes: `CharacterVoie` (Task 1).
- Produces: `Character` expose `getCaracs(): ?array` / `setCaracs(?array)`, `getPlayState(): ?array` / `setPlayState(?array)`, `getCharacterVoies(): Collection`, `addCharacterVoie(CharacterVoie)`, `removeCharacterVoie(CharacterVoie)`. Le champ `data` n'existe plus.

- [ ] **Step 1 : Écrire un test API du nouveau format (échoue d'abord)**

Ajouter dans `backend/tests/Api/CharacterSecurityTest.php` une méthode qui crée un personnage au nouveau format et vérifie la forme lue. Utiliser l'helper d'authentification existant de `ApiSecurityTestCase` (voir les autres méthodes du fichier pour le pattern exact de `createUserAndLogin()` / `request()`).

```php
public function testCharacterNewShapeRoundTrip(): void
{
    $token = $this->createUserAndLogin('shape@test.com');
    $payload = [
        'name' => 'Lhagva',
        'level' => 1,
        'caracs' => ['AGI' => 1, 'CON' => 2, 'FOR' => 3, 'PER' => 1, 'CHA' => -1, 'INT' => 0, 'VOL' => 1],
        'playState' => ['hp' => ['current' => 15], 'money' => ['pa' => 12]],
    ];
    $response = $this->request('POST', '/api/characters', $payload, $token);
    $this->assertResponseStatusCodeSame(201);
    $data = json_decode($response->getContent(), true);
    $this->assertSame(3, $data['caracs']['FOR']);
    $this->assertSame(15, $data['playState']['hp']['current']);
    $this->assertArrayNotHasKey('data', $data);
}
```

- [ ] **Step 2 : Lancer le test — il échoue**

Run: `docker compose exec -T backend bin/phpunit --filter testCharacterNewShapeRoundTrip`
Expected: FAIL (propriétés `caracs`/`playState` inconnues d'API Platform).

- [ ] **Step 3 : Modifier l'entité `Character`**

Dans `backend/src/Entity/Character.php` : supprimer le bloc `data` (propriété + getter/setter, lignes ~58-61 et ~156-166) et ajouter les nouvelles propriétés. Ajouter les imports Collection en tête.

Remplacer la propriété `data` par :

```php
    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['character:read', 'character:write'])]
    private ?array $caracs = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['character:read', 'character:write'])]
    private ?array $playState = null;

    #[ORM\OneToMany(targetEntity: CharacterVoie::class, mappedBy: 'character', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['character:read', 'character:write'])]
    private Collection $characterVoies;
```

Ajouter en tête du fichier :

```php
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
```

Initialiser la collection dans un constructeur (l'entité n'en a pas encore) :

```php
    public function __construct()
    {
        $this->characterVoies = new ArrayCollection();
    }
```

Remplacer `getData`/`setData` par :

```php
    public function getCaracs(): ?array { return $this->caracs; }
    public function setCaracs(?array $caracs): static { $this->caracs = $caracs; return $this; }

    public function getPlayState(): ?array { return $this->playState; }
    public function setPlayState(?array $playState): static { $this->playState = $playState; return $this; }

    /** @return Collection<int, CharacterVoie> */
    public function getCharacterVoies(): Collection { return $this->characterVoies; }

    public function addCharacterVoie(CharacterVoie $cv): static
    {
        if (!$this->characterVoies->contains($cv)) {
            $this->characterVoies->add($cv);
            $cv->setCharacter($this);
        }
        return $this;
    }

    public function removeCharacterVoie(CharacterVoie $cv): static
    {
        if ($this->characterVoies->removeElement($cv)) {
            if ($cv->getCharacter() === $this) {
                $cv->setCharacter(null);
            }
        }
        return $this;
    }
```

- [ ] **Step 4 : Valider le mapping**

Run: `docker compose exec -T backend bin/console doctrine:schema:validate --skip-sync`
Expected: `[OK] The mapping files are correct.`

- [ ] **Step 5 : Régénérer et appliquer la migration (rupture nette), recharger les fixtures**

Run:
```bash
docker compose exec -T backend bin/console doctrine:migrations:diff --no-interaction
docker compose exec -T backend bin/console doctrine:migrations:migrate --no-interaction
```
Expected: une migration créée (drop `character.data`, add `character.caracs`/`playState`, create table `character_voie`) et appliquée sans erreur.

> Note : les fixtures seedées (Task 3) doivent être adaptées avant `fixtures:load`. Si `doctrine:migrations:diff` échoue faute d'anciennes migrations cohérentes en dev, réinitialiser : `bin/console doctrine:database:drop --force && bin/console doctrine:database:create && bin/console doctrine:migrations:migrate --no-interaction`.

- [ ] **Step 6 : Lancer le test — il passe**

Run: `docker compose exec -T backend bin/phpunit --filter testCharacterNewShapeRoundTrip`
Expected: PASS.

- [ ] **Step 7 : Commit**

```bash
git add backend/src/Entity/Character.php backend/tests/Api/CharacterSecurityTest.php backend/migrations/
git commit -m "feat(character): caracs + playState + characterVoies, suppression de data (rupture nette)"
```

---

### Task 3 : Adapter les `Character` seedés (fixtures) au nouveau format

**Files:**
- Modify: `backend/src/DataFixtures/AppFixtures.php:810-900` (les deux `new Character()`)

**Interfaces:**
- Consumes: `Character::setCaracs`, `setPlayState`, `addCharacterVoie` (Task 2) ; `CharacterVoie` (Task 1).

- [ ] **Step 1 : Réécrire les deux blocs Character**

Localiser les deux `new Character()` (≈ lignes 816 et 881). Remplacer les appels `->setData([...])` par le nouveau format. Exemple pour le PJ de test (adapter les valeurs existantes) :

```php
$ch = new Character();
$ch->setName('Lhagva');
$ch->setLevel(1);
// $ch->setRace(...) / $ch->setProfile(...) : conserver les rattachements existants
$ch->setCaracs(['AGI' => 1, 'CON' => 2, 'FOR' => 3, 'PER' => 1, 'CHA' => -1, 'INT' => 0, 'VOL' => 1]);
$ch->setPlayState([
    'hp' => ['current' => 15],
    'mana' => ['current' => 0],
    'luck' => ['current' => 2],
    'recovery' => ['used' => 0],
    'money' => ['po' => 0, 'pa' => 12, 'pc' => 0],
    'equipment' => [],
    'rp' => ['ideal' => '', 'flaw' => '', 'secret' => '', 'notes' => ''],
    'languages' => ['Commun'],
]);
$manager->persist($ch);
```

Faire de même pour le PNJ (ligne ≈ 881) avec ses valeurs propres. Ne pas créer de `CharacterVoie` ici si les voies ne sont pas connues à ce stade (laisser la collection vide est valide).

- [ ] **Step 2 : Charger les fixtures**

Run: `docker compose exec -T backend bin/console doctrine:fixtures:load --no-interaction`
Expected: `> purging database` puis chargement sans erreur (aucun appel à `setData`).

- [ ] **Step 3 : Vérifier qu'il ne reste aucun `setData` de Character**

Run: `docker compose exec -T backend grep -n "setData" src/DataFixtures/AppFixtures.php`
Expected: aucune ligne concernant un `Character` (les éventuels `setData` restants concernent d'autres entités — vérifier le contexte).

- [ ] **Step 4 : Commit**

```bash
git add backend/src/DataFixtures/AppFixtures.php
git commit -m "feat(fixtures): personnages seedés au format caracs/playState"
```

---

### Task 4 : `Profile` — suppression des champs morts `hitDie` et `skillPoints`

**Files:**
- Modify: `backend/src/Entity/Profile.php` (propriétés + getters/setters `hitDie` ~38-39/116-126, `skillPoints` ~47-48/152-162)
- Modify: `backend/src/DataFixtures/AppFixtures.php` (retrait des `setHitDie`/`setSkillPoints` ~184-208, 247)

**Interfaces:**
- Produces: `Profile` sans `getHitDie`/`setHitDie` ni `getSkillPoints`/`setSkillPoints`. `magicStat`, `family`, `stats`, `masteries`, `startingEquipment` conservés.

- [ ] **Step 1 : Retirer les champs de l'entité**

Dans `backend/src/Entity/Profile.php`, supprimer :
- la propriété `private ?string $hitDie = null;` + `getHitDie()` + `setHitDie()` ;
- la propriété `private ?int $skillPoints = null;` + `getSkillPoints()` + `setSkillPoints()`.

- [ ] **Step 2 : Retirer les appels dans les fixtures**

Dans `AppFixtures.php`, supprimer les lignes `$e->setHitDie(...)` (≈ 185, 207), le bloc `if (!$e->getHitDie())` (≈ 206-208), et `$e->setSkillPoints(2);` (≈ 247). Retirer aussi les `unset($extraStats['hitDie'], ...)` devenus sans objet uniquement si `hitDie` n'est plus lu ailleurs (garder `magicStat`).

- [ ] **Step 3 : Valider le mapping + recharger**

Run:
```bash
docker compose exec -T backend bin/console doctrine:schema:validate --skip-sync
docker compose exec -T backend bin/console doctrine:migrations:diff --no-interaction
docker compose exec -T backend bin/console doctrine:migrations:migrate --no-interaction
docker compose exec -T backend bin/console doctrine:fixtures:load --no-interaction
```
Expected: mapping OK, migration (drop colonnes `hit_die`/`skill_points`) appliquée, fixtures chargées.

- [ ] **Step 4 : Vérifier qu'aucun code ne référence plus ces getters**

Run: `docker compose exec -T backend grep -rn "getHitDie\|getSkillPoints\|setHitDie\|setSkillPoints" src/`
Expected: aucune occurrence.

- [ ] **Step 5 : Commit**

```bash
git add backend/src/Entity/Profile.php backend/src/DataFixtures/AppFixtures.php backend/migrations/
git commit -m "refactor(profile): supprime les champs morts hitDie et skillPoints (constantes de règles)"
```

---

### Task 5 : Données d'armures numériques + `armorMaxDef`/`weaponsAuth` sur `Profile`

**Files:**
- Modify: `backend/data/armors.json` (tous les objets : `defense` int, `agiMax` int nullable, ajout `penalty`)
- Modify: `backend/src/DataFixtures/AppFixtures.php` (armures : `setAcMaxAgi`/`setAcPenalty` ; profils : `setArmorMaxDef`/`setWeaponsAuth`)
- Modify: `backend/src/Entity/Profile.php` (ajout `armorMaxDef:int`, `weaponsAuth:array` — `weaponsAuth` existe déjà en `?array`, réutiliser ; ajouter `armorMaxDef`)

**Interfaces:**
- Produces: `Profile::getArmorMaxDef(): ?int` / `setArmorMaxDef(?int)` ; `Equipment` peuplé avec `acMaxAgi`/`acPenalty`.

- [ ] **Step 1 : Nettoyer `armors.json` en entiers**

Pour chaque objet, remplacer `"defense": "+2 "` par `"defense": 2`, et `"agiMax": "—"` par `"agiMax": null` (ou l'entier quand une valeur existe). Ajouter `"penalty": 0` (ou la valeur réelle si connue). Exemple :

```json
{ "id": "petit_bouclier", "name": "Petit bouclier", "type": "Bouclier", "defense": 1, "agiMax": null, "penalty": 0, "price": "2 pa", "comments": "La DEF s'additionne à celle de l'armure." }
```

- [ ] **Step 2 : Ajouter `armorMaxDef` à l'entité `Profile`**

```php
    #[ORM\Column(nullable: true)]
    #[Groups(['profile:read'])]
    private ?int $armorMaxDef = null;

    public function getArmorMaxDef(): ?int { return $this->armorMaxDef; }
    public function setArmorMaxDef(?int $armorMaxDef): static { $this->armorMaxDef = $armorMaxDef; return $this; }
```

- [ ] **Step 3 : Adapter le chargement des armures dans les fixtures**

Dans `loadEquipment`, le parsing devient direct (les valeurs sont des entiers) :

```php
$e->setAcBonus($item['defense'] ?? null);
$e->setAcMaxAgi($item['agiMax'] ?? null);
$e->setAcPenalty($item['penalty'] ?? 0);
```

- [ ] **Step 4 : Renseigner `armorMaxDef`/`weaponsAuth` par profil**

Dans la boucle de chargement des profils, ajouter une table de correspondance issue de la spec §8 (seuils de DEF max ; catégories d'armes). Exemple minimal (valeurs à compléter depuis les règles chap. 4-7) :

```php
// Seuil de DEF max d'armure par profil (spec §8 ; -1 = aucune armure)
$armorMaxDefByProfile = [
    'Barbare' => 3, 'Chevalier' => 6, 'Guerrier' => 5,
    'Magicien' => -1, 'Ensorceleur' => -1, 'Sorcier' => -1, 'Forgesort' => 2,
    'Druide' => 2, 'Moine' => -1, 'Prêtre' => 4,
    'Arquebusier' => 4, 'Barde' => 3, 'Rôdeur' => 3, 'Voleur' => 2,
];
if (isset($armorMaxDefByProfile[$name])) {
    $e->setArmorMaxDef($armorMaxDefByProfile[$name]);
}
```

- [ ] **Step 5 : Valider + migrer + recharger**

Run:
```bash
docker compose exec -T backend bin/console doctrine:schema:validate --skip-sync
docker compose exec -T backend bin/console doctrine:migrations:diff --no-interaction
docker compose exec -T backend bin/console doctrine:migrations:migrate --no-interaction
docker compose exec -T backend bin/console doctrine:fixtures:load --no-interaction
```
Expected: colonne `armor_max_def` ajoutée, fixtures chargées, armures avec `ac_bonus`/`ac_max_agi`/`ac_penalty` peuplés.

- [ ] **Step 6 : Vérifier les données d'une armure via l'API**

Run: `docker compose exec -T backend bin/console dbal:run-sql "SELECT name, ac_bonus, ac_max_agi FROM equipment WHERE type = 'Armure' LIMIT 3"`
Expected: `ac_bonus` numériques non nuls (ex. cuir = 2).

- [ ] **Step 7 : Commit**

```bash
git add backend/data/armors.json backend/src/Entity/Profile.php backend/src/DataFixtures/AppFixtures.php backend/migrations/
git commit -m "feat(equipment): armures numériques + seuil armorMaxDef par profil"
```

---

### Task 6 : Auto-détection du dé évolutif dans `Capability.effect`

**Files:**
- Modify: `backend/src/DataFixtures/AppFixtures.php` (boucle de création des `Capability`)

**Interfaces:**
- Consumes: `Capability::setEffect(?array)` (déjà existant).
- Produces: chaque capacité dont la description contient `Nd4°` reçoit `effect = ['evolutiveDie' => ['count' => N]]`.

- [ ] **Step 1 : Localiser la création des Capability**

Run: `docker compose exec -T backend grep -n "new Capability" src/DataFixtures/AppFixtures.php`
Expected: la/les ligne(s) où les capacités sont instanciées et où `setDescription` est appelé.

- [ ] **Step 2 : Ajouter la détection après `setDescription`**

Juste après le `->setDescription($desc)` de la capacité, insérer :

```php
// Auto-détection du dé évolutif "Nd4°" (spec §6.4) : "d4°" -> count 1, "2d4°" -> count 2
if (preg_match('/(\d*)d4°/u', $desc ?? '', $m)) {
    $count = $m[1] === '' ? 1 : (int) $m[1];
    $cap->setEffect(['evolutiveDie' => ['count' => $count]]);
}
```

(Adapter `$cap` et `$desc` aux noms de variables réels repérés au Step 1.)

- [ ] **Step 3 : Recharger les fixtures**

Run: `docker compose exec -T backend bin/console doctrine:fixtures:load --no-interaction`
Expected: chargement sans erreur.

- [ ] **Step 4 : Vérifier qu'au moins une capacité a un effet évolutif**

Run: `docker compose exec -T backend bin/console dbal:run-sql "SELECT name, effect FROM capability WHERE effect IS NOT NULL LIMIT 5"`
Expected: des lignes avec `{"evolutiveDie": {"count": ...}}` (ex. capacités du barbare repérées plus tôt : « +1d4° », « +2d4° »).

- [ ] **Step 5 : Commit**

```bash
git add backend/src/DataFixtures/AppFixtures.php
git commit -m "feat(fixtures): auto-détection du dé évolutif Nd4° dans Capability.effect"
```

---

### Task 7 : Vérification d'intégration + tests API

**Files:**
- Modify: `backend/tests/Api/CharacterSharingTest.php` (payloads au nouveau format si présents)

**Interfaces:**
- Consumes: l'ensemble des tâches précédentes.

- [ ] **Step 1 : Repérer les payloads Character à l'ancien format dans les tests**

Run: `docker compose exec -T backend grep -rn "'data'\|\"data\"" tests/Api/`
Expected: liste des occurrences où un test envoie `data => [...]` pour un Character.

- [ ] **Step 2 : Remplacer par `caracs`/`playState`**

Pour chaque payload de création/mise à jour de Character dans les tests, remplacer la clé `data` par `caracs` et `playState` (structure minimale, ex. `'caracs' => ['FOR' => 1, ...], 'playState' => []`). Ne pas modifier les assertions de sécurité (statuts 401/403/200), seulement la forme du corps.

- [ ] **Step 3 : Lancer toute la suite API**

Run: `docker compose exec -T backend bin/phpunit`
Expected: PASS sur l'ensemble (les ~40 tests de sécurité + le nouveau `testCharacterNewShapeRoundTrip`).

- [ ] **Step 4 : Vérifier le schéma final en base**

Run:
```bash
docker compose exec -T backend bin/console doctrine:schema:validate
```
Expected: `[OK] The mapping files are correct.` ET `[OK] The database schema is in sync with the mapping files.`

- [ ] **Step 5 : Commit**

```bash
git add backend/tests/Api/
git commit -m "test(api): adapte les payloads Character au format caracs/playState"
```

---

## Definition of Done (Phase 1)

- Table `character_voie` créée ; `character.data` supprimée ; `character.caracs`/`playState` présentes.
- `Profile.hitDie`/`skillPoints` supprimés ; `armorMaxDef` présent ; armures numériques (`ac_bonus`/`ac_max_agi`/`ac_penalty`).
- Capacités avec `Nd4°` portant `effect.evolutiveDie`.
- `doctrine:schema:validate` totalement vert.
- `bin/phpunit` vert (sécurité + round-trip du nouveau format).
- Fixtures rechargées sans `setData` de Character.

## Suite

La **Phase 2** (types front + services : `character.ts` en caracs/playState, voies par IRI via `characterVoies`, mapping `campaignService`/`character`) fera l'objet de son propre plan, écrit une fois la Phase 1 mergée et la forme JSON-LD de `Character` figée.
