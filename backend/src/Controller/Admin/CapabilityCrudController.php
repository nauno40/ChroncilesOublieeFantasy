<?php

namespace App\Controller\Admin;

use App\Entity\Capability;

class CapabilityCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Capability::class;
    }

    /**
     * `effect` est un JSON dérivé de la description par `CapabilityEffectBuilder` au
     * chargement des fixtures. On l'affiche pour pouvoir le vérifier ; le saisir n'aurait
     * pas de sens, la valeur serait écrasée au chargement suivant.
     */
    protected function derivedJsonFields(): array
    {
        return ['effect'];
    }
}
