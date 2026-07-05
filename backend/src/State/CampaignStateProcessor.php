<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Campaign;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class CampaignStateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security,
        private \App\Service\InviteCodeGenerator $inviteCodeGenerator,
    ) {
    }

    /**
     * @param Campaign $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data instanceof Campaign && null === $data->getOwner()) {
            $user = $this->security->getUser();
            if ($user) {
                $data->setOwner($user);
            }
        }

        if ($data instanceof Campaign && null === $data->getInviteCode()) {
            $data->setInviteCode($this->inviteCodeGenerator->generate());
        }

        // Handle timestamps manually if not using Gedmo/Stof
        if ($data instanceof Campaign) {
            $data->setUpdatedAt(new \DateTime());
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
