<?php

namespace App\Controller\Admin;

use App\Entity\Poison;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class PoisonCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Poison::class;
    }
}
