<?php

namespace App\Tests\Admin;

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

        foreach (self::WRITABLE_SECTIONS as $section) {
            $this->requestAsAdmin('/admin/'.$section);
            $this->assertResponseIsSuccessful(sprintf('L\'index « %s » doit répondre.', $section));

            $this->requestAsAdmin('/admin/'.$section.'/new');
            $this->assertResponseIsSuccessful(sprintf('Le formulaire de création « %s » doit répondre.', $section));

            $fixtureKey = self::FIXTURE_KEYS[$section] ?? $section;
            if (isset($entities[$fixtureKey])) {
                $this->requestAsAdmin(sprintf('/admin/%s/%d/edit', $section, $entities[$fixtureKey]->getId()));
                $this->assertResponseIsSuccessful(sprintf('Le formulaire de modification « %s » doit répondre.', $section));
            }
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
     * Aucune section du jeu d'essai n'est retenue par une clé étrangère : chaque association
     * qui pointe vers une des 10 entités B/C porte `orphanRemoval: true` côté propriétaire
     * (voir le commentaire de DELETABLE_SECTIONS), donc Doctrine efface les lignes dépendantes
     * avant la ligne visée, dans l'ordre ci-dessus. Réserve : `Campaign::$characters` n'a que
     * `cascade: ['persist']`, sans `orphanRemoval` — si `BackOfficeFixture` en venait à
     * attacher `character` à `campaign` (ce qu'elle ne fait pas aujourd'hui), la suppression
     * de `campaign` échouerait alors sur la contrainte `character.campaign_id`.
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
     * Documente le constat inverse : si une section venait un jour à rejoindre
     * DELETION_REFUSED_SECTIONS, ce test garantit que sa suppression échoue bien (pas de
     * faux négatif silencieux) et rappelle quoi faire si elle se met à aboutir.
     */
    public function testSomeDeletionsAreRefusedByForeignKeys(): void
    {
        if ([] === self::DELETION_REFUSED_SECTIONS) {
            self::markTestSkipped('Aucune section n\'est retenue par une clé étrangère.');
        }

        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        foreach (self::DELETION_REFUSED_SECTIONS as $section) {
            $entity = $entities[self::FIXTURE_KEYS[$section] ?? $section];
            $status = $this->deleteAsAdmin($section, $entity->getId());

            self::assertNotSame(302, $status, sprintf('La suppression « %s » est censée être refusée ; si elle aboutit désormais, déplacer la section dans DELETABLE_SECTIONS.', $section));
        }
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
}
