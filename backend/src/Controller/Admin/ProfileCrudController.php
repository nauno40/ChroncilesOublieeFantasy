<?php

namespace App\Controller\Admin;

use App\Entity\Profile;

class ProfileCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Profile::class;
    }
}
