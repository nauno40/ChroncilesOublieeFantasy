<?php

namespace App\Service;

use App\Entity\Capability;

/**
 * Construit la donnée `Capability.effect` exploitée par le moteur de règles du front :
 * dé évolutif (« Nd4° » détecté dans la description) + bonus de combat / plafond d'armure /
 * options de choix structurés, indexés par nom de capacité (données de règles COF2).
 *
 * Extrait de `AppFixtures` pour séparer le métier (ces règles/données) du chargeur de
 * fixtures (technique). Testable en isolation via `buildEffect()` (sans DB ni entité).
 */
final class CapabilityEffectBuilder
{
    /**
     * Bonus de combat structurés par nom de capacité (spec effect.bonuses, fidélité).
     * Évalués côté front au rang courant de la voie.
     */
    private const COMBAT_BONUSES = [
        'Réflexes éclair' => [
            ['target' => 'init', 'scalesWith' => 'fixed', 'value' => 3],
            ['target' => 'def', 'scalesWith' => 'threshold', 'thresholds' => [
                ['minRank' => 1, 'value' => 1], ['minRank' => 5, 'value' => 2],
            ]],
        ],
        'Murmures dans le vent' => [
            ['target' => 'init', 'scalesWith' => 'fixed', 'value' => 1],
            ['target' => 'def', 'scalesWith' => 'fixed', 'value' => 1],
        ],
        'Divination' => [
            ['target' => 'init', 'scalesWith' => 'threshold', 'thresholds' => [
                ['minRank' => 1, 'value' => 1], ['minRank' => 3, 'value' => 2], ['minRank' => 5, 'value' => 3],
            ]],
            ['target' => 'def', 'scalesWith' => 'threshold', 'thresholds' => [
                ['minRank' => 1, 'value' => 1], ['minRank' => 3, 'value' => 2], ['minRank' => 5, 'value' => 3],
            ]],
        ],
        'Peau de pierre' => [
            ['target' => 'def', 'scalesWith' => 'threshold', 'thresholds' => [
                ['minRank' => 1, 'value' => 1], ['minRank' => 4, 'value' => 2],
            ]],
        ],
        'Armure de vent' => [
            ['target' => 'def', 'scalesWith' => 'fixed', 'value' => 1],
        ],
    ];

    /** DEF max d'armure ouverte par une capacité (spec : plafond relevé). */
    /**
     * Capacités qui RELÈVENT le plafond d'armure de leur profil, avec la DEF de l'armure
     * qu'elles autorisent. Seule « Autorité naturelle » y figurait ; les trois autres cas
     * du livre manquaient, si bien qu'un barbare de rang 2 en chemise de mailles voyait
     * ses capacités de barbare annoncées inutilisables alors que Tour de force les lui
     * rend précisément accessibles.
     *
     * Les apostrophes sont typographiques : ce sont celles des données servies.
     */
    private const ARMOR_CAP_BY_CAPABILITY = [
        // Chevalier rang 3 : formation à la plaque complète.
        'Autorité naturelle' => 7,
        // Barbare rang 2 : « le barbare peut désormais porter une chemise de mailles et
        // utiliser toutes les capacités des voies de barbare auparavant autorisées avec
        // une armure de cuir renforcé ».
        'Tour de force' => 4,
        // Barbare rang 5 : la cotte de mailles, même formulation.
        'Briseur d’os' => 5,
    ];

    /**
     * Volontairement ABSENT de la table ci-dessus : « Vêtements sacrés » (prêtre, rang 1).
     *
     * Le livre écrit « éventuellement, si le prêtre prie une divinité guerrière, il PEUT
     * CHOISIR d'obtenir la maîtrise de la cotte de mailles ». C'est une option ouverte au
     * joueur, pas un acquis du rang : la poser pour tous les prêtres autoriserait la cotte
     * de mailles à ceux qui ne l'ont pas prise. Elle relève des capacités à choix
     * (`choiceOptions`), qui demandent un choix enregistré sur le personnage — à traiter
     * quand ce choix existera, plutôt que de trancher à la place du livre.
     */

    /** Options structurées des capacités à choix (spec #6a : bonus aux tests de carac). */
    private const CHOICE_OPTIONS_BY_CAPABILITY = [
        'Tatouages' => [
            ['label' => 'Taureau (+3 FOR)',  'caracTestBonus' => ['carac' => 'FOR', 'value' => 3]],
            ['label' => 'Ours (+3 CON)',     'caracTestBonus' => ['carac' => 'CON', 'value' => 3]],
            ['label' => 'Panthère (+3 AGI)', 'caracTestBonus' => ['carac' => 'AGI', 'value' => 3]],
            ['label' => 'Chouette (+3 PER)', 'caracTestBonus' => ['carac' => 'PER', 'value' => 3]],
            ['label' => 'Loup (+3 CHA)',     'caracTestBonus' => ['carac' => 'CHA', 'value' => 3]],
            ['label' => 'Renard (+3 INT)',   'caracTestBonus' => ['carac' => 'INT', 'value' => 3]],
            ['label' => 'Serpent (+3 VOL)',  'caracTestBonus' => ['carac' => 'VOL', 'value' => 3]],
        ],
        'Armure lourde' => [
            ['label' => '+1 DEF', 'bonuses' => [['target' => 'def', 'scalesWith' => 'fixed', 'value' => 1]]],
            ['label' => 'Armure de plaque (DEF +6)', 'armorCap' => 6],
        ],
        // Octroi de capacité (#6, traits de peuple) : choix contraint parmi les profils autorisés.
        // Labels seuls, sans payload : enregistrement/guide, pas de dérivation d'effet (tranche ultérieure).
        'Talent pour la violence' => [ // Demi-orque
            ['label' => 'Barbare (Rang 1)'], ['label' => 'Guerrier (Rang 1)'],
        ],
        'Talent pour la magie' => [ // Elfe haut
            ['label' => 'Magicien (Rang 1 ou 2)'], ['label' => 'Ensorceleur (Rang 1 ou 2)'],
        ],
        'Enfant de la forêt' => [ // Elfe sylvain
            ['label' => 'Druide (Rang 1)'], ['label' => 'Rôdeur (Rang 1)'],
        ],
        'Don étrange' => [ // Gnome
            ['label' => 'Ensorceleur (Rang 1)'],
        ],
        'Touche-à-tout' => [ // Humain
            ['label' => "N'importe quel profil (Rang 1 ou 2)"],
        ],
    ];

    /**
     * Construit l'effet d'une capacité à partir de son nom + sa description :
     * dé évolutif « Nd4° » (spec §6.4) + bonus/armorCap/choiceOptions indexés par nom.
     * Renvoie null si aucun effet (pour ne pas poser un `effect` vide). Fonction pure.
     */
    public function buildEffect(string $name, ?string $description): ?array
    {
        $effect = [];
        if (preg_match('/(\d*)d4°/u', (string) $description, $m)) {
            $effect['evolutiveDie'] = ['count' => $m[1] === '' ? 1 : (int) $m[1]];
        }
        if (isset(self::COMBAT_BONUSES[$name])) {
            $effect['bonuses'] = self::COMBAT_BONUSES[$name];
        }
        if (isset(self::ARMOR_CAP_BY_CAPABILITY[$name])) {
            $effect['armorCap'] = self::ARMOR_CAP_BY_CAPABILITY[$name];
        }
        if (isset(self::CHOICE_OPTIONS_BY_CAPABILITY[$name])) {
            $effect['choiceOptions'] = self::CHOICE_OPTIONS_BY_CAPABILITY[$name];
        }
        return $effect === [] ? null : $effect;
    }

    /** Applique l'effet construit à la capacité (ne fait rien si aucun effet). */
    public function apply(Capability $c): void
    {
        $effect = $this->buildEffect((string) $c->getName(), $c->getDescription());
        if ($effect !== null) {
            $c->setEffect($effect);
        }
    }
}
