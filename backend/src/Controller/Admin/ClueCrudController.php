<?php

namespace App\Controller\Admin;

use App\Entity\Clue;

class ClueCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return Clue::class;
    }
}
