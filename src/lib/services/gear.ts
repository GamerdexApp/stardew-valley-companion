import {
  bait,
  footwear,
  hats,
  rings,
  tackle,
  trinkets,
  weapons,
} from "stardew-valley-data";
import type { Weapon } from "stardew-valley-data";
import type { GearTabId } from "@/data/gear";

export const allWeapons: Weapon[] = weapons().get();
export const allFootwear = footwear().get();
export const allRings = rings().get();
export const allHats = hats().get();
export const allTrinkets = trinkets().get();
export const allBait = bait().get();
export const allTackle = tackle().get();

export const gearCounts: Record<GearTabId, number> = {
  weapons: allWeapons.length,
  footwear: allFootwear.length,
  rings: allRings.length,
  hats: allHats.length,
  trinkets: allTrinkets.length,
  bait: allBait.length,
  tackle: allTackle.length,
};

export const gearTotal: number = Object.values(gearCounts).reduce(
  (sum, count) => sum + count,
  0,
);

export type WeaponType = Weapon["type"];
export type WeaponTypeFilter = "all" | WeaponType;

export const weaponTypes: WeaponType[] = [
  "sword",
  "dagger",
  "club",
  "slingshot",
];

export interface WeaponFilters {
  query: string;
  type: WeaponTypeFilter;
}

export const emptyWeaponFilters: WeaponFilters = { query: "", type: "all" };

export const weaponCount = (type: WeaponType): number =>
  allWeapons.filter((weapon) => weapon.type === type).length;

export const filterWeapons = (filters: WeaponFilters): Weapon[] => {
  const needle = filters.query.trim().toLowerCase();
  return allWeapons.filter(
    (weapon) =>
      weapon.name.toLowerCase().includes(needle) &&
      (filters.type === "all" || weapon.type === filters.type),
  );
};

export const isFilteringWeapons = (filters: WeaponFilters): boolean =>
  filters.query !== "" || filters.type !== "all";
