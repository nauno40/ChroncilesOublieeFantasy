<?php

namespace App\Tests\Service;

use App\Entity\Comment;
use App\Entity\ContentReport;
use App\Entity\Favorite;
use App\Entity\HomebrewEntry;
use App\Entity\User;
use App\Service\NotificationMailer;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

/**
 * `NotificationMailer` est testée seule (mailer/logger mockés), pas via les processeurs
 * qui l'appellent : ce qui compte ici, ce sont ses propres garde-fous (pas de notification
 * pour un auto-commentaire, best-effort sur un échec de transport), déjà exercés
 * indirectement par CommentSecurityTest/FavoriteSecurityTest/ContentReportSecurityTest
 * (qui, eux, vérifient le comportement HTTP, pas le contenu de l'e-mail).
 */
final class NotificationMailerTest extends TestCase
{
    private function makeUser(string $email, string $pseudo): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setPseudo($pseudo);

        // `getId()` n'a pas de setter public : un ReflectionProperty est le seul moyen de
        // distinguer deux users en mémoire (comparaison faite par NotificationMailer).
        static $nextId = 1;
        $ref = new \ReflectionProperty(User::class, 'id');
        $ref->setValue($user, $nextId++);

        return $user;
    }

    private function makeEntry(User $owner): HomebrewEntry
    {
        $entry = new HomebrewEntry();
        $entry->setOwner($owner);
        $entry->setCategory('sort');
        $entry->setName('Sort de test');

        $ref = new \ReflectionProperty(HomebrewEntry::class, 'id');
        $ref->setValue($entry, 42);

        return $entry;
    }

    public function testNeNotifiePasUnCommentaireSurSonProprePropreContenu(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $owner = $this->makeUser('owner@example.com', 'Owner');
        $entry = $this->makeEntry($owner);
        $comment = (new Comment())->setAuthor($owner)->setTargetType('homebrew_entry')->setTargetId(42)->setContent('Bravo moi-même');

        (new NotificationMailer($mailer, $this->createStub(LoggerInterface::class), 'http://localhost:5173', 'no-reply@example.com'))
            ->notifyNewComment($comment, $entry);
    }

    public function testNotifieLePropretaireDuContenuCommente(): void
    {
        $owner = $this->makeUser('owner@example.com', 'Owner');
        $entry = $this->makeEntry($owner);
        $auteur = $this->makeUser('auteur@example.com', 'Alice');
        $comment = (new Comment())->setAuthor($auteur)->setTargetType('homebrew_entry')->setTargetId(42)->setContent('Bravo !');

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send')->with($this->callback(
            fn (Email $email) => 'owner@example.com' === $email->getTo()[0]->getAddress()
                && str_contains($email->getTextBody(), 'Bravo !')
        ));

        (new NotificationMailer($mailer, $this->createStub(LoggerInterface::class), 'http://localhost:5173', 'no-reply@example.com'))
            ->notifyNewComment($comment, $entry);
    }

    public function testNeNotifiePasUnFavoriSansProprietaire(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $entry = new HomebrewEntry(); // pas de owner
        $entry->setCategory('sort');
        $entry->setName('Orphelin');
        $favori = (new Favorite())->setUser($this->makeUser('quelquun@example.com', 'Quelqu’un'))->setTargetType('homebrew_entry')->setTargetId(1);

        (new NotificationMailer($mailer, $this->createStub(LoggerInterface::class), 'http://localhost:5173', 'no-reply@example.com'))
            ->notifyNewFavorite($favori, $entry);
    }

    public function testNotifieLeDeclarantQuandUnSignalementEstTraite(): void
    {
        $declarant = $this->makeUser('declarant@example.com', 'Déclarant');
        $report = (new ContentReport())
            ->setReporter($declarant)
            ->setTargetType('homebrew_entry')
            ->setTargetId(1)
            ->setReason('Contenu problématique')
            ->setStatus('resolved')
            ->setCreatedAt(new \DateTimeImmutable('2026-09-27'));

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send')->with($this->callback(
            fn (Email $email) => 'declarant@example.com' === $email->getTo()[0]->getAddress()
        ));

        (new NotificationMailer($mailer, $this->createStub(LoggerInterface::class), 'http://localhost:5173', 'no-reply@example.com'))
            ->notifyReportResolved($report);
    }

    public function testUnEchecDeTransportEstAvaleEtJournaliseSansPropager(): void
    {
        $owner = $this->makeUser('owner@example.com', 'Owner');
        $entry = $this->makeEntry($owner);
        $auteur = $this->makeUser('auteur@example.com', 'Alice');
        $comment = (new Comment())->setAuthor($auteur)->setTargetType('homebrew_entry')->setTargetId(42)->setContent('Bravo !');

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send')->willThrowException(new TransportException('SMTP en panne'));

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())->method('warning');

        // Ne doit lever aucune exception : un SMTP en panne ne doit jamais faire échouer
        // l'action qui déclenche la notification (ici, poster un commentaire).
        (new NotificationMailer($mailer, $logger, 'http://localhost:5173', 'no-reply@example.com'))
            ->notifyNewComment($comment, $entry);
    }
}
