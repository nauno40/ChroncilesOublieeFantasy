<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\JoinCampaignInput;
use App\ApiResource\SharedCampaign;
use App\Entity\CampaignMembership;
use App\Factory\SharedCampaignFactory;
use App\Repository\CampaignMembershipRepository;
use App\Repository\CampaignRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Rejoindre une campagne par code d'invitation. Idempotent.
 *
 * @implements ProcessorInterface<JoinCampaignInput, SharedCampaign>
 */
final readonly class JoinCampaignProcessor implements ProcessorInterface
{
    public function __construct(
        private Security $security,
        private CampaignRepository $campaigns,
        private CampaignMembershipRepository $memberships,
        private EntityManagerInterface $em,
        private SharedCampaignFactory $factory,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): SharedCampaign
    {
        $code = trim((string) ($data->code ?? ''));
        $campaign = '' === $code ? null : $this->campaigns->findOneBy(['inviteCode' => $code]);
        if (null === $campaign) {
            throw new NotFoundHttpException('Code d\'invitation invalide.');
        }

        $user = $this->security->getUser();
        if ($campaign->getOwner()?->getId() === $user->getId()) {
            throw new BadRequestHttpException('Vous êtes déjà le MJ de cette campagne.');
        }

        if (null === $this->memberships->findOneByCampaignAndPlayer($campaign, $user)) {
            $membership = new CampaignMembership();
            $membership->setCampaign($campaign);
            $membership->setPlayer($user);
            $this->em->persist($membership);
            $this->em->flush();
        }

        return $this->factory->fromCampaign($campaign);
    }
}
