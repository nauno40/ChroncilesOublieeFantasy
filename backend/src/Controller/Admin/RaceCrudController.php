<?php

namespace App\Controller\Admin;

use App\Entity\Race;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class RaceCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Race::class;
    }
}
