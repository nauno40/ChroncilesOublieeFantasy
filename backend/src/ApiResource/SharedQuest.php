<?php

namespace App\ApiResource;

use Symfony\Component\Serializer\Annotation\Groups;

/** Quête partagée par le MJ, telle que vue par un joueur (sans statut interne). */
final class SharedQuest
{
    #[Groups(['shared_campaign:read'])]
    public ?int $id = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $title = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $description = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $type = null;
}
