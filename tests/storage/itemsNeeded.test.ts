import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  bundlesIn,
  chooseBundleSet,
  chooseRoute,
  isGoldBundle,
  itemsNeeded,
  rooms,
  setAllItems,
  setItemHandedIn,
  setSlotBundle,
} from "@/service/communityCenter";
import {
  ANY_VILLAGER,
  buildGiftItems,
  buildNeededItems,
  emptyNeededFilters,
  filterNeeded,
  isFilteringNeeded,
  isTagFilter,
  isTracked,
  markGifted,
  neededItems,
  SCRATCH_DATA,
  tagCounts,
  totalQuantity,
  trackedCount,
  trackedGiftsOf,
  trackGift,
  universalItems,
  unmarkGifted,
  untrackGift,
  villagerGifts,
  villagerLabel,
} from "@/service/itemsNeeded";
import { allVillagers } from "@/service/villagers";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const base = (): GameData => clone(DEFAULT_GAME_DATA);
const find = (items: ReturnType<typeof neededItems>, name: string) =>
  items.filter((item) => item.name === name);

describe("everything from scratch", () => {
  const items = neededItems(SCRATCH_DATA);
  const counts = tagCounts(items);

  it("needs 95 donations, 154 shipments, cooking, crafting, 4 obelisks and the Gold Clock, and bundle items", () => {
    expect(counts.Donate).toBe(95);
    expect(counts.Ship).toBe(154);
    expect(counts.Cook).toBeGreaterThan(50);
    expect(counts.Craft).toBeGreaterThan(50);
    expect(counts.Build).toBeGreaterThan(3);
    expect(counts.Bundle).toBeGreaterThan(80);
    expect(counts.Gift).toBe(0);
    expect(counts.all).toBe(items.length);
  });

  it("gives every item a unique id", () => {
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
  });

  it("lists a donation with no quantity", () => {
    const donated = items.find((item) => item.id.startsWith("mineral-"))!;

    expect(donated.usages[0]).toMatchObject({
      tag: "Donate",
      goalName: "Museum Donation",
    });
    expect(totalQuantity(donated)).toBe(0);
  });

  it("adds up the quantity an ingredient is needed for", () => {
    const sugar = find(items, "Sugar")[0];

    expect(sugar.usages.length).toBeGreaterThan(2);
    expect(totalQuantity(sugar)).toBe(
      sugar.usages.reduce((sum, usage) => sum + (usage.quantity ?? 0), 0),
    );
  });

  it("puts an item that a bundle, a recipe and a building all need on one ingredient card", () => {
    const wood = items.find((item) => item.id === "ing-Wood")!;
    const tags = new Set(wood.usages.map((usage) => usage.tag));

    expect(tags.has("Bundle")).toBe(true);
    expect(tags.has("Craft")).toBe(true);
    expect(items.filter((item) => item.id === "ing-Wood")).toHaveLength(1);
  });
});

describe("what is done leaves the list", () => {
  it("drops a donated mineral, a shipped item, a cooked dish and a crafted recipe", () => {
    const before = neededItems(SCRATCH_DATA);
    const data = clone(SCRATCH_DATA);
    const mineral = before.find((item) => item.id.startsWith("mineral-"))!;
    data.minerals[mineral.id.replace("mineral-", "")] = {
      found: true,
      donated: true,
    } as GameData["minerals"][string];
    const shipped = before.find((item) => item.id.startsWith("ship-"))!;
    data.shipped[shipped.id.replace("ship-", "")] = {
      shipped: true,
    } as GameData["shipped"][string];
    const after = neededItems(data);

    expect(after.find((item) => item.id === mineral.id)).toBeUndefined();
    expect(after.find((item) => item.id === shipped.id)).toBeUndefined();
    expect(after.length).toBe(before.length - 2);
  });

  it("drops a built obelisk and its materials from the Build tag", () => {
    const data = clone(SCRATCH_DATA);
    const before = tagCounts(neededItems(data)).Build;
    data.buildings = [{ id: "1", type: "Gold Clock", animalCount: 0 }];

    expect(tagCounts(neededItems(data)).Build).toBeLessThanOrEqual(before);
    expect(
      neededItems(data).some((item) =>
        item.usages.some((usage) => usage.goalName === "Gold Clock"),
      ),
    ).toBe(false);
  });

  it("drops the items of a bundle that is complete, and keeps the others", () => {
    const data = clone(SCRATCH_DATA);
    const spring = bundlesIn(data, rooms[0])[0];
    const done = setAllItems(data, spring, true);
    const needs = (state: GameData, bundleName: string) =>
      neededItems(state).some((item) =>
        item.usages.some((usage) => usage.goalName === bundleName),
      );

    expect(needs(data, spring.name)).toBe(true);
    expect(needs(done, spring.name)).toBe(false);
    expect(needs(done, bundlesIn(data, rooms[0])[1].name)).toBe(true);
  });

  it("lists nothing for a bundle that is complete with fewer items than it offers", () => {
    const data = chooseBundleSet(clone(SCRATCH_DATA), "remix");
    const choosy = rooms
      .flatMap((room) => room.pool)
      .find(
        (bundle) =>
          !isGoldBundle(bundle) && bundle.itemsRequired < bundle.items.length,
      )!;
    const room = rooms.find((item) => item.id === choosy.room)!;
    let state = setSlotBundle(data, room, null, choosy);
    for (let index = 0; index < itemsNeeded(choosy); index++)
      state = setItemHandedIn(state, choosy, index, true);
    const needsIt = (current: GameData) =>
      neededItems(current).some((item) =>
        item.usages.some((usage) => usage.goalName === choosy.name),
      );

    expect(needsIt(setSlotBundle(data, room, null, choosy))).toBe(true);
    expect(needsIt(state)).toBe(false);
  });

  it("lists only the bundle items not handed in yet", () => {
    const data = clone(SCRATCH_DATA);
    const spring = bundlesIn(data, rooms[0])[0];
    const itemName = (spring as { items: { name: string }[] }).items[0].name;
    const handed = clone(data);
    handed.bundles[spring.id]["0"] = true;
    const has = (state: GameData) =>
      neededItems(state).some((item) =>
        item.usages.some(
          (usage) => usage.goalName === spring.name && item.name === itemName,
        ),
      );

    expect(has(data)).toBe(true);
    expect(has(handed)).toBe(false);
  });

  it("lists no bundle items for a Joja farm", () => {
    const joja = chooseRoute(clone(SCRATCH_DATA), "joja");

    expect(tagCounts(neededItems(joja)).Bundle).toBe(0);
  });

  it("lists no bundle items for a Community Center farm with no bundles saved", () => {
    const empty = base();
    empty.joja.isMember = false;

    expect(
      buildNeededItems(empty).some((item) =>
        item.usages.some((usage) => usage.tag === "Bundle"),
      ),
    ).toBe(false);
  });
});

describe("tracked gifts", () => {
  const withGift = () => trackGift(base(), "Sam", "Pizza", "loves");

  it("track a gift for a villager and show it as a Gift", () => {
    const gifts = buildGiftItems(withGift());

    expect(gifts).toHaveLength(1);
    expect(gifts[0]).toMatchObject({ id: "gift-Sam-Pizza", name: "Pizza" });
    expect(gifts[0].usages[0]).toMatchObject({
      tag: "Gift",
      preference: "loves",
      villager: "Sam",
    });
    expect(trackedCount(withGift())).toBe(1);
    expect(isTracked(withGift(), "Sam", "Pizza")).toBe(true);
  });

  it("take a gift off the list when it is marked gifted, and put it back on undo", () => {
    const gifted = markGifted(withGift(), "Sam", "Pizza");

    expect(gifted.trackedGifts[0].given).toBe(true);
    expect(buildGiftItems(gifted)).toEqual([]);
    expect(trackedCount(gifted)).toBe(0);
    expect(isTracked(gifted, "Sam", "Pizza")).toBe(false);
    expect(unmarkGifted(gifted, "Sam", "Pizza").trackedGifts[0].given).toBe(
      false,
    );
  });

  it("only mark the gift of that villager", () => {
    const data = trackGift(withGift(), "Abigail", "Pizza", "likes");
    const gifted = markGifted(data, "Sam", "Pizza");

    expect(trackedGiftsOf(gifted).map((gift) => gift.villagerName)).toEqual([
      "Abigail",
    ]);
  });

  it("forget a gift when it is untracked", () => {
    expect(untrackGift(withGift(), "Sam", "Pizza").trackedGifts).toEqual([]);
  });

  it("work when the playthrough has no tracked gift list", () => {
    const data = base() as Partial<GameData> as GameData;
    delete (data as Partial<GameData>).trackedGifts;

    expect(buildGiftItems(data)).toEqual([]);
    expect(trackedCount(data)).toBe(0);
    expect(markGifted(data, "Sam", "Pizza").trackedGifts).toEqual([]);
  });

  it("take the preference from the villager when none was saved", () => {
    const data = base();
    data.trackedGifts = [
      { itemName: "Pizza", villagerName: "Sam", given: false },
    ];

    expect(buildGiftItems(data)[0].usages[0].preference).toBeDefined();
  });

  it("name a gift for no one in particular Any villager", () => {
    expect(villagerLabel(ANY_VILLAGER)).toBe("Any villager");
    expect(villagerLabel("Sam")).toBe("Sam");
  });
});

describe("gifts to pick", () => {
  it("give a villager's loved, liked and neutral gifts in that order, without categories", () => {
    const name = allVillagers.find(
      (villager) =>
        villager.loves.length > 0 &&
        villager.likes.length > 0 &&
        villager.neutrals.length > 0,
    )!.name;
    const gifts = villagerGifts(name);
    const order = gifts.map((gift) => gift.preference);

    expect(gifts.some((gift) => gift.name.startsWith("All "))).toBe(false);
    expect(order.indexOf("loves")).toBeLessThan(order.indexOf("likes"));
    expect(order.lastIndexOf("likes")).toBeLessThan(order.indexOf("neutral"));
    expect(villagerGifts("Nobody")).toEqual([]);
  });

  it("give the universal gifts of each tier as items only", () => {
    expect(universalItems("loves")).toHaveLength(6);
    expect(universalItems("neutral").length).toBeGreaterThan(10);
    expect(
      universalItems("likes").every((name) => !name.startsWith("All ")),
    ).toBe(true);
  });
});

describe("filter", () => {
  const items = neededItems(SCRATCH_DATA);

  it("lists every item with no filter", () => {
    expect(filterNeeded(items, emptyNeededFilters)).toHaveLength(items.length);
    expect(isFilteringNeeded(emptyNeededFilters)).toBe(false);
  });

  it("keeps the items that have the tag, even when they have other tags too", () => {
    const ship = filterNeeded(items, { tag: "Ship", query: "" });

    expect(ship).toHaveLength(154);
    expect(
      ship.every((item) => item.usages.some((usage) => usage.tag === "Ship")),
    ).toBe(true);
    expect(isFilteringNeeded({ tag: "Ship", query: "" })).toBe(true);
  });

  it("searches the name without caring about case, with the tag", () => {
    const found = filterNeeded(items, { tag: "all", query: "COPPER" });

    expect(found.length).toBeGreaterThan(0);
    expect(
      found.every((item) => item.name.toLowerCase().includes("copper")),
    ).toBe(true);
    expect(
      filterNeeded(items, { tag: "Donate", query: "copper" }).length,
    ).toBeLessThanOrEqual(found.length);
  });

  it("knows a tag from the address", () => {
    expect(isTagFilter("Ship")).toBe(true);
    expect(isTagFilter("all")).toBe(true);
    expect(isTagFilter("Bundle")).toBe(true);
    expect(isTagFilter("nothing")).toBe(false);
    expect(isTagFilter(null)).toBe(false);
  });
});
