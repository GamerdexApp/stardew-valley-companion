import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  applySaveUpdate,
  changesBySection,
  countChanges,
} from "@/service/saveUpdate";
import { DEFAULT_GAME_DATA } from "@/data/constants";
import { progressedPlaythrough } from "./fixtures";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const mine = (): GameData => ({
  ...clone(progressedPlaythrough().data),
  trackedGifts: [
    {
      itemName: "Pumpkin",
      villagerName: "Abigail",
      given: false,
      preference: "loves",
    },
  ],
  lostBooks: { "1": true },
});

const fromSave = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  return {
    ...data,
    character: {
      ...data.character,
      name: "Sam",
      money: 99999,
      totalDaysPlayed: 300,
      currentDate: { season: "winter", day: 3, year: 3 },
    },
    toolLevels: { ...data.toolLevels, pan: 2, axe: 3 },
    shipped: {
      "16": { shipped: true, count: 50 },
      "999": { shipped: true, count: 1 },
    },
    fishCaught: [
      { id: "128", timesCaught: 9, largestSize: 40 },
      { id: "130", timesCaught: 1, largestSize: 12 },
    ],
    achievements: ["0", "5"],
    stardrops: { CF_Fair: false, CF_Fish: true },
    villagers: {
      Abigail: {
        hearts: 8,
        heartPoints: 2000,
        eventsSeen: ["1", "3"],
        status: "Friendly",
      },
      Leah: { hearts: 2, heartPoints: 500, eventsSeen: [], status: "Friendly" },
    },
    goldenWalnutsFound: 40,
    perfectionWaiverCount: 0,
  };
};

describe("applySaveUpdate, replace", () => {
  it("lets the save win for what it reports", () => {
    const result = applySaveUpdate(mine(), fromSave(), "replace");

    expect(result.character.money).toBe(99999);
    expect(result.character.currentDate).toEqual({
      season: "winter",
      day: 3,
      year: 3,
    });
    expect(result.goldenWalnutsFound).toBe(40);
    expect(result.villagers.Abigail.hearts).toBe(8);
  });

  it("removes what the save does not report", () => {
    const result = applySaveUpdate(mine(), fromSave(), "replace");

    expect(Object.keys(result.shipped).sort()).toEqual(["16", "999"]);
    expect(result.fishCaught.map((fish) => fish.id)).toEqual(["128", "130"]);
  });

  it("always keeps tracked gifts and lost books", () => {
    const result = applySaveUpdate(mine(), fromSave(), "replace");

    expect(result.trackedGifts).toEqual(mine().trackedGifts);
    expect(result.lostBooks).toEqual({ "1": true });
  });

  it("keeps a field it does not know", () => {
    const current = { ...mine(), futureField: { nested: [1] } } as GameData;

    const result = applySaveUpdate(current, fromSave(), "replace") as GameData &
      Record<string, unknown>;

    expect(result.futureField).toEqual({ nested: [1] });
  });
});

describe("applySaveUpdate, fill gaps only", () => {
  it("keeps values the player changed", () => {
    const result = applySaveUpdate(mine(), fromSave(), "fill");

    expect(result.character.money).toBe(48210);
    expect(result.character.currentDate).toEqual({
      season: "fall",
      day: 12,
      year: 2,
    });
    expect(result.goldenWalnutsFound).toBe(12);
    expect(result.villagers.Abigail.hearts).toBe(10);
    expect(result.villagers.Abigail.status).toBe("Married");
  });

  it("fills values that were still empty or at their default", () => {
    const current = mine();
    current.character.totalMoneyEarned = 0;
    current.toolLevels.pan = -1;

    const result = applySaveUpdate(current, fromSave(), "fill");

    expect(result.toolLevels.pan).toBe(2);
    expect(result.toolLevels.axe).toBe(3);
  });

  it("keeps a tool level the player already raised", () => {
    const current = mine();
    current.toolLevels.axe = 1;

    expect(applySaveUpdate(current, fromSave(), "fill").toolLevels.axe).toBe(1);
  });

  it("adds entries the player has not recorded and keeps the ones they have", () => {
    const result = applySaveUpdate(mine(), fromSave(), "fill");

    expect(result.shipped["16"]).toEqual({ shipped: true, count: 12 });
    expect(result.shipped["999"]).toEqual({ shipped: true, count: 1 });
    expect(result.shipped["174"]).toEqual({ shipped: true, count: 3 });
    expect(result.villagers.Leah.hearts).toBe(2);
  });

  it("merges lists by id and by value without losing the player's entries", () => {
    const result = applySaveUpdate(mine(), fromSave(), "fill");

    expect(result.fishCaught).toEqual([
      { id: "128", timesCaught: 4, largestSize: 31 },
      { id: "130", timesCaught: 1, largestSize: 12 },
    ]);
    expect(result.achievements).toEqual(["0", "5"]);
    expect(result.villagers.Abigail.eventsSeen).toEqual(["1", "2", "3"]);
  });

  it("never turns a switched on flag off", () => {
    const current = mine();
    current.stardrops = { CF_Fair: true };

    const result = applySaveUpdate(current, fromSave(), "fill");

    expect(result.stardrops).toEqual({ CF_Fair: true, CF_Fish: true });
  });

  it("turns on a flag the save has and the player had off", () => {
    const current = mine();
    current.stardrops = { CF_Fish: false };

    expect(applySaveUpdate(current, fromSave(), "fill").stardrops.CF_Fish).toBe(
      true,
    );
  });

  it("always keeps tracked gifts and lost books", () => {
    const result = applySaveUpdate(mine(), fromSave(), "fill");

    expect(result.trackedGifts).toEqual(mine().trackedGifts);
    expect(result.lostBooks).toEqual({ "1": true });
  });

  it("changes nothing a second time", () => {
    const once = applySaveUpdate(mine(), fromSave(), "fill");

    expect(applySaveUpdate(once, fromSave(), "fill")).toEqual(once);
  });

  it("changes nothing when the save matches", () => {
    const current = mine();

    expect(applySaveUpdate(current, clone(current), "fill")).toEqual(current);
  });

  it("does not change the data it is given", () => {
    const current = mine();
    const save = fromSave();
    const before = [JSON.stringify(current), JSON.stringify(save)];

    applySaveUpdate(current, save, "fill");
    applySaveUpdate(current, save, "replace");

    expect([JSON.stringify(current), JSON.stringify(save)]).toEqual(before);
  });
});

describe("counting changes", () => {
  it("is zero for identical data", () => {
    expect(countChanges(mine(), mine())).toBe(0);
  });

  it("counts a changed field and an added entry", () => {
    const after = mine();
    after.character.money = 1;
    after.shipped["500"] = { shipped: true, count: 1 };

    expect(countChanges(mine(), after)).toBe(2);
  });

  it("counts list entries that are added or removed", () => {
    const after = mine();
    after.achievements = ["9"];
    const before = mine();
    before.achievements = ["1", "2"];

    expect(countChanges(before, after)).toBe(3);
  });

  it("counts a removed entry", () => {
    const after = mine();
    delete after.shipped["16"];

    expect(countChanges(mine(), after)).toBe(1);
  });

  it("is larger for replace than for fill when the player's edits differ from the save", () => {
    const fill = countChanges(
      mine(),
      applySaveUpdate(mine(), fromSave(), "fill"),
    );
    const replace = countChanges(
      mine(),
      applySaveUpdate(mine(), fromSave(), "replace"),
    );

    expect(fill).toBeGreaterThan(0);
    expect(replace).toBeGreaterThan(fill);
  });

  it("lists the fields that change, most changes first", () => {
    const after = mine();
    after.shipped["500"] = { shipped: true, count: 1 };
    after.shipped["501"] = { shipped: true, count: 1 };
    after.character.money = 1;

    expect(changesBySection(mine(), after)).toEqual([
      { field: "shipped", count: 2 },
      { field: "character", count: 1 },
    ]);
  });
});
