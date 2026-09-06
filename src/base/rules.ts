// Rules-table accessors for the base sim. The data tables (src/data/*.ts) are authored separately; this thin layer
// tolerates either array or id-keyed-record exports so the sim only ever deals in typed defs.
import type { FacilityDef, ItemDef, CraftTypeDef, CraftWeaponDef, RegionDef } from '../data/types';
import { FACILITIES } from '../data/facilities';
import { ITEMS } from '../data/items';
import { CRAFT, CRAFT_WEAPONS } from '../data/craft';
import { REGIONS } from '../data/countries';
import { FUNDING } from '../data/score';

function asList<T extends { id: string }>(t: unknown): T[] {
  if (!t) return [];
  if (Array.isArray(t)) return t as T[];
  if (t instanceof Map) return [...(t as Map<string, T>).values()];
  return Object.values(t as Record<string, T>);
}
function index<T extends { id: string }>(t: unknown): Map<string, T> {
  const m = new Map<string, T>();
  for (const d of asList<T>(t)) m.set(d.id, d);
  return m;
}
let facMap: Map<string, FacilityDef> | null = null;
let itemMap: Map<string, ItemDef> | null = null;
let craftMap: Map<string, CraftTypeDef> | null = null;
let cwMap: Map<string, CraftWeaponDef> | null = null;
let regionList: RegionDef[] | null = null;

export const allFacilities = (): FacilityDef[] => [...(facMap ??= index<FacilityDef>(FACILITIES)).values()];
export const facilityDef = (id: string): FacilityDef | undefined => (facMap ??= index<FacilityDef>(FACILITIES)).get(id);
export const allItems = (): ItemDef[] => [...(itemMap ??= index<ItemDef>(ITEMS)).values()];
export const itemDef = (id: string): ItemDef | undefined => (itemMap ??= index<ItemDef>(ITEMS)).get(id);
export const allCraftTypes = (): CraftTypeDef[] => [...(craftMap ??= index<CraftTypeDef>(CRAFT)).values()];
export const craftDef = (id: string): CraftTypeDef | undefined => (craftMap ??= index<CraftTypeDef>(CRAFT)).get(id);
export const allCraftWeapons = (): CraftWeaponDef[] => [...(cwMap ??= index<CraftWeaponDef>(CRAFT_WEAPONS)).values()];
export const craftWeaponDef = (id: string): CraftWeaponDef | undefined => (cwMap ??= index<CraftWeaponDef>(CRAFT_WEAPONS)).get(id);
/** Craft weapon def whose launcher item is `storeItem`. */
export const craftWeaponForItem = (itemId: string): CraftWeaponDef | undefined => allCraftWeapons().find((w) => w.storeItem === itemId || w.id === itemId);
export const allRegions = (): RegionDef[] => (regionList ??= asList<RegionDef>(REGIONS));
export const regionDef = (id: string): RegionDef | undefined => allRegions().find((r) => r.id === id);

/** Lift facility id (the def flagged `lift`, else 'access-lift'). */
export const liftDefId = (): string => allFacilities().find((f) => f.lift)?.id ?? 'access-lift';

export type PersonnelKind = 'soldier' | 'scientist' | 'engineer';
// Original 1994 values as fallbacks; the FUNDING table wins when it carries the figure under any common key.
const HIRE_DEFAULT: Record<PersonnelKind, number> = { soldier: 40_000, scientist: 30_000, engineer: 25_000 };
const SALARY_DEFAULT: Record<PersonnelKind, number> = { soldier: 20_000, scientist: 30_000, engineer: 25_000 };
const num = (...c: unknown[]) => { for (const v of c) if (typeof v === 'number' && Number.isFinite(v)) return v; return undefined; };
function fundingLookup(kind: PersonnelKind, what: 'hire' | 'salary'): number | undefined {
  const F: any = FUNDING ?? {};
  const K = kind, Kc = kind[0].toUpperCase() + kind.slice(1);
  if (what === 'hire') return num(F[`${K}Cost`], F[`${K}Hire`], F[`hire${Kc}`], F[`cost${Kc}`], F.hire?.[K], F.hireCost?.[K], F.costs?.[K], F.recruit?.[K], F[K]?.hire, F[K]?.cost, F.personnel?.[K]?.hire, F.personnel?.[K]?.cost);
  return num(F[`${K}Salary`], F[`salary${Kc}`], F[`${K}Monthly`], F.salary?.[K], F.salaries?.[K], F.monthly?.[K], F.upkeep?.[K], F[K]?.salary, F[K]?.monthly, F.personnel?.[K]?.salary, F.personnel?.[K]?.monthly);
}
export const hireCost = (kind: PersonnelKind): number => fundingLookup(kind, 'hire') ?? HIRE_DEFAULT[kind];
export const salary = (kind: PersonnelKind): number => fundingLookup(kind, 'salary') ?? SALARY_DEFAULT[kind];
/** Hired personnel and purchased craft travel 72 h; items use their own transfer time (24 h default). */
export const PERSONNEL_HOURS = 72;
export const CRAFT_HOURS_DEFAULT = 72;
export const ITEM_HOURS_DEFAULT = 24;
export const itemHours = (d: ItemDef) => (d.transferHours && d.transferHours > 0 ? d.transferHours : ITEM_HOURS_DEFAULT);
export const craftHours = (d: CraftTypeDef) => (d.transferHours && d.transferHours > 0 ? d.transferHours : CRAFT_HOURS_DEFAULT);
