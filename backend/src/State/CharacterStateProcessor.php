<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Character;
use App\Repository\CampaignMembershipRepository;
use App\Repository\CampaignRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final readonly class CharacterStateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security,
        private CampaignMembershipRepository $memberships,
        private CampaignRepository $campaigns,
    ) {
    }

    /**
     * @param Character $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $user = $this->security->getUser();

        if ($data instanceof Character && null === $data->getOwner()) {
            if ($user) {
                $data->setOwner($user);
            }
        }

        // Rattachement par identifiant (le membre ne peut pas résoudre l'IRI d'une campagne
        // owner-scopée) : on résout la campagne côté serveur, hors du scope propriétaire.
        if (null !== $data->getCampaignId()) {
            $campaign = $this->campaigns->find($data->getCampaignId());
            if (null === $campaign) {
                throw new NotFoundHttpException('Campagne introuvable.');
            }
            $data->setCampaign($campaign);
        }

        // On ne peut rattacher une fiche qu'à une campagne dont on est MJ ou membre.
        $campaign = $data->getCampaign();
        if (null !== $campaign && null !== $user) {
            $isOwner = $campaign->getOwner()?->getId() === $user->getId();
            $isMember = null !== $this->memberships->findOneByCampaignAndPlayer($campaign, $user);
            if (!$isOwner && !$isMember) {
                throw new AccessDeniedHttpException('Vous ne pouvez rattacher une fiche qu\'à une campagne que vous avez rejointe.');
            }
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
