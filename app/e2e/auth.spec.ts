import { test, expect, register, login, uniqueEmail, getToken, expectLoggedIn } from './fixtures';

test.describe('Authentification', () => {
    test('inscription → auto-login', async ({ page }) => {
        const email = uniqueEmail('register');
        await register(page, email);

        expect(await getToken(page)).not.toBeNull();
        // Redirection SPA (sans rechargement) vers l'app après inscription.
        await expect(page).toHaveURL(/\/dashboard/);
        await expectLoggedIn(page, email);
    });

    test('déconnexion purge le token et renvoie à l’accueil', async ({ page }) => {
        await register(page, uniqueEmail('logout'));
        await page.goto('/dashboard');

        await page.locator('aside button[title="Déconnexion"]').click();

        await expect.poll(() => getToken(page)).toBeNull();
        await expect(page).toHaveURL(/\/$/);
    });

    test('connexion avec un compte existant', async ({ page }) => {
        const email = uniqueEmail('login');
        await register(page, email);

        // Repartir d'un état déconnecté avant de se reconnecter.
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());

        await login(page, email);
        expect(await getToken(page)).not.toBeNull();
        // Redirection SPA (sans rechargement) vers l'app après connexion.
        await expect(page).toHaveURL(/\/dashboard/);
        await expectLoggedIn(page, email);
    });
});
