<?php

namespace App\Controller\Admin;

use App\Entity\Clue;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class ClueCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return Clue::class;
    }
}
