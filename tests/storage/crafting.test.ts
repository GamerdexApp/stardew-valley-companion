import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allRecipes,
  categories,
  craftingSummary,
  emptyCraftingFilters,
  filterRecipes,
  groupByCategory,
  isFilteringCrafting,
  isInCraftingCollection,
} from "@/service/crafting";
import type { CraftingFilters } from "@/service/crafting";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const withStates = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.craftingRecipes["Bomb"] = { learned: true, crafted: true };
  data.craftingRecipes["Cherry Bomb"] = { learned: true, crafted: false };
  return data;
};
const names = (filters: Partial<CraftingFilters>) =>
  filterRecipes(withStates(), { ...emptyCraftingFilters, ...filters }).map(
    (r) => r.name,
  );

describe("crafting recipes", () => {
  it("lists 150 recipes in 20 categories, alphabetical", () => {
    expect(allRecipes).toHaveLength(150);
    expect(categories).toHaveLength(20);
    expect(categories).toEqual(
      [...categories].sort((a, b) => a.localeCompare(b)),
    );
    const all = names({});
    expect(all).toEqual([...all].sort((a, b) => a.localeCompare(b)));
  });

  it("leaves the Wedding Ring out of the in-game collection only", () => {
    const ring = allRecipes.find((r) => r.name === "Wedding Ring")!;
    const bomb = allRecipes.find((r) => r.name === "Bomb")!;

    expect(isInCraftingCollection(ring)).toBe(false);
    expect(isInCraftingCollection(bomb)).toBe(true);
  });
});

describe("crafting filters", () => {
  it("reads Learned as learned and not crafted", () => {
    expect(names({ status: "learned" })).toEqual(["Cherry Bomb"]);
    expect(names({ status: "crafted" })).toEqual(["Bomb"]);
    expect(names({ status: "not-learned" })).toHaveLength(148);
  });

  it("filters by one category", () => {
    expect(names({ category: "Bombs" })).toEqual([
      "Bomb",
      "Cherry Bomb",
      "Mega Bomb",
    ]);
    expect(names({ category: "Seeds & Fertilizer" })).toHaveLength(20);
  });

  it("combines search, status and category", () => {
    expect(
      names({ query: "BOMB", status: "crafted", category: "Bombs" }),
    ).toEqual(["Bomb"]);
    expect(names({ query: "zzz" })).toEqual([]);
  });

  it("knows when a filter is on", () => {
    expect(isFilteringCrafting(emptyCraftingFilters)).toBe(false);
    expect(
      isFilteringCrafting({ ...emptyCraftingFilters, category: "Bombs" }),
    ).toBe(true);
  });
});

describe("crafting groups", () => {
  it("groups by category with the sizes of the board and counts crafted per group", () => {
    const data = withStates();
    const groups = groupByCategory(data, allRecipes);
    const size = (category: string) =>
      groups.find((g) => g.category === category)!.recipes.length;

    expect(groups).toHaveLength(20);
    expect(size("Artisan Equipment")).toBe(10);
    expect(size("Bombs")).toBe(3);
    expect(size("Seeds & Fertilizer")).toBe(20);
    expect(groups.find((g) => g.category === "Bombs")!.crafted).toBe(1);
    expect(groups.reduce((sum, g) => sum + g.recipes.length, 0)).toBe(150);
  });

  it("leaves out a category with no match", () => {
    const groups = groupByCategory(
      withStates(),
      filterRecipes(withStates(), { ...emptyCraftingFilters, query: "bomb" }),
    );

    expect(groups.map((g) => g.category)).toEqual(["Bombs"]);
  });
});

describe("crafting summary", () => {
  it("lists 150 and counts crafted and learned over the 149 of the collection", () => {
    const summary = craftingSummary(withStates());

    expect(summary.total).toBe(150);
    expect(summary.notInCollection).toBe(1);
    expect(summary.crafted).toEqual({ current: 1, total: 149 });
    expect(summary.learned).toBe(2);
  });

  it("does not count a learned Wedding Ring", () => {
    const data = clone(DEFAULT_GAME_DATA);
    data.craftingRecipes["Wedding Ring"] = { learned: true, crafted: true };
    const summary = craftingSummary(data);

    expect(summary.learned).toBe(0);
    expect(summary.crafted.current).toBe(0);
  });
});
