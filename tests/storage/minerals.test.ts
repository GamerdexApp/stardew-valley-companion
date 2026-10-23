import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allBars,
  allGeodes,
  allMinerals,
  allNodes,
  allOres,
  allResources,
  countShipped,
  emptyMineralFilters,
  emptyShippedFilters,
  filterByName,
  filterMinerals,
  filterShippable,
  geodeContents,
  geodesHolding,
  mineralNameById,
  mineralsSummary,
  opensForRandomItems,
} from "@/service/minerals";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const fresh = (): GameData => clone(DEFAULT_GAME_DATA);

describe("the six minerals lists", () => {
  it("have the sizes of the board", () => {
    expect(allMinerals).toHaveLength(53);
    expect(allGeodes).toHaveLength(8);
    expect(allOres).toHaveLength(5);
    expect(allBars).toHaveLength(6);
    expect(allResources).toHaveLength(3);
    expect(allNodes).toHaveLength(26);
  });
});

describe("mineral filters", () => {
  const data = fresh();
  data.minerals["80"] = { found: true, donated: true };
  data.minerals["82"] = { found: true, donated: false };
  const names = (filters: object) =>
    filterMinerals(data, { ...emptyMineralFilters, ...filters }).map(
      (m) => m.name,
    );

  it("lists all 53 with no filter", () => {
    expect(names({})).toHaveLength(53);
  });

  it("filters by donation and by found, where donated counts as found", () => {
    expect(names({ donation: "donated" })).toEqual(["Quartz"]);
    expect(names({ found: "found" })).toHaveLength(2);
    expect(names({ found: "not-found" })).toHaveLength(51);
    expect(names({ donation: "not-donated" })).toHaveLength(52);
  });

  it("searches by name without case", () => {
    expect(names({ query: "QUARTZ" }).sort()).toEqual([
      "Fire Quartz",
      "Quartz",
    ]);
  });
});

describe("shipped filters", () => {
  it("splits ores by shipped state", () => {
    const data = fresh();
    data.shipped["378"] = { shipped: true, count: 3 };

    const only = (shipped: "shipped" | "not-shipped") =>
      filterShippable(allOres, data, { ...emptyShippedFilters, shipped }).map(
        (o) => o.name,
      );

    expect(only("shipped")).toEqual(["Copper Ore"]);
    expect(only("not-shipped")).toHaveLength(4);
  });

  it("counts shipped items of a list", () => {
    const data = fresh();
    data.shipped["378"] = { shipped: true, count: 3 };
    data.shipped["334"] = { shipped: true, count: 1 };

    expect(countShipped(data, allOres)).toBe(1);
    expect(countShipped(data, allBars)).toBe(1);
  });

  it("searches a plain list by name", () => {
    expect(filterByName(allNodes, "copper").map((n) => n.name)).toEqual([
      "Copper Node",
    ]);
  });
});

describe("minerals summary", () => {
  it("starts at nothing", () => {
    const summary = mineralsSummary(fresh());

    expect(summary.found).toEqual({ current: 0, total: 53 });
    expect(summary.donated).toBe(0);
    expect(summary.oresShipped).toBe(0);
  });

  it("counts found including donated", () => {
    const data = fresh();
    data.minerals["80"] = { found: true, donated: true };
    data.minerals["82"] = { found: true, donated: false };
    const summary = mineralsSummary(data);

    expect(summary.found.current).toBe(2);
    expect(summary.donated).toBe(1);
  });
});

describe("geodes", () => {
  it("tells which geodes hold a mineral", () => {
    const earthCrystal = allMinerals.find((m) => m.name === "Earth Crystal")!;

    expect(geodesHolding(earthCrystal)).toContain("Geode");
    expect(geodesHolding(earthCrystal)).toContain("Omni Geode");
  });

  it("lists the minerals of a blacksmith geode and the contents of a box", () => {
    const geode = allGeodes.find((g) => g.name === "Geode")!;
    const trove = allGeodes.find((g) => g.name === "Artifact Trove")!;

    expect(opensForRandomItems(geode)).toBe(false);
    expect(geodeContents(geode)).toHaveLength(16);
    expect(opensForRandomItems(trove)).toBe(true);
    expect(geodeContents(trove)).toHaveLength(28);
  });

  it("names an ore by its id and leaves an unknown id as it is", () => {
    expect(mineralNameById("378")).toBe("Copper Ore");
    expect(mineralNameById("Copper Ore")).toBe("Copper Ore");
  });
});
