import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allProjects,
  chooseRoute,
  rooms,
  setAllDeveloped,
  setProjectPurchased,
  setRoomComplete,
} from "@/service/communityCenter";
import { setUpgrade } from "@/service/gingerIsland";
import {
  ALL_CATEGORIES,
  allLocations,
  categories,
  emptyTownFilters,
  filterLocations,
  hoursOf,
  houseRenovations,
  houseUpgrades,
  isFilteringTown,
  islandUnlocks,
  purchasableAnimals,
  purchasablePets,
  shopBuildings,
  shopCount,
  shopItems,
  valleyUnlocks,
} from "@/service/town";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const base = (): GameData => clone(DEFAULT_GAME_DATA);
const names = (query: Partial<typeof emptyTownFilters>) =>
  filterLocations({ ...emptyTownFilters, ...query }).map(
    (location) => location.name,
  );

describe("the locations", () => {
  it("are 38 in 11 categories, 21 of them shops", () => {
    expect(allLocations).toHaveLength(38);
    expect(shopCount).toBe(21);
    expect(categories).toEqual([
      "The Valley",
      "Pelican Town",
      "Cindersap Forest",
      "Beyond the Valley",
      "The Beach",
      "The Mountain",
      "Railroad",
      "Quarry",
      "The Sewers",
      "The Desert",
      "Ginger Island",
    ]);
    expect(
      categories.map(
        (category) =>
          allLocations.filter((l) => l.category === category).length,
      ),
    ).toEqual([2, 9, 5, 5, 1, 4, 2, 1, 1, 4, 4]);
  });

  it("show hours in the morning to evening form, or none when the place is always open", () => {
    const hours = (name: string) =>
      hoursOf(allLocations.find((location) => location.name === name)!);

    expect(hours("Pierre's General Store")).toBe("9am - 5pm");
    expect(hours("Museum")).toBe("8am - 6pm");
    expect(hours("Traveling Cart")).toBe("6am - 8pm");
    expect(hours("Casino")).toBe("9am - 11:50pm");
    expect(hours("Pelican Town")).toBeNull();
  });

  it("show the night hours of the places that open in the evening", () => {
    const hours = (name: string) =>
      hoursOf(allLocations.find((location) => location.name === name)!);

    expect(hours("Wizard's Tower")).toBe("6pm - 11pm");
    expect(hours("The Stardrop Saloon")).toBe("12pm - 12am");
    expect(hours("Adventurer's Guild")).toBe("2pm - 2am");
  });
});

describe("filters", () => {
  it("list everything with no filter", () => {
    expect(names({})).toHaveLength(38);
    expect(isFilteringTown(emptyTownFilters)).toBe(false);
  });

  it("split into shops and places that are not shops", () => {
    expect(names({ show: "shops" })).toHaveLength(21);
    expect(names({ show: "locations" })).toHaveLength(17);
  });

  it("keep one category", () => {
    expect(names({ category: "Pelican Town" })).toHaveLength(9);
    expect(isFilteringTown({ ...emptyTownFilters, category: "Quarry" })).toBe(
      true,
    );
    expect(ALL_CATEGORIES).toBe("all");
  });

  it("search the name, the occupants and the names of what a shop sells", () => {
    expect(names({ query: "blacksmith" })).toContain("Blacksmith");
    expect(names({ query: "clint" })).toContain("Blacksmith");
    expect(names({ query: "parsnip seeds" })).toContain(
      "Pierre's General Store",
    );
    expect(names({ query: "PARSNIP SEEDS" })).toContain(
      "Pierre's General Store",
    );
    expect(names({ query: "zzzzzz" })).toEqual([]);
  });

  it("work together", () => {
    const found = filterLocations({
      query: "clint",
      show: "shops",
      category: "Pelican Town",
    });

    expect(found.map((location) => location.name)).toEqual(["Blacksmith"]);
    expect(names({ query: "clint", show: "locations" })).toEqual([
      "Pelican Town",
    ]);
  });
});

describe("shops", () => {
  it("sell the items of the game with a price", () => {
    const pierre = shopItems("pierre-shop");
    const seeds = pierre.find((item) => item.name === "Parsnip Seeds")!;

    expect(pierre).toHaveLength(54);
    expect(seeds.price).toBe("20g");
    expect(seeds.season).toBe("Spring");
    expect(pierre.find((item) => item.name === "Sugar")!.season).toBe("");
  });

  it("show a trade as an amount of an item and Qi gems as a price", () => {
    const prices = ["qi-shop", "desert-trader-shop", "casino-shop"].flatMap(
      (shop) => shopItems(shop).map((item) => item.price),
    );

    expect(prices.some((price) => /^\d+x /.test(price))).toBe(true);
    expect(prices.some((price) => price.endsWith("Qi Gems"))).toBe(true);
    expect(shopItems("nothing")).toEqual([]);
  });

  it("count 54, 16, 4, 21, 14 and 24 items in the first six", () => {
    expect(
      [
        "pierre-shop",
        "saloon-shop",
        "blacksmith-shop",
        "carpenter-shop",
        "marnie-shop",
        "willy-shop",
      ].map((shop) => shopItems(shop).length),
    ).toEqual([54, 16, 4, 21, 14, 24]);
  });

  it("give Robin the buildings that are not magical and the Wizard the magical ones", () => {
    expect(
      shopBuildings("carpenter-shop").every((building) => !building.magical),
    ).toBe(true);
    expect(
      shopBuildings("wizard-shop").every((building) => building.magical),
    ).toBe(true);
    expect(shopBuildings("pierre-shop")).toEqual([]);
  });

  it("list the farmhouse, the animals and the pets for sale", () => {
    expect(houseUpgrades).toHaveLength(4);
    expect(houseRenovations).toHaveLength(9);
    expect(purchasableAnimals).toHaveLength(7);
    expect(purchasablePets.length).toBe(12);
  });
});

describe("valley unlocks", () => {
  it("come from the Community Center rooms", () => {
    let data = chooseRoute(base(), "community-center");
    data = setRoomComplete(
      data,
      rooms.find((room) => room.id === "pantry")!,
      true,
    );
    data = setRoomComplete(
      data,
      rooms.find((room) => room.id === "vault")!,
      true,
    );
    const unlocks = valleyUnlocks(data);

    expect(unlocks.map((unlock) => unlock.name)).toEqual([
      "Greenhouse",
      "Quarry bridge",
      "Panning",
      "Minecarts",
      "Bus to the Calico Desert",
    ]);
    expect(unlocks.map((unlock) => unlock.on)).toEqual([
      true,
      false,
      false,
      false,
      true,
    ]);
    expect(unlocks[0].via).toBe("Pantry");
  });

  it("come from the Joja projects on the Joja route", () => {
    let data = chooseRoute(base(), "joja");
    data = setProjectPurchased(
      data,
      allProjects.find((project) => project.name === "Bridge")!,
      true,
    );
    const unlocks = valleyUnlocks(data);

    expect(unlocks.map((unlock) => unlock.on)).toEqual([
      false,
      true,
      false,
      false,
      false,
    ]);
    expect(unlocks[1].via).toBe("Joja Bridge");
    expect(
      valleyUnlocks(setAllDeveloped(data, true)).every((unlock) => unlock.on),
    ).toBe(true);
  });
});

describe("island unlocks", () => {
  it("list the 11 upgrades and which are built", () => {
    const none = islandUnlocks(base());
    const built = islandUnlocks(setUpgrade(base(), "Island_Resort", true));

    expect(none).toHaveLength(11);
    expect(none.every((unlock) => !unlock.on)).toBe(true);
    expect(
      built.filter((unlock) => unlock.on).map((unlock) => unlock.name),
    ).toEqual(["Island Resort"]);
  });
});
