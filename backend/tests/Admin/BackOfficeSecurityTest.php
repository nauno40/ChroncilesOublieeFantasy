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
        'creature-family', 'creature', 'equipment',
    ];

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

            if (isset($entities[$section])) {
                $this->requestAsAdmin(sprintf('/admin/%s/%d/edit', $section, $entities[$section]->getId()));
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
