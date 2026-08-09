#!/usr/bin/env node
/**
 * Reproduction du défaut d'échafaudage des voies de profil.
 *
 * Ouvrir la fiche d'un personnage qui ne porte que DEUX voies de profil devrait afficher
 * les cinq voies de sa classe : trois vides à compléter. Or trois restent à
 * « — Choisir une voie — » indéfiniment.
 *
 * Ce n'est PAS de la lenteur : la mesure imprime l'instant d'arrivée de chaque collection
 * de l'API (toutes présentes en 1,3 s) et l'état des sélecteurs pendant vingt secondes.
 * Observé : cinq sélecteurs à 2 s, dont deux renseignés — et plus rien ne bouge ensuite.
 * Sur un personnage dont les cinq voies sont déjà enregistrées, les cinq se renseignent.
 *
 * L'effet en cause est la synchronisation de `characterVoies` dans `useCharacterSheet`.
 *
 * Usage (depuis la racine, avec le stack démarré) :
 *   docker run --rm --network host \
 *     -v "$PWD/app/node_modules:/nm:ro" -v "$PWD/scripts:/work" \
 *     mcr.microsoft.com/playwright:v1.58.2-jammy node /work/reproduire-echafaudage-voies.mjs
 *
 * Le script crée un compte et un personnage jetables ; les supprimer après usage.
 */
import pkg from '/nm/playwright-core/index.js';
const { chromium } = pkg;
const b = await chromium.launch();
const ctx = await b.newContext();
const p = await ctx.newPage();
p.setDefaultNavigationTimeout(90000);
const t = {};
p.on('response', r => {
    const u = r.url();
    for (const c of ['profiles', 'voies', 'capabilities', 'races']) {
        if (u.includes(`/api/${c}?`) && !t[c]) t[c] = Date.now();
    }
});
// Reproduction fidèle du test : compte neuf, personnage créé avec DEUX voies seulement.
const email = `mesure_${Date.now()}@example.com`;
await p.goto('http://localhost:5173/register');
await p.fill('input[type=email]', email);
await p.fill('input[type=text]', 'mesure');
await p.fill('input[type=password]', 'Test1234!');
await p.click('form button[type=submit]');
await p.waitForURL(u => !u.pathname.includes('/register'));
const jeton = await p.evaluate(() => localStorage.getItem('co_auth_token'));
const profs = await (await p.request.get('http://localhost:8001/api/profiles?pagination=false', { headers: { Accept: 'application/ld+json' } })).json();
const membres = profs.member || profs['hydra:member'];
const guerrier = membres.find(x => x.name === 'Guerrier');
const voie = (n) => guerrier.voies.find(v => v.name === n)['@id'];
const cree = await (await p.request.post('http://localhost:8001/api/characters', {
    headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
    data: { name: 'Mesure', level: 1, profile: guerrier['@id'],
        caracs: { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 1 },
        characterVoies: [
            { voie: voie('Voie du Bouclier'), rank: 2, source: 'profil' },
            { voie: voie('Voie du Combat'), rank: 1, source: 'profil' },
        ] },
})).json();
const idPerso = cree['@id'].split('/').pop();

const depart = Date.now();
Object.keys(t).forEach(k => delete t[k]);
await p.goto(`http://localhost:5173/characters/${idPerso}`);
const noms = () => p.locator('select:has(optgroup)').evaluateAll(els => els.map(e => e.selectedOptions[0]?.text || ''));
let dernier = '';
for (let i = 0; i < 40; i++) {
    await p.waitForTimeout(500);
    const v = await noms().catch(() => []);
    const rendu = JSON.stringify(v);
    if (rendu !== dernier) {
        console.log(`${((Date.now() - depart) / 1000).toFixed(1)}s → ${v.length} sélecteurs : ${v.filter(x => !x.startsWith('—')).length} renseignés`);
        dernier = rendu;
    }
}
console.log('réponses API (s depuis navigation) :', Object.fromEntries(Object.entries(t).map(([k, v]) => [k, ((v - depart) / 1000).toFixed(1)])));
await b.close();
