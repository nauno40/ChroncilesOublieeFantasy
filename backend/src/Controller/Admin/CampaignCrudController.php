<?php

namespace App\Controller\Admin;

use App\Entity\Campaign;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class CampaignCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return Campaign::class;
    }
}
