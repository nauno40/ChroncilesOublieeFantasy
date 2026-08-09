import { type Page } from '@playwright/test';
import { test, expect, login, getToken, API_URL } from './fixtures';

// La liste des campagnes est rendue en cartes cliquables (`ContentCard`, refonte UI/UX) :
// il n'y a plus d'ancre `href` à viser. On ouvre la première campagne du MJ par son nom,
// lu depuis l'API — le test ne dépend donc d'aucun libellé écrit en dur.
async function ouvrirPremiereCampagne(page: Page, token: string): Promise<void> {
    const res = await page.request.get(`${API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' },
    });
    const body = await res.json();
    const toutes: Array<{ id: number; name: string; characters?: unknown[] }> = body.member || body['hydra:member'];
    // Une campagne PEUPLÉE : le générateur de rencontre compose selon la taille du groupe,
    // et une campagne vide ne lui donne rien à composer.
    const campagnes = toutes.filter(c => (c.characters?.length ?? 0) > 0).length > 0
        ? toutes.filter(c => (c.characters?.length ?? 0) > 0)
        : toutes;
    expect(campagnes.length, 'le MJ de démo doit avoir au moins une campagne').toBeGreaterThan(0);
    // On y va par son identifiant plutôt qu'en cliquant son nom : le nom apparaît deux fois
    // sur la page (carte et rappel), et `.first()` tombait parfois sur l'occurrence qui ne
    // navigue pas — le test échouait alors sur le panneau, pas sur ce qu'il vérifie.
    await page.goto(`/campaign/${campagnes[0].id}`);
}


// Fonctionnalité Rencontre (MJ) : créer une rencontre sur une campagne, puis la
// lancer dans le Suivi de Combat. Compte de démo nauno40@gmail.com / chroniques.
test.describe('Campagne — Rencontres', () => {
    test.beforeEach(async ({ page }) => {
        // Accepte les éventuelles confirmations (écrasement d'un combat en cours).
        page.on('dialog', d => d.accept());
        await login(page, 'nauno40@gmail.com', 'chroniques');
    });

    test('créer une rencontre puis la lancer dans le Suivi de Combat', async ({ page }) => {
        const name = `Embuscade ${Date.now()}`;

        await ouvrirPremiereCampagne(page, (await getToken(page))!);
        await expect(page.getByRole('heading', { level: 3, name: 'Rencontres' })).toBeVisible({ timeout: 15_000 });

        // Un monstre du MJ, choisi dans SES données plutôt qu'écrit en dur : les fixtures
        // de démonstration changent de bestiaire au fil des versions, et un nom figé fait
        // échouer le test pour une raison qui n'a rien à voir avec la rencontre.
        const monstres = await (await page.request.get(`${API_URL}/custom_creatures?pagination=false`, {
            headers: { Authorization: `Bearer ${(await getToken(page))!}`, Accept: 'application/ld+json' },
        })).json();
        const membres: Array<{ name: string }> = monstres.member || monstres['hydra:member'];
        expect(membres.length, 'le MJ de démo doit avoir au moins un monstre').toBeGreaterThan(0);
        const monstre = membres[0].name;

        // Ouvrir la modale de création.
        await page.getByRole('button', { name: /créer une rencontre/i }).click();
        const modal = page.locator('div.fixed.inset-0', { hasText: 'Créer une rencontre' });

        await modal.getByPlaceholder(/embuscade/i).fill(name);
        // Le sélecteur de créature est celui qui contient l'option (≠ select d'environnement du générateur).
        const creatureSelect = modal.locator('select', { has: page.getByRole('option', { name: monstre, exact: true }) });
        await creatureSelect.selectOption({ label: monstre });
        // La quantité du picker manuel est le dernier input number (après taille/niveau du générateur).
        await modal.locator('input[type="number"]').last().fill('2');
        await modal.getByRole('button', { name: /ajouter/i }).click();

        // Le roster affiche l'entrée avec sa quantité (le « 2× » distingue du <option>).
        await expect(modal.getByText(new RegExp(`2× ${monstre}`))).toBeVisible();

        await modal.getByRole('button', { name: /^enregistrer$/i }).click();

        // La rencontre apparaît dans le panneau.
        await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });

        // La lancer → redirection vers le tracker avec les combattants développés.
        // Viser la rencontre qu'on vient de créer : `.first()` lançait la première du
        // panneau — une rencontre préexistante de la campagne de démonstration.
        await page.locator('li', { hasText: name }).getByTitle('Lancer dans le Suivi de Combat').click();
        await expect(page).toHaveURL(/\/tools\/tracker/);
        await expect(page.getByText(`${monstre} 1`)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(`${monstre} 2`)).toBeVisible();

        // Le test range derrière lui : les rencontres s'accumulaient d'une exécution à
        // l'autre sur la campagne de démonstration, et la collection embarquée dans la
        // charge utile de campagne étant paginée, une rencontre nouvellement créée finissait
        // par ne plus y figurer — le test échouait alors sur une limite qu'il avait
        // lui-même provoquée.
        const jeton = (await getToken(page))!;
        const liste = await (await page.request.get(`${API_URL}/encounters?pagination=false`, {
            headers: { Authorization: `Bearer ${jeton}`, Accept: 'application/ld+json' },
        })).json();
        for (const e of (liste.member || liste['hydra:member']) as Array<{ '@id': string; name: string }>) {
            if (e.name === name) {
                await page.request.delete(`http://localhost:8000${e['@id']}`.replace('http://localhost:8000/api', `${API_URL}`), {
                    headers: { Authorization: `Bearer ${jeton}` },
                });
            }
        }
    });

    test('le générateur compose un roster selon l’environnement et la difficulté', async ({ page }) => {
        await ouvrirPremiereCampagne(page, (await getToken(page))!);
        await expect(page.getByRole('heading', { level: 3, name: 'Rencontres' })).toBeVisible({ timeout: 15_000 });

        await page.getByRole('button', { name: /créer une rencontre/i }).click();
        const modal = page.locator('div.fixed.inset-0', { hasText: 'Créer une rencontre' });

        // L'environnement décide du vivier : le générateur refuse (et alerte) quand aucune
        // créature de l'environnement retenu ne rentre dans le budget. On choisit donc celui
        // qui en compte le plus, plutôt que de dépendre du premier par ordre alphabétique.
        const creatures = await (await page.request.get(`${API_URL}/creatures?pagination=false`, {
            headers: { Accept: 'application/ld+json' },
        })).json();
        const parEnv = new Map<string, number>();
        for (const c of (creatures.member || creatures['hydra:member']) as Array<{ environment?: string }>) {
            if (c.environment) parEnv.set(c.environment, (parEnv.get(c.environment) ?? 0) + 1);
        }
        const environnement = [...parEnv.entries()].sort((a, b) => b[1] - a[1])[0][0];
        await modal.locator('select').first().selectOption(environnement);

        await modal.getByRole('button', { name: /^difficile$/i }).click();
        await modal.getByRole('button', { name: /^générer/i }).click();

        // Le nom est auto-rempli et au moins une créature est ajoutée au roster.
        await expect(modal.getByPlaceholder(/embuscade/i)).toHaveValue(/Rencontre —/);
        await expect(modal.getByLabel('Retirer').first()).toBeVisible();
    });
});
