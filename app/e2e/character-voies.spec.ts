import { type Page } from '@playwright/test';
import { test, expect, register, uniqueEmail, getToken } from './fixtures';

// Helpers partagés — modèle Phase 2 : les voies sont référencées par IRI et le profil
// embarque ses voies (avec @id). On résout profils et voies depuis le compendium.
async function loadProfiles(page: Page) {
    const profs = await (await page.request.get('http://localhost:8000/api/profiles?pagination=false', {
        headers: { Accept: 'application/ld+json' },
    })).json();
    const members: Array<{ name: string; '@id': string; voies?: Array<{ name: string; '@id': string }> }> =
        profs.member || profs['hydra:member'];
    const profileIri = (name: string) => members.find((p) => p.name === name)!['@id'];
    const voieIri = (profileName: string, voieName: string) =>
        members.find((p) => p.name === profileName)!.voies!.find((v) => v.name === voieName)!['@id'];
    return { profileIri, voieIri };
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
// hybrides) — le seul type de select à contenir des <optgroup>. Les voies sont référencées
// par IRI ; on lit le libellé (nom de voie) de l'option sélectionnée.
const profileVoieNames = (page: Page) =>
    page.locator('select:has(optgroup)').evaluateAll(els =>
        (els as HTMLSelectElement[]).map(e => e.selectedOptions[0]?.text || ''));

// Régression : en rouvrant un perso de niveau ≥ 1 dont seule une partie des voies
// de profil avait été sauvegardée, les 5 voies du profil doivent s'afficher.
test('rouvrir un perso niveau ≥ 1 recharge les 5 voies de profil', async ({ page }) => {
    await register(page, uniqueEmail('voies'));
    const token = await getToken(page);
    const { profileIri, voieIri } = await loadProfiles(page);

    const id = await createCharacter(page, token, {
        name: 'Vétéran', level: 1, profile: profileIri('Guerrier'),
        caracs: { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 1 },
        characterVoies: [
            { voie: voieIri('Guerrier', 'Voie du Bouclier'), rank: 2, source: 'profil' },
            { voie: voieIri('Guerrier', 'Voie du Combat'), rank: 1, source: 'profil' },
        ],
    });

    await page.goto(`/characters/${id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h3', { hasText: /Voie de Profil/i })).toHaveCount(5);
    await expect.poll(() => profileVoieNames(page), { timeout: 15_000 }).toEqual(expect.arrayContaining(GUERRIER));
});

// Régression : choisir / changer la classe d'un perso existant met à jour les voies.
test('choisir ou changer la classe met à jour les voies de profil', async ({ page }) => {
    await register(page, uniqueEmail('cls'));
    const token = await getToken(page);
    const { profileIri, voieIri } = await loadProfiles(page);
    const classSelect = () => page.locator('select').filter({ hasText: 'Choisir un profil' }).first();

    // Cas 1 : perso sans classe (aucune voie de profil) → choisir Guerrier.
    const idA = await createCharacter(page, token, {
        name: 'SansClasse', level: 1, profile: null,
        caracs: { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 1 },
        characterVoies: [],
    });
    await page.goto(`/characters/${idA}`);
    await page.waitForLoadState('networkidle');
    await classSelect().selectOption(profileIri('Guerrier'));
    await page.keyboard.press('Escape'); // fermer une éventuelle modale d'équipement
    await expect.poll(() => profileVoieNames(page), { timeout: 15_000 }).toEqual(expect.arrayContaining(GUERRIER));

    // Cas 2 : changer de classe (Guerrier → Druide) remplace les voies.
    const idB = await createCharacter(page, token, {
        name: 'ChangeClasse', level: 1, profile: profileIri('Guerrier'),
        caracs: { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 1 },
        characterVoies: [{ voie: voieIri('Guerrier', 'Voie du Bouclier'), rank: 1, source: 'profil' }],
    });
    await page.goto(`/characters/${idB}`);
    await page.waitForLoadState('networkidle');
    await classSelect().selectOption(profileIri('Druide'));
    await page.keyboard.press('Escape');
    await expect.poll(() => profileVoieNames(page), { timeout: 15_000 }).toEqual(expect.arrayContaining(DRUIDE));
    // Plus aucune voie du Guerrier ne subsiste.
    await expect.poll(() => profileVoieNames(page)).not.toContain('Voie du Bouclier');
});
