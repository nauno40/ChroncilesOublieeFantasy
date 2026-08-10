import React, { useState } from 'react';
import { Mountain } from 'lucide-react';
import { PageContainer, PageShell } from '../components/common';
import {
    dommagesChute, DIF_AMORTIR_CHUTE, difficulteSaut, NOTE_ELAN,
    difficulteSuffocation, difficulteChaleur, difficulteFroid,
    DM_FEU_PAR_ROUND, DM_TEMPERATURE,
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

    const chute = dommagesChute(hauteur, niveau, amorti);
    const chaleur = difficulteChaleur(temperature);
    const froid = difficulteFroid(temperature, vetements);

    return (
        <PageContainer>
            <PageShell
                title="Dangers & obstacles"
                subtitle="Chute, saut, feu, chaleur et froid : ce que la situation coûte, calculé."
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
        </PageContainer>
    );
};
