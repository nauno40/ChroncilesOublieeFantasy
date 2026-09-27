<?php

namespace App\Service;

use App\Entity\Comment;
use App\Entity\ContentReport;
use App\Entity\CustomCreature;
use App\Entity\Favorite;
use App\Entity\HomebrewEntry;
use App\Entity\User;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

/**
 * Notifications par e-mail liées à l'activité communautaire (jalon C) : nouveau
 * commentaire ou favori sur son propre contenu, signalement traité. Mêmes conventions
 * que PasswordResetController/EmailVerificationController — `Email` brut (from/to/
 * subject/text/html), pas de moteur de gabarits, `MAILER_FROM`/`FRONTEND_URL` déjà en
 * config.
 *
 * Best-effort : un échec d'envoi (SMTP en panne) ne doit jamais faire échouer l'action
 * qui le déclenche (commenter, mettre en favori, traiter un signalement) — attrapé et
 * journalisé plutôt que de renvoyer une 500 sur un POST/PATCH par ailleurs réussi.
 * Pas de préférence de désabonnement pour l'instant (aucune infrastructure de
 * préférences n'existe sur `User`) — à ajouter si le volume devient gênant.
 */
final readonly class NotificationMailer
{
    public function __construct(
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        #[Autowire('%env(FRONTEND_URL)%')] private string $frontendUrl,
        #[Autowire('%env(MAILER_FROM)%')] private string $mailerFrom,
    ) {
    }

    public function notifyNewComment(Comment $comment, HomebrewEntry|CustomCreature $target): void
    {
        $owner = $target->getOwner();
        // Ni l'auteur du contenu qui se répond à lui-même, ni un propriétaire orphelin.
        if (null === $owner || $owner->getId() === $comment->getAuthor()?->getId()) {
            return;
        }

        $name = $target->getName();
        $link = $this->contentLink($target);
        $auteur = $comment->getAuthor()?->getPseudo() ?? 'Quelqu\'un';

        $this->send(
            $owner,
            sprintf('Nouveau commentaire sur « %s »', $name),
            sprintf(
                "Bonjour,\n\n%s a commenté « %s » :\n\n« %s »\n\nVoir : %s",
                $auteur,
                $name,
                $comment->getContent(),
                $link
            ),
            sprintf(
                '<p>Bonjour,</p><p><strong>%s</strong> a commenté « %s » :</p><blockquote>%s</blockquote><p><a href="%s">Voir le commentaire</a></p>',
                htmlspecialchars($auteur),
                htmlspecialchars($name),
                nl2br(htmlspecialchars($comment->getContent())),
                htmlspecialchars($link)
            )
        );
    }

    public function notifyNewFavorite(Favorite $favorite, HomebrewEntry|CustomCreature $target): void
    {
        $owner = $target->getOwner();
        if (null === $owner) {
            return;
        }

        $name = $target->getName();
        $link = $this->contentLink($target);
        $auteur = $favorite->getUser()?->getPseudo() ?? 'Quelqu\'un';

        $this->send(
            $owner,
            sprintf('« %s » a un nouveau favori', $name),
            sprintf("Bonjour,\n\n%s a ajouté « %s » à ses favoris.\n\nVoir : %s", $auteur, $name, $link),
            sprintf(
                '<p>Bonjour,</p><p><strong>%s</strong> a ajouté « %s » à ses favoris.</p><p><a href="%s">Voir la fiche</a></p>',
                htmlspecialchars($auteur),
                htmlspecialchars($name),
                htmlspecialchars($link)
            )
        );
    }

    public function notifyReportResolved(ContentReport $report): void
    {
        $reporter = $report->getReporter();
        if (null === $reporter) {
            return;
        }

        $statusLabel = 'resolved' === $report->getStatus() ? 'traité' : 'classé sans suite';

        $this->send(
            $reporter,
            'Votre signalement a été traité',
            sprintf(
                "Bonjour,\n\nLe signalement que vous avez envoyé le %s a été %s par un administrateur.\n\nMerci pour votre vigilance.",
                $report->getCreatedAt()?->format('d/m/Y') ?? '',
                $statusLabel
            ),
            sprintf(
                '<p>Bonjour,</p><p>Le signalement que vous avez envoyé le %s a été <strong>%s</strong> par un administrateur.</p><p>Merci pour votre vigilance.</p>',
                htmlspecialchars($report->getCreatedAt()?->format('d/m/Y') ?? ''),
                htmlspecialchars($statusLabel)
            )
        );
    }

    private function contentLink(HomebrewEntry|CustomCreature $target): string
    {
        $path = $target instanceof HomebrewEntry
            ? '/homebrew/'.$target->getId()
            : '/creatures/maison/'.$target->getId();

        return rtrim($this->frontendUrl, '/').$path;
    }

    private function send(User $to, string $subject, string $text, string $html): void
    {
        $email = $to->getEmail();
        if (null === $email) {
            return;
        }

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->mailerFrom)
                    ->to($email)
                    ->subject($subject)
                    ->text($text)
                    ->html($html)
            );
        } catch (TransportExceptionInterface $e) {
            $this->logger->warning('Échec d\'envoi d\'une notification e-mail communautaire.', ['exception' => $e]);
        }
    }
}
