<?php

namespace App\ApiResource;

use Symfony\Component\Serializer\Annotation\Groups;

/** Indice partagé par le MJ, tel que vu par un joueur. */
final class SharedClue
{
    #[Groups(['shared_campaign:read'])]
    public ?int $id = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $content = null;
}
