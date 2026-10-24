import { cooking as queryCooking } from "stardew-valley-data";
import type { CookedDish } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { countCookingMade } from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { isLearned, recipeStatus } from "./recipes";

export const allDishes: CookedDish[] = queryCooking().sortByName().get();

export type CookingStatusFilter = "all" | "cooked" | "learned" | "not-learned";
export type CookingSourceFilter =
  | "all"
  | "queen-of-sauce"
  | "friendship"
  | "purchase"
  | "skill"
  | "default"
  | "cutscene";

export interface CookingFilters {
  query: string;
  status: CookingStatusFilter;
  source: CookingSourceFilter;
}

export const emptyCookingFilters: CookingFilters = {
  query: "",
  status: "all",
  source: "all",
};

export const isFilteringCooking = (filters: CookingFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyCookingFilters);

const STATUS_OF_FILTER = {
  cooked: "done",
  learned: "learned",
  "not-learned": "not-learned",
} as const;

/** Learned means learned and not cooked yet. Not learned means the recipe is unknown. */
export const filterDishes = (
  data: GameData,
  filters: CookingFilters,
): CookedDish[] => {
  const needle = filters.query.trim().toLowerCase();
  return allDishes.filter(
    (dish) =>
      dish.name.toLowerCase().includes(needle) &&
      (filters.status === "all" ||
        recipeStatus(data, "cooking", dish.name) ===
          STATUS_OF_FILTER[filters.status]) &&
      (filters.source === "all" ||
        dish.recipeSources.some((source) => source.type === filters.source)),
  );
};

export interface CookingSummary {
  total: number;
  learned: number;
  cooked: ProgressCount;
}

export const cookingSummary = (data: GameData): CookingSummary => ({
  total: allDishes.length,
  learned: allDishes.filter((dish) =>
    isLearned(recipeStatus(data, "cooking", dish.name)),
  ).length,
  cooked: countCookingMade(data),
});

/** The package leaves out an energy or health value of zero. */
export const energyAndHealth = (
  dish: CookedDish,
): { energy: number; health: number } => ({
  energy: dish.energyHealth.energy ?? 0,
  health: dish.energyHealth.health ?? 0,
});

/** The length of a buff, given in seconds by the data package. */
export const buffMinutes = (
  seconds: number,
): { minutes: number; seconds: number } => ({
  minutes: Math.floor(seconds / 60),
  seconds: seconds % 60,
});
