<?php

namespace App\Controller\Admin;

use App\Entity\Voie;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class VoieCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Voie::class;
    }
}
