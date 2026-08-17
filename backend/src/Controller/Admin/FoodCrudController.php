<?php

namespace App\Controller\Admin;

use App\Entity\Food;

class FoodCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Food::class;
    }
}
