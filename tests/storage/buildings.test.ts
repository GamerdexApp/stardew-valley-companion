import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  addableBuildings,
  addBuilding,
  animalsIn,
  buildingsSummary,
  emptyBuildingFilters,
  filterBuildings,
  fishName,
  isFilteringBuildings,
  ownedCount,
  pondFishOptions,
  pondOf,
  removeBuilding,
  setCount,
  setPondFish,
  setPondOccupants,
  viewOf,
} from "@/service/buildings";
import type { BuildingFilters } from "@/service/buildings";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const farm = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.character.houseUpgradeLevel = 2;
  data.buildings = [
    { id: "house", type: "Farmhouse", animalCount: 0 },
    { id: "green", type: "Greenhouse", animalCount: 0 },
    { id: "coop", type: "Coop", animalCount: 2 },
    { id: "barn", type: "Barn", animalCount: 1 },
    { id: "pond", type: "Fish Pond", animalCount: 3 },
    { id: "hutch", type: "Slime Hutch", animalCount: 4 },
    { id: "hut", type: "Junimo Hut", animalCount: 0 },
  ];
  data.fishPonds = [
    { buildingId: "pond", fishType: 698, currentOccupants: 3, maxOccupants: 5 },
  ];
  const animal = (id: string, buildingId: string, buildingType: string) => ({
    name: id,
    id,
    type: "White Chicken",
    buildingType,
    buildingId,
    friendship: 100,
    happiness: 255,
    age: 5,
    hasAnimalCracker: false,
  });
  data.animals = [
    animal("A", "coop", "Coop"),
    animal("B", "coop", "Coop"),
    animal("C", "barn", "Barn"),
  ];
  return data;
};

const names = (filters: Partial<BuildingFilters>) =>
  filterBuildings(farm(), { ...emptyBuildingFilters, ...filters }).map(
    (b) => b.id,
  );

describe("building views", () => {
  it("names the farmhouse by the house level", () => {
    const data = farm();
    const house = data.buildings[0];

    expect(viewOf(data, house).name).toBe("Farmhouse Upgrade 2");
    data.character.houseUpgradeLevel = 0;
    expect(viewOf(data, house).name).toBe("Starting Farmhouse");
    data.character.houseUpgradeLevel = 3;
    expect(viewOf(data, house).name).toBe("Cellar");
  });

  it("gives a building its builder, cost and picture", () => {
    const data = farm();

    expect(viewOf(data, data.buildings[2])).toMatchObject({
      name: "Coop",
      builder: "Robin",
      cost: 4000,
    });
    expect(viewOf(data, data.buildings[6]).builder).toBe("Wizard");
    expect(viewOf(data, data.buildings[2]).image).toContain("Coop");
  });

  it("falls back to the type for a building the data does not know", () => {
    const data = farm();
    data.buildings.push({ id: "x", type: "Mystery Hut", animalCount: 0 });

    expect(viewOf(data, data.buildings[7])).toMatchObject({
      name: "Mystery Hut",
      image: null,
      builder: "",
    });
  });
});

describe("housed animals and ponds", () => {
  it("lists the animals that live in a building", () => {
    expect(animalsIn(farm(), "coop").map((a) => a.id)).toEqual(["A", "B"]);
    expect(ownedCount(farm(), "Coop")).toBe(1);
    expect(ownedCount(farm(), "Silo")).toBe(0);
  });

  it("reads a pond and the name of its fish", () => {
    expect(pondOf(farm(), "pond")?.fishType).toBe(698);
    expect(fishName(698)).toBe("Sturgeon");
    expect(fishName(0)).toBeNull();
    expect(pondFishOptions.length).toBeGreaterThan(50);
    expect(
      pondFishOptions.every((option) => Number.isFinite(option.type)),
    ).toBe(true);
    expect(pondFishOptions.map((option) => option.name)).not.toContain("Goby");
  });
});

describe("building filters", () => {
  it("lists everything with no filter", () => {
    expect(names({})).toHaveLength(7);
  });

  it("filters by builder and lists the farmhouse and greenhouse under All only", () => {
    expect(names({ builder: "Robin" })).toEqual([
      "coop",
      "barn",
      "pond",
      "hutch",
    ]);
    expect(names({ builder: "Wizard" })).toEqual(["hut"]);
  });

  it("searches the building name, the farmhouse name and the fish of a pond", () => {
    expect(names({ query: "coop" })).toEqual(["coop"]);
    expect(names({ query: "upgrade 2" })).toEqual(["house"]);
    expect(names({ query: "sturgeon" })).toEqual(["pond"]);
  });

  it("knows when a filter is on", () => {
    expect(isFilteringBuildings(emptyBuildingFilters)).toBe(false);
    expect(
      isFilteringBuildings({ ...emptyBuildingFilters, builder: "Robin" }),
    ).toBe(true);
  });
});

describe("buildings summary", () => {
  it("counts buildings by builder, the animals housed without the ponds, and the fish", () => {
    expect(buildingsSummary(farm())).toEqual({
      total: 7,
      robin: 4,
      wizard: 1,
      animalsHoused: 7,
      ponds: 1,
      fishInPonds: 3,
    });
  });
});

describe("adding a building", () => {
  it("offers the buildings of Robin and the Wizard", () => {
    expect(
      addableBuildings.every(
        (b) => b.builder === "Robin" || b.builder === "Wizard",
      ),
    ).toBe(true);
    expect(addableBuildings.some((b) => b.name === "Greenhouse")).toBe(false);
    expect(addableBuildings.some((b) => b.name === "Junimo Hut")).toBe(true);
  });

  it("adds an empty building with the given id", () => {
    const result = addBuilding(farm(), "Big Coop", "manual-big-coop-1");

    expect(result.buildings.at(-1)).toEqual({
      id: "manual-big-coop-1",
      type: "Big Coop",
      animalCount: 0,
    });
    expect(result.fishPonds).toHaveLength(1);
  });

  it("adds a pond with no fish and room for ten", () => {
    const result = addBuilding(farm(), "Fish Pond", "manual-pond-1");

    expect(result.fishPonds.at(-1)).toEqual({
      buildingId: "manual-pond-1",
      fishType: 0,
      currentOccupants: 0,
      maxOccupants: 10,
    });
  });
});

describe("removing a building", () => {
  it("moves its animals to unhoused and recounts", () => {
    const result = removeBuilding(farm(), "coop");

    expect(result.buildings.map((b) => b.id)).not.toContain("coop");
    expect(
      result.animals
        .filter((a) => a.id !== "C")
        .every((a) => a.buildingId === "" && a.buildingType === ""),
    ).toBe(true);
    expect(result.animals.find((a) => a.id === "C")?.buildingId).toBe("barn");
    expect(result.buildings.find((b) => b.id === "barn")?.animalCount).toBe(1);
  });

  it("drops the pond of a removed pond building and keeps the other ponds", () => {
    const data = addBuilding(farm(), "Fish Pond", "p2");
    const result = removeBuilding(data, "pond");

    expect(result.fishPonds.map((p) => p.buildingId)).toEqual(["p2"]);
  });

  it("leaves a building that is not there alone", () => {
    const result = removeBuilding(farm(), "nothing");

    expect(result.buildings).toHaveLength(7);
    expect(result.animals).toHaveLength(3);
  });
});

describe("counts and ponds", () => {
  it("sets the count of a slime hutch up to its capacity and not below zero", () => {
    expect(setCount(farm(), "hutch", 12).buildings[5].animalCount).toBe(12);
    expect(setCount(farm(), "hutch", 99).buildings[5].animalCount).toBe(20);
    expect(setCount(farm(), "hutch", -3).buildings[5].animalCount).toBe(0);
  });

  it("does not set the count of a coop, which follows its animals", () => {
    const data = farm();

    expect(setCount(data, "coop", 3)).toBe(data);
    expect(setCount(data, "nothing", 3)).toBe(data);
  });

  it("sets the fish of a pond", () => {
    expect(setPondFish(farm(), "pond", 128).fishPonds[0].fishType).toBe(128);
  });

  it("sets the fish in a pond up to its maximum and keeps the building count the same", () => {
    const up = setPondOccupants(farm(), "pond", 99);
    const down = setPondOccupants(farm(), "pond", -2);

    expect(up.fishPonds[0].currentOccupants).toBe(5);
    expect(up.buildings.find((b) => b.id === "pond")?.animalCount).toBe(5);
    expect(down.fishPonds[0].currentOccupants).toBe(0);
    expect(down.buildings.find((b) => b.id === "pond")?.animalCount).toBe(0);
  });

  it("does nothing for a building that is not a pond", () => {
    const data = farm();

    expect(setPondOccupants(data, "coop", 3)).toBe(data);
  });
});
