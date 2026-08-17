<?php

namespace App\Controller\Admin;

use App\Entity\CharacterVoie;

class CharacterVoieCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return CharacterVoie::class;
    }
}
