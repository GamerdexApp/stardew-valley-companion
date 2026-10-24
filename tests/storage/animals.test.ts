import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  addAnimal,
  addPet,
  allSpecies,
  animalsSummary,
  canBeStarter,
  capacityOf,
  emptyAnimalFilters,
  familyOf,
  filterAnimals,
  heartsOf,
  housingFor,
  isFilteringAnimals,
  moveAnimal,
  occupantsOf,
  petImage,
  produceStatus,
  removeAnimal,
  removePet,
  setAge,
  setCracker,
  setFriendship,
  setHappiness,
  setPetFriendship,
  setStarterPet,
  speciesOf,
  variantsOf,
} from "@/service/animals";
import type { AnimalFilters } from "@/service/animals";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const withFarm = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.buildings = [
    { id: "coop", type: "Coop", animalCount: 0 },
    { id: "big", type: "Big Coop", animalCount: 0 },
    { id: "deluxe", type: "Deluxe Coop", animalCount: 0 },
    { id: "barn", type: "Barn", animalCount: 0 },
    { id: "silo", type: "Silo", animalCount: 0 },
  ];
  return data;
};

const animal = (id: string, over: object = {}) => ({
  name: id,
  id,
  type: "White Chicken",
  buildingType: "Coop",
  buildingId: "coop",
  friendship: 500,
  happiness: 255,
  age: 10,
  hasAnimalCracker: false,
  ...over,
});

const withAnimals = (): GameData => {
  const data = withFarm();
  data.animals = [
    animal("Lucas", { friendship: 1000, age: 112 }),
    animal("Ana", {
      type: "Duck",
      buildingId: "big",
      friendship: 200,
      age: 30,
    }),
    animal("Bo", {
      type: "White Cow",
      buildingType: "Barn",
      buildingId: "barn",
      friendship: 600,
      age: 60,
      hasAnimalCracker: true,
    }),
  ];
  return data;
};

describe("species and housing", () => {
  it("lists the 14 farm animals", () => {
    expect(allSpecies).toHaveLength(14);
    expect(speciesOf("Duck")?.building).toBe("Big Coop");
    expect(speciesOf("Nope")).toBeUndefined();
  });

  it("tells a coop family from a barn family", () => {
    expect(familyOf("Deluxe Coop")).toBe("Coop");
    expect(familyOf("Big Barn")).toBe("Barn");
    expect(familyOf("Silo")).toBeNull();
  });

  it("reads the capacity of a building type", () => {
    expect(capacityOf("Coop")).toBe(4);
    expect(capacityOf("Big Coop")).toBe(8);
    expect(capacityOf("Deluxe Barn")).toBe(12);
    expect(capacityOf("Silo")).toBe(0);
  });

  it("lists the buildings a species fits in, its own kind or a larger one of its family", () => {
    const data = withFarm();
    const ids = (species: string) => housingFor(data, species).map((b) => b.id);

    expect(ids("White Chicken")).toEqual(["coop", "big", "deluxe"]);
    expect(ids("Duck")).toEqual(["big", "deluxe"]);
    expect(ids("Rabbit")).toEqual(["deluxe"]);
    expect(ids("White Cow")).toEqual(["barn"]);
    expect(ids("Unknown")).toEqual([]);
  });
});

describe("hearts", () => {
  it("count 200 points a heart, up to five", () => {
    expect(heartsOf(0)).toBe(0);
    expect(heartsOf(199)).toBe(0);
    expect(heartsOf(200)).toBe(1);
    expect(heartsOf(999)).toBe(4);
    expect(heartsOf(1000)).toBe(5);
    expect(heartsOf(-16)).toBe(0);
  });
});

describe("adding and removing an animal", () => {
  it("adds a baby with full happiness, in a fitting building, and recounts the building", () => {
    const result = addAnimal(
      withFarm(),
      { species: "Duck", name: "  Quack ", friendship: 300, buildingId: "big" },
      "manual-animal-1",
    );

    expect(result.animals).toEqual([
      {
        name: "Quack",
        id: "manual-animal-1",
        type: "Duck",
        buildingType: "Coop",
        buildingId: "big",
        friendship: 300,
        happiness: 255,
        age: 0,
        hasAnimalCracker: false,
      },
    ]);
    expect(result.buildings.find((b) => b.id === "big")?.animalCount).toBe(1);
  });

  it("keeps the count of a Fish Pond, which counts fish in the same field", () => {
    const data = withFarm();
    data.buildings.push({ id: "pond", type: "Fish Pond", animalCount: 3 });
    const result = addAnimal(
      data,
      { species: "Duck", name: "Q", friendship: 0, buildingId: "big" },
      "m1",
    );

    expect(result.buildings.find((b) => b.id === "pond")?.animalCount).toBe(3);
    expect(
      removeAnimal(result, "m1").buildings.find((b) => b.id === "pond")
        ?.animalCount,
    ).toBe(3);
  });

  it("adds an unhoused animal with no building", () => {
    const result = addAnimal(
      withFarm(),
      { species: "Goat", name: "Gus", friendship: 0, buildingId: "" },
      "manual-animal-2",
    );

    expect(result.animals[0]).toMatchObject({
      buildingId: "",
      buildingType: "",
    });
    expect(result.buildings.every((b) => b.animalCount === 0)).toBe(true);
  });

  it("keeps friendship between 0 and 1000", () => {
    const high = addAnimal(
      withFarm(),
      { species: "Duck", name: "A", friendship: 5000, buildingId: "" },
      "x",
    );
    const low = addAnimal(
      withFarm(),
      { species: "Duck", name: "B", friendship: -5, buildingId: "" },
      "y",
    );

    expect(high.animals[0].friendship).toBe(1000);
    expect(low.animals[0].friendship).toBe(0);
  });

  it("removes an animal and recounts", () => {
    const data = moveAnimal(withAnimals(), "Lucas", "coop");
    const result = removeAnimal(data, "Lucas");

    expect(result.animals.map((a) => a.id)).toEqual(["Ana", "Bo"]);
    expect(occupantsOf(result, "coop")).toBe(0);
    expect(result.buildings.find((b) => b.id === "coop")?.animalCount).toBe(0);
  });
});

describe("editing an animal", () => {
  it("moves an animal to a building, updates its family and both counts", () => {
    const start = moveAnimal(withAnimals(), "Lucas", "coop");
    const moved = moveAnimal(start, "Lucas", "deluxe");

    expect(moved.animals.find((a) => a.id === "Lucas")).toMatchObject({
      buildingId: "deluxe",
      buildingType: "Coop",
    });
    expect(moved.buildings.find((b) => b.id === "coop")?.animalCount).toBe(0);
    expect(moved.buildings.find((b) => b.id === "deluxe")?.animalCount).toBe(1);
  });

  it("unhouses an animal with an empty building id", () => {
    const moved = moveAnimal(withAnimals(), "Bo", "");

    expect(moved.animals.find((a) => a.id === "Bo")).toMatchObject({
      buildingId: "",
      buildingType: "",
    });
  });

  it("sets friendship, happiness and age within their limits and keeps the other animals", () => {
    let data = withAnimals();
    data = setFriendship(data, "Ana", 1200);
    data = setHappiness(data, "Ana", 300);
    data = setAge(data, "Ana", -3);

    expect(data.animals.find((a) => a.id === "Ana")).toMatchObject({
      friendship: 1000,
      happiness: 255,
      age: 0,
    });
    expect(data.animals.find((a) => a.id === "Lucas")?.friendship).toBe(1000);
    expect(setHappiness(withAnimals(), "Ana", 120).animals[1].happiness).toBe(
      120,
    );
  });

  it("gives and takes a golden animal cracker", () => {
    const on = setCracker(withAnimals(), "Ana", true);

    expect(on.animals.find((a) => a.id === "Ana")?.hasAnimalCracker).toBe(true);
    expect(
      setCracker(on, "Ana", false).animals.find((a) => a.id === "Ana")
        ?.hasAnimalCracker,
    ).toBe(false);
  });
});

describe("animal filters", () => {
  const names = (filters: Partial<AnimalFilters>) =>
    filterAnimals(withAnimals(), { ...emptyAnimalFilters, ...filters }).map(
      (a) => a.name,
    );

  it("sorts by name, friendship or age", () => {
    expect(names({})).toEqual(["Ana", "Bo", "Lucas"]);
    expect(names({ sort: "friendship" })).toEqual(["Lucas", "Bo", "Ana"]);
    expect(names({ sort: "age" })).toEqual(["Lucas", "Bo", "Ana"]);
  });

  it("searches the name and the species", () => {
    expect(names({ query: "duck" })).toEqual(["Ana"]);
    expect(names({ query: "LUC" })).toEqual(["Lucas"]);
  });

  it("filters by species and by building family", () => {
    expect(names({ type: "White Cow" })).toEqual(["Bo"]);
    expect(names({ building: "coop" })).toEqual(["Ana", "Lucas"]);
    expect(names({ building: "barn" })).toEqual(["Bo"]);
  });

  it("knows when a filter is on, and that a sort is not a filter", () => {
    expect(isFilteringAnimals(emptyAnimalFilters)).toBe(false);
    expect(isFilteringAnimals({ ...emptyAnimalFilters, sort: "age" })).toBe(
      false,
    );
    expect(isFilteringAnimals({ ...emptyAnimalFilters, query: "a" })).toBe(
      true,
    );
  });
});

describe("summary and produce", () => {
  it("counts animals, buildings, pets, the average friendship and crackers", () => {
    const data = withAnimals();
    data.pets = [
      {
        name: "Yogi",
        type: "Dog",
        breed: "2",
        friendship: 1000,
        starter: true,
      },
    ];
    const summary = animalsSummary(data);

    expect(summary).toEqual({
      animals: 3,
      buildings: 5,
      pets: 1,
      averageFriendship: 600,
      crackers: 1,
    });
    expect(animalsSummary(withFarm()).averageFriendship).toBe(0);
  });

  it("says whether an animal is old enough to produce", () => {
    const chicken = speciesOf("White Chicken")!;

    expect(produceStatus(chicken, 0)).toEqual({
      ready: false,
      daysLeft: chicken.daysToMature,
    });
    expect(produceStatus(chicken, 100)).toEqual({ ready: true, daysLeft: 0 });
  });
});

describe("pets", () => {
  const pets = (): GameData => {
    const data = withFarm();
    data.pets = [
      { name: "Yogi", type: "Dog", breed: "2", friendship: 900, starter: true },
      {
        name: "Grover",
        type: "Horse",
        breed: "",
        friendship: null,
        starter: false,
      },
    ];
    return data;
  };

  it("lets only cats and dogs be the starter", () => {
    expect(canBeStarter("Cat")).toBe(true);
    expect(canBeStarter("Dog")).toBe(true);
    expect(canBeStarter("Turtle")).toBe(false);
    expect(canBeStarter("Horse")).toBe(false);
  });

  it("gives a cat five looks, a turtle two and a horse one", () => {
    expect(variantsOf("Cat")).toHaveLength(5);
    expect(variantsOf("Dog").map((v) => v.breed)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    expect(variantsOf("Turtle").map((v) => v.breed)).toEqual(["0", "1"]);
    expect(variantsOf("Horse")).toHaveLength(1);
    expect(petImage(pets().pets[0])).toContain("Dog 2");
  });

  it("adds a pet and clears the old starter when the new one is the starter", () => {
    const result = addPet(pets(), {
      type: "Cat",
      name: " Mimi ",
      breed: "3",
      friendship: 400,
      starter: true,
    });

    expect(result.pets).toHaveLength(3);
    expect(result.pets[2]).toEqual({
      name: "Mimi",
      type: "Cat",
      breed: "3",
      friendship: 400,
      starter: true,
    });
    expect(result.pets.filter((p) => p.starter)).toHaveLength(1);
    expect(result.pets[0].starter).toBe(false);
  });

  it("gives a horse no friendship and never a starter", () => {
    const result = addPet(pets(), {
      type: "Horse",
      name: "Bolt",
      breed: "",
      friendship: 500,
      starter: true,
    });

    expect(result.pets[2]).toMatchObject({ friendship: null, starter: false });
    expect(result.pets[0].starter).toBe(true);
  });

  it("removes a pet by its position", () => {
    expect(removePet(pets(), 0).pets.map((p) => p.name)).toEqual(["Grover"]);
  });

  it("sets a pet's friendship, but not for a horse", () => {
    const data = pets();

    expect(setPetFriendship(data, 0, 2000).pets[0].friendship).toBe(1000);
    expect(setPetFriendship(data, 0, -5).pets[0].friendship).toBe(0);
    expect(setPetFriendship(data, 1, 300).pets[1].friendship).toBeNull();
  });

  it("keeps one starter: choosing one clears the others, and a horse cannot be one", () => {
    let data = addPet(pets(), {
      type: "Cat",
      name: "Mimi",
      breed: "1",
      friendship: 0,
      starter: false,
    });
    data = setStarterPet(data, 2, true);

    expect(data.pets.map((p) => p.starter)).toEqual([false, false, true]);
    expect(setStarterPet(data, 1, true).pets.map((p) => p.starter)).toEqual([
      false,
      false,
      true,
    ]);
    expect(setStarterPet(data, 2, false).pets.every((p) => !p.starter)).toBe(
      true,
    );
  });
});
