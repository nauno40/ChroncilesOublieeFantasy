<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\ContentReport;
use App\Service\NotificationMailer;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Pose le déclarant et l'horodatage à la création (jamais fournis par le client), et
 * l'auteur + l'horodatage de traitement dès qu'un ROLE_ADMIN fait sortir le signalement
 * de son statut `pending` — sans quoi rien ne dit qui a traité un signalement ni quand.
 * Prévient aussi le déclarant par e-mail à ce même moment (une seule fois : la garde sur
 * `resolvedAt` déjà nul empêche un re-déclenchement si le statut est repatché ensuite).
 */
final readonly class ContentReportStateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security,
        private NotificationMailer $notificationMailer,
    ) {
    }

    /**
     * @param ContentReport $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $justResolved = false;
        if ($operation instanceof Post) {
            $data->setReporter($this->security->getUser());
            $data->setStatus('pending');
            $data->setCreatedAt(new \DateTimeImmutable());
        }

        if ($operation instanceof Patch && 'pending' !== $data->getStatus() && null === $data->getResolvedAt()) {
            $data->setResolvedBy($this->security->getUser());
            $data->setResolvedAt(new \DateTimeImmutable());
            $justResolved = true;
        }

        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        if ($justResolved) {
            $this->notificationMailer->notifyReportResolved($data);
        }

        return $result;
    }
}
