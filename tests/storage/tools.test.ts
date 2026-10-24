import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  BACKPACK_SLOTS,
  isUpgrading,
  levelDots,
  levelLabel,
  toolEntries,
} from "@/service/tools";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const fresh = (): GameData => clone(DEFAULT_GAME_DATA);
const entry = (id: string) => toolEntries.find((e) => e.id === id)!;

describe("tool entries", () => {
  it("list the eight tools in the order of the board", () => {
    expect(toolEntries.map((e) => e.id)).toEqual([
      "axe",
      "pickaxe",
      "hoe",
      "watering-can",
      "pan",
      "trash-can",
      "fishing-rod",
      "backpack",
    ]);
  });

  it("give an upgradeable tool five levels from Basic to Iridium", () => {
    expect(entry("hoe").options.map((o) => o.label)).toEqual([
      "Basic",
      "Copper",
      "Steel",
      "Gold",
      "Iridium",
    ]);
  });

  it("make the pan start at copper with None for no pan", () => {
    expect(entry("pan").options).toEqual([
      { value: -1, label: "None" },
      { value: 0, label: "Copper" },
      { value: 1, label: "Steel" },
      { value: 2, label: "Gold" },
      { value: 3, label: "Iridium" },
    ]);
    expect(levelLabel(entry("pan"), -1)).toBe("None");
    expect(levelLabel(entry("pan"), 0)).toBe("Copper");
  });

  it("name the rod levels and allow none", () => {
    expect(entry("fishing-rod").options.map((o) => o.label)).toEqual([
      "None",
      "Training Rod",
      "Bamboo Pole",
      "Fiberglass Rod",
      "Iridium Rod",
      "Advanced Iridium Rod",
    ]);
  });

  it("save the backpack as 12, 24 or 36 slots", () => {
    expect(entry("backpack").options.map((o) => o.value)).toEqual(
      BACKPACK_SLOTS,
    );
    expect(entry("backpack").options.map((o) => o.label)).toEqual([
      "Basic Backpack",
      "Large Pack",
      "Deluxe Pack",
    ]);
  });
});

describe("reading and setting a tool", () => {
  it("reads the saved level of each tool and the backpack size from the character", () => {
    const data = fresh();
    data.toolLevels.pickaxe = 3;
    data.character.maxItems = 24;

    expect(entry("pickaxe").value(data)).toBe(3);
    expect(entry("backpack").value(data)).toBe(24);
    expect(entry("fishing-rod").value(data)).toBe(-1);
  });

  it("writes the same fields as the old edit step", () => {
    expect(entry("watering-can").set(fresh(), 2).toolLevels.wateringCan).toBe(
      2,
    );
    expect(entry("trash-can").set(fresh(), 4).toolLevels.trashCan).toBe(4);
    expect(entry("pan").set(fresh(), 0).toolLevels.pan).toBe(0);
    expect(entry("fishing-rod").set(fresh(), 3).toolLevels.fishingRod).toBe(3);
    expect(entry("backpack").set(fresh(), 36).character.maxItems).toBe(36);
  });

  it("does not touch the other tools", () => {
    const result = entry("axe").set(fresh(), 2);

    expect(result.toolLevels).toEqual({ ...fresh().toolLevels, axe: 2 });
  });
});

describe("panel rows", () => {
  it("mark the current level, the ones below as owned and the ones above as locked", () => {
    const states = entry("pickaxe")
      .rows(2)
      .map((r) => r.state);

    expect(states).toEqual(["owned", "owned", "current", "locked", "locked"]);
  });

  it("give the upgrade cost and material of a level", () => {
    const rows = entry("hoe").rows(0);

    expect(rows[0].cost).toBeNull();
    expect(rows[1]).toMatchObject({
      cost: 2000,
      material: { quantity: 5, name: "Copper Bar" },
    });
  });

  it("start the pan at copper with no cost", () => {
    const rows = entry("pan").rows(0);

    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      name: "Copper",
      state: "current",
      cost: null,
    });
    expect(rows[1]).toMatchObject({ name: "Steel", cost: 5000 });
  });

  it("say how to get the last rod and what each rod supports", () => {
    const rows = entry("fishing-rod").rows(1);

    expect(rows[4].obtain).toBeTruthy();
    expect(rows[2].facts).toMatchObject({ bait: true, fishingLevel: 2 });
    expect(rows[3].facts).toMatchObject({ tackleSlots: 1, enchantable: true });
    expect(rows[0].facts.bait).toBe(false);
  });

  it("show the backpack tiers with their cost", () => {
    const rows = entry("backpack").rows(24);

    expect(rows.map((r) => r.state)).toEqual(["owned", "current", "locked"]);
    expect(rows[1].cost).toBe(2000);
    expect(rows[2].cost).toBe(10000);
    expect(rows[0].cost).toBeNull();
  });
});

describe("dots and the Upgrading tag", () => {
  it("fill the dots up to the level", () => {
    expect(levelDots(entry("hoe"), 2)).toEqual({ filled: 3, total: 5 });
    expect(levelDots(entry("pan"), -1)).toEqual({ filled: 0, total: 4 });
    expect(levelDots(entry("pan"), 0)).toEqual({ filled: 1, total: 4 });
    expect(levelDots(entry("backpack"), 36)).toEqual({ filled: 3, total: 3 });
  });

  it("mark only the tool that Clint holds", () => {
    const data = fresh();
    data.toolLevels.currentlyUpgrading = "pickaxe";

    expect(isUpgrading(data, entry("pickaxe"))).toBe(true);
    expect(isUpgrading(data, entry("axe"))).toBe(false);
    expect(isUpgrading(data, entry("backpack"))).toBe(false);
  });
});
