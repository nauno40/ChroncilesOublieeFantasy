import { type Page } from '@playwright/test';
import { test, expect, register, uniqueEmail, getToken, API_URL } from './fixtures';

// Bibliothèque communautaire : une voie porte ses capacités comme des entrées à part
// entière (`parent`), la fiche communautaire rend la même feuille que l'officielle, et
// les déclarations d'états y sont cliquables. Le contenu est posé par l'API — ce que ces
// tests gardent, c'est le RENDU, là où les tests unitaires ne voient rien.

async function createEntry(page: Page, token: string, body: Record<string, unknown>) {
    const res = await page.request.post(`${API_URL}/homebrew_entries`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        data: body,
    });
    expect(res.status()).toBe(201);
    return (await res.json())['@id'] as string;
}

test('une voie communautaire affiche ses capacités imbriquées', async ({ page }) => {
    await register(page, uniqueEmail('biblio'));
    const token = (await getToken(page))!;

    const voieIri = await createEntry(page, token, {
        category: 'voie',
        name: 'Voie du Guetteur',
        description: 'Surveiller, prévenir, disparaître.',
        visibility: 'private',
        data: { category: 'profil', maxRank: 5 },
    });

    await createEntry(page, token, {
        category: 'capacite',
        name: 'Œil du guetteur',
        visibility: 'private',
        parent: voieIri,
        data: { rank: 1, actionType: 'Libre', effect: ['+2 en Perception'], details: [] },
    });

    await page.goto(`/homebrew/${voieIri.split('/').pop()}`);

    await expect(page.getByRole('heading', { name: 'Voie du Guetteur' })).toBeVisible();
    // La capacité vient d'une AUTRE entrée : si l'imbrication ne se recharge pas, la voie
    // s'affiche en coquille vide sans que rien n'échoue par ailleurs.
    await expect(page.getByText('Œil du guetteur')).toBeVisible();
    await expect(page.getByText('+2 en Perception')).toBeVisible();
});

test('un état déclaré par une capacité communautaire mène à sa fiche', async ({ page }) => {
    await register(page, uniqueEmail('biblio'));
    const token = (await getToken(page))!;

    const capIri = await createEntry(page, token, {
        category: 'capacite',
        name: 'Coup de bouclier',
        visibility: 'private',
        data: { rank: 2, actionType: 'Attaque', effect: ['1d6 DM'], details: [], states: ['Renversé'] },
    });

    await page.goto(`/homebrew/${capIri.split('/').pop()}`);

    // Le compendium n'a pas de fiche d'état : le lien vise la liste filtrée.
    const lien = page.locator('a[href*="/states?q="]').first();
    await expect(lien).toBeVisible();
    await expect(lien).toContainText('Renversé');
});

test('le retour d’une fiche ouverte depuis la Bibliothèque y ramène', async ({ page }) => {
    await register(page, uniqueEmail('biblio'));
    const token = (await getToken(page))!;

    await createEntry(page, token, {
        category: 'race',
        name: 'Peuple des Brumes',
        description: 'Nés du brouillard des marches.',
        visibility: 'private',
        data: { modifiers: { PER: 1, CON: -1 }, speed: '10 m', abilities: 'Vision brumeuse' },
    });

    await page.goto('/bibliotheque');
    await page.getByText('Peuple des Brumes').first().click();

    await expect(page.getByRole('heading', { name: 'Peuple des Brumes' })).toBeVisible();
    // Sans provenance, le retour renverrait vers /races — pas là d'où l'on vient.
    const retour = page.getByRole('link', { name: /Retour à la Biblioth/i });
    await expect(retour).toBeVisible();
    await retour.click();
    await expect(page).toHaveURL(/\/bibliotheque/);
});

// Les PV de base, le dé de récupération et les PC découlent de la famille (COF2, Création
// §6-§8). La fiche officielle les affiche depuis toujours — elle les tient de l'entité
// `Family` — tandis que la communautaire, qui ne nomme sa famille qu'en texte libre, ne
// montrait aucune des quatre lignes. La règle est la même des deux côtés.
test('une classe communautaire affiche les lignes vitales de sa famille, comme l’officielle', async ({ page }) => {
    await register(page, uniqueEmail('classe'));
    const token = (await getToken(page))!;

    const iri = await createEntry(page, token, {
        category: 'classe',
        name: 'Berserker totémique',
        description: 'Guerrier lié à un esprit animal.',
        visibility: 'private',
        data: { family: 'Combattants', armorMaxDef: 3 },
    });

    await page.goto(`/homebrew/${iri.split('/').pop()}`);
    await expect(page.getByRole('heading', { name: 'Berserker totémique' })).toBeVisible();

    // Combattants : dé d10 et 5 PV de base. Chaque valeur est lue en face de son intitulé —
    // « d10 » figure deux fois (dé de vie et récupération), et un `getByText` nu passerait
    // même si les deux lignes portaient la même valeur par accident.
    const ligne = (label: string) => page.locator('h3:has-text("Statistiques Vitales")')
        .locator('xpath=../div/div').filter({ hasText: label });
    await expect(ligne('Dé de Vie')).toContainText('d10');
    await expect(ligne('PV / Niveau')).toContainText('5');
    await expect(ligne('Récupération')).toContainText('d10');
    // Aucune ligne de PC ici : seuls les aventuriers en gagnent un. Le contrôle ne vaut que
    // parce que la même page la MONTRE pour un aventurier — sans quoi une ligne jamais
    // rendue passerait pour une règle respectée.
    await expect(page.getByText('Points de Chance')).toHaveCount(0);

    const aventurier = await createEntry(page, token, {
        category: 'classe', name: 'Éclaireur de test', visibility: 'private',
        data: { family: 'Aventuriers' },
    });
    await page.goto(`/homebrew/${aventurier.split('/').pop()}`);
    await expect(ligne('Points de Chance')).toContainText('1');
    await expect(ligne('Dé de Vie')).toContainText('d8');
});

test('une famille maison n’emprunte pas les chiffres d’une autre', async ({ page }) => {
    await register(page, uniqueEmail('classe'));
    const token = (await getToken(page))!;

    const iri = await createEntry(page, token, {
        category: 'classe',
        name: 'Artificier de test',
        visibility: 'private',
        data: { family: 'Artificiers', armorMaxDef: 3 },
    });

    await page.goto(`/homebrew/${iri.split('/').pop()}`);
    await expect(page.getByText('Famille des Artificiers')).toBeVisible();
    // Le nom reste visible ; aucun dé n'est inventé pour l'accompagner.
    await expect(page.getByText('Dé de Vie')).toHaveCount(0);
});
