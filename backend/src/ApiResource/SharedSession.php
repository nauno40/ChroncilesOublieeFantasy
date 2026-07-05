<?php

namespace App\ApiResource;

use Symfony\Component\Serializer\Annotation\Groups;

/** Résumé d'une séance, tel que vu par un joueur. */
final class SharedSession
{
    #[Groups(['shared_campaign:read'])]
    public ?int $id = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $title = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $date = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $summary = null;
}
