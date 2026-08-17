<?php

namespace App\Controller\Admin;

use App\Entity\CampaignMembership;

class CampaignMembershipCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return CampaignMembership::class;
    }
}
