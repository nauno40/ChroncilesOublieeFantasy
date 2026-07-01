import { test, expect, register, uniqueEmail } from './fixtures';

test.describe('Compendium (données depuis la BDD)', () => {
    test.beforeEach(async ({ page }) => {
        await register(page, uniqueEmail('compendium'));
    });

    test('/races liste les races seedées', async ({ page }) => {
        await page.goto('/races');

        // Les cartes de race sont des liens vers /races/:id (le lien de nav est /races, non matché).
        const cards = page.locator('a[href^="/races/"]');
        await expect.poll(() => cards.count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(8);
        await expect(page.getByText(/races? trouvée/i)).toBeVisible();
    });

    test('/classes et /bestiary chargent sans erreur API', async ({ page }) => {
        const apiErrors: string[] = [];
        page.on('response', (r) => {
            if (r.url().includes('/api/') && r.status() >= 400) {
                apiErrors.push(`${r.status()} ${r.url()}`);
            }
        });

        await page.goto('/classes');
        await expect(page.locator('a[href^="/classes/"]').first()).toBeVisible({ timeout: 15_000 });

        await page.goto('/bestiary');
        await expect(page.locator('a[href^="/bestiary/"]').first()).toBeVisible({ timeout: 15_000 });

        expect(apiErrors, `Erreurs API rencontrées : ${apiErrors.join(', ')}`).toEqual([]);
    });
});
