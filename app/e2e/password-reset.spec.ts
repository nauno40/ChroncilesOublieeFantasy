import { test, expect, register, login, uniqueEmail, expectLoggedIn } from './fixtures';

// Mailpit capture les e-mails en dev (docker-compose) ; accessible en network_mode host.
const MAILPIT = 'http://localhost:8025';

test.describe('Réinitialisation de mot de passe', () => {
    test('demande → e-mail (Mailpit) → reset → connexion avec le nouveau mot de passe', async ({ page }) => {
        const email = uniqueEmail('reset');
        await register(page, email); // crée le compte (mot de passe par défaut) + auto-login

        // Repartir déconnecté et purger la boîte Mailpit.
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.request.delete(`${MAILPIT}/api/v1/messages`);

        // Depuis /login, suivre le lien « Oublié ? ».
        await page.goto('/login');
        await page.getByRole('link', { name: /oublié/i }).click();
        await expect(page).toHaveURL(/\/forgot-password/);
        // Attendre que la page « Mot de passe oublié » soit réellement montée : la page de
        // login a le même placeholder d'e-mail, il faut éviter de remplir l'ancien champ.
        await expect(page.getByRole('heading', { name: /mot de passe oublié/i })).toBeVisible();

        const emailInput = page.getByPlaceholder(/exemple\.com/i);
        await emailInput.fill(email);
        await expect(emailInput).toHaveValue(email); // attendre que la valeur contrôlée soit posée
        // Synchroniser sur la réponse réseau réelle plutôt que sur un simple délai UI.
        const [resp] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/forgot-password'), { timeout: 15_000 }),
            page.getByRole('button', { name: /envoyer le lien/i }).click(),
        ]);
        expect(resp.status()).toBe(200);
        await expect(page.getByText(/vérifiez vos e-mails/i)).toBeVisible({ timeout: 15_000 });

        // Récupérer le jeton depuis l'e-mail capté par Mailpit.
        let token = '';
        for (let i = 0; i < 20 && !token; i++) {
            const res = await page.request.get(`${MAILPIT}/api/v1/messages`);
            const msgs = (await res.json()).messages || [];
            if (msgs.length) {
                const full = await (await page.request.get(`${MAILPIT}/api/v1/message/${msgs[0].ID}`)).json();
                const m = ((full.Text || '') + (full.HTML || '')).match(/reset-password\?token=([a-f0-9]+)/);
                if (m) token = m[1];
            }
            if (!token) await page.waitForTimeout(500);
        }
        expect(token, "jeton introuvable dans l'e-mail Mailpit").not.toEqual('');

        // Réinitialiser via le lien.
        await page.goto(`/reset-password?token=${token}`);
        await page.getByPlaceholder(/minimum 6/i).fill('nouveauMdp1');
        await page.getByPlaceholder(/retapez/i).fill('nouveauMdp1');
        await page.getByRole('button', { name: /^réinitialiser$/i }).click();
        await expect(page.getByText(/mot de passe réinitialisé/i)).toBeVisible({ timeout: 15_000 });

        // Se connecter avec le NOUVEAU mot de passe.
        await login(page, email, 'nouveauMdp1');
        await expectLoggedIn(page, email);
    });
});
