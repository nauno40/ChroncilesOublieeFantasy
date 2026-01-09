<?php

namespace App\Controller\Admin;

use App\Entity\Creature;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ArrayField;

class CreatureCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Creature::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id')->hideOnForm(),
            TextField::new('name'),
            TextEditorField::new('description'),
            AssociationField::new('family'),
            IntegerField::new('nc'),
            IntegerField::new('hp'),
            IntegerField::new('def'),
            IntegerField::new('init'),
            ArrayField::new('stats'),
            ArrayField::new('specialAbilities'),
        ];
    }
}
