import { test, expect, getToken } from './fixtures';

// Régression du fix 401 (app/src/services/api.ts::handleUnauthorized) : un JWT
// périmé/invalide en localStorage doit être purgé et rediriger vers /login au
// lieu de casser silencieusement toute l'app (y compris le compendium public).
test('un JWT périmé est purgé et redirige vers /login (fix 401)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.setItem('co_auth_token', 'eyJhbGciOiJSUzI1NiJ9.stale.invalidsignature');
        localStorage.setItem('co_auth_user', JSON.stringify({ email: 'stale@example.com' }));
    });

    // /races déclenche un appel API ; le 401 doit auto-guérir l'état.
    await page.goto('/races');

    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
    expect(await getToken(page)).toBeNull();
});
