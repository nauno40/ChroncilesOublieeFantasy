<?php

namespace App\Controller\Admin;

use App\Entity\HarmfulState;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class HarmfulStateCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return HarmfulState::class;
    }
}
