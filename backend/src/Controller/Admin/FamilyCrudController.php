<?php

namespace App\Controller\Admin;

use App\Entity\Family;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class FamilyCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Family::class;
    }
}
