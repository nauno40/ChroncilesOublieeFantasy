<?php

namespace App\Controller\Admin;

use App\Entity\Voie;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class VoieCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Voie::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id')->hideOnForm(),
            TextField::new('name'),
            TextEditorField::new('description'),
            TextField::new('category'),
            AssociationField::new('profile'),
            // `Voie::$races` est une collection ManyToMany ; `race` n'existe pas et faisait
            // répondre 500 à la page entière.
            AssociationField::new('races'),
            IntegerField::new('maxRank'),
        ];
    }
}
