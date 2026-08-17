<?php

namespace App\Controller\Admin;

use App\Entity\Quest;

class QuestCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return Quest::class;
    }
}
