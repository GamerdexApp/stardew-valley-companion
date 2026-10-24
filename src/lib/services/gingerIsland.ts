import { goldenWalnuts, jojaParrotCalculator } from "stardew-valley-data";
import type { GoldenWalnut } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { countWalnutsFound } from "@/lib/utils/collectionCounts";
import { ISLAND_UPGRADES } from "@/data/constants/gingerIsland";
import type { IslandUpgradeData } from "@/data/constants/gingerIsland";

const parrot = jojaParrotCalculator();

export const allWalnutSpots: GoldenWalnut[] = goldenWalnuts().get();
export const upgrades: IslandUpgradeData[] = ISLAND_UPGRADES;
export const WALNUT_TOTAL = parrot.total;
export const PARROT_RATE = parrot.costPerWalnut;
export const upgradesCost = upgrades.reduce(
  (sum, upgrade) => sum + upgrade.cost,
  0,
);

export const walnutsFound = (data: GameData): number =>
  countWalnutsFound(data).current;

export const isUnlocked = (data: GameData, upgradeId: string): boolean =>
  Boolean(data.islandUpgrades[upgradeId]);

export interface IslandSummary {
  found: number;
  unlocked: number;
  spent: number;
  available: number;
  remaining: number;
  parrotCost: number;
  spotsFound: number;
}

export const islandSummary = (data: GameData): IslandSummary => {
  const found = walnutsFound(data);
  const unlocked = upgrades.filter((upgrade) => isUnlocked(data, upgrade.id));
  const spent = unlocked.reduce((sum, upgrade) => sum + upgrade.cost, 0);
  return {
    found,
    unlocked: unlocked.length,
    spent,
    available: Math.max(0, found - spent),
    remaining: Math.max(0, WALNUT_TOTAL - found),
    parrotCost: parrot.cost(found),
    spotsFound: allWalnutSpots.filter((spot) => data.goldenWalnuts[spot.id])
      .length,
  };
};

/** A locked upgrade that costs more than the walnuts left shows a warning. It can still be unlocked. */
export const costsMoreThanLeft = (
  data: GameData,
  upgrade: IslandUpgradeData,
): boolean =>
  !isUnlocked(data, upgrade.id) && upgrade.cost > islandSummary(data).available;

const clampFound = (count: number): number =>
  Math.min(WALNUT_TOTAL, Math.max(0, Math.floor(count)));

/** The total is its own number. Ticking a spot changes it, and typing it leaves the spots alone. */
export const setWalnutsFound = (data: GameData, count: number): GameData => ({
  ...data,
  goldenWalnutsFound: clampFound(count),
});

export const setUpgrade = (
  data: GameData,
  upgradeId: string,
  unlocked: boolean,
): GameData => ({
  ...data,
  islandUpgrades: { ...data.islandUpgrades, [upgradeId]: unlocked },
});

export const isSpotFound = (data: GameData, spotId: string): boolean =>
  Boolean(data.goldenWalnuts[spotId]);

/** A spot adds its walnuts to the total when it is ticked and takes them away when it is cleared. */
export const setSpotFound = (
  data: GameData,
  spotId: string,
  found: boolean,
): GameData => {
  const spot = allWalnutSpots.find((item) => item.id === spotId);
  if (!spot || isSpotFound(data, spotId) === found) return data;

  const { [spotId]: _removed, ...others } = data.goldenWalnuts;
  const total = walnutsFound(data);
  return {
    ...data,
    goldenWalnuts: found ? { ...others, [spotId]: 1 } : others,
    goldenWalnutsFound: clampFound(
      found ? total + spot.amount : total - spot.amount,
    ),
  };
};

export type SpotStatusFilter = "all" | "found" | "not-found";

export interface SpotFilters {
  query: string;
  location: string;
  status: SpotStatusFilter;
}

export const ALL_LOCATIONS = "all";

export const emptySpotFilters: SpotFilters = {
  query: "",
  location: ALL_LOCATIONS,
  status: "all",
};

export const isFilteringSpots = (filters: SpotFilters): boolean =>
  filters.query !== "" ||
  filters.location !== ALL_LOCATIONS ||
  filters.status !== "all";

export const spotLocations: { name: string; count: number }[] = [
  ...new Set(allWalnutSpots.map((spot) => spot.location)),
].map((name) => ({
  name,
  count: allWalnutSpots.filter((spot) => spot.location === name).length,
}));

export const filterSpots = (
  data: GameData,
  filters: SpotFilters,
): GoldenWalnut[] => {
  const needle = filters.query.trim().toLowerCase();
  return allWalnutSpots.filter((spot) => {
    const found = isSpotFound(data, spot.id);
    return (
      (spot.name.toLowerCase().includes(needle) ||
        spot.hint.toLowerCase().includes(needle)) &&
      (filters.location === ALL_LOCATIONS ||
        spot.location === filters.location) &&
      (filters.status === "all" || (filters.status === "found") === found)
    );
  });
};

export interface WalnutBarShares {
  spent: number;
  available: number;
  unfound: number;
}

/** Shares of the 130 walnuts that are spent on upgrades, free to spend, and not found yet. */
export const barShares = (summary: IslandSummary): WalnutBarShares => {
  const spent = Math.min(summary.spent, summary.found);
  return {
    spent: spent / WALNUT_TOTAL,
    available: (summary.found - spent) / WALNUT_TOTAL,
    unfound: summary.remaining / WALNUT_TOTAL,
  };
};
