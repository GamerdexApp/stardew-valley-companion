import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allSpecialItems,
  countSpecialItemsAcquired,
  emptySpecialItemFilters,
  filterSpecialItems,
  isEditableItem,
  isFilteringSpecialItems,
  setSpecialItemAcquired,
  specialItemsSummary,
  specialItemState,
} from "@/service/specialItems";
import type { SpecialItemFilters } from "@/service/specialItems";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const withStates = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.specialItems = ["ForestMagic", "RustyKey"];
  data.books = ["PriceCatalogue"];
  data.mastery.unlocked = ["farming"];
  return data;
};
const item = (id: string) => allSpecialItems.find((i) => i.id === id)!;
const names = (filters: Partial<SpecialItemFilters>) =>
  filterSpecialItems(withStates(), {
    ...emptySpecialItemFilters,
    ...filters,
  }).map((i) => i.name);

describe("special items", () => {
  it("lists 41: 12 special items, 19 books, 5 skill books and 5 masteries", () => {
    const count = (type: string) =>
      allSpecialItems.filter((i) => i.type === type).length;

    expect(allSpecialItems).toHaveLength(41);
    expect([
      count("special-item"),
      count("book"),
      count("skill-book"),
      count("mastery"),
    ]).toEqual([12, 19, 5, 5]);
  });

  it("lets only special items and books be changed here", () => {
    expect(isEditableItem(item("ForestMagic"))).toBe(true);
    expect(isEditableItem(item("PriceCatalogue"))).toBe(true);
    expect(isEditableItem(item("BaitAndBobber"))).toBe(false);
    expect(isEditableItem(item("Mastery_Farming"))).toBe(false);
  });
});

describe("special item state", () => {
  it("reads each type from its own saved list", () => {
    const data = withStates();

    expect(specialItemState(data, item("ForestMagic"))).toBe("acquired");
    expect(specialItemState(data, item("DwarvishTranslationGuide"))).toBe(
      "missing",
    );
    expect(specialItemState(data, item("PriceCatalogue"))).toBe("acquired");
    expect(specialItemState(data, item("Mastery_Farming"))).toBe("acquired");
    expect(specialItemState(data, item("Mastery_Mining"))).toBe("missing");
    expect(specialItemState(data, item("BaitAndBobber"))).toBe("info");
  });
});

describe("setting a special item", () => {
  it("adds a special item to specialItems and a book to books", () => {
    const base = clone(DEFAULT_GAME_DATA);

    expect(
      setSpecialItemAcquired(base, item("ForestMagic"), true).specialItems,
    ).toEqual(["ForestMagic"]);
    expect(
      setSpecialItemAcquired(base, item("PriceCatalogue"), true).books,
    ).toEqual(["PriceCatalogue"]);
    expect(
      setSpecialItemAcquired(base, item("ForestMagic"), true).books,
    ).toEqual([]);
  });

  it("takes an item out and leaves the others", () => {
    const result = setSpecialItemAcquired(
      withStates(),
      item("ForestMagic"),
      false,
    );

    expect(result.specialItems).toEqual(["RustyKey"]);
    expect(result.books).toEqual(["PriceCatalogue"]);
  });

  it("does nothing for a mastery or a skill book", () => {
    const data = withStates();

    expect(setSpecialItemAcquired(data, item("Mastery_Mining"), true)).toBe(
      data,
    );
    expect(setSpecialItemAcquired(data, item("BaitAndBobber"), true)).toBe(
      data,
    );
  });

  it("returns the same object when nothing changes", () => {
    const data = withStates();

    expect(setSpecialItemAcquired(data, item("ForestMagic"), true)).toBe(data);
    expect(
      setSpecialItemAcquired(data, item("DwarvishTranslationGuide"), false),
    ).toBe(data);
  });
});

describe("special item filters", () => {
  it("filters by type", () => {
    expect(names({ type: "special-item" })).toHaveLength(12);
    expect(names({ type: "book" })).toHaveLength(19);
    expect(names({ type: "skill-book" })).toHaveLength(5);
    expect(names({ type: "mastery" })).toHaveLength(5);
  });

  it("keeps skill books under every status", () => {
    expect(names({ status: "acquired", type: "skill-book" })).toHaveLength(5);
    expect(names({ status: "not-acquired", type: "skill-book" })).toHaveLength(
      5,
    );
    expect(names({ status: "acquired" })).toHaveLength(4 + 5);
  });

  it("splits acquired and not acquired", () => {
    expect(names({ status: "acquired", type: "special-item" })).toEqual([
      "Forest Magic",
      "Rusty Key",
    ]);
    expect(names({ status: "not-acquired", type: "mastery" })).toHaveLength(4);
  });

  it("searches by name and knows when a filter is on", () => {
    expect(names({ query: "mastery" }).length).toBeGreaterThanOrEqual(5);
    expect(isFilteringSpecialItems(emptySpecialItemFilters)).toBe(false);
    expect(
      isFilteringSpecialItems({ ...emptySpecialItemFilters, type: "book" }),
    ).toBe(true);
  });
});

describe("special items summary", () => {
  it("counts each group and a total over 36, leaving skill books out", () => {
    const summary = specialItemsSummary(withStates());

    expect(summary.specialItems).toEqual({ current: 2, total: 12 });
    expect(summary.books).toEqual({ current: 1, total: 19 });
    expect(summary.mastery).toEqual({ current: 1, total: 5 });
    expect(summary.total).toEqual({ current: 4, total: 36 });
    expect(countSpecialItemsAcquired(withStates())).toEqual({
      current: 4,
      total: 36,
    });
  });
});
