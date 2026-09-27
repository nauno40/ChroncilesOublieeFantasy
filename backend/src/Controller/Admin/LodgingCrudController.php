<?php

namespace App\Controller\Admin;

use App\Entity\Lodging;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class LodgingCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Lodging::class;
    }
}
