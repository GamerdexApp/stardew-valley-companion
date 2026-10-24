import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allFarmAnimals,
  allProduce,
  animalProductsSummary,
  emptyProduceFilters,
  filterProduce,
  isFilteringProduce,
  isTrackedProduce,
} from "@/service/animalProducts";
import type { ProduceFilters } from "@/service/animalProducts";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const withStates = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.shipped["176"] = { shipped: true, count: 12 };
  return data;
};
const names = (filters: Partial<ProduceFilters>) =>
  filterProduce(withStates(), { ...emptyProduceFilters, ...filters }).map(
    (p) => p.name,
  );
const find = (name: string) => allProduce.find((p) => p.name === name)!;

describe("animal produce", () => {
  it("lists 14 animals and 17 produce items, each once", () => {
    expect(allFarmAnimals).toHaveLength(14);
    expect(allProduce).toHaveLength(17);
    expect(new Set(allProduce.map((p) => p.id)).size).toBe(17);
  });

  it("lists the animals that give a shared item, with their buildings", () => {
    expect(find("Milk").sources).toEqual([
      { animal: "White Cow", building: "Barn" },
      { animal: "Brown Cow", building: "Barn" },
    ]);
    expect(
      find("Wool")
        .sources.map((s) => s.building)
        .sort(),
    ).toEqual(["Deluxe Barn", "Deluxe Coop"]);
  });

  it("marks the large variants as deluxe", () => {
    expect(find("Large Milk").isDeluxe).toBe(true);
    expect(find("Milk").isDeluxe).toBe(false);
  });

  it("leaves the Golden Egg and the Dinosaur Egg out of what the game tracks", () => {
    expect(allProduce.filter(isTrackedProduce)).toHaveLength(15);
    expect(isTrackedProduce(find("Golden Egg"))).toBe(false);
    expect(isTrackedProduce(find("Dinosaur Egg"))).toBe(false);
  });
});

describe("produce filters", () => {
  it("searches the item and the animal", () => {
    expect(names({ query: "milk" }).sort()).toEqual([
      "Goat Milk",
      "Large Goat Milk",
      "Large Milk",
      "Milk",
    ]);
    expect(names({ query: "duck" }).sort()).toEqual([
      "Duck Egg",
      "Duck Feather",
    ]);
  });

  it("splits shipped, not shipped and not tracked", () => {
    expect(names({ shipped: "shipped" })).toEqual(["Egg"]);
    expect(names({ shipped: "not-shipped" })).toHaveLength(14);
    expect(names({ shipped: "not-tracked" }).sort()).toEqual([
      "Dinosaur Egg",
      "Golden Egg",
    ]);
  });

  it("knows when a filter is on", () => {
    expect(isFilteringProduce(emptyProduceFilters)).toBe(false);
    expect(
      isFilteringProduce({ ...emptyProduceFilters, shipped: "shipped" }),
    ).toBe(true);
  });
});

describe("animal products summary", () => {
  it("counts animals, items and shipped over the 15 tracked", () => {
    const summary = animalProductsSummary(withStates());

    expect(summary.animals).toBe(14);
    expect(summary.items).toBe(17);
    expect(summary.shipped).toEqual({ current: 1, total: 15 });
  });

  it("does not count a shipped Golden Egg", () => {
    const data = clone(DEFAULT_GAME_DATA);
    data.shipped["928"] = { shipped: true, count: 1 };

    expect(animalProductsSummary(data).shipped.current).toBe(0);
  });
});
