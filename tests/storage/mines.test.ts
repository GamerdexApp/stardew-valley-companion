import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  ALL_LOCATIONS,
  allMonsters,
  dangerousCount,
  elevatorLevel,
  emptyMonsterFilters,
  filterMonsters,
  getGoalKillCount,
  getMonsterKillCount,
  goalProgress,
  isFilteringMonsters,
  lootOf,
  MAX_KILLS,
  minesSummary,
  monsterLocations,
  setMineLevel,
  setMonsterKills,
  setRustyKey,
  setSkullKey,
  setSkullLevel,
  slayerGoals,
} from "@/service/mines";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const base = (): GameData => clone(DEFAULT_GAME_DATA);
const monster = (name: string) =>
  allMonsters.find((item) => item.name === name)!;

describe("kill counts", () => {
  it("adds up the kills of every monster of a goal", () => {
    const duggies = slayerGoals.find((goal) => goal.name === "Duggies")!;

    expect(
      getGoalKillCount(duggies, { Duggy: 10, "Magma Duggy": 5, Bat: 99 }),
    ).toBe(15);
  });

  it("counts a monster saved by name and by id once each", () => {
    const slime = monster("Green Slime");

    expect(getMonsterKillCount(slime, { "Green Slime": 7 })).toBe(7);
    expect(getMonsterKillCount(slime, {})).toBe(0);
    const renamed = { ...slime, id: "slime-id" };
    expect(
      getMonsterKillCount(renamed, { "Green Slime": 7, "slime-id": 3 }),
    ).toBe(10);
  });

  it("sets the kills of a monster and removes the entry at zero", () => {
    const slime = monster("Green Slime");
    const set = setMonsterKills(base(), slime, 12);

    expect(set.monsters).toEqual({ "Green Slime": 12 });
    expect(setMonsterKills(set, slime, 0).monsters).toEqual({});
  });

  it("keeps the kills of the other monsters", () => {
    const data = { ...base(), monsters: { Bat: 4 } };

    expect(setMonsterKills(data, monster("Duggy"), 3).monsters).toEqual({
      Bat: 4,
      Duggy: 3,
    });
  });

  it("keeps kills as a whole number between zero and the limit", () => {
    const slime = monster("Green Slime");

    expect(setMonsterKills(base(), slime, 4.9).monsters["Green Slime"]).toBe(4);
    expect(setMonsterKills(base(), slime, -5).monsters).toEqual({});
    expect(
      setMonsterKills(base(), slime, 99_999_999).monsters["Green Slime"],
    ).toBe(MAX_KILLS);
  });

  it("does not leave a second count under the id of a monster", () => {
    const renamed = { ...monster("Green Slime"), id: "slime-id" };
    const data = { ...base(), monsters: { "Green Slime": 7, "slime-id": 3 } };

    expect(setMonsterKills(data, renamed, 20).monsters).toEqual({
      "Green Slime": 20,
    });
  });
});

describe("slayer goals", () => {
  it("lists 12 goals in the order of their kill target", () => {
    const targets = slayerGoals.map((goal) => goal.killTarget);

    expect(slayerGoals).toHaveLength(12);
    expect(targets).toEqual([...targets].sort((a, b) => a - b));
    expect(slayerGoals[0].name).toBe("Duggies");
    expect(slayerGoals[11].name).toBe("Slime");
  });

  it("tells progress and when a goal is complete, and caps the share at one", () => {
    const data = { ...base(), monsters: { Duggy: 30, Skeleton: 20 } };
    const progress = goalProgress(data);

    expect(progress[0]).toMatchObject({ kills: 30, complete: true, share: 1 });
    expect(
      progress.find((item) => item.goal.name === "Skeletons"),
    ).toMatchObject({
      kills: 20,
      complete: false,
    });
    expect(
      progress.find((item) => item.goal.name === "Skeletons")!.share,
    ).toBeCloseTo(0.4);
    expect(goalProgress({ ...base(), monsters: { Duggy: 300 } })[0].share).toBe(
      1,
    );
  });
});

describe("mine progress", () => {
  it("keeps the Mines floor between 0 and 120", () => {
    expect(setMineLevel(base(), 85).mineProgress.deepestMineLevel).toBe(85);
    expect(setMineLevel(base(), 500).mineProgress.deepestMineLevel).toBe(120);
    expect(setMineLevel(base(), -3).mineProgress.deepestMineLevel).toBe(0);
  });

  it("lets the Skull Cavern floor grow with no upper limit", () => {
    expect(
      setSkullLevel(base(), 112).mineProgress.deepestSkullCavernLevel,
    ).toBe(112);
    expect(
      setSkullLevel(base(), 5000).mineProgress.deepestSkullCavernLevel,
    ).toBe(5000);
    expect(setSkullLevel(base(), -1).mineProgress.deepestSkullCavernLevel).toBe(
      0,
    );
  });

  it("sets the two keys without touching the rest", () => {
    const data = setSkullLevel(setMineLevel(base(), 40), 9);
    const keyed = setSkullKey(setRustyKey(data, true), true);

    expect(keyed.mineProgress).toEqual({
      deepestMineLevel: 40,
      deepestSkullCavernLevel: 9,
      hasRustyKey: true,
      hasSkullKey: true,
    });
  });

  it("finds the elevator level at every fifth floor of the Mines", () => {
    expect(elevatorLevel(0)).toBe(0);
    expect(elevatorLevel(4)).toBe(0);
    expect(elevatorLevel(5)).toBe(5);
    expect(elevatorLevel(87)).toBe(85);
    expect(elevatorLevel(120)).toBe(120);
  });
});

describe("mines summary", () => {
  it("reads the depths, keys, goals and kills", () => {
    let data = setSkullLevel(setMineLevel(base(), 85), 112);
    data = setRustyKey(data, true);
    data.monsters = { Duggy: 30, "Magma Duggy": 12, Bat: 8 };

    expect(minesSummary(data)).toEqual({
      mineLevel: 85,
      skullLevel: 112,
      rustyKey: true,
      skullKey: false,
      goalsDone: 1,
      goalsTotal: 12,
      totalSlain: 50,
      elevator: 85,
    });
  });
});

describe("monster list and filters", () => {
  it("lists 46 monsters in name order, 7 of them dangerous", () => {
    const names = allMonsters.map((item) => item.name);

    expect(allMonsters).toHaveLength(46);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(dangerousCount(allMonsters)).toBe(7);
    expect(filterMonsters(emptyMonsterFilters)).toHaveLength(46);
    expect(isFilteringMonsters(emptyMonsterFilters)).toBe(false);
  });

  it("filters by location and by type", () => {
    expect(monsterLocations).toHaveLength(11);
    const skull = filterMonsters({
      ...emptyMonsterFilters,
      location: "Skull Cavern",
    });

    expect(skull.length).toBeGreaterThan(3);
    expect(skull.every((item) => item.locations.includes("Skull Cavern"))).toBe(
      true,
    );
    expect(
      filterMonsters({ ...emptyMonsterFilters, type: "dangerous" }),
    ).toHaveLength(7);
    expect(
      filterMonsters({ ...emptyMonsterFilters, type: "standard" }),
    ).toHaveLength(39);
    expect(
      isFilteringMonsters({ ...emptyMonsterFilters, type: "dangerous" }),
    ).toBe(true);
    expect(ALL_LOCATIONS).toBe("all");
  });

  it("searches the name without caring about case", () => {
    expect(
      filterMonsters({ ...emptyMonsterFilters, query: "GREEN sl" }).map(
        (m) => m.name,
      ),
    ).toEqual(["Green Slime"]);
  });
});

describe("loot", () => {
  it("lists what a monster drops", () => {
    expect(lootOf(monster("Green Slime")).map((item) => item.name)).toContain(
      "Slime",
    );
    expect(lootOf(monster("Putrid Ghost"))).toEqual([]);
  });
});
