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

// Le test d'attaque ne suit pas les mêmes règles que le test de caractéristique : c'est la
// DEF de la cible qui sert de difficulté, et un 1 n'y est pas un échec automatique.
test('le lanceur jette un test d’attaque contre la DEF de la cible', async ({ page }) => {
    await register(page, uniqueEmail('atk'));
    await page.goto('/tools/dice');

    await page.click('[role=radio]:has-text("Attaque")');
    await page.fill('input[aria-label="Valeur d\'attaque"]', '5');
    await page.fill('input[aria-label="DEF de la cible"]', '16');
    await page.click('button:has-text("Tester")');

    const jet = page.locator('.glass-panel.p-2').first();
    await expect(jet).toContainText('Attaque d20+5');
    await expect(jet).toContainText('DEF 16');
    await expect(jet).toContainText(/Réussi|Échoué/);
});

// Les malus de tir dépendent de la situation, pas de la feuille : ils n'étaient rappelés
// nulle part. On vérifie qu'une condition chiffrée et une condition à dé malus se combinent.
test('les conditions de tir s’appliquent au test d’attaque', async ({ page }) => {
    await register(page, uniqueEmail('tir'));
    await page.goto('/tools/dice');

    await page.click('[role=radio]:has-text("Attaque")');
    await page.fill('input[aria-label="Valeur d\'attaque"]', '5');
    await page.fill('input[aria-label="DEF de la cible"]', '16');
    await page.click('button:has-text("Conditions de tir")');
    await page.click('label:has-text("Cible à couvert — fortement") input');
    await page.click('label:has-text("Longue portée") input');
    await page.click('button:has-text("Tester")');

    const jet = page.locator('.glass-panel.p-2').first();
    // La valeur d'attaque et le malus de situation restent lisibles séparément.
    await expect(jet).toContainText('Attaque d20+5');
    await expect(jet).toContainText('tir -5');
    // La longue portée impose un dé malus : deux d20 sont lancés.
    await expect(jet).toContainText(/\(\d+ \/ \d+\)/);
});
