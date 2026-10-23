import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  collectionRows,
  communityCenterFigures,
  hero,
  heroTitle,
  isCategoryDone,
  maxedVillagers,
  milestoneTiles,
  minesFigures,
  percentOf,
  perfectionFigures,
  skillRows,
  skillTotal,
  toolChips,
  villagerRows,
} from "@/service/overview";
import { DEFAULT_GAME_DATA } from "@/data/constants";
import { progressedPlaythrough } from "./fixtures";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const fresh = (): GameData => clone(DEFAULT_GAME_DATA);
const progressed = (): GameData => clone(progressedPlaythrough().data);

describe("hero", () => {
  it("names the farm and the character", () => {
    expect(heroTitle(progressed())).toBe("Riverland Farm · Sam");
  });

  it("leaves out a blank character name instead of ending in a dot", () => {
    const data = progressed();
    data.character.name = "";

    expect(heroTitle(data)).toBe("Riverland Farm");
  });

  it("is empty when neither is known", () => {
    expect(heroTitle(fresh())).toBe("");
  });

  it("writes the season pill and hides a missing spouse", () => {
    const data = progressed();
    data.character.spouse = "";

    expect(hero(data).seasonPill).toBe("Fall Day 12, Year 2");
    expect(hero(data).spouse).toBeNull();
    expect(hero(progressed()).spouse).toBe("Abigail");
  });

  it("lists the seven figures in order with grouped numbers", () => {
    const figures = hero(progressed()).figures;

    expect(figures.map((figure) => figure.label)).toEqual([
      "Time played",
      "Total days",
      "Current money",
      "Total earned",
      "House upgrade",
      "Max energy",
      "Max health",
    ]);
    expect(figures[2].value).toBe(
      `${progressed().character.money.toLocaleString()}g`,
    );
  });

  it("shows a dash for no time played and minutes under an hour", () => {
    const data = progressed();
    data.character.millisecondsPlayed = 0;
    expect(hero(data).figures[0].value).toBe("—");

    data.character.millisecondsPlayed = 25 * 60_000;
    expect(hero(data).figures[0].value).toBe("25m");

    data.character.millisecondsPlayed = (46 * 60 + 16) * 60_000;
    expect(hero(data).figures[0].value).toBe("46h 16m");
  });

  it("names the house levels and marks only the full upgrade", () => {
    const at = (level: number) => {
      const data = progressed();
      data.character.houseUpgradeLevel = level;
      return hero(data).figures[4];
    };

    expect(at(0).value).toBe("Basic");
    expect(at(2).value).toBe("Level 2");
    expect(at(3)).toMatchObject({ value: "Full Upgrade", tone: "primary" });
    expect(at(2).tone).toBeUndefined();
  });
});

describe("skills and tools", () => {
  it("caps each level at ten and totals them", () => {
    const data = fresh();
    data.skills = {
      farming: { level: 10, xp: 0 },
      fishing: { level: 12, xp: 0 },
      mining: { level: 4, xp: 0 },
    } as GameData["skills"];

    expect(skillRows(data).map((row) => row.level)).toEqual([10, 10, 0, 4, 0]);
    expect(skillTotal(data)).toBe(24);
  });

  it("marks a skill with mastery unlocked", () => {
    const data = fresh();
    data.mastery.unlocked = ["fishing"];

    expect(skillRows(data).map((row) => row.mastered)).toEqual([
      false,
      true,
      false,
      false,
      false,
    ]);
  });

  it("lists the six tools in order and then the rod", () => {
    expect(toolChips(fresh()).map((chip) => chip.label)).toEqual([
      "Axe",
      "Pickaxe",
      "Hoe",
      "Watering Can",
      "Pan",
      "Trash Can",
      "Fishing Rod",
    ]);
  });

  it("names tool levels and applies the pan offset", () => {
    const data = fresh();
    data.toolLevels.axe = 3;
    data.toolLevels.pan = 0;

    const chips = Object.fromEntries(
      toolChips(data).map((chip) => [chip.label, chip]),
    );

    expect(chips.Axe).toMatchObject({ level: "Gold", tone: "gold" });
    expect(chips.Pan).toMatchObject({ level: "Copper", tone: "copper" });
    expect(chips.Hoe).toMatchObject({ level: "Basic", tone: "basic" });
  });

  it("says None when there is no rod and colors a rod from the third up", () => {
    const none = toolChips(fresh()).at(-1)!;
    const data = fresh();
    data.toolLevels.fishingRod = 2;
    const third = toolChips(data).at(-1)!;

    expect(none).toMatchObject({ level: "None", tone: "basic" });
    expect(third.tone).toBe("gold");
    expect(third.level).not.toBe("None");
  });
});

describe("collections", () => {
  it("uses the in-game fish and crafting totals", () => {
    const rows = Object.fromEntries(
      collectionRows(fresh()).map((row) => [row.label, row]),
    );

    expect(rows["Fish caught"].total).toBe(72);
    expect(rows["Recipes crafted"].total).toBe(149);
  });

  it("counts only shipped items and gives percentages", () => {
    const data = fresh();
    data.shipped = {
      "16": { shipped: true, count: 1 },
      "174": { shipped: false, count: 0 },
    };

    const row = collectionRows(data)[0];

    expect(row.label).toBe("Items shipped");
    expect(row.current).toBe(1);
    expect(row.percent).toBe(Math.round((1 / row.total) * 100));
  });

  it("does not count a caught fish that the collection leaves out", () => {
    const data = fresh();
    data.fishCaught = [{ id: "159", timesCaught: 1, largestSize: 1 }];

    expect(collectionRows(data)[1].current).toBeLessThanOrEqual(1);
  });

  it("caps a percentage at 100 and survives a total of zero", () => {
    expect(percentOf({ current: 12, total: 10 })).toBe(100);
    expect(percentOf({ current: 0, total: 0 })).toBe(0);
  });
});

describe("relationships", () => {
  it("counts hearts against the villager's own maximum", () => {
    const data = progressed();
    const rows = villagerRows(data);
    const abigail = rows.find((row) => row.name === "Abigail")!;
    const sebastian = rows.find((row) => row.name === "Sebastian")!;

    expect(abigail.married).toBe(true);
    expect(abigail.maxHearts).toBeGreaterThan(sebastian.maxHearts);
    expect(sebastian.maxHearts).toBe(10);
    expect(abigail.maxHearts).toBe(14);
  });

  it("raises the maximum for a dating villager, whatever the capitalization", () => {
    const data = progressed();
    const withDating = villagerRows(data).find(
      (row) => row.name === "Sebastian",
    )!;
    data.villagers.Sebastian.status = "dating";
    const lowercase = villagerRows(data).find(
      (row) => row.name === "Sebastian",
    )!;
    data.villagers.Sebastian.status = "Friendly";
    const friendly = villagerRows(data).find(
      (row) => row.name === "Sebastian",
    )!;

    expect(lowercase.maxHearts).toBe(withDating.maxHearts);
    expect(friendly.maxHearts).toBeLessThan(withDating.maxHearts);
  });

  it("treats a villager with no progress as zero hearts and lists every villager", () => {
    const rows = villagerRows(fresh());

    expect(rows.length).toBeGreaterThan(30);
    expect(rows.every((row) => row.hearts === 0 && !row.maxed)).toBe(true);
  });

  it("counts the villagers at their maximum", () => {
    const data = progressed();
    const rows = villagerRows(data);
    const target = rows.find((row) => row.name === "Krobus")!;
    data.villagers.Krobus = {
      hearts: target.maxHearts,
      heartPoints: 0,
      eventsSeen: [],
      status: "Friendly",
    };

    expect(maxedVillagers(villagerRows(data)).current).toBe(1);
    expect(maxedVillagers(villagerRows(data)).total).toBe(rows.length);
  });
});

describe("perfection", () => {
  it("lists every category and adds the waivers to the score", () => {
    const data = progressed();
    const without = perfectionFigures({ ...data, perfectionWaiverCount: 0 });
    const withWaivers = perfectionFigures({
      ...data,
      perfectionWaiverCount: 2,
    });

    expect(withWaivers.categories.length).toBe(11);
    expect(withWaivers.score).toBe(without.score + 2);
    expect(withWaivers.waivers).toBe(2);
  });

  it("says a category is done when it reaches its total", () => {
    expect(isCategoryDone({ current: 4, total: 4 } as never)).toBe(true);
    expect(isCategoryDone({ current: 3, total: 4 } as never)).toBe(false);
  });
});

describe("community center and joja", () => {
  it("shows the six rooms and the three flags for the Community Center", () => {
    const data = progressed();
    data.communityCenter.rooms.pantry = true;
    data.communityCenter.ceremonyAttended = true;

    const figures = communityCenterFigures(data);

    expect(figures.path).toBe("community-center");
    expect(figures.badge).toBe("1 / 6 rooms");
    expect(figures.rows.map((row) => row.label)).toEqual([
      "Crafts Room",
      "Pantry",
      "Fish Tank",
      "Boiler Room",
      "Bulletin Board",
      "Vault",
    ]);
    expect(
      figures.flags.find((flag) => flag.label === "Ceremony attended")!.on,
    ).toBe(true);
    expect(figures.flags.find((flag) => flag.label === "Completed")!.on).toBe(
      false,
    );
  });

  it("shows the Joja projects for a Joja member, with readable names", () => {
    const data = progressed();
    data.joja = {
      isMember: true,
      completed: false,
      developments: { "greenhouse-fix": true, "bus-repair": false },
    };

    const figures = communityCenterFigures(data);

    expect(figures.path).toBe("joja");
    expect(figures.badge).toBe("1 / 2 purchased");
    expect(figures.rows).toEqual([
      { label: "Greenhouse Fix", done: true },
      { label: "Bus Repair", done: false },
    ]);
    expect(figures.flags).toEqual([]);
  });
});

describe("mines", () => {
  it("measures the mine against 120 and the Skull Cavern bar against 100", () => {
    const data = progressed();
    data.mineProgress.deepestMineLevel = 60;
    data.mineProgress.deepestSkullCavernLevel = 130;

    const figures = minesFigures(data);

    expect(figures.mineDepth).toEqual({ current: 60, total: 120 });
    expect(figures.skullCavernLevel).toBe(130);
    expect(figures.skullCavernBar).toBe(1);
  });

  it("scales the Skull Cavern bar below 100", () => {
    const data = progressed();
    data.mineProgress.deepestSkullCavernLevel = 25;

    expect(minesFigures(data).skullCavernBar).toBe(0.25);
  });

  it("reports the keys and the slayer goals", () => {
    const data = progressed();
    data.mineProgress.hasRustyKey = true;

    const figures = minesFigures(data);

    expect(figures.keys).toEqual([
      { label: "Rusty Key", owned: true },
      { label: "Skull Key", owned: false },
    ]);
    expect(figures.goals.length).toBe(12);
    expect(figures.goalsDone).toBe(
      figures.goals.filter((goal) => goal.done).length,
    );
  });
});

describe("milestones", () => {
  it("lists the eleven tiles in order", () => {
    expect(milestoneTiles(fresh()).map((tile) => tile.label)).toEqual([
      "Stardrops",
      "Golden Walnuts",
      "Achievements",
      "Secret Notes",
      "Journal Scraps",
      "Lost Books",
      "Power Books",
      "Special Items",
      "Help Wanted",
      "Special Orders",
      "Qi Orders",
    ]);
  });

  it("has no total for Help Wanted and 130 for the walnuts", () => {
    const tiles = Object.fromEntries(
      milestoneTiles(progressed()).map((tile) => [tile.label, tile]),
    );

    expect(tiles["Help Wanted"].total).toBeUndefined();
    expect(tiles["Golden Walnuts"].total).toBe(130);
    expect(tiles["Golden Walnuts"].current).toBe(12);
  });

  it("reads lost books from the found count, because a save never fills the list", () => {
    const data = progressed();
    data.lostBooks = {};
    data.lostBooksFound = 14;

    expect(
      milestoneTiles(data).find((tile) => tile.label === "Lost Books")!.current,
    ).toBe(14);
  });
});
