<?php

namespace App\Controller\Admin;

use App\Entity\Trap;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class TrapCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Trap::class;
    }
}
