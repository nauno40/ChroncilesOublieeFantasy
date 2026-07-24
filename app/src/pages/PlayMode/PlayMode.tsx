import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Swords, NotebookPen, ScrollText, Dices, Check, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import { useCharacterData } from '../../hooks/useCharacterData';
import { useCharacterSheet } from '../../hooks/useCharacterSheet';
import { useAutosavePlayState, type SaveStatus } from '../../hooks/useAutosavePlayState';
import {
    attackValue, attackCarac, buildVoieIndex, isCapabilityGrantedByEntry, findRace, findProfile,
} from '../../domain/rules';
import type { Character } from '../../types/character';

type Tab = 'perso' | 'notes' | 'campagne' | 'des';
const sign = (n: number) => `${n >= 0 ? '+' : ''}${n}`;

// --- Sous-composants (niveau module) ---

const SaveIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    if (status === 'saving') return <span className="flex items-center gap-1 text-[11px] text-stone-400"><Loader2 size={12} className="animate-spin" /> Enregistrement…</span>;
    if (status === 'saved') return <span className="flex items-center gap-1 text-[11px] text-green-500"><Check size={12} /> Enregistré</span>;
    if (status === 'error') return <span className="flex items-center gap-1 text-[11px] text-red-400"><AlertTriangle size={12} /> Erreur</span>;
    return <span className="text-[11px] text-stone-600">À jour</span>;
};

// Tracker « courant / max » avec gros boutons tactiles (−/+).
const Tracker: React.FC<{ label: string; current: number; max: number; onChange: (v: number) => void; color: string }> = ({ label, current, max, onChange, color }) => (
    <div className="flex-1 min-w-[8rem] bg-stone-900/50 border border-white/10 rounded-2xl p-3 text-center">
        <div className={`text-[10px] uppercase font-black tracking-widest ${color}`}>{label}</div>
        <div className="flex items-center justify-center gap-2 mt-1">
            <button onClick={() => onChange(current - 1)} className="w-11 h-11 rounded-xl bg-stone-800 active:bg-red-900/60 text-red-400 text-2xl font-bold flex items-center justify-center border border-white/5 active:scale-95 transition-all">−</button>
            <div className="min-w-[3.5rem]">
                <span className="text-3xl font-display font-bold text-white tabular-nums">{current}</span>
                <span className="text-stone-500 text-sm"> / {max}</span>
            </div>
            <button onClick={() => onChange(current + 1)} className="w-11 h-11 rounded-xl bg-stone-800 active:bg-green-900/60 text-green-400 text-2xl font-bold flex items-center justify-center border border-white/5 active:scale-95 transition-all">+</button>
        </div>
    </div>
);

const Chip: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="bg-stone-900/40 border border-white/5 rounded-xl px-3 py-2 text-center min-w-[4.5rem]">
        <div className="text-[9px] uppercase tracking-wider text-stone-500">{label}</div>
        <div className="text-lg font-bold text-stone-200 leading-tight">{value}</div>
    </div>
);

const Collapsible: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen }) => (
    <details open={defaultOpen} className="group bg-stone-900/30 border border-white/5 rounded-2xl overflow-hidden">
        <summary className="cursor-pointer list-none select-none flex items-center justify-between px-4 py-3 text-sm font-display font-bold uppercase tracking-wider text-primary-400/90">
            {title}
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 space-y-3">{children}</div>
    </details>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${active ? 'text-primary-400' : 'text-stone-500'}`}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
);

const Stub: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-stone-600 gap-2 py-20">
        <span className="text-sm">{label}</span>
        <span className="text-[11px]">Bientôt.</span>
    </div>
);

/** Mode session joueur (mobile-first) : perso éditable au doigt + auto-save. Volet 1 (onglet Perso). */
export const PlayMode: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>('perso');
    const { races, profiles, allVoies } = useCharacterData();
    const {
        character, setCharacter, loading, combatStats, mods, maxHp, damageReduction,
        luckPoints, manaPoints, recoveryDieString, evolutiveDie, bonuses, getResolvedDice,
    } = useCharacterSheet({ races, profiles, allVoies, id, isNew: false, navigate });

    const saveStatus = useAutosavePlayState(id, character.playState, !loading);

    if (loading) return <div className="min-h-screen bg-stone-950 text-stone-300 flex items-center justify-center">Chargement…</div>;

    const ps = character.playState;
    const raceName = findRace(character.race, races)?.name ?? '';
    const profileName = findProfile(character.profile, profiles)?.name ?? '';
    const level = character.level ?? 1;
    const isMage = manaPoints > 0;

    const setPs = (patch: Partial<NonNullable<Character['playState']>>) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, ...patch } }));

    const hpCurrent = Math.min(maxHp, ps?.hp?.current ?? maxHp);
    const setHp = (v: number) => setPs({ hp: { ...ps!.hp, current: Math.max(0, Math.min(maxHp, v)) } });
    const manaCurrent = Math.min(manaPoints, ps?.mana?.current ?? manaPoints);
    const setMana = (v: number) => setPs({ mana: { ...ps!.mana, current: Math.max(0, Math.min(manaPoints, v)) } });
    const luckCurrent = Math.min(luckPoints, ps?.luck?.current ?? luckPoints);
    const setLuck = (v: number) => setPs({ luck: { ...ps!.luck, current: Math.max(0, Math.min(luckPoints, v)) } });

    const subs = ps?.caracSubstitutions;
    const contact = attackValue(mods[attackCarac('contact', subs, 'FOR')], level) + bonuses.attaque;
    const distance = attackValue(mods[attackCarac('distance', subs, 'AGI')], level) + bonuses.attaque;
    const magic = attackValue(mods.VOL, level) + bonuses.attaque;

    const byIri = buildVoieIndex(races, profiles, allVoies);
    const voies = (character.characterVoies ?? []).filter(e => e.voie && e.rank >= 1);
    const weapons = (ps?.weapons ?? []).filter(w => w.name);
    const activeStates = (ps?.activeStates ?? []);
    const usages = (ps?.usages ?? []);

    const toggleState = (i: number) => setPs({ activeStates: activeStates.map((s, j) => j === i ? { ...s, active: !s.active } : s) });
    const spendUsage = (i: number, delta: number) => setPs({ usages: usages.map((u, j) => j === i ? { ...u, used: Math.max(0, Math.min(u.max, u.used + delta)) } : u) });

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200 pb-20" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {/* En-tête */}
            <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
                <Link to={`/characters/${id}`} className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-stone-400 active:scale-95"><ChevronLeft size={20} /></Link>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-display font-bold text-white truncate leading-tight">{character.name || 'Personnage'}</h1>
                    <p className="text-[11px] text-stone-500 truncate">{[raceName, profileName].filter(Boolean).join(' · ')} — Niv {level}</p>
                </div>
                <SaveIndicator status={saveStatus} />
            </header>

            <main className="p-4 space-y-4 max-w-2xl mx-auto">
                {tab === 'perso' && (
                    <>
                        {/* Trackers */}
                        <div className="flex flex-wrap gap-2">
                            <Tracker label="Points de Vie" current={hpCurrent} max={maxHp} onChange={setHp} color="text-green-500" />
                            {isMage && <Tracker label="Mana" current={manaCurrent} max={manaPoints} onChange={setMana} color="text-blue-400" />}
                            <Tracker label="Chance" current={luckCurrent} max={luckPoints} onChange={setLuck} color="text-amber-400" />
                        </div>

                        {/* Stats de combat (lecture) */}
                        <div className="flex flex-wrap gap-2">
                            <Chip label="DEF" value={combatStats.def} />
                            <Chip label="Init." value={combatStats.init} />
                            <Chip label="RD" value={damageReduction} />
                            <Chip label="Dé récup." value={recoveryDieString} />
                            <Chip label="Dé évo." value={evolutiveDie} />
                        </div>

                        {/* Attaques */}
                        <div className="grid grid-cols-3 gap-2">
                            <Chip label="Atk contact" value={sign(contact)} />
                            <Chip label="Atk distance" value={sign(distance)} />
                            <Chip label="Atk magie" value={sign(magic)} />
                        </div>

                        {/* États actifs */}
                        {activeStates.length > 0 && (
                            <Collapsible title="États activables" defaultOpen>
                                <div className="space-y-2">
                                    {activeStates.map((s, i) => (
                                        <button key={i} onClick={() => toggleState(i)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all active:scale-[0.99] ${s.active ? 'bg-primary-500/15 border-primary-500/50 text-primary-200' : 'bg-stone-900/50 border-white/5 text-stone-400'}`}>
                                            <span>{s.name} <span className="text-[11px] opacity-70">({s.target} {sign(s.value)})</span></span>
                                            <span className={`text-[10px] font-bold uppercase ${s.active ? 'text-primary-300' : 'text-stone-600'}`}>{s.active ? 'Actif' : 'Inactif'}</span>
                                        </button>
                                    ))}
                                </div>
                            </Collapsible>
                        )}

                        {/* Usages limités */}
                        {usages.length > 0 && (
                            <Collapsible title="Usages limités" defaultOpen>
                                <div className="space-y-2">
                                    {usages.map((u, i) => (
                                        <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-900/50 border border-white/5">
                                            <span className="text-sm text-stone-300">{u.name} <span className="text-[11px] text-stone-500">/ {u.per}</span></span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => spendUsage(i, 1)} className="w-9 h-9 rounded-lg bg-stone-800 text-red-400 text-lg font-bold active:scale-95">−</button>
                                                <span className="tabular-nums text-sm w-12 text-center">{u.max - u.used} / {u.max}</span>
                                                <button onClick={() => spendUsage(i, -1)} className="w-9 h-9 rounded-lg bg-stone-800 text-green-400 text-lg font-bold active:scale-95">+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Collapsible>
                        )}

                        {/* Capacités & sorts */}
                        <Collapsible title="Capacités & sorts">
                            <div className="space-y-3">
                                {voies.map((entry, i) => {
                                    const v = byIri.get(entry.voie);
                                    const caps = (v?.capabilities ?? []).filter(c => isCapabilityGrantedByEntry(c.rank, entry));
                                    return (
                                        <div key={i}>
                                            <div className="text-xs font-bold text-stone-300 border-b border-white/5 mb-1">{v?.name || 'Voie'} <span className="text-[10px] font-normal text-stone-500">(rang {entry.rank})</span></div>
                                            <div className="space-y-1.5">
                                                {caps.map((c, j) => {
                                                    const dice = c.rank != null ? getResolvedDice(entry.voie, c.rank) : undefined;
                                                    return (
                                                        <div key={j} className="text-[13px]">
                                                            <div><span className="font-bold text-stone-200">R{c.rank} — {c.name}</span>{c.isSpell && <span className="ml-1 text-[9px] font-bold uppercase text-indigo-400 border border-indigo-500/40 rounded px-1">Sort · {c.rank} PM</span>}{dice && <span className="ml-1 text-[10px] text-stone-500">[{dice}]</span>}</div>
                                                            {c.description && <p className="text-[12px] text-stone-400 leading-snug">{c.description}</p>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Collapsible>

                        {/* Équipement */}
                        <Collapsible title="Équipement">
                            <p className="text-xs text-stone-400"><strong className="text-stone-300">Protection :</strong> {[ps?.protection?.armor?.name && `${ps.protection.armor.name} (DEF +${ps.protection.armor.def})`, ps?.protection?.shield?.name && `${ps.protection.shield.name} (DEF +${ps.protection.shield.def})`].filter(Boolean).join(' · ') || '—'}</p>
                            {weapons.length > 0 && (
                                <ul className="text-xs text-stone-400 space-y-0.5">
                                    {weapons.map((w, i) => <li key={i}>{w.name}{w.atkMod ? ` · ${sign(w.atkMod)}` : ''}{w.dmg ? ` · ${w.dmg} DM` : ''}{w.special ? ` (${w.special})` : ''}</li>)}
                                </ul>
                            )}
                            <p className="text-xs text-stone-500">Bourse : {ps?.money ? [ps.money.po && `${ps.money.po} po`, `${ps.money.pa ?? 0} pa`, ps.money.pc && `${ps.money.pc} pc`].filter(Boolean).join(' · ') : '—'}</p>
                        </Collapsible>
                    </>
                )}
                {tab === 'notes' && <Stub label="Prise de notes" />}
                {tab === 'campagne' && <Stub label="Historique & résumé de campagne" />}
                {tab === 'des' && <Stub label="Lanceur de dés" />}
            </main>

            {/* Barre d'onglets (bas) */}
            <nav className="fixed bottom-0 inset-x-0 z-10 bg-stone-950/95 backdrop-blur border-t border-white/10 flex max-w-2xl mx-auto">
                <TabButton active={tab === 'perso'} onClick={() => setTab('perso')} icon={<Swords size={20} />} label="Perso" />
                <TabButton active={tab === 'notes'} onClick={() => setTab('notes')} icon={<NotebookPen size={20} />} label="Notes" />
                <TabButton active={tab === 'campagne'} onClick={() => setTab('campagne')} icon={<ScrollText size={20} />} label="Campagne" />
                <TabButton active={tab === 'des'} onClick={() => setTab('des')} icon={<Dices size={20} />} label="Dés" />
            </nav>
        </div>
    );
};
