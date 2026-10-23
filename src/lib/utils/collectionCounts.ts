import { crafting, fish, goldenWalnuts } from "stardew-valley-data";
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
export const collectionCrafting = crafting()
  .get()
  .filter((recipe) => recipe.name !== "Wedding Ring");

export const allGoldenWalnuts = goldenWalnuts().get();

const WALNUT_TOTAL = allGoldenWalnuts.reduce((sum, w) => sum + w.amount, 0);

export function countFishCaught(gameData: GameData): ProgressCount {
  const caughtIds = new Set(gameData.fishCaught.map((f) => f.id));
  return {
    current: collectionFish.filter((f) => caughtIds.has(f.id)).length,
    total: collectionFish.length,
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
