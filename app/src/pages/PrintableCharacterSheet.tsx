import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCharacterData } from '../hooks/useCharacterData';
import { useCharacterSheet } from '../hooks/useCharacterSheet';
import { attackValue, attackCarac, baseLanguages, isCapabilityGrantedByEntry, buildVoieIndex, findRace, findProfile, type Stats } from '../domain/rules';

const CARACS: (keyof Stats)[] = ['FOR', 'AGI', 'CON', 'PER', 'INT', 'CHA', 'VOL'];
const sign = (n: number) => `${n >= 0 ? '+' : ''}${n}`;

// --- Sous-composants présentationnels (niveau module : évite react-hooks/static-components) ---

const Section: React.FC<{ title: string; children: React.ReactNode; avoidBreak?: boolean }> = ({ title, children, avoidBreak }) => (
    <section className="mb-4" style={avoidBreak ? { breakInside: 'avoid' } : undefined}>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-500 border-b border-stone-300 pb-0.5 mb-2">{title}</h2>
        {children}
    </section>
);

const StatBox: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode }> = ({ label, value, hint }) => (
    <div className="border border-stone-400 rounded px-2 py-1 text-center">
        <div className="text-[9px] uppercase tracking-wider text-stone-500">{label}</div>
        <div className="text-base font-bold text-stone-900 leading-tight">{value}</div>
        {hint != null && <div className="text-[8px] text-stone-500">{hint}</div>}
    </div>
);

// Ressource « courant / max » avec une case à remplir pour le courant.
const Resource: React.FC<{ label: string; current: React.ReactNode; max: React.ReactNode }> = ({ label, current, max }) => (
    <div className="border border-stone-400 rounded px-2 py-1 text-center">
        <div className="text-[9px] uppercase tracking-wider text-stone-500">{label}</div>
        <div className="flex items-center justify-center gap-1 leading-tight">
            <span className="inline-block min-w-[1.6rem] border-b border-stone-400 text-base font-bold">{current}</span>
            <span className="text-stone-400 text-sm">/</span>
            <span className="text-base font-bold">{max}</span>
        </div>
    </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <p className="text-xs text-stone-700"><strong className="text-stone-800">{label} :</strong> {children}</p>
);

// Rangée de cases à cocher (usages limités) : `used` cochées sur `max`.
const CheckBoxes: React.FC<{ used: number; max: number }> = ({ used, max }) => (
    <span className="inline-flex gap-0.5 align-middle">
        {Array.from({ length: Math.max(0, max) }).map((_, i) => (
            <span key={i} className={`inline-block w-3 h-3 border border-stone-500 rounded-sm ${i < used ? 'bg-stone-700' : ''}`} />
        ))}
    </span>
);

// Lignes vides à remplir (zone de notes manuscrites).
const BlankLines: React.FC<{ count: number }> = ({ count }) => (
    <div className="mt-1 space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="border-b border-dotted border-stone-400" />
        ))}
    </div>
);

/** Fiche de personnage de table (print-CSS + PDF natif du navigateur).
 *  Lecture seule : réutilise la même dérivation que la fiche écran (valeurs identiques).
 *  Détaillée : descriptions de capacités intégrales, suivi PV/PM/PC, toutes les sections. */
export const PrintableCharacterSheet: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { races, profiles, allVoies } = useCharacterData();
    const {
        character, loading, finalStats, combatStats, mods, maxHp, damageReduction,
        luckPoints, manaPoints, recoveryDieString, evolutiveDie, bonuses, caracTestBonuses,
        getResolvedDice,
    } = useCharacterSheet({ races, profiles, allVoies, id, isNew: false, navigate });

    if (loading) return <div className="p-8 text-center">Chargement…</div>;

    const raceName = findRace(character.race, races)?.name ?? String(character.race ?? '');
    const profileName = findProfile(character.profile, profiles)?.name ?? String(character.profile ?? '');
    const level = character.level ?? 1;
    const byIri = buildVoieIndex(races, profiles, allVoies);

    const ps = character.playState;
    const subs = ps?.caracSubstitutions;
    const contact = attackValue(mods[attackCarac('contact', subs, 'FOR')], level) + bonuses.attaque;
    const distance = attackValue(mods[attackCarac('distance', subs, 'AGI')], level) + bonuses.attaque;
    const magic = attackValue(mods.VOL, level) + bonuses.attaque;

    // Seules les voies effectivement acquises (rang ≥ 1) ; on ignore l'échafaudage rang 0.
    const voies = (character.characterVoies ?? []).filter(e => e.voie && e.rank >= 1);
    const languages = ps?.languages ?? [];
    const talents = (ps?.talents ?? []).filter(Boolean);
    const base = baseLanguages(raceName);
    const weapons = (ps?.weapons ?? []).filter(w => w.name);
    const protection = ps?.protection;
    const inventory = (ps?.equipment ?? []).filter(Boolean);
    const magicItems = (ps?.magicItems ?? []).filter(m => m.name);
    const activeStates = (ps?.activeStates ?? []).filter(s => s.name);
    const usages = (ps?.usages ?? []).filter(u => u.name);
    const companions = (ps?.companions ?? []).filter(c => c.name);
    const money = ps?.money;
    const rp = ps?.rp;
    const physical = ps?.physical;
    const isMage = manaPoints > 0;

    const srcLabel = (s: string): string =>
        s === 'peuple' ? 'peuple' : s === 'prestige' ? 'prestige' : s === 'trait' ? 'octroi' : 'profil';

    const moneyStr = money
        ? [money.po ? `${money.po} po` : null, `${money.pa ?? 0} pa`, money.pc ? `${money.pc} pc` : null].filter(Boolean).join(' · ')
        : '—';

    return (
        <div className="mx-auto max-w-[820px] bg-white text-stone-900 p-6 print:p-0" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {/* Actions — masquées à l'impression */}
            <div className="no-print flex items-center justify-between mb-4">
                <Link to={`/characters/${id}`} className="text-sm text-stone-600 hover:text-stone-900">← Retour à la fiche</Link>
                <button onClick={() => window.print()} className="px-4 py-2 rounded bg-stone-800 text-white text-sm font-bold hover:bg-stone-700">
                    Imprimer / Enregistrer en PDF
                </button>
            </div>

            {/* En-tête */}
            <header className="border-b-2 border-stone-800 pb-2 mb-4">
                <h1 className="text-2xl font-bold">{character.name || 'Personnage'}</h1>
                <p className="text-sm text-stone-600">{[raceName, profileName].filter(Boolean).join(' · ')} — Niveau {level}</p>
            </header>

            {/* Caractéristiques */}
            <Section title="Caractéristiques" avoidBreak>
                <div className="grid grid-cols-7 gap-2">
                    {CARACS.map(c => (
                        <StatBox key={c} label={c} value={sign(finalStats[c])}
                            hint={(caracTestBonuses?.[c] ?? 0) > 0 ? `tests ${sign(caracTestBonuses![c]!)}` : undefined} />
                    ))}
                </div>
            </Section>

            {/* Combat */}
            <Section title="Combat" avoidBreak>
                <div className="grid grid-cols-4 gap-2 mb-2">
                    <StatBox label="Défense" value={combatStats.def} />
                    <StatBox label="Initiative" value={combatStats.init} />
                    <StatBox label="Réduction de dmg" value={damageReduction} />
                    <Resource label="Points de Vie" current={Math.min(maxHp, ps?.hp?.current ?? maxHp)} max={maxHp} />
                </div>
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="text-left text-stone-500 uppercase text-[9px]">
                            <th className="border-b border-stone-300 py-0.5">Attaque</th>
                            <th className="border-b border-stone-300 py-0.5 w-16 text-center">Valeur</th>
                            <th className="border-b border-stone-300 py-0.5 w-20">DM</th>
                            <th className="border-b border-stone-300 py-0.5">Spécial</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td className="py-0.5">Contact</td><td className="text-center font-bold">{sign(contact)}</td><td>—</td><td className="text-stone-500">FOR</td></tr>
                        <tr><td className="py-0.5">Distance</td><td className="text-center font-bold">{sign(distance)}</td><td>—</td><td className="text-stone-500">AGI</td></tr>
                        <tr><td className="py-0.5">Magie</td><td className="text-center font-bold">{sign(magic)}</td><td>—</td><td className="text-stone-500">VOL</td></tr>
                        {weapons.map((w, i) => (
                            <tr key={i} className="border-t border-stone-200">
                                <td className="py-0.5 font-medium">{w.name}</td>
                                <td className="text-center font-bold">{w.atkMod ? sign(w.atkMod) : '—'}</td>
                                <td>{w.dmg || '—'}</td>
                                <td className="text-stone-600">{w.special || ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Section>

            {/* Ressources trackables */}
            <Section title="Ressources" avoidBreak>
                <div className="grid grid-cols-4 gap-2">
                    {isMage && <Resource label="Points de Mana" current={ps?.mana?.current ?? manaPoints} max={manaPoints} />}
                    <Resource label="Points de Chance" current={ps?.luck?.current ?? luckPoints} max={luckPoints} />
                    <StatBox label="Dé de récupération" value={recoveryDieString} />
                    <StatBox label="Dé évolutif" value={evolutiveDie} />
                </div>
                {isMage && <p className="text-[10px] text-stone-500 mt-1">Un sort coûte son rang en PM (indiqué sur chaque sort ci-dessous).</p>}
            </Section>

            {/* Voies & capacités — descriptions complètes */}
            <Section title="Voies & capacités">
                <div className="space-y-3">
                    {voies.map((entry, i) => {
                        const v = byIri.get(entry.voie);
                        const caps = (v?.capabilities ?? []).filter(c => isCapabilityGrantedByEntry(c.rank, entry));
                        return (
                            <div key={i} style={{ breakInside: 'avoid' }}>
                                <div className="text-sm font-bold text-stone-800 border-b border-stone-200 mb-1">
                                    {v?.name || 'Voie'} <span className="text-[10px] font-normal text-stone-500">({srcLabel(entry.source)} · rang {entry.rank})</span>
                                </div>
                                <div className="space-y-1.5">
                                    {caps.map((c, j) => {
                                        const dice = c.rank != null ? getResolvedDice(entry.voie, c.rank) : undefined;
                                        const chosen = c.rank != null ? (entry.choices?.[String(c.rank)] as string | undefined) : undefined;
                                        return (
                                            <div key={j} style={{ breakInside: 'avoid' }}>
                                                <div className="text-xs">
                                                    <span className="font-bold text-stone-800">Rang {c.rank} — {c.name}</span>
                                                    {c.isSpell && <span className="ml-1 text-[9px] font-bold uppercase text-indigo-700 border border-indigo-300 rounded px-1">Sort · {c.rank} PM</span>}
                                                    {dice && <span className="ml-1 text-[10px] text-stone-500">[{dice}]</span>}
                                                </div>
                                                {c.description && <p className="text-[11px] text-stone-700 leading-snug ml-1">{c.description}</p>}
                                                {chosen && <p className="text-[10px] text-stone-600 ml-1"><em>Choix : {chosen}</em></p>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* Équipement */}
            <Section title="Équipement" avoidBreak>
                <Field label="Protection">
                    {[protection?.armor?.name && `${protection.armor.name} (DEF +${protection.armor.def}${protection.armor.agiMax != null ? `, AGI max ${sign(protection.armor.agiMax)}` : ''})`,
                      protection?.shield?.name && `${protection.shield.name} (DEF +${protection.shield.def})`]
                        .filter(Boolean).join(' · ') || '—'}
                </Field>
                {inventory.length > 0 && <Field label="Inventaire">{inventory.join(', ')}</Field>}
                <Field label="Bourse">{moneyStr}</Field>
                {magicItems.length > 0 && (
                    <Field label="Objets magiques">
                        {magicItems.map(m => `${m.name} (${m.target} ${sign(m.value)}${m.equipped ? ', équipé' : ''})`).join(' · ')}
                    </Field>
                )}
            </Section>

            {/* Aide de table */}
            {(activeStates.length > 0 || usages.length > 0 || companions.length > 0) && (
                <Section title="Aide de table" avoidBreak>
                    {activeStates.length > 0 && (
                        <Field label="États activables">
                            {activeStates.map(s => `${s.name} (${s.target} ${sign(s.value)})${s.active ? ' ✔' : ''}`).join(' · ')}
                        </Field>
                    )}
                    {usages.length > 0 && (
                        <div className="text-xs text-stone-700 mt-1">
                            <strong className="text-stone-800">Usages limités :</strong>
                            <ul className="ml-3 mt-0.5 space-y-0.5">
                                {usages.map((u, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <CheckBoxes used={u.used} max={u.max} />
                                        <span>{u.name} <span className="text-stone-500">/ {u.per}</span></span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {companions.length > 0 && (
                        <div className="text-xs text-stone-700 mt-1">
                            <strong className="text-stone-800">Compagnons & invocations :</strong>
                            <ul className="ml-3 mt-0.5 space-y-0.5">
                                {companions.map((c, i) => (
                                    <li key={i}>{c.name} — PV {c.hp.current}/{c.hp.max} · DEF {c.def} · Init {c.init}{c.notes ? ` · ${c.notes}` : ''}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Section>
            )}

            {/* Personnage & notes */}
            <Section title="Personnage" avoidBreak>
                {(rp?.ideal || rp?.flaw || rp?.secret) && (
                    <>
                        {rp?.ideal && <Field label="Idéal">{rp.ideal}</Field>}
                        {rp?.flaw && <Field label="Trait / faiblesse">{rp.flaw}</Field>}
                        {rp?.secret && <Field label="Secret">{rp.secret}</Field>}
                    </>
                )}
                {(physical?.age || physical?.height || physical?.weight) && (
                    <Field label="Physique">
                        {[physical?.age && `âge ${physical.age}`, physical?.height && `taille ${physical.height}`, physical?.weight && `poids ${physical.weight}`].filter(Boolean).join(' · ')}
                    </Field>
                )}
                <Field label="Langues">{[...new Set([...base, ...languages.filter(Boolean)])].join(', ')}</Field>
                {talents.length > 0 && <Field label="Talents">{talents.join(', ')}</Field>}
            </Section>

            <Section title="Notes">
                {rp?.notes && <p className="text-[11px] text-stone-700 whitespace-pre-line">{rp.notes}</p>}
                <BlankLines count={6} />
            </Section>
        </div>
    );
};
