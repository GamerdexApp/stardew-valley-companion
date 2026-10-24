import { crafting as queryCrafting } from "stardew-valley-data";
import type { CraftingRecipe } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import {
  collectionCrafting,
  countCraftingMade,
} from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { isLearned, recipeStatus } from "./recipes";

export const allRecipes: CraftingRecipe[] = queryCrafting().sortByName().get();

const collectionNames = new Set(
  collectionCrafting.map((recipe) => recipe.name),
);

/** The in-game collection leaves out the Wedding Ring, a special item. */
export const isInCraftingCollection = (recipe: CraftingRecipe): boolean =>
  collectionNames.has(recipe.name);

export const categories: string[] = [
  ...new Set(allRecipes.map((recipe) => recipe.category)),
].sort((a, b) => a.localeCompare(b));

export type CraftingStatusFilter =
  "all" | "crafted" | "learned" | "not-learned";

export interface CraftingFilters {
  query: string;
  status: CraftingStatusFilter;
  /** "all" or one category name. */
  category: string;
}

export const emptyCraftingFilters: CraftingFilters = {
  query: "",
  status: "all",
  category: "all",
};

export const isFilteringCrafting = (filters: CraftingFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyCraftingFilters);

const STATUS_OF_FILTER = {
  crafted: "done",
  learned: "learned",
  "not-learned": "not-learned",
} as const;

/** Learned means learned and not crafted yet. Not learned means the recipe is unknown. */
export const filterRecipes = (
  data: GameData,
  filters: CraftingFilters,
): CraftingRecipe[] => {
  const needle = filters.query.trim().toLowerCase();
  return allRecipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(needle) &&
      (filters.status === "all" ||
        recipeStatus(data, "crafting", recipe.name) ===
          STATUS_OF_FILTER[filters.status]) &&
      (filters.category === "all" || recipe.category === filters.category),
  );
};

export interface RecipeGroup {
  category: string;
  recipes: CraftingRecipe[];
  crafted: number;
}

/** The recipes grouped by category in alphabetical order, with how many of each are crafted. */
export const groupByCategory = (
  data: GameData,
  recipes: CraftingRecipe[],
): RecipeGroup[] =>
  categories
    .map((category) => {
      const inGroup = recipes.filter((recipe) => recipe.category === category);
      return {
        category,
        recipes: inGroup,
        crafted: inGroup.filter(
          (recipe) => recipeStatus(data, "crafting", recipe.name) === "done",
        ).length,
      };
    })
    .filter((group) => group.recipes.length > 0);

export interface CraftingSummary {
  total: number;
  notInCollection: number;
  learned: number;
  crafted: ProgressCount;
}

export const craftingSummary = (data: GameData): CraftingSummary => ({
  total: allRecipes.length,
  notInCollection: allRecipes.length - collectionCrafting.length,
  learned: collectionCrafting.filter((recipe) =>
    isLearned(recipeStatus(data, "crafting", recipe.name)),
  ).length,
  crafted: countCraftingMade(data),
});
