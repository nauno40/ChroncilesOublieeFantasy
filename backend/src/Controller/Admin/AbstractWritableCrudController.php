<?php

namespace App\Controller\Admin;

use App\Admin\Field\JsonField;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;

/**
 * Base des sections que l'administrateur peut créer et modifier.
 *
 * Les champs sont déduits des métadonnées Doctrine plutôt qu'énumérés à la main : une liste
 * écrite dans le contrôleur redit le schéma, vieillit en silence, et laisse invisible toute
 * colonne ajoutée ensuite. C'est ainsi que `RaceCrudController` a longtemps cité `title`,
 * un champ que l'entité n'a jamais eu.
 */
abstract class AbstractWritableCrudController extends AbstractCrudController
{
    public function __construct(protected readonly EntityManagerInterface $entityManager)
    {
    }

    public function configureFields(string $pageName): iterable
    {
        $metadata = $this->entityManager->getClassMetadata(static::getEntityFqcn());

        // Les champs par défaut d'EasyAdmin : les colonnes scalaires, sans les JSON, qu'il
        // exclut de ses quatre pages (voir FieldProvider::getDefaultFields()). Les colonnes
        // `float` sont écartées ici pour être reconstruites juste après avec une décimale :
        // COF2 emploie le demi-niveau (NC ½) pour ses adversaires les plus faibles, qu'un
        // champ entier tronquerait à la saisie.
        foreach (parent::configureFields($pageName) as $field) {
            $property = $field->getAsDto()->getProperty();

            if (\in_array($property, $metadata->getFieldNames(), true) && 'float' === $metadata->getTypeOfField($property)) {
                continue;
            }

            yield $field;
        }

        foreach ($metadata->getFieldNames() as $fieldName) {
            if ('float' === $metadata->getTypeOfField($fieldName)) {
                yield NumberField::new($fieldName)->setNumDecimals(1);
            }
        }

        foreach ($metadata->getAssociationNames() as $association) {
            // Les collections ne sont montrées qu'en détail : sur un formulaire, elles
            // chargeraient toute la table liée pour remplir une liste déroulante.
            if ($metadata->isSingleValuedAssociation($association) || Crud::PAGE_DETAIL === $pageName) {
                yield AssociationField::new($association);
            }
        }

        // Un JSON imbriqué n'a pas sa place dans une colonne de tableau.
        if (Crud::PAGE_INDEX === $pageName) {
            return;
        }

        $derived = $this->derivedJsonFields();
        foreach ($metadata->getFieldNames() as $fieldName) {
            if ('json' !== $metadata->getTypeOfField($fieldName)) {
                continue;
            }

            $field = JsonField::new($fieldName);
            if (\in_array($fieldName, $derived, true)) {
                $field->setFormTypeOption('disabled', true);
            }

            yield $field;
        }
    }

    /**
     * Colonnes JSON dérivées par le code : affichées, jamais saisies.
     *
     * @return string[]
     */
    protected function derivedJsonFields(): array
    {
        return [];
    }
}
