import { type Page } from '@playwright/test';
import { test, expect, register, uniqueEmail, getToken } from './fixtures';

// Helpers partagés
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

const GUERRIER = ['Voie du Bouclier', 'Voie du Combat', "Voie du Maître d'Armes", 'Voie de la Résistance', 'Voie du Soldat'];
const DRUIDE = ['Voie des Animaux', 'Voie du Fauve', 'Voie de la Nature', 'Voie du Protecteur', 'Voie des Végétaux'];

// En jeu (niveau ≥ 1), chaque voie de profil est un <select> groupé par profil (profils
// hybrides) — le seul type de select à contenir des <optgroup>. On lit leurs valeurs.
const profileVoieValues = (page: Page) =>
    page.locator('select:has(optgroup)').evaluateAll(els => (els as HTMLSelectElement[]).map(e => e.value));

// Régression : en rouvrant un perso de niveau ≥ 1 dont seule une partie des voies
// de profil avait été sauvegardée, les 5 voies du profil doivent s'afficher.
test('rouvrir un perso niveau ≥ 1 recharge les 5 voies de profil', async ({ page }) => {
    await register(page, uniqueEmail('voies'));
    const token = await getToken(page);
    const iri = await profileIriResolver(page);

    const id = await createCharacter(page, token, {
        name: 'Vétéran', level: 1, profile: iri('Guerrier'),
        data: { voies: { profile: [
            { name: 'Voie du Bouclier', ranks: [true, true, false, false, false] },
            { name: 'Voie du Combat', ranks: [true, false, false, false, false] },
        ], racial: { name: '', ranks: [false, false, false, false, false] } } },
    });

    await page.goto(`/characters/${id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h3', { hasText: /Voie de Profil/i })).toHaveCount(5);
    await expect.poll(() => profileVoieValues(page), { timeout: 15_000 }).toEqual(expect.arrayContaining(GUERRIER));
});

// Régression : choisir / changer la classe d'un perso existant met à jour les voies.
test('choisir ou changer la classe met à jour les voies de profil', async ({ page }) => {
    await register(page, uniqueEmail('cls'));
    const token = await getToken(page);
    const iri = await profileIriResolver(page);
    const classSelect = () => page.locator('select').filter({ hasText: 'Choisir un profil' }).first();

    // Cas 1 : perso sans classe (voies « Voie 1..5 » par défaut) → choisir Guerrier.
    const idA = await createCharacter(page, token, {
        name: 'SansClasse', level: 1, profile: null,
        data: { voies: { profile: [1, 2, 3, 4, 5].map(i => ({ name: `Voie ${i}`, ranks: [false, false, false, false, false] })), racial: { name: '', ranks: [false, false, false, false, false] } } },
    });
    await page.goto(`/characters/${idA}`);
    await page.waitForLoadState('networkidle');
    await classSelect().selectOption(iri('Guerrier'));
    await page.keyboard.press('Escape'); // fermer une éventuelle modale d'équipement
    await expect.poll(() => profileVoieValues(page), { timeout: 15_000 }).toEqual(expect.arrayContaining(GUERRIER));

    // Cas 2 : changer de classe (Guerrier → Druide) remplace les voies.
    const idB = await createCharacter(page, token, {
        name: 'ChangeClasse', level: 1, profile: iri('Guerrier'),
        data: { voies: { profile: [{ name: 'Voie du Bouclier', ranks: [true, false, false, false, false] }], racial: { name: '', ranks: [false, false, false, false, false] } } },
    });
    await page.goto(`/characters/${idB}`);
    await page.waitForLoadState('networkidle');
    await classSelect().selectOption(iri('Druide'));
    await page.keyboard.press('Escape');
    await expect.poll(() => profileVoieValues(page), { timeout: 15_000 }).toEqual(expect.arrayContaining(DRUIDE));
    // Plus aucune voie du Guerrier ne subsiste.
    await expect.poll(() => profileVoieValues(page)).not.toContain('Voie du Bouclier');
});
