import { type Page } from '@playwright/test';
import { test, expect, register, uniqueEmail, getToken } from './fixtures';

// Résout l'IRI d'un profil par nom depuis le compendium.
async function profileIriResolver(page: Page) {
    const profs = await (await page.request.get('http://localhost:8000/api/profiles?pagination=false', {
        headers: { Accept: 'application/ld+json' },
    })).json();
    const members: Array<{ name: string; '@id': string }> = profs.member || profs['hydra:member'];
    return (name: string) => members.find((p) => p.name === name)!['@id'];
}

async function createCharacter(page: Page, token: string, body: Record<string, unknown>) {
    const res = await page.request.post('http://localhost:8000/api/characters', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        data: body,
    });
    return (await res.json())['@id'].split('/').pop();
}

// Non-régression : la fiche d'un perso réel affiche les sections repliables et les panneaux
// des mécaniques Phase 5 (un panneau qui plante ferait tomber ce test).
test('la fiche affiche les sections et les panneaux des mécaniques', async ({ page }) => {
    await register(page, uniqueEmail('mech'));
    const token = await getToken(page);
    const iri = await profileIriResolver(page);
    const id = await createCharacter(page, token, {
        name: 'Testeur', level: 3, profile: iri('Guerrier'),
        caracs: { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 1 },
        characterVoies: [],
    });

    await page.goto(`/characters/${id}`);
    await page.waitForLoadState('networkidle');

    // En-têtes de sections repliables.
    for (const s of ['Identité', 'Rôleplay & langues', 'Équipement', 'Voies & Progression', 'En jeu']) {
        await expect(page.getByText(s, { exact: false }).first()).toBeVisible();
    }
    // En-têtes distinctifs des nouveaux panneaux (mécaniques Phase 5).
    for (const p of ['Objets magiques', 'Usages limités', 'Compagnons', 'Transformations', 'Repos', 'Capacités à choix', 'Substitution de caractéristique', 'États activables']) {
        await expect(page.getByText(p, { exact: false }).first()).toBeVisible();
    }
});

// Non-régression du câblage : un objet magique équipé (+DEF) compose la Défense affichée.
test('un objet magique équipé augmente la Défense affichée', async ({ page }) => {
    await register(page, uniqueEmail('mechdef'));
    const token = await getToken(page);
    const iri = await profileIriResolver(page);
    const id = await createCharacter(page, token, {
        name: 'DefTest', level: 1, profile: iri('Guerrier'),
        caracs: { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 1 },
        characterVoies: [],
    });

    await page.goto(`/characters/${id}`);
    await page.waitForLoadState('networkidle');

    // Valeur de Défense affichée (MainStatsPanel : label "Défense" + valeur dans le même panneau).
    const defValue = () =>
        page.locator('div.glass-panel', { has: page.getByText('Défense', { exact: true }) })
            .locator('div.text-2xl').first();
    const before = parseInt((await defValue().innerText()).trim());

    // Ajouter un objet magique équipé : cible DEF, valeur 2 (panneau "Objets magiques").
    const panel = page.locator('div.glass-panel', { has: page.getByText('Objets magiques', { exact: true }) });
    await panel.getByTitle('Ajouter un objet').click();
    await panel.getByPlaceholder("Nom de l'objet").fill('Anneau de protection');
    await panel.locator('select').first().selectOption('def');
    await panel.locator('input[type="number"]').first().fill('2');
    // L'objet est équipé par défaut ; la Défense doit augmenter de 2.
    await expect.poll(async () => parseInt((await defValue().innerText()).trim()), { timeout: 10_000 }).toBe(before + 2);
});
