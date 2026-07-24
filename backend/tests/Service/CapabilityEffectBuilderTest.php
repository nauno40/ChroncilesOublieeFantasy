<?php

namespace App\Tests\Service;

use App\Service\CapabilityEffectBuilder;
use PHPUnit\Framework\TestCase;

/**
 * Teste le builder d'effets de capacité en isolation (métier pur : ni DB, ni fixtures, ni entité).
 */
final class CapabilityEffectBuilderTest extends TestCase
{
    private CapabilityEffectBuilder $builder;

    protected function setUp(): void
    {
        $this->builder = new CapabilityEffectBuilder();
    }

    public function testDetecteLeDeEvolutifDansLaDescription(): void
    {
        $this->assertSame(['count' => 1], $this->builder->buildEffect('X', 'inflige 1d4° DM')['evolutiveDie']);
        $this->assertSame(['count' => 2], $this->builder->buildEffect('X', 'inflige 2d4° DM')['evolutiveDie']);
        // « d4° » sans chiffre → count 1
        $this->assertSame(['count' => 1], $this->builder->buildEffect('X', 'd4° de dégâts')['evolutiveDie']);
    }

    public function testFusionneBonusArmorCapChoiceOptionsParNom(): void
    {
        $effect = $this->builder->buildEffect('Réflexes éclair', 'passif');
        $this->assertSame('init', $effect['bonuses'][0]['target']);
        $this->assertSame(3, $effect['bonuses'][0]['value']);

        $this->assertSame(7, $this->builder->buildEffect('Autorité naturelle', '')['armorCap']);

        $tattoo = $this->builder->buildEffect('Tatouages', '');
        $this->assertCount(7, $tattoo['choiceOptions']);
        $this->assertSame(['carac' => 'CON', 'value' => 3], $tattoo['choiceOptions'][1]['caracTestBonus']);
    }

    public function testRenvoieNullSiAucunEffet(): void
    {
        $this->assertNull($this->builder->buildEffect('Capacité banale', 'une description sans dé ni bonus'));
        $this->assertNull($this->builder->buildEffect('Capacité banale', null));
    }

    public function testCombineDeEvolutifEtTable(): void
    {
        $effect = $this->builder->buildEffect('Réflexes éclair', 'inflige 1d4°');
        $this->assertArrayHasKey('evolutiveDie', $effect);
        $this->assertArrayHasKey('bonuses', $effect);
    }
}
