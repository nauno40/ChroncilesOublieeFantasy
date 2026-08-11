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
        // Le compteur a quitté le sous-titre de page pour la barre de recherche, où il
        // décrit ce que le filtrage a retenu (cf. plan de cohérence, phase 3).
        await expect(page.getByText(/\d+ peuples?/i)).toBeVisible();
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

// Le sélecteur « Filtrer par classe » de la page Voies ne proposait AUCUNE classe : il
// lisait `voie.profileId`, que l'API ne sert pas. La relation existe dans l'autre sens,
// sur les voies de chaque profil.
test('le filtre par classe des voies propose les classes et filtre vraiment', async ({ page }) => {
    await register(page, uniqueEmail('classe'));
    await page.goto('/voies');

    await expect(page.getByText(/\d+ voies/)).toBeVisible({ timeout: 20_000 });
    const selecteur = page.getByLabel('Filtrer par classe');
    // Quatorze classes plus l'option « toutes » : le sélecteur n'en avait qu'une.
    await expect(selecteur.locator('option')).toHaveCount(15);

    await selecteur.selectOption({ label: 'Arquebusier' });
    // Un profil COF2 a cinq voies : le compte doit chuter, pas rester à 130.
    await expect(page.getByText('5 voies')).toBeVisible();
});
