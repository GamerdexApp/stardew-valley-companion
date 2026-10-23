import {
  artifacts,
  collections,
  cooking,
  crafting,
  crops,
  fish,
  goldenWalnuts,
  minerals,
} from "stardew-valley-data";
import type { GameData } from "@/types";

export interface ProgressCount {
  current: number;
  total: number;
}

// The in-game collections list leaves out these fish.
const FISH_NOT_IN_COLLECTION = new Set([
  "Son of Crimsonfish",
  "Ms. Angler",
  "Legend II",
  "Radioactive Carp",
  "Glacierfish Jr.",
]);

export const collectionFish = fish()
  .get()
  .filter((f) => !FISH_NOT_IN_COLLECTION.has(f.name));

// The Wedding Ring is a special item and does not count towards the crafting total.
const collectionFishIds = new Set(collectionFish.map((f) => f.id));

export const isInFishCollection = (fishId: string): boolean =>
  collectionFishIds.has(fishId);

export const collectionCrafting = crafting()
  .get()
  .filter((recipe) => recipe.name !== "Wedding Ring");

export const collectionArtifacts = artifacts().get();

const shippedItemIds = new Set(
  collections()
    .itemsShipped()
    .get()
    .map((item) => item.id),
);

/** The crops the shipping collection lists. Qi Fruit is a crop that cannot be shipped for it. */
export const shippableCrops = crops()
  .get()
  .filter((crop) => shippedItemIds.has(crop.id));

export const collectionDishes = cooking().get();

export const collectionMinerals = minerals().mineralItems().get();

export const allGoldenWalnuts = goldenWalnuts().get();

const WALNUT_TOTAL = allGoldenWalnuts.reduce((sum, w) => sum + w.amount, 0);

export function countFishCaught(gameData: GameData): ProgressCount {
  const caughtIds = new Set(gameData.fishCaught.map((f) => f.id));
  return {
    current: collectionFish.filter((f) => caughtIds.has(f.id)).length,
    total: collectionFish.length,
  };
}

export function countArtifactsFound(gameData: GameData): ProgressCount {
  return {
    current: collectionArtifacts.filter(
      (artifact) => gameData.artifacts[artifact.id]?.found === true,
    ).length,
    total: collectionArtifacts.length,
  };
}

export function countMineralsFound(gameData: GameData): ProgressCount {
  return {
    current: collectionMinerals.filter(
      (mineral) => gameData.minerals[mineral.id]?.found === true,
    ).length,
    total: collectionMinerals.length,
  };
}

export function countCropsShipped(gameData: GameData): ProgressCount {
  return {
    current: shippableCrops.filter(
      (crop) => gameData.shipped[crop.id]?.shipped === true,
    ).length,
    total: shippableCrops.length,
  };
}

export function countCookingMade(gameData: GameData): ProgressCount {
  return {
    current: collectionDishes.filter(
      (dish) => gameData.cookingRecipes[dish.name]?.cooked === true,
    ).length,
    total: collectionDishes.length,
  };
}

export function countCraftingMade(gameData: GameData): ProgressCount {
  return {
    current: collectionCrafting.filter(
      (recipe) => gameData.craftingRecipes[recipe.name]?.crafted,
    ).length,
    total: collectionCrafting.length,
  };
}

// A save file reports goldenWalnutsFound. A hand-edited playthrough only has the per-spot map.
export function countWalnutsFound(gameData: GameData): ProgressCount {
  const current =
    gameData.goldenWalnutsFound > 0
      ? gameData.goldenWalnutsFound
      : Object.keys(gameData.goldenWalnuts).length;
  return { current, total: WALNUT_TOTAL };
}
