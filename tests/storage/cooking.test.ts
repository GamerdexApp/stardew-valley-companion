import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allDishes,
  buffMinutes,
  cookingSummary,
  emptyCookingFilters,
  energyAndHealth,
  filterDishes,
  isFilteringCooking,
} from "@/service/cooking";
import type { CookingFilters } from "@/service/cooking";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const withStates = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.cookingRecipes["Fried Egg"] = { learned: true, cooked: true };
  data.cookingRecipes["Omelet"] = { learned: true, cooked: false };
  return data;
};
const names = (filters: Partial<CookingFilters>) =>
  filterDishes(withStates(), { ...emptyCookingFilters, ...filters }).map(
    (d) => d.name,
  );

describe("cooking filters", () => {
  it("lists the 81 recipes in alphabetical order", () => {
    const all = names({});

    expect(all).toHaveLength(81);
    expect(all).toEqual([...all].sort((a, b) => a.localeCompare(b)));
    expect(allDishes).toHaveLength(81);
  });

  it("reads Learned as learned and not cooked", () => {
    expect(names({ status: "learned" })).toEqual(["Omelet"]);
    expect(names({ status: "cooked" })).toEqual(["Fried Egg"]);
    expect(names({ status: "not-learned" })).toHaveLength(79);
  });

  it("matches a source when any source of the dish has the type", () => {
    const purchase = names({ source: "purchase" });
    const queen = names({ source: "queen-of-sauce" });

    expect(purchase).toHaveLength(11);
    expect(queen).toHaveLength(32);
    const both = allDishes.filter((d) => {
      const types = d.recipeSources.map((s) => s.type);
      return types.includes("purchase") && types.includes("queen-of-sauce");
    });
    expect(both.length).toBeGreaterThan(0);
    for (const dish of both) {
      expect(purchase).toContain(dish.name);
      expect(queen).toContain(dish.name);
    }
  });

  it("filters by every source type", () => {
    expect(names({ source: "friendship" })).toHaveLength(36);
    expect(names({ source: "skill" })).toHaveLength(8);
    expect(names({ source: "default" })).toEqual(["Fried Egg"]);
    expect(names({ source: "cutscene" })).toHaveLength(1);
  });

  it("combines search, status and source", () => {
    expect(
      names({ query: "EGG", status: "cooked", source: "default" }),
    ).toEqual(["Fried Egg"]);
    expect(names({ query: "zzz" })).toEqual([]);
  });

  it("knows when a filter is on", () => {
    expect(isFilteringCooking(emptyCookingFilters)).toBe(false);
    expect(
      isFilteringCooking({ ...emptyCookingFilters, source: "skill" }),
    ).toBe(true);
  });
});

describe("cooking summary", () => {
  it("counts learned including cooked, and cooked", () => {
    const summary = cookingSummary(withStates());

    expect(summary.total).toBe(81);
    expect(summary.learned).toBe(2);
    expect(summary.cooked).toEqual({ current: 1, total: 81 });
  });

  it("starts at nothing", () => {
    const summary = cookingSummary(clone(DEFAULT_GAME_DATA));

    expect(summary.learned).toBe(0);
    expect(summary.cooked.current).toBe(0);
  });
});

describe("dish values", () => {
  it("reads a missing energy or health as zero", () => {
    const dish = allDishes.find((d) => d.name === "Fried Egg")!;

    expect(energyAndHealth(dish)).toEqual({ energy: 50, health: 22 });
  });

  it("splits a buff length given in seconds", () => {
    expect(buffMinutes(420)).toEqual({ minutes: 7, seconds: 0 });
    expect(buffMinutes(672)).toEqual({ minutes: 11, seconds: 12 });
  });
});
