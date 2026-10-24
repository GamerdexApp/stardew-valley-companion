import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  countCraftingMade,
  countFishCaught,
} from "@/lib/utils/collectionCounts";
import {
  countCompleteSections,
  overviewSections,
} from "@/service/collectionsOverview";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const fresh = (): GameData => clone(DEFAULT_GAME_DATA);
const section = (data: GameData, id: string) =>
  overviewSections(data).find((s) => s.id === id)!;

describe("collections overview sections", () => {
  it("lists the six sections with the in-game totals", () => {
    const totals = overviewSections(fresh()).map((s) => [s.id, s.total]);

    expect(totals).toEqual([
      ["shipped", 154],
      ["fish", 72],
      ["artifacts", 42],
      ["minerals", 53],
      ["cooking", 81],
      ["crafting", 149],
    ]);
  });

  it("starts with nothing done", () => {
    const sections = overviewSections(fresh());

    expect(sections.every((s) => s.done === 0 && !s.isComplete)).toBe(true);
    expect(countCompleteSections(sections)).toBe(0);
  });

  it("counts a shipped item only when shipped is true", () => {
    const data = fresh();
    data.shipped["16"] = { shipped: true, count: 1 };
    data.shipped["24"] = { shipped: false, count: 0 };

    expect(section(data, "shipped").done).toBe(1);
  });

  it("counts an artifact or mineral when found, even if not donated", () => {
    const data = fresh();
    data.artifacts["96"] = { found: true, donated: false };
    data.artifacts["97"] = { found: false, donated: false };
    data.minerals["60"] = { found: true, donated: false };

    expect(section(data, "artifacts").done).toBe(1);
    expect(section(data, "minerals").done).toBe(1);
  });

  it("counts a recipe when cooked or crafted, not when only learned", () => {
    const data = fresh();
    data.cookingRecipes["Fried Egg"] = { learned: true, cooked: false };
    data.cookingRecipes["Omelet"] = { learned: true, cooked: true };
    data.craftingRecipes["Bomb"] = { learned: true, crafted: false };
    data.craftingRecipes["Cherry Bomb"] = { learned: true, crafted: true };

    expect(section(data, "cooking").done).toBe(1);
    expect(section(data, "crafting").done).toBe(1);
  });

  it("marks the tile of a done item complete and leaves the others", () => {
    const data = fresh();
    data.fishCaught.push({ id: "128", timesCaught: 1, largestSize: 0 });
    const tiles = section(data, "fish").tiles;

    expect(tiles.find((t) => t.name === "Pufferfish")?.complete).toBe(true);
    expect(tiles.filter((t) => t.complete)).toHaveLength(1);
  });

  it("ignores a caught fish that is not in the in-game collection", () => {
    const data = fresh();
    data.fishCaught.push({ id: "898", timesCaught: 1, largestSize: 0 });

    expect(section(data, "fish").done).toBe(0);
  });

  it("matches the shared fish and crafting counts used everywhere else", () => {
    const data = fresh();
    data.fishCaught.push(
      { id: "128", timesCaught: 1, largestSize: 0 },
      { id: "129", timesCaught: 1, largestSize: 0 },
    );
    data.craftingRecipes["Bomb"] = { learned: true, crafted: true };

    expect(section(data, "fish").done).toBe(countFishCaught(data).current);
    expect(section(data, "fish").total).toBe(countFishCaught(data).total);
    expect(section(data, "crafting").done).toBe(
      countCraftingMade(data).current,
    );
    expect(section(data, "crafting").total).toBe(countCraftingMade(data).total);
  });

  it("counts a section complete only when every item is done", () => {
    const data = fresh();
    for (const tile of section(data, "artifacts").tiles) {
      data.artifacts[tile.id] = { found: true, donated: false };
    }

    const sections = overviewSections(data);
    expect(sections.find((s) => s.id === "artifacts")?.isComplete).toBe(true);
    expect(countCompleteSections(sections)).toBe(1);
  });
});
