import { type Page } from '@playwright/test';
import { test, expect, register, uniqueEmail } from './fixtures';

/**
 * Tout champ de saisie doit porter une étiquette ACCESSIBLE : un intitulé visible à côté
 * ne suffit pas, il faut l'association. Le formulaire de créature maison avait 19 champs
 * sur 20 dans ce cas — les intitulés étaient là, mais un lecteur d'écran annonçait
 * « zone de saisie » sans dire de quoi.
 */
const champsSansEtiquette = (page: Page) => page.evaluate(() => {
    const champs = Array.from(document.querySelectorAll('input, select, textarea'));
    return champs
        .filter(c => {
            const el = c as HTMLInputElement;
            if (el.type === 'hidden') return false;
            const parLabel = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
            return !(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || parLabel || el.closest('label'));
        })
        .map(c => `${c.tagName.toLowerCase()} « ${c.getAttribute('placeholder') ?? '—'} »`);
});

test('les écrans de liste et d’outils n’ont aucun champ sans étiquette', async ({ page }) => {
    await register(page, uniqueEmail('a11y'));
    for (const route of ['/voies', '/equipment', '/creatures', '/tools/tracker', '/tools/dice', '/tools/dangers']) {
        await page.goto(route);
        await page.waitForTimeout(900);
        expect(await champsSansEtiquette(page), `champ sans étiquette sur ${route}`).toEqual([]);
    }
});

test('le formulaire de créature maison étiquette tous ses champs', async ({ page }) => {
    await register(page, uniqueEmail('a11yform'));
    await page.goto('/tools/monsters');
    await page.click('button:has-text("Nouveau monstre")');
    await expect(page.getByLabel('Nom')).toBeVisible();
    // Les sept caractéristiques portent leur sigle — et, à côté, la case « supérieure »
    // porte le sien. D'où `exact` : sans lui, « FOR » désigne les deux à la fois.
    await expect(page.getByLabel('FOR', { exact: true })).toBeVisible();
    await expect(page.getByLabel('FOR supérieure')).toBeVisible();
    expect(await champsSansEtiquette(page)).toEqual([]);
});
