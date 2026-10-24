import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  ALL_LOCATIONS,
  allWalnutSpots,
  barShares,
  costsMoreThanLeft,
  emptySpotFilters,
  filterSpots,
  isFilteringSpots,
  islandSummary,
  PARROT_RATE,
  setSpotFound,
  setUpgrade,
  setWalnutsFound,
  spotLocations,
  upgrades,
  upgradesCost,
  WALNUT_TOTAL,
} from "@/service/gingerIsland";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const base = (): GameData => clone(DEFAULT_GAME_DATA);

const single = allWalnutSpots.find((spot) => spot.amount === 1)!;
const triple = allWalnutSpots.find((spot) => spot.amount === 3)!;

describe("island summary", () => {
  it("reads the totals of an empty island", () => {
    expect(islandSummary(base())).toEqual({
      found: 0,
      unlocked: 0,
      spent: 0,
      available: 0,
      remaining: 130,
      parrotCost: 1_300_000,
      spotsFound: 0,
    });
    expect(WALNUT_TOTAL).toBe(130);
    expect(PARROT_RATE).toBe(10_000);
  });

  it("spends the cost of every unlocked upgrade and leaves the rest", () => {
    let data = setWalnutsFound(base(), 98);
    data = setUpgrade(data, "Island_FirstParrot", true);
    data = setUpgrade(data, "Island_Turtle", true);
    const summary = islandSummary(data);

    expect(summary).toMatchObject({
      found: 98,
      unlocked: 2,
      spent: 11,
      available: 87,
      remaining: 32,
    });
    expect(summary.parrotCost).toBe(320_000);
  });

  it("never shows a negative balance when more is spent than found", () => {
    const data = setUpgrade(setWalnutsFound(base(), 3), "Island_Resort", true);

    expect(islandSummary(data).available).toBe(0);
  });

  it("lists 11 upgrades that cost 116 walnuts together", () => {
    expect(upgrades).toHaveLength(11);
    expect(upgradesCost).toBe(116);
  });

  it("reads the found number from the per-spot map when the save has no total", () => {
    const data = base();
    data.goldenWalnuts = { a: 1, b: 1 };

    expect(islandSummary(data).found).toBe(2);
  });
});

describe("the walnut total", () => {
  it("is kept between 0 and 130 as a whole number", () => {
    expect(setWalnutsFound(base(), 200).goldenWalnutsFound).toBe(130);
    expect(setWalnutsFound(base(), -4).goldenWalnutsFound).toBe(0);
    expect(setWalnutsFound(base(), 12.9).goldenWalnutsFound).toBe(12);
  });

  it("leaves the spots alone", () => {
    const data = setSpotFound(base(), single.id, true);

    expect(setWalnutsFound(data, 50).goldenWalnuts).toEqual(data.goldenWalnuts);
  });
});

describe("upgrade warning", () => {
  const resort = upgrades.find((upgrade) => upgrade.id === "Island_Resort")!;

  it("warns when a locked upgrade costs more than the walnuts left", () => {
    expect(costsMoreThanLeft(setWalnutsFound(base(), 19), resort)).toBe(true);
    expect(costsMoreThanLeft(setWalnutsFound(base(), 20), resort)).toBe(false);
  });

  it("does not warn about an unlocked upgrade", () => {
    const data = setUpgrade(setWalnutsFound(base(), 0), resort.id, true);

    expect(costsMoreThanLeft(data, resort)).toBe(false);
  });

  it("counts walnuts spent on other upgrades", () => {
    let data = setWalnutsFound(base(), 25);
    data = setUpgrade(data, "Island_Turtle", true);

    expect(costsMoreThanLeft(data, resort)).toBe(true);
  });
});

describe("ticking a walnut spot", () => {
  it("adds the walnuts of the spot to the total and marks it found", () => {
    const data = setSpotFound(setWalnutsFound(base(), 10), triple.id, true);

    expect(data.goldenWalnuts[triple.id]).toBe(1);
    expect(data.goldenWalnutsFound).toBe(13);
  });

  it("takes them away again when the spot is cleared", () => {
    const ticked = setSpotFound(setWalnutsFound(base(), 10), triple.id, true);
    const cleared = setSpotFound(ticked, triple.id, false);

    expect(cleared.goldenWalnutsFound).toBe(10);
    expect(cleared.goldenWalnuts).toEqual({});
  });

  it("does nothing when the spot is already in that state, or is not known", () => {
    const data = setSpotFound(base(), single.id, true);

    expect(setSpotFound(data, single.id, true)).toBe(data);
    expect(setSpotFound(base(), single.id, false)).toEqual(base());
    const unknown = base();
    expect(setSpotFound(unknown, "nothing", true)).toBe(unknown);
  });

  it("keeps the total from going below zero or past 130", () => {
    const low = setSpotFound(
      { ...base(), goldenWalnuts: { [triple.id]: 1 } },
      triple.id,
      false,
    );
    const high = setSpotFound(setWalnutsFound(base(), 129), triple.id, true);

    expect(low.goldenWalnutsFound).toBe(0);
    expect(high.goldenWalnutsFound).toBe(130);
  });

  it("builds the total from the spot map when a hand made playthrough has no total", () => {
    const data = base();
    data.goldenWalnuts = { first: 1, second: 1 };
    const next = setSpotFound(data, single.id, true);

    expect(next.goldenWalnutsFound).toBe(3);
  });
});

describe("walnut spot filters", () => {
  it("knows the 69 spots, and that they hold 130 walnuts", () => {
    expect(allWalnutSpots).toHaveLength(69);
    expect(allWalnutSpots.reduce((sum, spot) => sum + spot.amount, 0)).toBe(
      130,
    );
    expect(spotLocations).toHaveLength(8);
    expect(spotLocations.find((l) => l.name === "Island West")?.count).toBe(26);
  });

  it("lists every spot with no filter", () => {
    expect(filterSpots(base(), emptySpotFilters)).toHaveLength(69);
    expect(isFilteringSpots(emptySpotFilters)).toBe(false);
  });

  it("filters by location", () => {
    const shown = filterSpots(base(), {
      ...emptySpotFilters,
      location: "Volcano",
    });

    expect(shown).toHaveLength(5);
    expect(shown.every((spot) => spot.location === "Volcano")).toBe(true);
    expect(isFilteringSpots({ ...emptySpotFilters, location: "Volcano" })).toBe(
      true,
    );
    expect(ALL_LOCATIONS).toBe("all");
  });

  it("filters by found and not found", () => {
    const data = setSpotFound(
      setSpotFound(base(), single.id, true),
      triple.id,
      true,
    );

    expect(
      filterSpots(data, { ...emptySpotFilters, status: "found" })
        .map((s) => s.id)
        .sort(),
    ).toEqual([single.id, triple.id].sort());
    expect(
      filterSpots(data, { ...emptySpotFilters, status: "not-found" }),
    ).toHaveLength(67);
  });

  it("searches the name and the hint without caring about case", () => {
    const byName = filterSpots(base(), {
      ...emptySpotFilters,
      query: single.name.toUpperCase(),
    });
    const byHint = filterSpots(base(), {
      ...emptySpotFilters,
      query: single.hint.slice(0, 12),
    });

    expect(byName.map((s) => s.id)).toContain(single.id);
    expect(byHint.map((s) => s.id)).toContain(single.id);
    expect(
      filterSpots(base(), { ...emptySpotFilters, query: "zzzzzz" }),
    ).toEqual([]);
  });
});

describe("walnut bar", () => {
  it("splits the 130 walnuts into spent, available and unfound", () => {
    let data = setWalnutsFound(base(), 65);
    data = setUpgrade(data, "Island_Resort", true);
    const shares = barShares(islandSummary(data));

    expect(shares.spent).toBeCloseTo(20 / 130);
    expect(shares.available).toBeCloseTo(45 / 130);
    expect(shares.unfound).toBeCloseTo(65 / 130);
    expect(shares.spent + shares.available + shares.unfound).toBeCloseTo(1);
  });

  it("shows only what was found as spent when more is spent than found", () => {
    const data = setUpgrade(setWalnutsFound(base(), 5), "Island_Resort", true);
    const shares = barShares(islandSummary(data));

    expect(shares.spent).toBeCloseTo(5 / 130);
    expect(shares.available).toBe(0);
  });
});
