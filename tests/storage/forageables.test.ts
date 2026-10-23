import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allForageItems,
  allTrees,
  countForageablesShipped,
  emptyForageFilters,
  emptyTreeFilters,
  filterForageItems,
  filterTrees,
  forageSummary,
  fruitTrees,
  isFilteringForage,
  isFilteringTrees,
  isShippableItem,
  treeProduce,
  wildTrees,
} from "@/service/forageables";
import type { ForageFilters } from "@/service/forageables";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const withStates = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.shipped["410"] = { shipped: true, count: 3 };
  return data;
};
const names = (filters: Partial<ForageFilters>) =>
  filterForageItems(withStates(), { ...emptyForageFilters, ...filters }).map(
    (i) => i.name,
  );

describe("forageable items", () => {
  it("list each item once: 49 forageables, 8 fruit tree fruits and 4 tapper goods", () => {
    expect(allForageItems).toHaveLength(61);
    expect(new Set(allForageItems.map((i) => i.id)).size).toBe(61);
    expect(allForageItems.filter((i) => i.kind === "forageable")).toHaveLength(
      49,
    );
    expect(allForageItems.filter((i) => i.kind === "fruit-tree")).toHaveLength(
      8,
    );
    expect(allForageItems.filter((i) => i.kind === "tapper")).toHaveLength(4);
  });

  it("count 53 as shippable: 41 forageables and the 12 tree goods", () => {
    expect(allForageItems.filter((i) => isShippableItem(i.id))).toHaveLength(
      53,
    );
  });

  it("give a fruit its tree season and a tapper good no season", () => {
    const apricot = allForageItems.find((i) => i.name === "Apricot")!;
    const syrup = allForageItems.find((i) => i.name === "Maple Syrup")!;

    expect(apricot.seasons).toEqual(["spring"]);
    expect(apricot.place).toBe("Apricot Tree");
    expect(syrup.seasons).toEqual([]);
    expect(syrup.maxQuality).toBe("base");
  });
});

describe("forageable filters", () => {
  it("search matches the name and the place", () => {
    expect(names({ query: "blackberry" })).toContain("Blackberry");
    expect(names({ query: "secret woods" }).length).toBeGreaterThanOrEqual(7);
    expect(names({ query: "apricot" }).sort()).toEqual(["Apricot"]);
  });

  it("season keeps forageables and fruit of that season and always keeps tapper goods", () => {
    const winter = names({ season: "winter" });

    expect(winter).toContain("Maple Syrup");
    expect(winter).toContain("Crocus");
    expect(winter).not.toContain("Blackberry");
    expect(names({ season: "spring" })).toContain("Apricot");
    expect(winter).not.toContain("Apricot");
  });

  it("shipped splits into shipped, not shipped and other", () => {
    expect(names({ shipped: "shipped" })).toEqual(["Blackberry"]);
    expect(names({ shipped: "not-shipped" })).toHaveLength(52);
    expect(names({ shipped: "other" })).toHaveLength(8);
    expect(names({ shipped: "other" })).toContain("Clam");
  });

  it("knows when a filter is on", () => {
    expect(isFilteringForage(emptyForageFilters)).toBe(false);
    expect(isFilteringForage({ ...emptyForageFilters, season: "fall" })).toBe(
      true,
    );
  });
});

describe("forageables summary", () => {
  it("counts items, trees and seasons", () => {
    const summary = forageSummary(withStates());

    expect(summary.items).toBe(61);
    expect(summary.trees).toBe(16);
    expect(summary.fruitTrees).toBe(8);
    expect(summary.wildTrees).toBe(8);
    expect(summary.shipped).toEqual({ current: 1, total: 53 });
    expect(summary.seasons.map((s) => s.season)).toEqual([
      "spring",
      "summer",
      "fall",
      "winter",
    ]);
  });

  it("counts shipped over the 53 only", () => {
    const data = clone(DEFAULT_GAME_DATA);
    data.shipped["388"] = { shipped: true, count: 5 };

    expect(countForageablesShipped(data).current).toBe(
      isShippableItem("388") ? 1 : 0,
    );
  });
});

describe("trees", () => {
  it("lists 8 fruit trees and 8 wild trees", () => {
    expect(fruitTrees).toHaveLength(8);
    expect(wildTrees).toHaveLength(8);
    expect(allTrees).toHaveLength(16);
  });

  it("filters by type and by tree or produce name", () => {
    expect(
      filterTrees({ ...emptyTreeFilters, type: "fruit-tree" }),
    ).toHaveLength(8);
    expect(
      filterTrees({ ...emptyTreeFilters, type: "wild-tree" }),
    ).toHaveLength(8);
    expect(
      filterTrees({ ...emptyTreeFilters, query: "syrup" })
        .map((t) => t.name)
        .sort(),
    ).toEqual(["Maple Tree", "Mystic Tree"]);
    expect(
      filterTrees({ ...emptyTreeFilters, query: "apricot" }).map((t) => t.name),
    ).toEqual(["Apricot Tree"]);
    expect(isFilteringTrees(emptyTreeFilters)).toBe(false);
  });

  it("gives the fruit of a fruit tree and the tapper good of a wild tree, and nothing for a palm", () => {
    const find = (name: string) => allTrees.find((t) => t.name === name)!;

    expect(treeProduce(find("Apricot Tree"))?.name).toBe("Apricot");
    expect(treeProduce(find("Oak Tree"))?.name).toBe("Oak Resin");
    expect(treeProduce(find("Palm Tree"))).toBeNull();
  });
});
