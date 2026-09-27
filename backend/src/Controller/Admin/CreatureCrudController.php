<?php

namespace App\Controller\Admin;

use App\Entity\Creature;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class CreatureCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Creature::class;
    }
}
