<?php

namespace App\Controller\Admin;

use App\Entity\Character;

class CharacterCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return Character::class;
    }
}
