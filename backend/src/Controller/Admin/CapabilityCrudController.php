<?php

namespace App\Controller\Admin;

use App\Entity\Capability;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ArrayField;

class CapabilityCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Capability::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id')->hideOnForm(),
            TextField::new('name'),
            TextEditorField::new('description'),
            IntegerField::new('rank'),
            AssociationField::new('voie'),
            BooleanField::new('isSpell'),
            TextField::new('actionType'),
            BooleanField::new('limited'),
            ArrayField::new('effect'),
        ];
    }
}
