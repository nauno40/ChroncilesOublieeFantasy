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

    private function requestAsAdmin(string $path): string
    {
        $this->client->request('GET', $path, [
            'auth_basic' => ['admin@example.com', 'password'],
        ]);

        return $this->client->getKernelBrowser()->getResponse()->getContent();
    }
}
