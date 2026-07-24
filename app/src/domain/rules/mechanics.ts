import type { MagicItem, ItemBonusTarget, ActiveState, Usage, UsagePeriod, Companion, Form } from '../../types/character';

// Somme les bonus des objets magiques ÉQUIPÉS par cible (piloté joueur, jamais persisté).
export const computeItemBonuses = (
  items: MagicItem[] | undefined,
): Record<ItemBonusTarget, number> => {
  const acc: Record<ItemBonusTarget, number> = { def: 0, init: 0, pv: 0, rd: 0, attaque: 0, dm: 0 };
  (items ?? []).forEach(it => {
    if (it.equipped && it.target in acc) acc[it.target] += it.value || 0;
  });
  return acc;
};

// Somme les bonus des états ACTIFS par cible (piloté joueur, jamais persisté).
export const computeActiveStateBonuses = (
  states: ActiveState[] | undefined,
): Record<ItemBonusTarget, number> => {
  const acc: Record<ItemBonusTarget, number> = { def: 0, init: 0, pv: 0, rd: 0, attaque: 0, dm: 0 };
  (states ?? []).forEach(s => { if (s.active && s.target in acc) acc[s.target] += s.value || 0; });
  return acc;
};

// (Dés)active un état ; en activant un état d'un `group`, désactive les autres du même groupe.
export const activateState = (
  states: ActiveState[] | undefined,
  idx: number,
  active: boolean,
): ActiveState[] => {
  const list = states ?? [];
  const grp = list[idx]?.group;
  return list.map((s, i) => {
    if (i === idx) return { ...s, active };
    if (active && grp && s.group === grp) return { ...s, active: false }; // exclusion de groupe
    return s;
  });
};

// Remet `used` à 0 pour les usages dont la période figure dans `periods` (repos/reset).
// Pur : renvoie une nouvelle liste, ne mute pas l'entrée d'origine.
export const resetUsages = (
  usages: Usage[] | undefined,
  periods: UsagePeriod[],
): Usage[] => (usages ?? []).map(u => (periods.includes(u.per) ? { ...u, used: 0 } : u));

// Pré-remplit un compagnon depuis une créature du bestiaire (nom, PV, DEF, Init, IRI).
export const companionFromCreature = (
  c: { id?: number; name?: string; hp?: number; def?: number; init?: number },
): Companion => ({
  name: c.name ?? '',
  ref: c.id != null ? `/api/creatures/${c.id}` : undefined,
  hp: { current: c.hp ?? 0, max: c.hp ?? 0 },
  def: c.def ?? 0,
  init: c.init ?? 0,
});

// Pré-remplit une forme depuis une créature du bestiaire (réutilise companionFromCreature).
export const formFromCreature = (
  c: { id?: number; name?: string; hp?: number; def?: number; init?: number },
): Form => ({ ...companionFromCreature(c), active: false });

// (Dés)active une forme ; en activer une désactive toutes les autres (exclusivité globale).
export const activateForm = (
  forms: Form[] | undefined,
  idx: number,
  active: boolean,
): Form[] =>
  (forms ?? []).map((f, i) => (i === idx ? { ...f, active } : active ? { ...f, active: false } : f));
