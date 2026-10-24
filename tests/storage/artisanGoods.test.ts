import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allGoods,
  artisanGoodsSummary,
  calculateGood,
  emptyGoodFilters,
  equipmentTypes,
  filterGoods,
  hasFixedPrice,
  ingredientOptions,
  isFilteringGoods,
  isShippableGood,
} from "@/service/artisanGoods";
import type { GoodFilters } from "@/service/artisanGoods";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const withStates = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.shipped["340"] = { shipped: true, count: 5 };
  return data;
};
const names = (filters: Partial<GoodFilters>) =>
  filterGoods(withStates(), { ...emptyGoodFilters, ...filters }).map(
    (g) => g.name,
  );
const good = (name: string) => allGoods.find((g) => g.name === name)!;
const option = (name: string, from: string) =>
  ingredientOptions(good(name)).find((o) => o.name === from)!;

describe("artisan goods", () => {
  it("lists 30 goods made in 10 kinds of equipment, 27 of them counted by the game", () => {
    expect(allGoods).toHaveLength(30);
    expect(equipmentTypes).toHaveLength(10);
    expect(allGoods.filter(isShippableGood)).toHaveLength(27);
    for (const name of ["Coffee", "Vinegar", "Oil"])
      expect(isShippableGood(good(name))).toBe(false);
  });

  it("gives nine goods a formula instead of a price", () => {
    expect(
      allGoods
        .filter((g) => !hasFixedPrice(g))
        .map((g) => g.name)
        .sort(),
    ).toEqual([
      "Aged Roe",
      "Dried Fruit",
      "Dried Mushrooms",
      "Honey",
      "Jelly",
      "Juice",
      "Pickles",
      "Smoked Fish",
      "Wine",
    ]);
  });
});

describe("artisan good filters", () => {
  it("searches the name, the equipment and the ingredients", () => {
    expect(names({ query: "bee house" })).toEqual(["Honey"]);
    expect(names({ query: "keg" })).toContain("Wine");
    expect(names({ query: "hops" })).toContain("Pale Ale");
    expect(names({ query: "zzz" })).toEqual([]);
  });

  it("splits shipped, not shipped and not shippable", () => {
    expect(names({ shipped: "shipped" })).toEqual(["Honey"]);
    expect(names({ shipped: "not-shipped" })).toHaveLength(26);
    expect(names({ shipped: "not-shippable" }).sort()).toEqual([
      "Coffee",
      "Oil",
      "Vinegar",
    ]);
  });

  it("knows when a filter is on", () => {
    expect(isFilteringGoods(emptyGoodFilters)).toBe(false);
    expect(isFilteringGoods({ ...emptyGoodFilters, query: "a" })).toBe(true);
  });
});

describe("artisan goods summary", () => {
  it("counts equipment, goods and shipped over the 27", () => {
    const summary = artisanGoodsSummary(withStates());

    expect(summary.equipment).toBe(10);
    expect(summary.goods).toBe(30);
    expect(summary.shipped).toEqual({ current: 1, total: 27 });
  });

  it("does not count a shipped Coffee", () => {
    const data = clone(DEFAULT_GAME_DATA);
    data.shipped[good("Coffee").id] = { shipped: true, count: 9 };

    expect(artisanGoodsSummary(data).shipped.current).toBe(0);
  });
});

describe("price calculator ingredients", () => {
  it("offers every fish for Smoked Fish and the fish with roe for Aged Roe", () => {
    expect(ingredientOptions(good("Smoked Fish"))).toHaveLength(77);
    expect(ingredientOptions(good("Aged Roe")).length).toBeGreaterThan(0);
    expect(ingredientOptions(good("Aged Roe"))[0].sublabel).toMatch(
      /^Roe: \d+g$/,
    );
  });

  it("offers crops, forageables and fruit tree produce for wine, each name once and in order", () => {
    const wine = ingredientOptions(good("Wine"));
    const wineNames = wine.map((o) => o.name);

    expect(wineNames).toContain("Starfruit");
    expect(wineNames).toContain("Apricot");
    expect(new Set(wineNames).size).toBe(wineNames.length);
    expect(wineNames).toEqual(
      [...wineNames].sort((a, b) => a.localeCompare(b)),
    );
  });

  it("leaves fruit tree produce out of juice, which takes vegetables", () => {
    expect(ingredientOptions(good("Juice")).map((o) => o.name)).not.toContain(
      "Apricot",
    );
  });

  it("offers nothing for a good that has no calculator", () => {
    expect(ingredientOptions(good("Cheese"))).toEqual([]);
  });
});

describe("price calculator results", () => {
  it("prices wine at three times the fruit with 1.75 times the energy and health", () => {
    expect(calculateGood(good("Wine"), option("Wine", "Starfruit"))).toEqual({
      sellPrice: 2250,
      energy: 218,
      health: 98,
    });
  });

  it("prices honey and aged roe from the base price alone", () => {
    expect(
      calculateGood(good("Honey"), option("Honey", "Blue Jazz"))?.sellPrice,
    ).toBe(200);
    expect(
      calculateGood(good("Aged Roe"), option("Aged Roe", "Albacore"))
        ?.sellPrice,
    ).toBe(135);
  });

  it("prices smoked fish at twice the fish", () => {
    expect(
      calculateGood(good("Smoked Fish"), option("Smoked Fish", "Albacore"))
        ?.sellPrice,
    ).toBe(150);
  });

  it("gives no result for a good without a calculator", () => {
    expect(
      calculateGood(good("Cheese"), option("Wine", "Starfruit")),
    ).toBeNull();
  });
});
