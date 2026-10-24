import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  ABANDONED_ROOM,
  abandonedBundle,
  allProjects,
  bundleSetOf,
  bundlesIn,
  chooseBundleSet,
  chooseRoute,
  clearSlot,
  communityCenterSummary,
  entryCount,
  handedIn,
  isBundleComplete,
  isGoldBundle,
  isProjectPurchased,
  itemsNeeded,
  jojaSummary,
  PROJECTS_COST,
  roomProgress,
  rooms,
  routeOf,
  setAllDeveloped,
  setAllItems,
  setCeremony,
  setItemHandedIn,
  setJojaAbandoned,
  setProjectPurchased,
  setRoomComplete,
  setSlotBundle,
  STANDARD_BUNDLE_COUNT,
} from "@/service/communityCenter";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const base = (): GameData => clone(DEFAULT_GAME_DATA);
const room = (id: string) => rooms.find((item) => item.id === id)!;
const crafts = room("crafts-room");
const vault = room("vault");
const standardCrafts = () =>
  bundlesIn(chooseRoute(base(), "community-center"), crafts);

/** A Community Center playthrough on the standard set, as the wizard saves it. */
const standardData = () => chooseRoute(base(), "community-center");

describe("rooms", () => {
  it("has six rooms with 30 standard slots: 6, 6, 6, 3, 5 and 4", () => {
    expect(rooms.map((item) => item.slots)).toEqual([6, 6, 6, 3, 5, 4]);
    expect(STANDARD_BUNDLE_COUNT).toBe(30);
  });

  it("offers each room its standard bundles and the remix bundles for the slot", () => {
    expect(crafts.pool.length).toBeGreaterThan(crafts.slots);
    expect(crafts.pool.every((bundle) => bundle.room === "crafts-room")).toBe(
      true,
    );
  });

  it("knows the missing bundle of the abandoned JojaMart", () => {
    expect(abandonedBundle.name).toBe("The Missing Bundle");
    expect(abandonedBundle.room).toBe(ABANDONED_ROOM);
  });
});

describe("route", () => {
  it("is the Joja membership", () => {
    expect(routeOf(base())).toBe("community-center");
    expect(routeOf(chooseRoute(base(), "joja"))).toBe("joja");
  });

  it("turns the bundles on for the Community Center and fills the standard set", () => {
    const data = standardData();

    expect(data.communityCenter).toMatchObject({
      unlocked: true,
      bundlesActive: true,
    });
    expect(data.joja.isMember).toBe(false);
    expect(Object.keys(data.bundles)).toHaveLength(30);
    expect(
      Object.values(data.bundles).every((flags) =>
        Object.values(flags).every((v) => v === false),
      ),
    ).toBe(true);
  });

  it("turns the bundles off for Joja and keeps what was saved so the player can go back", () => {
    const withTicks = setItemHandedIn(
      standardData(),
      standardCrafts()[0],
      0,
      true,
    );
    const joja = chooseRoute(withTicks, "joja");

    expect(joja.joja.isMember).toBe(true);
    expect(joja.communityCenter).toMatchObject({
      unlocked: false,
      bundlesActive: false,
    });
    expect(joja.bundles).toEqual(withTicks.bundles);
    expect(chooseRoute(joja, "community-center").bundles).toEqual(
      withTicks.bundles,
    );
  });
});

describe("bundle set", () => {
  it("is standard when the 30 standard bundles are saved", () => {
    expect(bundleSetOf(standardData())).toBe("standard");
  });

  it("is remix when a bundle outside the standard set is saved", () => {
    const remixBundle = crafts.pool.find((bundle) => bundle.remixBundle)!;
    const data = setSlotBundle(
      standardData(),
      crafts,
      bundlesIn(standardData(), crafts)[0],
      remixBundle,
    );

    expect(bundleSetOf(data)).toBe("remix");
  });

  it("is remix with empty slots right after the switch, and standard for a Joja playthrough with no bundles", () => {
    expect(bundleSetOf(chooseBundleSet(standardData(), "remix"))).toBe("remix");
    expect(bundleSetOf(chooseRoute(base(), "joja"))).toBe("standard");
  });

  it("empties the slots for remix and drops the progress of the old set", () => {
    let data = setItemHandedIn(standardData(), standardCrafts()[0], 0, true);
    data = setRoomComplete(data, vault, true);
    const remix = chooseBundleSet(data, "remix");

    expect(Object.keys(remix.bundles)).toEqual([]);
    expect(Object.values(remix.communityCenter.rooms).some(Boolean)).toBe(
      false,
    );
    expect(remix.communityCenter.completed).toBe(false);
    expect(rooms.every((item) => bundlesIn(remix, item).length === 0)).toBe(
      true,
    );
  });

  it("brings the 30 standard bundles back for standard, empty", () => {
    const remix = chooseBundleSet(standardData(), "remix");
    const standard = chooseBundleSet(remix, "standard");

    expect(bundleSetOf(standard)).toBe("standard");
    expect(Object.keys(standard.bundles)).toHaveLength(30);
  });

  it("keeps the saved missing bundle when the set changes", () => {
    const data = {
      ...standardData(),
      bundles: {
        ...standardData().bundles,
        [abandonedBundle.id]: { "0": true },
      },
    };

    expect(chooseBundleSet(data, "remix").bundles[abandonedBundle.id]).toEqual({
      "0": true,
    });
  });
});

describe("remix slots", () => {
  it("puts a bundle in a slot and takes the bundle that sat there out", () => {
    const empty = chooseBundleSet(standardData(), "remix");
    const [first, second] = crafts.pool;
    const placed = setSlotBundle(empty, crafts, null, first);
    const swapped = setSlotBundle(placed, crafts, first, second);

    expect(bundlesIn(placed, crafts)).toEqual([first]);
    expect(bundlesIn(swapped, crafts)).toEqual([second]);
    expect(swapped.bundles[first.id]).toBeUndefined();
    expect(
      Object.values(swapped.bundles[second.id]).every((v) => v === false),
    ).toBe(true);
  });

  it("clears a slot", () => {
    const placed = setSlotBundle(
      chooseBundleSet(standardData(), "remix"),
      crafts,
      null,
      crafts.pool[0],
    );

    expect(
      bundlesIn(clearSlot(placed, crafts, crafts.pool[0]), crafts),
    ).toEqual([]);
  });
});

describe("items and bundles", () => {
  const first = () => standardCrafts()[0];

  it("hands an item in and takes it back", () => {
    const data = setItemHandedIn(standardData(), first(), 1, true);

    expect(data.bundles[first().id]["1"]).toBe(true);
    expect(handedIn(data, first())).toBe(1);
    expect(
      setItemHandedIn(data, first(), 1, false).bundles[first().id]["1"],
    ).toBe(false);
  });

  it("completes a bundle when enough items are handed in, not when every item is", () => {
    const bundle = rooms
      .flatMap((item) => item.pool)
      .find(
        (item) => !isGoldBundle(item) && item.itemsRequired < item.items.length,
      )!;
    let data = chooseBundleSet(standardData(), "remix");
    data = setSlotBundle(data, room(bundle.room), null, bundle);
    for (let index = 0; index < itemsNeeded(bundle) - 1; index++)
      data = setItemHandedIn(data, bundle, index, true);

    expect(isBundleComplete(data, bundle)).toBe(false);
    data = setItemHandedIn(data, bundle, itemsNeeded(bundle) - 1, true);
    expect(isBundleComplete(data, bundle)).toBe(true);
    expect(handedIn(data, bundle)).toBeLessThan(entryCount(bundle));
  });

  it("completes a gold bundle with its one entry", () => {
    const gold = bundlesIn(standardData(), vault)[0];
    const data = setItemHandedIn(standardData(), gold, 0, true);

    expect(isGoldBundle(gold)).toBe(true);
    expect(entryCount(gold)).toBe(1);
    expect(isBundleComplete(data, gold)).toBe(true);
    expect(isBundleComplete(standardData(), gold)).toBe(false);
  });

  it("sets and clears every item of a bundle", () => {
    const all = setAllItems(standardData(), first(), true);

    expect(isBundleComplete(all, first())).toBe(true);
    expect(Object.values(all.bundles[first().id])).toHaveLength(
      entryCount(first()),
    );
    expect(handedIn(setAllItems(all, first(), false), first())).toBe(0);
  });

  it("marks a room complete by itself when its last bundle is completed, and clears it when one is not", () => {
    let data = standardData();
    for (const bundle of bundlesIn(data, vault))
      data = setAllItems(data, bundle, true);

    expect(data.communityCenter.rooms.vault).toBe(true);
    expect(roomProgress(data, vault)).toMatchObject({
      done: 4,
      total: 4,
      flag: true,
    });
  });

  it("counts a room by its bundles while the flag is off", () => {
    const data = setAllItems(standardData(), first(), true);

    expect(roomProgress(data, crafts)).toMatchObject({
      done: 1,
      total: 6,
      flag: false,
    });
  });
});

describe("room flag", () => {
  it("makes every bundle of the room read complete and locks the items", () => {
    const data = setRoomComplete(standardData(), crafts, true);
    const bundle = bundlesIn(data, crafts)[0];

    expect(roomProgress(data, crafts)).toMatchObject({ done: 6, total: 6 });
    expect(isBundleComplete(data, bundle)).toBe(true);
    expect(setItemHandedIn(data, bundle, 0, true)).toBe(data);
    expect(setAllItems(data, bundle, false)).toBe(data);
  });

  it("opens the items again when the flag is cleared", () => {
    const data = setRoomComplete(
      setRoomComplete(standardData(), crafts, true),
      crafts,
      false,
    );

    expect(roomProgress(data, crafts)).toMatchObject({ done: 0, flag: false });
    expect(setItemHandedIn(data, bundlesIn(data, crafts)[0], 0, true)).not.toBe(
      data,
    );
  });

  it("completes the Community Center when all six rooms are complete, and not before", () => {
    let data = standardData();
    for (const item of rooms.slice(0, 5))
      data = setRoomComplete(data, item, true);

    expect(data.communityCenter.completed).toBe(false);
    data = setRoomComplete(data, rooms[5], true);
    expect(data.communityCenter.completed).toBe(true);
    expect(
      setRoomComplete(data, rooms[0], false).communityCenter.completed,
    ).toBe(false);
  });

  it("reads every bundle as complete after the Community Center is completed", () => {
    const data = standardData();
    data.communityCenter.completed = true;

    expect(communityCenterSummary(data).bundlesDone).toBe(30);
    expect(isBundleComplete(data, bundlesIn(data, vault)[0])).toBe(true);
  });
});

describe("summary and switches", () => {
  it("counts rooms by their flag and bundles by their state", () => {
    let data = setRoomComplete(standardData(), crafts, true);
    data = setAllItems(data, bundlesIn(data, vault)[0], true);

    expect(communityCenterSummary(data)).toMatchObject({
      unlocked: true,
      bundlesActive: true,
      roomsDone: 1,
      roomsTotal: 6,
      bundlesDone: 7,
      bundlesTotal: 30,
      completed: false,
    });
  });

  it("sets the ceremony and the abandoned JojaMart", () => {
    const data = setJojaAbandoned(setCeremony(base(), true), true);

    expect(data.communityCenter).toMatchObject({
      ceremonyAttended: true,
      jojaAbandoned: true,
    });
    expect(communityCenterSummary(data)).toMatchObject({
      ceremony: true,
      jojaAbandoned: true,
    });
  });
});

describe("Joja projects", () => {
  it("lists five projects that cost 135,000g", () => {
    expect(allProjects).toHaveLength(5);
    expect(PROJECTS_COST).toBe(135_000);
  });

  it("buys projects and reads what is invested and what remains", () => {
    const minecarts = allProjects.find(
      (project) => project.name === "Minecarts",
    )!;
    const bus = allProjects.find((project) => project.name === "Bus")!;
    let data = setProjectPurchased(base(), minecarts, true);
    data = setProjectPurchased(data, bus, true);

    expect(jojaSummary(data)).toEqual({
      purchased: 2,
      total: 5,
      invested: 55_000,
      remaining: 80_000,
      allDeveloped: false,
    });
  });

  it("reads and writes the key of the room each project replaces, as a save does", () => {
    const bridge = allProjects.find((project) => project.name === "Bridge")!;
    const fromSave = {
      ...base(),
      joja: {
        ...base().joja,
        developments: { jojaCraftsRoom: true, jojaPantry: false },
      },
    };

    expect(isProjectPurchased(fromSave, bridge)).toBe(true);
    expect(jojaSummary(fromSave).purchased).toBe(1);
    const bought = setProjectPurchased(base(), bridge, true);
    expect(bought.joja.developments).toEqual({ jojaCraftsRoom: true });
    expect(
      Object.keys(setAllDeveloped(base(), true).joja.developments).sort(),
    ).toEqual([
      "jojaBoilerRoom",
      "jojaCraftsRoom",
      "jojaFishTank",
      "jojaPantry",
      "jojaVault",
    ]);
  });

  it("reads a playthrough of the old app that keyed projects by their id, and rewrites it under the save key", () => {
    const bridge = allProjects.find((project) => project.name === "Bridge")!;
    const old = {
      ...base(),
      joja: { ...base().joja, developments: { "bridge-joja": true } },
    };

    expect(isProjectPurchased(old, bridge)).toBe(true);
    expect(setProjectPurchased(old, bridge, false).joja.developments).toEqual({
      jojaCraftsRoom: false,
    });
  });

  it("turns All developed on when the fifth project is bought and off when one is given back", () => {
    let data = base();
    for (const project of allProjects)
      data = setProjectPurchased(data, project, true);

    expect(data.joja.completed).toBe(true);
    expect(
      setProjectPurchased(data, allProjects[0], false).joja.completed,
    ).toBe(false);
  });

  it("buys or clears all five at once", () => {
    const all = setAllDeveloped(base(), true);

    expect(jojaSummary(all)).toMatchObject({
      purchased: 5,
      remaining: 0,
      allDeveloped: true,
    });
    expect(all.joja.completed).toBe(true);
    const none = setAllDeveloped(all, false);
    expect(jojaSummary(none).purchased).toBe(0);
    expect(none.joja.completed).toBe(false);
  });
});
