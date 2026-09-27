<?php

namespace App\Controller\Admin;

use App\Entity\CharacterVoie;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class CharacterVoieCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return CharacterVoie::class;
    }
}
