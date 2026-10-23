import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allFish,
  categoryIds,
  difficultyLevel,
  emptyFishFilters,
  filterFish,
  fishSummary,
  isCaught,
  isFilteringFish,
  locationOptions,
  setCaught,
  toggleCategory,
} from "@/service/fish";
import type { FishFilters } from "@/service/fish";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const fresh = (): GameData => clone(DEFAULT_GAME_DATA);
const names = (filters: Partial<FishFilters>, data = fresh()) =>
  filterFish(data, { ...emptyFishFilters, ...filters }).map(
    (fish) => fish.name,
  );

describe("catching a fish", () => {
  it("adds the entry the old edit step wrote", () => {
    const result = setCaught(fresh(), "129", true);

    expect(result.fishCaught).toEqual([
      { id: "129", timesCaught: 1, largestSize: 0 },
    ]);
    expect(isCaught(result, "129")).toBe(true);
  });

  it("removes the entry when switched off", () => {
    const caught = setCaught(fresh(), "129", true);

    expect(setCaught(caught, "129", false).fishCaught).toEqual([]);
  });

  it("keeps the real numbers of a fish that stays caught", () => {
    const data = fresh();
    data.fishCaught = [{ id: "129", timesCaught: 8, largestSize: 31 }];

    const result = setCaught(data, "129", true);

    expect(result).toBe(data);
    expect(result.fishCaught[0]).toEqual({
      id: "129",
      timesCaught: 8,
      largestSize: 31,
    });
  });

  it("does not change the data it is given", () => {
    const data = fresh();
    const before = JSON.stringify(data);

    setCaught(data, "129", true);

    expect(JSON.stringify(data)).toBe(before);
  });
});

describe("filters", () => {
  it("lists every fish with no filter", () => {
    expect(names({})).toHaveLength(allFish.length);
    expect(allFish).toHaveLength(77);
  });

  it("searches the name, ignoring case and spaces at the ends", () => {
    expect(names({ query: "  ANCHO " })).toEqual(["Anchovy"]);
  });

  it("filters by caught and not caught", () => {
    const data = setCaught(fresh(), "129", true);

    expect(names({ caught: "caught" }, data)).toEqual(["Anchovy"]);
    expect(names({ caught: "not-caught" }, data)).toHaveLength(76);
  });

  it("filters by catch type", () => {
    expect(names({ catchType: "rod" })).toHaveLength(67);
    expect(names({ catchType: "crab-pot" })).toHaveLength(10);
  });

  it("filters by season", () => {
    expect(
      names({ season: "spring" }).every((name) =>
        allFish.find((f) => f.name === name)!.seasons.includes("spring"),
      ),
    ).toBe(true);
  });

  it("finds the fish of Ginger Island by their location", () => {
    const result = names({ season: "ginger-island" });

    expect(result).toEqual(
      expect.arrayContaining(["Lionfish", "Stingray", "Blue Discus"]),
    );
    expect(result.length).toBeGreaterThanOrEqual(9);
  });

  it("includes fish that bite in any weather when Sunny or Rainy is chosen", () => {
    const sunny = filterFish(fresh(), {
      ...emptyFishFilters,
      weather: "sunny",
    });
    const rainy = filterFish(fresh(), {
      ...emptyFishFilters,
      weather: "rainy",
    });
    const any = filterFish(fresh(), { ...emptyFishFilters, weather: "both" });

    expect(sunny.some((fish) => fish.weather === "both")).toBe(true);
    expect(rainy.some((fish) => fish.weather === "both")).toBe(true);
    expect(any.every((fish) => fish.weather === "both")).toBe(true);
    expect(sunny.length).toBeGreaterThan(any.length);
  });

  it("filters by an exact location", () => {
    const result = filterFish(fresh(), {
      ...emptyFishFilters,
      location: "Mountain Lake",
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((fish) => fish.location === "Mountain Lake")).toBe(
      true,
    );
  });

  it("splits difficulty into the three bands and keeps the fish with none", () => {
    const easy = filterFish(fresh(), {
      ...emptyFishFilters,
      difficulty: "easy",
    });
    const medium = filterFish(fresh(), {
      ...emptyFishFilters,
      difficulty: "medium",
    });
    const hard = filterFish(fresh(), {
      ...emptyFishFilters,
      difficulty: "hard",
    });
    const none = filterFish(fresh(), {
      ...emptyFishFilters,
      difficulty: "none",
    });

    expect(easy.every((fish) => fish.difficulty! <= 33)).toBe(true);
    expect(
      medium.every((fish) => fish.difficulty! >= 34 && fish.difficulty! <= 66),
    ).toBe(true);
    expect(hard.every((fish) => fish.difficulty! >= 67)).toBe(true);
    expect(none).toHaveLength(13);
    expect(easy.length + medium.length + hard.length + none.length).toBe(
      allFish.length,
    );
  });

  it("names the band of a difficulty at its edges", () => {
    expect(difficultyLevel(33)).toBe("easy");
    expect(difficultyLevel(34)).toBe("medium");
    expect(difficultyLevel(66)).toBe("medium");
    expect(difficultyLevel(67)).toBe("hard");
  });

  it("matches any of the chosen categories", () => {
    const result = filterFish(fresh(), {
      ...emptyFishFilters,
      categories: "legendary,legendary-2",
    });

    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((fish) =>
        ["legendary", "legendary-2"].includes(fish.category),
      ),
    ).toBe(true);
  });

  it("combines every filter", () => {
    expect(names({ catchType: "crab-pot", caught: "caught" })).toEqual([]);
    expect(names({ catchType: "rod", query: "carp" }).length).toBeGreaterThan(
      0,
    );
  });

  it("toggles a category in and out", () => {
    const one = toggleCategory("", "regular");
    const two = toggleCategory(one, "other");

    expect(categoryIds(two)).toEqual(["regular", "other"]);
    expect(toggleCategory(two, "regular")).toBe("other");
    expect(categoryIds("")).toEqual([]);
  });

  it("knows when a filter is on", () => {
    expect(isFilteringFish(emptyFishFilters)).toBe(false);
    expect(isFilteringFish({ ...emptyFishFilters, query: "a" })).toBe(true);
    expect(
      isFilteringFish({ ...emptyFishFilters, categories: "regular" }),
    ).toBe(true);
  });

  it("lists the 32 locations in order", () => {
    expect(locationOptions).toHaveLength(32);
    expect(locationOptions).toEqual([...locationOptions].sort());
  });
});

describe("summary", () => {
  it("counts the fish by type and by season, leaving Ginger Island out", () => {
    const summary = fishSummary(fresh());

    expect(summary.total).toBe(77);
    expect(summary.rod).toBe(67);
    expect(summary.crabPot).toBe(10);
    expect(summary.seasons.map((entry) => entry.season)).toEqual([
      "spring",
      "summer",
      "fall",
      "winter",
    ]);
  });

  it("counts caught fish against the in-game collection of 72", () => {
    const data = setCaught(fresh(), "129", true);

    const summary = fishSummary(data);

    expect(summary.collection).toEqual({ current: 1, total: 72 });
    expect(summary.notInCollection).toBe(5);
  });

  it("does not count a caught fish the collection leaves out", () => {
    const legend = allFish.find((fish) => fish.name === "Ms. Angler")!;
    const data = setCaught(fresh(), legend.id, true);

    expect(fishSummary(data).collection.current).toBe(0);
  });
});
