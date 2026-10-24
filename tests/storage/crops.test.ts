import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allCrops,
  cropsSummary,
  emptyCropFilters,
  filterCrops,
  harvestLabel,
  isFilteringCrops,
  isShippableCrop,
} from "@/service/crops";
import type { CropFilters } from "@/service/crops";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const withStates = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.shipped["24"] = { shipped: true, count: 20 };
  data.shipped["190"] = { shipped: true, count: 400 };
  data.shipped["188"] = { shipped: true, count: 3 };
  return data;
};
const names = (filters: Partial<CropFilters>) =>
  filterCrops(withStates(), { ...emptyCropFilters, ...filters }).map(
    (c) => c.name,
  );

describe("crops", () => {
  it("lists 47 crops and 46 that the shipping collection counts", () => {
    expect(allCrops).toHaveLength(47);
    expect(allCrops.filter(isShippableCrop)).toHaveLength(46);
    expect(isShippableCrop(allCrops.find((c) => c.name === "Qi Fruit")!)).toBe(
      false,
    );
  });
});

describe("crop filters", () => {
  it("lists all with no filter and searches by name", () => {
    expect(names({})).toHaveLength(47);
    expect(names({ query: "BEAN" }).sort()).toEqual([
      "Coffee Bean",
      "Green Bean",
    ]);
  });

  it("filters by season, and a crop of two seasons matches both", () => {
    const spring = names({ season: "spring" });
    const summer = names({ season: "summer" });

    expect(spring).toContain("Parsnip");
    expect(summer).not.toContain("Parsnip");
    const both = allCrops.filter(
      (c) => c.seasons.includes("spring") && c.seasons.includes("summer"),
    );
    for (const crop of both) {
      expect(spring).toContain(crop.name);
      expect(summer).toContain(crop.name);
    }
  });

  it("filters by shipped state", () => {
    expect(names({ shipped: "shipped" }).sort()).toEqual([
      "Cauliflower",
      "Green Bean",
      "Parsnip",
    ]);
    expect(names({ shipped: "not-shipped" })).toHaveLength(44);
  });

  it("filters by regrowth, trellis and giant with the counts of the board", () => {
    expect(names({ regrowth: "regrowing" })).toHaveLength(17);
    expect(names({ regrowth: "non-regrowing" })).toHaveLength(30);
    expect(names({ trellis: "trellis" })).toHaveLength(4);
    expect(names({ trellis: "no-trellis" })).toHaveLength(43);
    expect(names({ giant: "giant" })).toHaveLength(5);
    expect(names({ giant: "no-giant" })).toHaveLength(42);
  });

  it("combines filters", () => {
    expect(
      names({ season: "spring", giant: "giant", shipped: "shipped" }),
    ).toEqual(["Cauliflower"]);
  });

  it("knows when a filter is on", () => {
    expect(isFilteringCrops(emptyCropFilters)).toBe(false);
    expect(isFilteringCrops({ ...emptyCropFilters, trellis: "trellis" })).toBe(
      true,
    );
  });
});

describe("crops summary", () => {
  it("counts regrowing, shipped over the 46, and the 15 and 300 milestones", () => {
    const summary = cropsSummary(withStates());

    expect(summary.total).toBe(47);
    expect(summary.regrowing).toBe(17);
    expect(summary.shipped).toEqual({ current: 3, total: 46 });
    expect(summary.shippedFifteen).toBe(2);
    expect(summary.shippedThreeHundred).toBe(1);
  });

  it("counts the crops of each season", () => {
    const seasons = cropsSummary(clone(DEFAULT_GAME_DATA)).seasons;

    expect(seasons.map((s) => s.season)).toEqual([
      "spring",
      "summer",
      "fall",
      "winter",
    ]);
    for (const { season, count } of seasons) {
      expect(count).toBe(
        allCrops.filter((c) => c.seasons.includes(season)).length,
      );
    }
  });

  it("counts a crop shipped exactly 15 or 300 times, and not one short of it", () => {
    const data = clone(DEFAULT_GAME_DATA);
    data.shipped["24"] = { shipped: true, count: 15 };
    data.shipped["190"] = { shipped: true, count: 14 };
    data.shipped["188"] = { shipped: true, count: 300 };
    data.shipped["192"] = { shipped: true, count: 299 };
    const summary = cropsSummary(data);

    expect(summary.shippedFifteen).toBe(3);
    expect(summary.shippedThreeHundred).toBe(1);
  });

  it("does not count an unshipped crop that still has a count", () => {
    const data = clone(DEFAULT_GAME_DATA);
    data.shipped["24"] = { shipped: false, count: 500 };

    expect(cropsSummary(data).shippedFifteen).toBe(0);
  });
});

describe("harvest label", () => {
  it("has none for a single item and shows the amount or range otherwise", () => {
    const find = (name: string) => allCrops.find((c) => c.name === name)!;

    expect(harvestLabel(find("Parsnip"))).toBeNull();
    expect(harvestLabel(find("Potato"))).toBe("×1–4");
    expect(harvestLabel(find("Coffee Bean"))).toBe("×4");
  });
});
