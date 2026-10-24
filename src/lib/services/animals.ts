import {
  isFarmAnimal,
  isPet,
  animals as queryAnimals,
  buildings as queryBuildings,
} from "stardew-valley-data";
import type { FarmAnimal } from "stardew-valley-data";
import type {
  BuildingProgress,
  FarmAnimalProgress,
  GameData,
  PetProgress,
} from "@/types/app";

export const allSpecies: FarmAnimal[] = queryAnimals()
  .farmAnimals()
  .get()
  .filter(isFarmAnimal);

const allPets = queryAnimals().pets().get().filter(isPet);

export const MAX_FRIENDSHIP = 1000;
export const MAX_HAPPINESS = 255;
export const POINTS_PER_HEART = 200;
export const MAX_HEARTS = 5;

export const speciesOf = (name: string): FarmAnimal | undefined =>
  allSpecies.find((species) => species.name === name);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const heartsOf = (friendship: number): number =>
  clamp(Math.floor(friendship / POINTS_PER_HEART), 0, MAX_HEARTS);

/** The building types of a family, from the smallest to the largest. */
const FAMILIES = {
  Coop: ["Coop", "Big Coop", "Deluxe Coop"],
  Barn: ["Barn", "Big Barn", "Deluxe Barn"],
} as const;

type Family = keyof typeof FAMILIES;

export const familyOf = (buildingType: string): Family | null =>
  buildingType.endsWith("Coop")
    ? "Coop"
    : buildingType.endsWith("Barn")
      ? "Barn"
      : null;

const tierOf = (buildingType: string): number => {
  const family = familyOf(buildingType);
  return family ? FAMILIES[family].indexOf(buildingType as never) : -1;
};

const capacities = new Map(
  queryBuildings()
    .get()
    .map((building) => [building.name, building.animalCapacity ?? 0]),
);

export const capacityOf = (buildingType: string): number =>
  capacities.get(buildingType) ?? 0;

/**
 * A species lives in its own kind of building or a larger one of the same family. A duck needs a
 * Big Coop, so a plain Coop does not fit it, and a Deluxe Coop does.
 */
export const housingFor = (
  data: GameData,
  speciesName: string,
): BuildingProgress[] => {
  const species = speciesOf(speciesName);
  if (!species) return [];
  return data.buildings.filter(
    (building) =>
      familyOf(building.type) === familyOf(species.building) &&
      tierOf(building.type) >= tierOf(species.building),
  );
};

export const occupantsOf = (data: GameData, buildingId: string): number =>
  data.animals.filter((animal) => animal.buildingId === buildingId).length;

/**
 * The animal count of each coop and barn follows the animals that live in it. Other buildings
 * keep their count, because a Fish Pond uses the same field for its fish.
 */
const recount = (data: GameData): GameData => ({
  ...data,
  buildings: data.buildings.map((building) => {
    if (familyOf(building.type) === null) return building;
    const animalCount = occupantsOf(data, building.id);
    return building.animalCount === animalCount
      ? building
      : { ...building, animalCount };
  }),
});

const buildingTypeOf = (data: GameData, buildingId: string): string =>
  data.buildings.find((building) => building.id === buildingId)?.type ?? "";

/** A new animal is a baby with full happiness. An empty building id means unhoused. */
export const addAnimal = (
  data: GameData,
  animal: {
    species: string;
    name: string;
    friendship: number;
    buildingId: string;
  },
  id: string,
): GameData =>
  recount({
    ...data,
    animals: [
      ...data.animals,
      {
        name: animal.name.trim(),
        id,
        type: animal.species,
        buildingType: familyOf(buildingTypeOf(data, animal.buildingId)) ?? "",
        buildingId: animal.buildingId,
        friendship: clamp(Math.floor(animal.friendship), 0, MAX_FRIENDSHIP),
        happiness: MAX_HAPPINESS,
        age: 0,
        hasAnimalCracker: false,
      },
    ],
  });

export const removeAnimal = (data: GameData, id: string): GameData =>
  recount({
    ...data,
    animals: data.animals.filter((animal) => animal.id !== id),
  });

const updateAnimal = (
  data: GameData,
  id: string,
  patch: Partial<FarmAnimalProgress>,
): GameData => ({
  ...data,
  animals: data.animals.map((animal) =>
    animal.id === id ? { ...animal, ...patch } : animal,
  ),
});

export const moveAnimal = (
  data: GameData,
  id: string,
  buildingId: string,
): GameData =>
  recount(
    updateAnimal(data, id, {
      buildingId,
      buildingType: familyOf(buildingTypeOf(data, buildingId)) ?? "",
    }),
  );

export const setFriendship = (
  data: GameData,
  id: string,
  value: number,
): GameData =>
  updateAnimal(data, id, {
    friendship: clamp(Math.floor(value), 0, MAX_FRIENDSHIP),
  });

export const setHappiness = (
  data: GameData,
  id: string,
  value: number,
): GameData =>
  updateAnimal(data, id, {
    happiness: clamp(Math.floor(value), 0, MAX_HAPPINESS),
  });

export const setAge = (data: GameData, id: string, value: number): GameData =>
  updateAnimal(data, id, { age: Math.max(0, Math.floor(value)) });

export const setCracker = (
  data: GameData,
  id: string,
  has: boolean,
): GameData => updateAnimal(data, id, { hasAnimalCracker: has });

export type AnimalSort = "name" | "friendship" | "age";
export type AnimalBuildingFilter = "all" | "coop" | "barn";

export interface AnimalFilters {
  query: string;
  /** "all" or a species name. */
  type: string;
  building: AnimalBuildingFilter;
  sort: AnimalSort;
}

export const emptyAnimalFilters: AnimalFilters = {
  query: "",
  type: "all",
  building: "all",
  sort: "name",
};

export const isFilteringAnimals = (filters: AnimalFilters): boolean =>
  filters.query !== "" || filters.type !== "all" || filters.building !== "all";

/** Coop includes the Big and Deluxe Coop, and Barn the Big and Deluxe Barn. */
export const filterAnimals = (
  data: GameData,
  filters: AnimalFilters,
): FarmAnimalProgress[] => {
  const needle = filters.query.trim().toLowerCase();
  const matches = data.animals.filter(
    (animal) =>
      (animal.name.toLowerCase().includes(needle) ||
        animal.type.toLowerCase().includes(needle)) &&
      (filters.type === "all" || animal.type === filters.type) &&
      (filters.building === "all" ||
        animal.buildingType.toLowerCase().includes(filters.building)),
  );
  const compare: Record<
    AnimalSort,
    (a: FarmAnimalProgress, b: FarmAnimalProgress) => number
  > = {
    name: (a, b) => a.name.localeCompare(b.name),
    friendship: (a, b) =>
      b.friendship - a.friendship || a.name.localeCompare(b.name),
    age: (a, b) => b.age - a.age || a.name.localeCompare(b.name),
  };
  return [...matches].sort(compare[filters.sort]);
};

export interface AnimalsSummary {
  animals: number;
  buildings: number;
  pets: number;
  averageFriendship: number;
  crackers: number;
}

export const animalsSummary = (data: GameData): AnimalsSummary => ({
  animals: data.animals.length,
  buildings: data.buildings.length,
  pets: data.pets.length,
  averageFriendship:
    data.animals.length === 0
      ? 0
      : Math.round(
          data.animals.reduce((sum, animal) => sum + animal.friendship, 0) /
            data.animals.length,
        ),
  crackers: data.animals.filter((animal) => animal.hasAnimalCracker).length,
});

/** Whether the animal is old enough to produce, and how long it takes. */
export const produceStatus = (
  species: FarmAnimal,
  age: number,
): { ready: boolean; daysLeft: number } => ({
  ready: age >= species.daysToMature,
  daysLeft: Math.max(0, species.daysToMature - age),
});

export const PET_TYPES = ["Cat", "Dog", "Turtle", "Horse"] as const;
export type PetType = (typeof PET_TYPES)[number];

/** Only cats and dogs can be the starter pet. */
export const canBeStarter = (type: string): boolean =>
  type === "Cat" || type === "Dog";

export const hasFriendship = (pet: PetProgress): boolean =>
  pet.friendship !== null;

/** The look of a pet: a cat or dog has five, a turtle has two (regular and iridium). */
export interface PetVariant {
  breed: string;
  image: string;
  label: string;
}

export const variantsOf = (type: string): PetVariant[] => {
  if (type === "Cat" || type === "Dog") {
    return allPets
      .filter((pet) => pet.name === type)
      .map((pet) => ({
        breed: String(pet.variant),
        image: pet.image,
        label: `${type} ${pet.variant}`,
      }));
  }
  if (type === "Turtle") {
    return ["turtle", "iridium-turtle"].map((id, index) => {
      const pet = allPets.find((item) => item.id === id)!;
      return { breed: String(index), image: pet.image, label: pet.name };
    });
  }
  const horse = allPets.find((pet) => pet.id === "horse")!;
  return [{ breed: "", image: horse.image, label: horse.name }];
};

export const petImage = (pet: PetProgress): string => {
  const variants = variantsOf(pet.type);
  return (
    variants.find((variant) => variant.breed === pet.breed) ?? variants[0]
  ).image;
};

export const addPet = (
  data: GameData,
  pet: {
    type: string;
    name: string;
    breed: string;
    friendship: number;
    starter: boolean;
  },
): GameData => ({
  ...data,
  pets: [
    ...data.pets.map((other) =>
      pet.starter && canBeStarter(pet.type)
        ? { ...other, starter: false }
        : other,
    ),
    {
      name: pet.name.trim(),
      type: pet.type,
      breed: pet.breed,
      friendship:
        pet.type === "Horse"
          ? null
          : clamp(Math.floor(pet.friendship), 0, MAX_FRIENDSHIP),
      starter: canBeStarter(pet.type) && pet.starter,
    },
  ],
});

export const removePet = (data: GameData, index: number): GameData => ({
  ...data,
  pets: data.pets.filter((_, position) => position !== index),
});

export const setPetFriendship = (
  data: GameData,
  index: number,
  value: number,
): GameData => ({
  ...data,
  pets: data.pets.map((pet, position) =>
    position === index && hasFriendship(pet)
      ? { ...pet, friendship: clamp(Math.floor(value), 0, MAX_FRIENDSHIP) }
      : pet,
  ),
});

/** Only one pet is the starter pet, so choosing one clears the others. A horse or a turtle cannot be one. */
export const setStarterPet = (
  data: GameData,
  index: number,
  starter: boolean,
): GameData => {
  const target = data.pets[index];
  if (!target || !canBeStarter(target.type)) return data;
  return {
    ...data,
    pets: data.pets.map((pet, position) => {
      if (position === index) return { ...pet, starter };
      return starter ? { ...pet, starter: false } : pet;
    }),
  };
};
