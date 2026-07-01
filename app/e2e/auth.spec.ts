import { test, expect, register, login, uniqueEmail, getToken, expectLoggedIn } from './fixtures';

test.describe('Authentification', () => {
    test('inscription → auto-login', async ({ page }) => {
        const email = uniqueEmail('register');
        await register(page, email);

        expect(await getToken(page)).not.toBeNull();
        await expect(page).not.toHaveURL(/\/register$/);
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
        await expectLoggedIn(page, email);
    });
});
