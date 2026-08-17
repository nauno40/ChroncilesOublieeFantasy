<?php

namespace App\Controller\Admin;

use App\Entity\Campaign;

class CampaignCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return Campaign::class;
    }
}
