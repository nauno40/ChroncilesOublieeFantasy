<?php

namespace App\Controller\Admin;

use App\Entity\CreatureFamily;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class CreatureFamilyCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return CreatureFamily::class;
    }
}
