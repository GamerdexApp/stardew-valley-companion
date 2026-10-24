import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  bestPetFriendship,
  buildGrandpaInput,
  EARNINGS_TIERS,
  evaluate,
  MAX_SCORE,
  totalSkillLevels,
  villagersAtEightHearts,
} from "@/service/grandpa";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const base = (): GameData => clone(DEFAULT_GAME_DATA);
const row = (data: GameData, category: string, id: string) =>
  evaluate(data)
    .categories.find((item) => item.id === category)!
    .rows.find((item) => item.id === id)!;
const withHearts = (data: GameData, names: string[], hearts = 8) => {
  for (const name of names) {
    data.villagers[name] = {
      hearts,
      heartPoints: hearts * 250,
      eventsSeen: [],
      status: "",
    };
  }
  return data;
};

describe("score and candles", () => {
  it("scores nothing on an empty farm and lights one candle", () => {
    const result = evaluate(base());

    expect(result.score).toBe(0);
    expect(result.candles).toBe(1);
    expect(MAX_SCORE).toBe(21);
    expect(result.nextCandle).toEqual({ points: 4, needed: 4 });
    expect(result.categoriesComplete).toBe(0);
  });

  it("lights the candles at 4, 8 and 12 points and says what the next one needs", () => {
    const at = (earnings: number, skills: number) => {
      const data = base();
      data.character.totalMoneyEarned = earnings;
      data.skills = { farming: { level: skills, xp: 0 } } as GameData["skills"];
      return evaluate(data);
    };

    expect(at(300_000, 0)).toMatchObject({ score: 4, candles: 2 });
    expect(at(500_000, 50)).toMatchObject({
      score: 7,
      candles: 2,
      nextCandle: { points: 8, needed: 1 },
    });
    expect(at(1_000_000, 50)).toMatchObject({ score: 9, candles: 3 });
  });

  it("lights all four candles at 12 points and has no next candle", () => {
    const data = base();
    data.character.totalMoneyEarned = 1_000_000;
    data.skills = { farming: { level: 50, xp: 0 } } as GameData["skills"];
    data.mineProgress.hasSkullKey = true;
    data.mineProgress.hasRustyKey = true;
    data.communityCenter.completed = true;
    data.communityCenter.ceremonyAttended = true;
    const result = evaluate(data);

    expect(result.score).toBe(7 + 2 + 1 + 1 + 3);
    expect(result.candles).toBe(4);
    expect(result.nextCandle).toBeNull();
  });
});

describe("earnings", () => {
  it("lists the six tiers of the game and none at 750,000g", () => {
    expect(EARNINGS_TIERS.map((tier) => tier.threshold)).toEqual([
      50_000, 100_000, 200_000, 300_000, 500_000, 1_000_000,
    ]);
    expect(EARNINGS_TIERS.map((tier) => tier.points)).toEqual([
      1, 2, 3, 4, 5, 7,
    ]);
  });

  it("gives the points of the highest tier reached, not the sum of the rows", () => {
    const data = base();
    data.character.totalMoneyEarned = 412_000;
    const earnings = evaluate(data).categories[0];

    expect(earnings).toMatchObject({ earned: 4, max: 7 });
    expect(earnings.rows.map((item) => item.earned)).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(row(data, "earnings", "earnings-500000").progress).toEqual({
      current: 412_000,
      total: 500_000,
      unit: "g",
    });
    expect(row(data, "earnings", "earnings-50000").progress).toBeNull();
  });

  it("agrees with the points of the evaluator at every tier", () => {
    for (const tier of EARNINGS_TIERS) {
      const data = base();
      data.character.totalMoneyEarned = tier.threshold;

      expect(evaluate(data).categories[0].earned).toBe(tier.points);
    }
  });
});

describe("skills", () => {
  it("adds the levels of the skills and earns a point at 30 and another at 50", () => {
    const data = base();
    data.skills = {
      farming: { level: 10, xp: 0 },
      fishing: { level: 10, xp: 0 },
      foraging: { level: 10, xp: 0 },
      mining: { level: 6, xp: 0 },
      combat: { level: 6, xp: 0 },
    };

    expect(totalSkillLevels(data)).toBe(42);
    expect(evaluate(data).categories[1]).toMatchObject({ earned: 1, max: 2 });
    expect(row(data, "skills", "Total Skill Levels ≥50").progress).toEqual({
      current: 42,
      total: 50,
      unit: "",
    });
    expect(row(data, "skills", "Total Skill Levels ≥30").earned).toBe(true);
  });
});

describe("achievements", () => {
  it("reads the achievements with the ids 5, 26 and 34", () => {
    const data = base();
    data.achievements = ["26"];

    expect(row(data, "achievements", "Master Angler").earned).toBe(true);
    expect(row(data, "achievements", "A Complete Collection").earned).toBe(
      false,
    );
    expect(row(data, "achievements", "Full Shipment").earned).toBe(false);
  });

  it("shows progress for the ones not earned, with the totals of the collections", () => {
    const museum = row(
      base(),
      "achievements",
      "A Complete Collection",
    ).progress!;
    const angler = row(base(), "achievements", "Master Angler").progress!;
    const shipment = row(base(), "achievements", "Full Shipment").progress!;

    expect(museum).toMatchObject({ current: 0, unit: "donated" });
    expect(museum.total).toBeGreaterThan(80);
    expect(angler).toEqual({ current: 0, total: 72, unit: "caught" });
    expect(shipment).toMatchObject({ current: 0, unit: "shipped" });
    expect(shipment.total).toBeGreaterThan(100);
  });

  it("counts donated items for the museum", () => {
    const data = base();
    data.minerals = {
      "80": { found: true, donated: true },
    } as GameData["minerals"];

    expect(
      row(data, "achievements", "A Complete Collection").progress!.current,
    ).toBe(1);
  });
});

describe("friendship", () => {
  it("counts villagers at 8 hearts and leaves out the spouse", () => {
    const data = withHearts(base(), [
      "Abigail",
      "Alex",
      "Elliott",
      "Emily",
      "Haley",
      "Harvey",
    ]);
    data.character.spouse = "Abigail";

    expect(villagersAtEightHearts(data)).toBe(5);
    expect(row(data, "friendship", "5+ Villagers at 8 Hearts").earned).toBe(
      true,
    );
    expect(
      row(data, "friendship", "10+ Villagers at 8 Hearts").progress,
    ).toEqual({
      current: 5,
      total: 10,
      unit: "",
    });
  });

  it("does not count a villager at 7 hearts", () => {
    expect(villagersAtEightHearts(withHearts(base(), ["Abigail"], 7))).toBe(0);
  });

  it("needs the kitchen and the nursery with a spouse for the marriage point", () => {
    const married = base();
    married.character.spouse = "Leah";
    married.character.houseUpgradeLevel = 1;
    expect(
      row(married, "friendship", "Married with Kitchen & Nursery").earned,
    ).toBe(false);
    married.character.houseUpgradeLevel = 2;
    expect(
      row(married, "friendship", "Married with Kitchen & Nursery").earned,
    ).toBe(true);
    expect(buildGrandpaInput(base()).married).toBe(false);
  });

  it("takes the best friendship of a cat, dog or turtle and ignores a horse", () => {
    const data = base();
    data.pets = [
      {
        name: "Horse",
        type: "Horse",
        breed: "",
        friendship: 1000,
        starter: false,
      },
      { name: "Tom", type: "Cat", breed: "", friendship: 820, starter: true },
      {
        name: "Odie",
        type: "Dog",
        breed: "",
        friendship: null,
        starter: false,
      },
    ];

    expect(bestPetFriendship(data)).toBe(820);
    expect(row(data, "friendship", "Pet at Max Friendship").progress).toEqual({
      current: 820,
      total: 1000,
      unit: "",
    });
    data.pets[2].friendship = 1000;
    expect(row(data, "friendship", "Pet at Max Friendship").earned).toBe(true);
  });

  it("has no pet friendship without a pet", () => {
    expect(bestPetFriendship(base())).toBe(0);
  });
});

describe("Community Center and exploration", () => {
  it("gives a point for completing the Community Center and two for the ceremony", () => {
    const data = base();
    data.communityCenter.completed = true;

    expect(evaluate(data).categories[4]).toMatchObject({ earned: 1, max: 3 });
    data.communityCenter.ceremonyAttended = true;
    expect(evaluate(data).categories[4]).toMatchObject({
      earned: 3,
      max: 3,
      complete: true,
    });
    expect(
      row(data, "community-center", "Community Center Ceremony Attended")
        .maxPoints,
    ).toBe(2);
  });

  it("gives a point for each key", () => {
    const data = base();
    data.mineProgress.hasRustyKey = true;

    expect(evaluate(data).categories[5]).toMatchObject({ earned: 1, max: 2 });
    data.mineProgress.hasSkullKey = true;
    expect(evaluate(data).categories[5].complete).toBe(true);
    expect(evaluate(data).categoriesComplete).toBe(1);
  });
});

describe("categories", () => {
  it("come in the order earnings, skills, achievements, friendship, community center, exploration", () => {
    expect(evaluate(base()).categories.map((item) => item.id)).toEqual([
      "earnings",
      "skills",
      "achievements",
      "friendship",
      "community-center",
      "exploration",
    ]);
  });

  it("add up to the 21 points", () => {
    expect(
      evaluate(base()).categories.reduce((sum, item) => sum + item.max, 0),
    ).toBe(21);
  });
});
