import { test, expect } from '@playwright/test';
import { register, uniqueEmail } from './fixtures';

// Le lanceur ne savait faire que des `xdy+z` : ni dé malus, ni difficulté, alors que les
// états préjudiciables du compendium DÉCLARENT un dé malus. On vérifie ici le câblage —
// la règle elle-même est couverte par `domain/rules/test.test.ts`.
test('le lanceur jette un test COF2 avec dé malus et difficulté', async ({ page }) => {
    await register(page, uniqueEmail('des'));
    await page.goto('/tools/dice');

    await page.fill('input[aria-label="Valeur de caractéristique"]', '3');
    await page.selectOption('select[aria-label="Difficulté"]', '15');
    await page.click('[role=radio]:has-text("Dé malus")');
    await page.click('button:has-text("Tester")');

    const jet = page.locator('.glass-panel.p-2').first();
    await expect(jet).toContainText('DIF 15');
    // Un dé malus fait lancer DEUX d20 : le détail les montre tous les deux.
    await expect(jet).toContainText(/\(\d+ \/ \d+\)/);
    await expect(jet).toContainText(/Réussi|Échoué/);
});
