<?php

namespace App\Tests\Admin;

use App\Entity\Campaign;
use App\Entity\ContentReport;
use App\Entity\User;
use App\Tests\Api\ApiSecurityTestCase;

/**
 * The EasyAdmin back-office is the only server-rendered part of the project, and it
 * exposes the whole compendium in write mode plus the list of every account's e-mail
 * address. It once answered 200 to anonymous visitors because its firewall declared no
 * authenticator and no access rule covered `^/admin`. These tests are that regression's
 * guard: the pages are reached over HTTP basic auth (see `security.yaml`).
 */
final class BackOfficeSecurityTest extends ApiSecurityTestCase
{
    public function testAnonymousIsChallengedOnTheDashboard(): void
    {
        $this->client->request('GET', '/admin');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testAnonymousCannotListUserAccounts(): void
    {
        $this->client->request('GET', '/admin/user');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testRegularUserIsDeniedTheBackOffice(): void
    {
        $this->createUser('player@example.com');

        $this->client->request('GET', '/admin/user', [
            'auth_basic' => ['player@example.com', 'password'],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testAdminReachesTheUserList(): void
    {
        $this->createUser('admin@example.com', ['ROLE_ADMIN']);

        $this->client->request('GET', '/admin/user', [
            'auth_basic' => ['admin@example.com', 'password'],
        ]);
        $this->assertResponseIsSuccessful();
    }

    /** Sections dont l'administrateur peut créer et modifier une ligne. */
    private const WRITABLE_SECTIONS = [
        'user', 'race', 'family', 'profile', 'voie', 'capability',
        'creature-family', 'creature', 'creature-voie', 'equipment',
        'material', 'food', 'lodging', 'mount', 'harmful-state', 'poison', 'trap',
    ];

    /** Sections dont la clé dans le jeu d'essai diffère du segment d'URL. */
    private const FIXTURE_KEYS = [
        'harmful-state' => 'state',
        'homebrew-entry' => 'homebrew',
        'campaign-membership' => 'membership',
    ];

    /** Sections que l'administrateur peut consulter et supprimer, jamais créer ni modifier. */
    private const READ_DELETE_SECTIONS = [
        'campaign', 'campaign-membership', 'quest', 'clue', 'session', 'encounter',
        'character', 'character-voie', 'homebrew-entry', 'custom-creature',
    ];

    public function testAdminReadsEveryUserDataSection(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        foreach (self::READ_DELETE_SECTIONS as $section) {
            $this->requestAsAdmin('/admin/'.$section);
            $this->assertResponseIsSuccessful(sprintf('L\'index « %s » doit répondre.', $section));

            $entity = $entities[self::FIXTURE_KEYS[$section] ?? $section];
            $this->requestAsAdmin(sprintf('/admin/%s/%d', $section, $entity->getId()));
            $this->assertResponseIsSuccessful(sprintf('Le détail « %s » doit répondre.', $section));
        }
    }

    /**
     * Ces données appartiennent à un utilisateur et sont écrites par le front, qui applique
     * des règles (propriétaire, appartenance, dérivations) qu'un formulaire ignore. Le refus
     * doit venir d'EasyAdmin lui-même, pas d'un bouton caché : la route doit être fermée.
     */
    public function testWriteRoutesAreClosedOnUserDataSections(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        foreach (self::READ_DELETE_SECTIONS as $section) {
            $entity = $entities[self::FIXTURE_KEYS[$section] ?? $section];

            $this->requestAsAdmin('/admin/'.$section.'/new');
            $this->assertResponseStatusCodeSame(403, sprintf('La création « %s » doit être refusée.', $section));

            $this->requestAsAdmin(sprintf('/admin/%s/%d/edit', $section, $entity->getId()));
            $this->assertResponseStatusCodeSame(403, sprintf('La modification « %s » doit être refusée.', $section));
        }
    }

    /**
     * Chaque formulaire rend une liste déroulante par association, dont EasyAdmin construit
     * les libellés en convertissant l'entité liée en chaîne. Sans `__toString()`, la page
     * répond 500 — alors que l'index et le détail, eux, répondent 200.
     */
    public function testAdminOpensEveryWritableForm(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);
        // BackOfficeFixture::seed() ne renvoie jamais l'administrateur : c'est ce test qui le
        // crée, hors du jeu d'essai (dont les 26 clés sont figées par BackOfficeFixtureTest).
        // On l'ajoute ici sous la clé « user » pour que la boucle ci-dessous couvre aussi le
        // formulaire de modification de la section la plus sensible : mots de passe et rôles.
        $entities['user'] = $admin;

        foreach (self::WRITABLE_SECTIONS as $section) {
            $this->requestAsAdmin('/admin/'.$section);
            $this->assertResponseIsSuccessful(sprintf('L\'index « %s » doit répondre.', $section));

            $this->requestAsAdmin('/admin/'.$section.'/new');
            $this->assertResponseIsSuccessful(sprintf('Le formulaire de création « %s » doit répondre.', $section));

            // Les 17 sections en écriture ont désormais toutes une entité correspondante :
            // un indexage direct échoue bruyamment si une clé venait à manquer, plutôt que de
            // sauter silencieusement la vérification comme le faisait l'ancien isset().
            $fixtureKey = self::FIXTURE_KEYS[$section] ?? $section;
            $this->requestAsAdmin(sprintf('/admin/%s/%d/edit', $section, $entities[$fixtureKey]->getId()));
            $this->assertResponseIsSuccessful(sprintf('Le formulaire de modification « %s » doit répondre.', $section));
        }
    }

    /**
     * `Capability.effect` est dérivé par `CapabilityEffectBuilder` au chargement des
     * fixtures. On veut le lire dans le back-office, pas le saisir : une saisie serait
     * écrasée au chargement suivant.
     */
    public function testDerivedJsonIsShownButNotEditable(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        $html = $this->requestAsAdmin(sprintf('/admin/capability/%d/edit', $entities['capability']->getId()));

        self::assertStringContainsString('Capability[effect]', $html, 'Le champ dérivé doit être affiché.');
        self::assertMatchesRegularExpression(
            '/name="Capability\[effect\]"[^>]*disabled/',
            $html,
            'Le champ dérivé doit être en lecture seule.'
        );
    }

    /**
     * Sections dont une ligne se supprime depuis le back-office, mesuré empiriquement.
     * Ordre significatif, feuilles avant racines : `Campaign::$quests/$clues/$sessions/
     * $encounters/$memberships` portent `orphanRemoval: true`, donc Doctrine les efface déjà
     * en cascade quand `campaign` est supprimée en premier — un ordre racine-avant-feuille
     * fait échouer le balayage sur un 404 (ligne déjà effacée), pas sur une clé étrangère.
     * Même mécanisme pour `Character::$characterVoies` (cascade: ['remove'], orphanRemoval)
     * vis-à-vis de `character-voie`.
     */
    private const DELETABLE_SECTIONS = [
        'character-voie', 'quest', 'clue', 'session', 'encounter', 'campaign-membership',
        'character', 'campaign', 'homebrew-entry', 'custom-creature',
    ];

    /**
     * Vide : aucune des 10 sections, prise isolément dans l'état où `BackOfficeFixture` les
     * laisse, n'est retenue par une clé étrangère (chaque association qui pointe vers l'une
     * d'elles porte `orphanRemoval: true` côté propriétaire — voir le commentaire de
     * DELETABLE_SECTIONS). Ce n'est pas la même chose que « aucune suppression n'est jamais
     * refusée » : `Campaign::$characters` n'a que `cascade: ['persist']`, sans
     * `orphanRemoval`, et un personnage réellement rattaché à sa campagne — l'état normal du
     * produit — bloque bel et bien la suppression de la campagne. Ce cas n'est pas mesurable
     * par le mécanisme à deux listes (le balayage de DELETABLE_SECTIONS supprime `character`
     * avant `campaign`, ce qui masquerait le refus) ; il est couvert séparément par
     * `testCampaignDeletionIsRefusedWhenACharacterIsAttached()`.
     */
    private const DELETION_REFUSED_SECTIONS = [];

    /**
     * Une suppression par section. Les cascades du domaine campagne n'ont pas été écrites
     * pour le back-office : certaines lignes sont retenues par une clé étrangère. Le test
     * fige ce qui est vrai aujourd'hui — il n'invente pas de cascade pour se satisfaire.
     */
    public function testAdminDeletesUserData(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        foreach (self::DELETABLE_SECTIONS as $section) {
            $entity = $entities[self::FIXTURE_KEYS[$section] ?? $section];
            $id = $entity->getId();
            $class = $entity::class;

            self::assertSame(302, $this->deleteAsAdmin($section, $id), sprintf('La suppression « %s » doit aboutir.', $section));

            $this->em->clear();
            self::assertNull($this->em->find($class, $id), sprintf('La ligne « %s » doit avoir disparu.', $section));
        }
    }

    /**
     * Le cas courant du produit, qu'aucune des 10 sections du balayage n'exerce : un
     * personnage de joueur réellement rattaché à sa campagne. `Character::$campaign` est un
     * `ManyToOne` nullable, mais la migration qui a posé la colonne
     * (`Version20260301194224.php`) crée la clé étrangère sans clause `ON DELETE` — Postgres
     * applique donc `RESTRICT` par défaut. `BackOfficeFixture::seed()` ne rattache jamais son
     * `character` à sa `campaign` ; on le fait ici, pour cette seule section, hors du
     * balayage : l'ordre de `DELETABLE_SECTIONS` supprime déjà `character` avant `campaign`,
     * ce qui aurait effacé la ligne bloquante avant le test.
     *
     * EasyAdmin attrape la `ForeignKeyConstraintViolationException` de Doctrine et la
     * retraduit en `EntityRemoveException`, une `HttpException` avec un code 409 — la requête
     * ne remonte donc pas comme exception non interceptée jusqu'à PHPUnit, elle répond 409.
     */
    public function testCampaignDeletionDetachesAttachedCharacters(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        $entities['character']->setCampaign($entities['campaign']);
        $this->em->flush();

        $campaignId = $entities['campaign']->getId();
        $characterId = $entities['character']->getId();

        // Version20260925090000 : la FK est ON DELETE SET NULL — la fiche appartient à son
        // joueur, elle survit à la campagne de son MJ (avant : RESTRICT, réponse 409).
        self::assertSame(302, $this->deleteAsAdmin('campaign', $campaignId));

        $this->em->clear();
        self::assertNull($this->em->find(Campaign::class, $campaignId), 'La campagne doit avoir disparu.');
        $character = $this->em->find(\App\Entity\Character::class, $characterId);
        self::assertNotNull($character, 'La fiche du joueur doit survivre à la campagne.');
        self::assertNull($character->getCampaign(), 'La fiche doit être détachée, pas supprimée.');
    }

    /**
     * EasyAdmin protège la suppression par un jeton de session. Le navigateur de test garde
     * les cookies entre deux requêtes : il suffit de lire le jeton sur la page de détail.
     */
    private function deleteAsAdmin(string $section, int $id): int
    {
        $html = $this->requestAsAdmin(sprintf('/admin/%s/%d', $section, $id));
        self::assertMatchesRegularExpression('/name="token" value="([^"]+)"/', $html, 'La page de détail doit porter un jeton de suppression.');
        preg_match('/name="token" value="([^"]+)"/', $html, $matches);

        $browser = $this->client->getKernelBrowser();
        $browser->request(
            'POST',
            sprintf('/admin/%s/%d/delete', $section, $id),
            ['token' => $matches[1]],
            [],
            ['PHP_AUTH_USER' => 'admin@example.com', 'PHP_AUTH_PW' => 'password'],
        );

        return $browser->getResponse()->getStatusCode();
    }

    private function requestAsAdmin(string $path): string
    {
        $this->client->request('GET', $path, [
            'auth_basic' => ['admin@example.com', 'password'],
        ]);

        return $this->client->getKernelBrowser()->getResponse()->getContent();
    }

    // --- ROLE_MODERATOR : un bénévole traite les signalements, rien d'autre ---

    private function makeReport(User $reporter): ContentReport
    {
        $report = new ContentReport();
        $report->setReporter($reporter);
        $report->setTargetType('homebrew_entry');
        $report->setTargetId(1);
        $report->setReason('Contenu hors charte');
        $report->setStatus('pending');
        $report->setCreatedAt(new \DateTimeImmutable());
        $this->em->persist($report);
        $this->em->flush();

        return $report;
    }

    public function testDashboardRedirectsModeratorToContentReportsNotBestiary(): void
    {
        $this->createUser('mod@example.com', ['ROLE_MODERATOR']);

        $this->client->request('GET', '/admin', ['auth_basic' => ['mod@example.com', 'password']]);
        $response = $this->client->getKernelBrowser()->getResponse();
        $this->assertTrue($response->isRedirect());
        $this->assertStringContainsString('content-report', (string) $response->headers->get('Location'));
    }

    public function testModeratorCanViewAndEditAContentReport(): void
    {
        $this->createUser('mod@example.com', ['ROLE_MODERATOR']);
        $reporter = $this->createUser('joueur@example.com');
        $report = $this->makeReport($reporter);

        $this->client->request('GET', '/admin/content-report/'.$report->getId(), ['auth_basic' => ['mod@example.com', 'password']]);
        $this->assertResponseIsSuccessful('Un modérateur doit pouvoir consulter un signalement.');

        $this->client->request('GET', '/admin/content-report/'.$report->getId().'/edit', ['auth_basic' => ['mod@example.com', 'password']]);
        $this->assertResponseIsSuccessful('Un modérateur doit pouvoir ouvrir le formulaire de traitement.');
    }

    public function testModeratorCannotDeleteAContentReport(): void
    {
        // La suppression reste un geste admin (nettoyage), pas de la modération courante
        // (changer un statut) — cf. le commentaire de ContentReportCrudController.
        $this->createUser('mod@example.com', ['ROLE_MODERATOR']);
        $reporter = $this->createUser('joueur@example.com');
        $report = $this->makeReport($reporter);

        $browser = $this->client->getKernelBrowser();
        $browser->request(
            'POST',
            sprintf('/admin/content-report/%d/delete', $report->getId()),
            ['token' => 'peu-importe'],
            [],
            ['PHP_AUTH_USER' => 'mod@example.com', 'PHP_AUTH_PW' => 'password'],
        );
        $this->assertSame(403, $browser->getResponse()->getStatusCode());
    }

    /** Sections que ROLE_MODERATOR ne doit jamais atteindre — le cœur du correctif. */
    private const MODERATOR_DENIED_SECTIONS = [
        'user', 'race', 'creature', 'equipment', 'homebrew-entry', 'custom-creature',
        'campaign', 'character', 'quest',
    ];

    public function testModeratorIsDeniedEverySectionExceptContentReport(): void
    {
        $moderator = $this->createUser('mod@example.com', ['ROLE_MODERATOR']);
        BackOfficeFixture::seed($this->em, $moderator);

        foreach (self::MODERATOR_DENIED_SECTIONS as $section) {
            $this->client->request('GET', '/admin/'.$section, ['auth_basic' => ['mod@example.com', 'password']]);
            $this->assertResponseStatusCodeSame(403, sprintf('La section « %s » doit être refusée à un modérateur.', $section));
        }
    }

    public function testRegularUserWithoutModeratorRoleCannotReachContentReports(): void
    {
        // Ni ROLE_ADMIN ni ROLE_MODERATOR : un compte joueur ordinaire, même avec un
        // signalement à son nom, ne doit pas pouvoir consulter la file de modération.
        $player = $this->createUser('joueur@example.com');
        $this->makeReport($player);

        $this->client->request('GET', '/admin/content-report', ['auth_basic' => ['joueur@example.com', 'password']]);
        $this->assertResponseStatusCodeSame(403);
    }
}
