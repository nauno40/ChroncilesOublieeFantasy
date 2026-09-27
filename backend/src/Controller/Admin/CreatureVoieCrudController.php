<?php

namespace App\Controller\Admin;

use App\Entity\CreatureVoie;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class CreatureVoieCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return CreatureVoie::class;
    }
}
