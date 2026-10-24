import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  calculatePerfection,
  calculatePerfectionScore,
  MAX_WAIVERS,
  perfectionView,
  setWaivers,
} from "@/service/perfection";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const base = (): GameData => clone(DEFAULT_GAME_DATA);
const category = (data: GameData, id: string) =>
  calculatePerfection(data).find((item) => item.id === id)!;
const row = (data: GameData, id: string) =>
  perfectionView(data).rows.find((item) => item.category.id === id)!;

describe("the categories", () => {
  it("are the eleven of the game, with weights that add up to 100", () => {
    const categories = calculatePerfection(base());

    expect(categories).toHaveLength(11);
    expect(categories.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });

  it("count the in-game totals of fish, crafting and walnuts", () => {
    const data = base();

    expect(category(data, "fish-caught").total).toBe(72);
    expect(category(data, "crafting-recipes-made").total).toBe(149);
    expect(category(data, "golden-walnuts-found").total).toBe(130);
    expect(category(data, "produce-forage-shipped").total).toBe(154);
  });
});

describe("what each category counts", () => {
  it("counts the obelisks and the gold clock on the farm", () => {
    const data = base();
    data.buildings = [
      { id: "1", type: "Earth Obelisk", animalCount: 0 },
      { id: "2", type: "Water Obelisk", animalCount: 0 },
      { id: "3", type: "Gold Clock", animalCount: 0 },
    ];

    expect(category(data, "obelisks-on-farm")).toMatchObject({ current: 2 });
    expect(
      category(data, "obelisks-on-farm").missing.map((item) => item.name),
    ).toEqual(["Desert Obelisk", "Island Obelisk"]);
    expect(category(data, "golden-clock-on-farm")).toMatchObject({
      current: 1,
      missing: [],
    });
    expect(category(base(), "golden-clock-on-farm").missing).toHaveLength(1);
  });

  it("counts the levels of the five skills up to 10 each and names what is missing", () => {
    const data = base();
    data.skills = {
      farming: { level: 9, xp: 0 },
      fishing: { level: 10, xp: 0 },
      foraging: { level: 14, xp: 0 },
      mining: { level: 7, xp: 0 },
      combat: { level: 7, xp: 0 },
    };

    const farmer = category(data, "farmer-level");
    expect(farmer.current).toBe(43);
    expect(farmer.missing.map((item) => item.name)).toEqual([
      "Farming 9 of 10",
      "Mining 7 of 10",
      "Combat 7 of 10",
    ]);
  });

  it("counts a villager at the cap of their own status, a spouse at 14", () => {
    const data = base();
    data.character.spouse = "Leah";
    data.villagers.Leah = {
      hearts: 10,
      heartPoints: 2500,
      eventsSeen: [],
      status: "Married",
    };
    data.villagers.Pierre = {
      hearts: 10,
      heartPoints: 2500,
      eventsSeen: [],
      status: "",
    };
    data.villagers.Shane = {
      hearts: 7,
      heartPoints: 1750,
      eventsSeen: [],
      status: "",
    };
    data.villagers.Abigail = {
      hearts: 10,
      heartPoints: 2500,
      eventsSeen: [],
      status: "Dating",
    };

    const friends = category(data, "great-friends");
    expect(friends.current).toBe(2);
    expect(friends.total).toBe(34);
    expect(friends.missing.map((item) => item.name)).toContain("Leah");
    data.villagers.Leah.hearts = 14;
    expect(category(data, "great-friends").current).toBe(3);
  });

  it("counts the slayer goals that reached their target", () => {
    const data = base();
    data.monsters = { Duggy: 30 };

    expect(category(data, "monster-slayer-hero").current).toBe(1);
  });

  it("counts walnuts from the one found total", () => {
    const data = base();
    data.goldenWalnutsFound = 105;

    expect(category(data, "golden-walnuts-found").current).toBe(105);
  });

  it("gives every missing item an image address that starts at the site root", () => {
    const missing = calculatePerfection(base()).flatMap((item) => item.missing);

    expect(missing.length).toBeGreaterThan(100);
    expect(
      missing.filter((item) => item.image && !item.image.startsWith("/")),
    ).toEqual([]);
    expect(category(base(), "golden-walnuts-found").missing[0].image).toBe(
      "/images/misc/Golden Walnut.png",
    );
  });
});

describe("the score", () => {
  it("is zero for a new farm", () => {
    expect(perfectionView(base())).toMatchObject({
      score: 0,
      base: 0,
      complete: 0,
    });
  });

  it("weighs each category by its share, and never past its weight", () => {
    const data = base();
    data.goldenWalnutsFound = 130;
    data.stardrops = Object.fromEntries(
      calculatePerfection(base())
        .find((item) => item.id === "found-all-stardrops")!
        .missing.map((item) => [item.id, true]),
    );
    const view = perfectionView(data);

    expect(row(data, "golden-walnuts-found")).toMatchObject({
      share: 1,
      points: 5,
      complete: true,
    });
    expect(row(data, "found-all-stardrops")).toMatchObject({
      points: 10,
      complete: true,
    });
    expect(view.base).toBe(15);
    expect(view.score).toBe(15);
    expect(view.complete).toBe(2);
  });

  it("caps a category that goes over its total, as a file with too many walnuts can", () => {
    const data = base();
    data.goldenWalnutsFound = 400;

    expect(row(data, "golden-walnuts-found")).toMatchObject({
      share: 1,
      points: 5,
      complete: true,
    });
    expect(perfectionView(data).base).toBe(5);
    expect(perfectionView(data).score).toBe(5);
  });

  it("adds a percent for each waiver, rounds, and stops at 100", () => {
    const categories = calculatePerfection(base());

    expect(calculatePerfectionScore(categories, 2)).toBe(2);
    expect(calculatePerfectionScore(categories, 250)).toBe(100);
    const half = calculatePerfection(base()).map((item) => ({
      ...item,
      current: item.total / 2,
    }));
    expect(calculatePerfectionScore(half, 0)).toBe(50);
    const odd = calculatePerfection(base()).map((item) => ({
      ...item,
      current: item.total * 0.51,
    }));
    expect(calculatePerfectionScore(odd, 0)).toBe(51);
  });

  it("reads the weighted sum with one decimal and the waivers", () => {
    const data = base();
    data.goldenWalnutsFound = 65;
    data.perfectionWaiverCount = 2;
    const view = perfectionView(data);

    expect(view.base).toBe(2.5);
    expect(view.waivers).toBe(2);
    expect(view.score).toBe(5);
  });
});

describe("waivers", () => {
  it("are a whole number from 0 to the limit", () => {
    expect(setWaivers(base(), 3).perfectionWaiverCount).toBe(3);
    expect(setWaivers(base(), -2).perfectionWaiverCount).toBe(0);
    expect(setWaivers(base(), 4.8).perfectionWaiverCount).toBe(4);
    expect(setWaivers(base(), 999).perfectionWaiverCount).toBe(MAX_WAIVERS);
  });

  it("change the score and nothing else", () => {
    const data = base();
    const next = setWaivers(data, 5);

    expect(perfectionView(next).score).toBe(5);
    expect({ ...next, perfectionWaiverCount: 0 }).toEqual(data);
  });
});
