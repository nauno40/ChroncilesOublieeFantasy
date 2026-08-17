<?php

namespace App\Controller\Admin;

use App\Entity\HomebrewEntry;

class HomebrewEntryCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return HomebrewEntry::class;
    }
}
