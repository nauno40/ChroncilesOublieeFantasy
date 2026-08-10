import React, { useState } from 'react';
import { Mountain } from 'lucide-react';
import { PageContainer, PageShell } from '../components/common';
import {
    dommagesChute, DIF_AMORTIR_CHUTE, difficulteSaut, NOTE_ELAN,
    difficulteSuffocation, difficulteChaleur, difficulteFroid,
    DM_FEU_PAR_ROUND, DM_TEMPERATURE,
    distanceParPeriode, distanceSurTerrain, difficulteMarcheForcee,
    DUREE_PERIODE_H, PERIODES_PAR_JOUR, type Monture,
    enduireArme, resisterAuPoison, DIF_RESISTER_POISON, NOTE_PREMIERE_ATTAQUE,
} from '../domain/rules';

/**
 * Dangers et obstacles — l'aide-mémoire qui calcule.
 *
 * Ces règles (chute, saut, feu, chaleur, froid) sont celles que le MJ refait de tête en
 * pleine partie : combien de dés pour une chute de 12 m, quelle difficulté pour ‑15 °C.
 * Elles étaient dans le livre et nulle part dans l'application.
 */
const Bloc: React.FC<{ titre: string; children: React.ReactNode; note?: string }> = ({ titre, children, note }) => (
    <section className="glass-panel p-5 rounded-2xl border-white/5 space-y-3">
        <h2 className="text-stone-400 font-display font-bold uppercase text-[11px] tracking-[0.2em]">{titre}</h2>
        {children}
        {note && <p className="text-[11px] text-stone-400 italic leading-snug">{note}</p>}
    </section>
);

const Champ: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <label className="flex items-center gap-2 text-sm text-stone-300">
        <span className="text-[11px] uppercase tracking-wider text-stone-400 w-32 shrink-0">{label}</span>
        {children}
    </label>
);

const classeSaisie = 'w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-stone-100 font-mono focus:outline-none focus:border-primary-500/50';

const Resultat: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-lg font-display font-bold text-primary-300">{children}</p>
);

export const Dangers: React.FC = () => {
    const [hauteur, setHauteur] = useState(12);
    const [niveau, setNiveau] = useState(1);
    const [amorti, setAmorti] = useState(false);
    const [distance, setDistance] = useState(4);
    const [avecElan, setAvecElan] = useState(true);
    const [round, setRound] = useState(1);
    const [temperature, setTemperature] = useState(-15);
    const [vetements, setVetements] = useState(0);
    const [con, setCon] = useState(2);
    const [defArmure, setDefArmure] = useState(0);
    const [dansLeSac, setDansLeSac] = useState(false);
    const [monture, setMonture] = useState<Monture>('aucune');
    const [horsPiste, setHorsPiste] = useState(false);
    const [terrainDifficile, setTerrainDifficile] = useState(false);
    const [periodeSup, setPeriodeSup] = useState(1);
    const [intPoison, setIntPoison] = useState(1);
    const [conPoison, setConPoison] = useState(1);
    const [virulence, setVirulence] = useState(DIF_RESISTER_POISON);
    const [jetPoison, setJetPoison] = useState<string | null>(null);

    const chute = dommagesChute(hauteur, niveau, amorti);
    const parPeriode = distanceParPeriode({ con, defArmure, armureDansLeSac: dansLeSac, monture });
    const surTerrain = distanceSurTerrain(parPeriode, { horsPiste, terrainDifficile });
    // Les jets appellent Math.random : ils vivent dans des gestionnaires, jamais dans le
    // corps du composant.
    const jeterEnduire = () => {
        const r = enduireArme(intPoison);
        const verdict = r.issue === 'applique' ? 'arme enduite'
            : r.issue === 'auto-empoisonnement' ? 'ÉCHEC CRITIQUE — le porteur s’empoisonne'
                : 'dose gaspillée';
        setJetPoison(`Enduire : (${r.de}) + ${intPoison} = ${r.total} — ${verdict}`);
    };
    const jeterResistance = () => {
        const r = resisterAuPoison(conPoison, virulence);
        setJetPoison(`Résistance : (${r.conserve}) + ${conPoison} = ${r.total} contre ${virulence} — ${r.reussi ? 'résisté' : 'subi'}`);
    };

    const chaleur = difficulteChaleur(temperature);
    const froid = difficulteFroid(temperature, vetements);

    return (
        <PageContainer>
            <PageShell
                title="Voyage & dangers"
                subtitle="Distances, chute, saut, feu, chaleur et froid : ce que la situation coûte, calculé."
                icon={Mountain}
            />

            <div className="grid md:grid-cols-2 gap-4">
                <Bloc titre="Chute" note={`Un test d’AGI difficulté ${DIF_AMORTIR_CHUTE} permet d’ignorer les trois premiers mètres.`}>
                    <Champ label="Hauteur (m)">
                        <input type="number" aria-label="Hauteur de chute" value={hauteur} min={0}
                            onChange={e => setHauteur(parseInt(e.target.value) || 0)} className={classeSaisie} />
                    </Champ>
                    <Champ label="Niveau du PJ">
                        <input type="number" aria-label="Niveau du personnage" value={niveau} min={1}
                            onChange={e => setNiveau(parseInt(e.target.value) || 1)} className={classeSaisie} />
                    </Champ>
                    <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
                        <input type="checkbox" checked={amorti} onChange={e => setAmorti(e.target.checked)} className="accent-primary-500" />
                        Test d’AGI réussi
                    </label>
                    <Resultat>
                        {chute.des > 0 ? `${chute.des}${chute.de}` : 'Aucun dommage'}
                        {chute.plafonne && <span className="text-stone-400 text-xs font-normal"> (plafond de 30 m)</span>}
                    </Resultat>
                </Bloc>

                <Bloc titre="Saut en longueur" note={NOTE_ELAN}>
                    <Champ label="Distance (m)">
                        <input type="number" aria-label="Distance du saut" value={distance} min={0}
                            onChange={e => setDistance(parseInt(e.target.value) || 0)} className={classeSaisie} />
                    </Champ>
                    <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
                        <input type="checkbox" checked={avecElan} onChange={e => setAvecElan(e.target.checked)} className="accent-primary-500" />
                        Avec élan
                    </label>
                    <Resultat>Test d’AGI difficulté {difficulteSaut(distance, avecElan)}</Resultat>
                </Bloc>

                <Bloc titre="Feu" note="Le test de CON ne concerne que l’incendie : il évite de suffoquer et de perdre connaissance.">
                    <Champ label="Round">
                        <input type="number" aria-label="Round d’incendie" value={round} min={1}
                            onChange={e => setRound(parseInt(e.target.value) || 1)} className={classeSaisie} />
                    </Champ>
                    <Resultat>{DM_FEU_PAR_ROUND} DM · test de CON difficulté {difficulteSuffocation(round)}</Resultat>
                </Bloc>

                <Bloc titre="Chaleur & froid" note={`Un test par tranche de 6 h ; en cas d’échec, ${DM_TEMPERATURE} DM. Des vêtements chauds valent +5 à +10 au test.`}>
                    <Champ label="Température (°C)">
                        <input type="number" aria-label="Température" value={temperature}
                            onChange={e => setTemperature(parseInt(e.target.value) || 0)} className={classeSaisie} />
                    </Champ>
                    <Champ label="Vêtements chauds">
                        <input type="number" aria-label="Bonus de vêtements" value={vetements} min={0} max={10}
                            onChange={e => setVetements(parseInt(e.target.value) || 0)} className={classeSaisie} />
                    </Champ>
                    <Resultat>
                        {chaleur !== null ? `Chaleur — test de CON difficulté ${chaleur}`
                            : froid !== null ? `Froid — test de CON difficulté ${froid}`
                                : 'Aucun test : température supportable'}
                    </Resultat>
                </Bloc>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Bloc titre="Voyage" note={`Une période de déplacement dure ${DUREE_PERIODE_H} h ; une journée normale en compte ${PERIODES_PAR_JOUR}. La pénalité d’armure est sa DEF ; une monture de bât la porte à votre place.`}>
                    <Champ label="CON">
                        <input type="number" aria-label="Valeur de CON" value={con}
                            onChange={e => setCon(parseInt(e.target.value) || 0)} className={classeSaisie} />
                    </Champ>
                    <Champ label="DEF d’armure">
                        <input type="number" aria-label="DEF de l’armure portée" value={defArmure} min={0}
                            onChange={e => setDefArmure(parseInt(e.target.value) || 0)} className={classeSaisie} />
                    </Champ>
                    <Champ label="Monture">
                        <select aria-label="Monture" value={monture} onChange={e => setMonture(e.target.value as Monture)}
                            className={`${classeSaisie} w-40`}>
                            <option value="aucune">À pied</option>
                            <option value="bat">Animal de bât</option>
                            <option value="poney">Poney</option>
                            <option value="cheval">Cheval</option>
                        </select>
                    </Champ>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-300">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={dansLeSac} onChange={e => setDansLeSac(e.target.checked)} className="accent-primary-500" />
                            Armure dans le sac
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={horsPiste} onChange={e => setHorsPiste(e.target.checked)} className="accent-primary-500" />
                            Hors piste
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={terrainDifficile} onChange={e => setTerrainDifficile(e.target.checked)} className="accent-primary-500" />
                            Terrain difficile
                        </label>
                    </div>
                    <Resultat>
                        {surTerrain} km par période · {surTerrain * PERIODES_PAR_JOUR} km par jour
                        {surTerrain !== parPeriode && <span className="text-stone-400 text-xs font-normal"> (sans terrain : {parPeriode} km)</span>}
                    </Resultat>
                </Bloc>

                <Bloc titre="Marche forcée" note="À pied, chaque période supplémentaire coûte 1 DR ; sans DR, le personnage est affaibli, et s’il l’est déjà, il s’écroule.">
                    <Champ label="Période sup.">
                        <input type="number" aria-label="Période supplémentaire" value={periodeSup} min={1}
                            onChange={e => setPeriodeSup(parseInt(e.target.value) || 1)} className={classeSaisie} />
                    </Champ>
                    <Resultat>À cheval : deux tests d’Équitation difficulté {difficulteMarcheForcee(periodeSup)}</Resultat>
                    <p className="text-[11px] text-stone-400 leading-snug">
                        Un test de CON pour éviter de perdre 1 DR, un test de CHA pour faire avancer la monture.
                    </p>
                </Bloc>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Bloc titre="Poison — enduire une arme" note={NOTE_PREMIERE_ATTAQUE}>
                    <Champ label="INT du porteur">
                        <input type="number" aria-label="INT du porteur" value={intPoison}
                            onChange={e => setIntPoison(parseInt(e.target.value) || 0)} className={classeSaisie} />
                    </Champ>
                    <button onClick={jeterEnduire}
                        className="px-3 py-1.5 rounded bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-[11px] uppercase tracking-wider transition-colors w-fit">
                        Test d’INT
                    </button>
                </Bloc>

                <Bloc titre="Poison — résister" note="La colonne « Effet — Réussite » du compendium dit ce que la victime subit malgré un test réussi.">
                    <Champ label="CON de la victime">
                        <input type="number" aria-label="CON de la victime" value={conPoison}
                            onChange={e => setConPoison(parseInt(e.target.value) || 0)} className={classeSaisie} />
                    </Champ>
                    <Champ label="Virulence">
                        <input type="number" aria-label="Difficulté du poison" value={virulence} min={0}
                            onChange={e => setVirulence(parseInt(e.target.value) || 0)} className={classeSaisie} />
                    </Champ>
                    <button onClick={jeterResistance}
                        className="px-3 py-1.5 rounded bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-[11px] uppercase tracking-wider transition-colors w-fit">
                        Test de CON
                    </button>
                </Bloc>
            </div>

            {jetPoison && (
                <p className="glass-panel px-4 py-2 rounded-xl border-primary-500/30 bg-primary-950/10 text-sm text-stone-200 font-mono mt-4">
                    {jetPoison}
                    <button onClick={() => setJetPoison(null)} aria-label="Effacer le jet"
                        className="ml-3 text-stone-400 hover:text-stone-200 text-xs">✕</button>
                </p>
            )}
        </PageContainer>
    );
};
