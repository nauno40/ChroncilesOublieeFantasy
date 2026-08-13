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
            // `effect` n'est PAS affiché, et ce n'est pas une omission : c'est un JSON
            // imbriqué (`bonuses`, `armorCap`, `choiceOptions`, `evolutiveDie`) que
            // `CapabilityEffectBuilder` DÉRIVE de la description au chargement des
            // fixtures — une donnée écrite par la machine, pas saisie par un humain.
            // `ArrayField` le rendait en « Array to string conversion » (500), et un champ
            // texte est refusé par EasyAdmin avant tout formatage. Le modifier à la main
            // serait de toute façon écrasé au prochain chargement.
        ];
    }
}
