import { test, expect, type Page } from '@playwright/test';

// Shared helpers for the E2E suite. Selectors mirror the real auth pages
// (LoginPage/RegisterPage: input[type=email], input[type=password], the submit
// button is the only button inside <form>) and the authenticated shell (Layout:
// the sidebar <aside> renders a logout control titled "Déconnexion").

export const TOKEN_KEY = 'co_auth_token';
export const USER_KEY = 'co_auth_user';
export const DEFAULT_PASSWORD = 'Test1234!';

export function uniqueEmail(prefix = 'e2e'): string {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

export function getToken(page: Page): Promise<string | null> {
    return page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
}

// Remplit le formulaire d'auth et attend l'apparition du JWT. Sur /register un
// champ « Pseudo » (input[type=text]) est requis ; on le renseigne quand un pseudo
// est fourni. La page /login n'a pas ce champ, d'où l'argument optionnel.
async function submitCredentials(page: Page, email: string, password: string, pseudo?: string): Promise<void> {
    await page.locator('input[type="email"]').fill(email);
    if (pseudo !== undefined) {
        await page.locator('input[type="text"]').fill(pseudo);
    }
    await page.locator('input[type="password"]').fill(password);
    await page.locator('form button[type="submit"]').click();
    // AuthService stores the JWT, then the page navigates to '/'. A cold backend
    // makes the first request slow, so poll generously for the token to appear.
    await expect.poll(() => getToken(page), { timeout: 20_000 }).not.toBeNull();
}

export async function register(page: Page, email: string, password = DEFAULT_PASSWORD, pseudo?: string): Promise<void> {
    await page.goto('/register');
    // Le pseudo est obligatoire à l'inscription ; on en dérive un déterministe de l'email.
    await submitCredentials(page, email, password, pseudo ?? email.split('@')[0]);
}

export async function login(page: Page, email: string, password = DEFAULT_PASSWORD): Promise<void> {
    await page.goto('/login');
    await submitCredentials(page, email, password);
}

// Navigates to a protected route and asserts the authenticated shell is shown.
export async function expectLoggedIn(page: Page, email?: string): Promise<void> {
    await page.goto('/dashboard');
    await expect(page.locator('aside button[title="Déconnexion"]')).toBeVisible();
    if (email) {
        await expect(page.locator('aside')).toContainText(email);
    }
}

export { test, expect };
