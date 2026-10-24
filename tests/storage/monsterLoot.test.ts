import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allLoot,
  countMonsterLootShipped,
  emptyLootFilters,
  filterLoot,
  isFilteringLoot,
  isShippableLoot,
} from "@/service/monsterLoot";
import type { LootFilters } from "@/service/monsterLoot";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const withStates = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.shipped["684"] = { shipped: true, count: 30 };
  return data;
};
const names = (filters: Partial<LootFilters>) =>
  filterLoot(withStates(), { ...emptyLootFilters, ...filters }).map(
    (l) => l.name,
  );

describe("monster loot", () => {
  it("lists 6 items and 5 that the game counts", () => {
    expect(allLoot).toHaveLength(6);
    expect(allLoot.filter(isShippableLoot)).toHaveLength(5);
    expect(
      isShippableLoot(allLoot.find((l) => l.name === "Dragon Tooth")!),
    ).toBe(false);
  });

  it("searches the name and the monsters", () => {
    expect(names({ query: "slime" }).sort()).toEqual(["Slime"]);
    expect(names({ query: "haunted skull" }).sort()).toEqual([
      "Solar Essence",
      "Void Essence",
    ]);
  });

  it("lists only items that can still be shipped under Not shipped", () => {
    expect(names({ shipped: "shipped" })).toEqual(["Bug Meat"]);
    expect(names({ shipped: "not-shipped" })).toHaveLength(4);
    expect(names({ shipped: "not-shipped" })).not.toContain("Dragon Tooth");
    expect(names({ shipped: "not-shippable" })).toEqual(["Dragon Tooth"]);
  });

  it("counts shipped over the 5 and ignores a shipped Dragon Tooth", () => {
    const data = withStates();
    data.shipped["852"] = { shipped: true, count: 1 };

    expect(countMonsterLootShipped(data)).toEqual({ current: 1, total: 5 });
  });

  it("knows when a filter is on", () => {
    expect(isFilteringLoot(emptyLootFilters)).toBe(false);
    expect(isFilteringLoot({ ...emptyLootFilters, query: "a" })).toBe(true);
  });
});
