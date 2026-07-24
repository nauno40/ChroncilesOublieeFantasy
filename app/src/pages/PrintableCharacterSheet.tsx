import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCharacterData } from '../hooks/useCharacterData';
import { useCharacterSheet } from '../hooks/useCharacterSheet';
import { attackValue, attackCarac, baseLanguages, isCapabilityGrantedByEntry, buildVoieIndex, findRace, findProfile, type Stats } from '../domain/rules';

const CARACS: (keyof Stats)[] = ['FOR', 'AGI', 'CON', 'PER', 'INT', 'CHA', 'VOL'];
const sign = (n: number) => `${n >= 0 ? '+' : ''}${n}`;

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="border border-stone-400 rounded px-2 py-1 text-center">
        <div className="text-[9px] uppercase tracking-wider text-stone-500">{label}</div>
        <div className="text-base font-bold text-stone-900">{value}</div>
    </div>
);

/** Fiche de personnage en version imprimable (print-CSS + PDF natif du navigateur).
 *  Lecture seule : réutilise la même dérivation que la fiche écran (valeurs identiques). */
export const PrintableCharacterSheet: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { races, profiles, allVoies } = useCharacterData();
    const {
        character, loading, finalStats, combatStats, mods, maxHp, damageReduction,
        luckPoints, manaPoints, recoveryDieString, evolutiveDie, bonuses, caracTestBonuses,
    } = useCharacterSheet({ races, profiles, allVoies, id, isNew: false, navigate });

    if (loading) return <div className="p-8 text-center">Chargement…</div>;

    // Résolution des noms peuple/profil + de la carte des voies.
    const raceName = findRace(character.race, races)?.name ?? String(character.race ?? '');
    const profileName = findProfile(character.profile, profiles)?.name ?? String(character.profile ?? '');
    const level = character.level ?? 1;

    const byIri = buildVoieIndex(races, profiles, allVoies);

    const subs = character.playState?.caracSubstitutions;
    const contact = attackValue(mods[attackCarac('contact', subs, 'FOR')], level) + bonuses.attaque;
    const distance = attackValue(mods[attackCarac('distance', subs, 'AGI')], level) + bonuses.attaque;
    const magic = attackValue(mods.VOL, level) + bonuses.attaque;

    const voies = character.characterVoies ?? [];
    const languages = character.playState?.languages ?? [];
    const talents = character.playState?.talents ?? [];
    const base = baseLanguages(raceName);
    const weapons = character.playState?.weapons ?? [];
    const protection = character.playState?.protection;

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
            <section className="mb-4" style={{ breakInside: 'avoid' }}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Caractéristiques</h2>
                <div className="grid grid-cols-7 gap-2">
                    {CARACS.map(c => (
                        <div key={c} className="border border-stone-400 rounded px-1 py-1 text-center">
                            <div className="text-[10px] uppercase font-bold text-stone-500">{c}</div>
                            <div className="text-lg font-bold">{sign(finalStats[c])}</div>
                            {(caracTestBonuses?.[c] ?? 0) > 0 && <div className="text-[8px] text-stone-500">tests {sign(caracTestBonuses![c]!)}</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats dérivées */}
            <section className="mb-4" style={{ breakInside: 'avoid' }}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Statistiques</h2>
                <div className="grid grid-cols-5 gap-2">
                    <Stat label="PV max" value={maxHp} />
                    <Stat label="DEF" value={combatStats.def} />
                    <Stat label="Init." value={combatStats.init} />
                    <Stat label="RD" value={damageReduction} />
                    <Stat label="Dé récup." value={recoveryDieString} />
                    <Stat label="Chance" value={luckPoints} />
                    <Stat label="Mana" value={manaPoints} />
                    <Stat label="Dé évolutif" value={evolutiveDie} />
                    <Stat label="Atk contact" value={sign(contact)} />
                    <Stat label="Atk distance" value={sign(distance)} />
                    <Stat label="Atk magie" value={sign(magic)} />
                </div>
            </section>

            {/* Voies & capacités */}
            <section className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Voies & capacités</h2>
                <div className="space-y-2">
                    {voies.filter(e => e.voie).map((entry, i) => {
                        const v = byIri.get(entry.voie);
                        const caps = (v?.capabilities ?? []).filter(c => isCapabilityGrantedByEntry(c.rank, entry));
                        return (
                            <div key={i} style={{ breakInside: 'avoid' }}>
                                <div className="text-sm font-bold">{v?.name || 'Voie'} <span className="text-[10px] font-normal text-stone-500">(rang {entry.rank}{entry.source === 'trait' ? ' · octroi' : ''})</span></div>
                                <ul className="ml-4 text-xs text-stone-700 list-disc">
                                    {caps.map((c, j) => (
                                        <li key={j}>Rang {c.rank} — {c.name}{c.isSpell ? ` (${c.rank} PM)` : ''}</li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Équipement */}
            <section className="mb-4" style={{ breakInside: 'avoid' }}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Équipement</h2>
                <p className="text-xs text-stone-700">
                    <strong>Protection :</strong>{' '}
                    {[protection?.armor?.name && `${protection.armor.name} (DEF +${protection.armor.def})`,
                      protection?.shield?.name && `${protection.shield.name} (DEF +${protection.shield.def})`]
                        .filter(Boolean).join(' · ') || '—'}
                </p>
                {weapons.filter(w => w.name).length > 0 && (
                    <ul className="ml-4 text-xs text-stone-700 list-disc mt-1">
                        {weapons.filter(w => w.name).map((w, i) => (
                            <li key={i}>{w.name}{w.dmg ? ` — ${w.dmg} DM` : ''}{w.special ? ` (${w.special})` : ''}</li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Langues */}
            <section className="mb-4" style={{ breakInside: 'avoid' }}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Langues & talents</h2>
                <p className="text-xs text-stone-700">
                    <strong>Langues :</strong> {[...base, ...languages.filter(Boolean)].join(', ')}
                </p>
                {talents.filter(Boolean).length > 0 && (
                    <p className="text-xs text-stone-700"><strong>Talents :</strong> {talents.filter(Boolean).join(', ')}</p>
                )}
            </section>
        </div>
    );
};
