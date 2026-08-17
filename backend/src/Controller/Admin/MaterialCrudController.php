<?php

namespace App\Controller\Admin;

use App\Entity\Material;

class MaterialCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Material::class;
    }
}
