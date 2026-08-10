import { test, expect, register, uniqueEmail } from './fixtures';

// Les trois onglets d'une page de type doivent se parcourir de la même façon : même
// invite de recherche, même mot pour compter, mêmes filtres. Le communautaire disait
// « Rechercher… » et « 4 résultats », et n'offrait aucun filtre.

const invite = (page: import('@playwright/test').Page) =>
    page.locator('input[placeholder^="Rechercher"]').first();

async function ongletsDe(page: import('@playwright/test').Page, route: string, attendu: string) {
    for (const onglet of ['Officiel', 'Communauté', 'Mes créations']) {
        await page.goto(route);
        if (onglet !== 'Officiel') await page.click(`button:has-text("${onglet}")`);
        await expect(invite(page)).toHaveAttribute('placeholder', attendu, { timeout: 20_000 });
    }
}

test('les trois onglets nomment le type de la même façon', async ({ page }) => {
    await register(page, uniqueEmail('iso'));
    await ongletsDe(page, '/races', 'Rechercher un peuple…');
    await ongletsDe(page, '/voies', 'Rechercher une voie…');
    await ongletsDe(page, '/poisons', 'Rechercher un poison…');
});

test('le compteur emploie le mot du type, et non « résultats »', async ({ page }) => {
    await register(page, uniqueEmail('iso2'));
    await page.goto('/races');
    await expect(page.getByText(/\d+ peuples?/).first()).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Communauté")');
    await expect(page.getByText(/\d+ peuples?/).first()).toBeVisible();
    await expect(page.getByText(/résultats?/)).toHaveCount(0);
});

test('les filtres de la page officielle existent aussi côté communautaire', async ({ page }) => {
    await register(page, uniqueEmail('iso3'));

    // Capacités : la page officielle filtre par type et par rang.
    await page.goto('/capacites');
    await expect(page.getByRole('button', { name: /Filtres/ })).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Communauté")');
    await page.click('button:has-text("Filtres")');
    await expect(page.getByLabel('Rang')).toBeVisible();

    // Voies : le type de voie se choisit en pastilles, avec les mêmes intitulés.
    await page.goto('/voies');
    await expect(page.getByRole('tab', { name: 'Personnage' })).toBeVisible();
    await page.click('button:has-text("Communauté")');
    await expect(page.getByRole('tab', { name: 'Personnage' })).toBeVisible();
});
