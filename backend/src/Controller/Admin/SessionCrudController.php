<?php

namespace App\Controller\Admin;

use App\Entity\Session;

class SessionCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return Session::class;
    }
}
