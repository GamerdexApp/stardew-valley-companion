import {
  buildings as queryBuildings,
  fish as queryFish,
  houseUpgrades as queryHouseUpgrades,
} from "stardew-valley-data";
import type { Building } from "stardew-valley-data";
import type { BuildingProgress, FishPondProgress, GameData } from "@/types/app";
import { capacityOf, familyOf, occupantsOf, unhouseAnimalsIn } from "./animals";

export const allBuildingTypes: Building[] = queryBuildings().get();
const houseTiers = queryHouseUpgrades().get();
/** A pond is saved with the item id of its fish, so only fish with a numeric id can live in one. */
const pondFish = queryFish()
  .get()
  .filter((fish) => fish.fishPond && Number.isFinite(Number(fish.id)));

export const POND_MAX_OCCUPANTS = 10;
export const FARMHOUSE = "Farmhouse";
export const FISH_POND = "Fish Pond";
export const SLIME_HUTCH = "Slime Hutch";

const info = (type: string): Building | undefined =>
  allBuildingTypes.find((building) => building.name === type);

/** The Farmhouse is listed by its house level: Starting Farmhouse, then the upgrades. */
export interface BuildingView {
  name: string;
  image: string | null;
  description: string;
  builder: string;
  cost: number | null;
}

export const viewOf = (
  data: GameData,
  building: BuildingProgress,
): BuildingView => {
  if (building.type === FARMHOUSE) {
    const tier =
      houseTiers[
        Math.min(data.character.houseUpgradeLevel, houseTiers.length - 1)
      ];
    return {
      name: tier.name,
      image: tier.image,
      description: tier.description,
      builder: "Robin",
      cost: tier.cost,
    };
  }
  const known = info(building.type);
  return {
    name: building.type,
    image: known?.image ?? null,
    description: known?.description ?? "",
    builder: known?.builder ?? "",
    cost: known?.buildCost ?? null,
  };
};

export const infoOf = info;

export const isPond = (building: BuildingProgress): boolean =>
  building.type === FISH_POND;

/** A coop or barn counts the animals that live in it. A slime hutch has a count of its own. */
export const isAnimalHome = (building: BuildingProgress): boolean =>
  familyOf(building.type) !== null;

export const hasCountField = (building: BuildingProgress): boolean =>
  building.type === SLIME_HUTCH;

export const animalsIn = (data: GameData, buildingId: string) =>
  data.animals.filter((animal) => animal.buildingId === buildingId);

export const ownedCount = (data: GameData, type: string): number =>
  data.buildings.filter((building) => building.type === type).length;

export const pondOf = (
  data: GameData,
  buildingId: string,
): FishPondProgress | undefined =>
  data.fishPonds.find((pond) => pond.buildingId === buildingId);

export const fishName = (fishType: number): string | null =>
  pondFish.find((fish) => Number(fish.id) === fishType)?.name ?? null;

export const pondFishOptions = pondFish.map((fish) => ({
  type: Number(fish.id),
  name: fish.name,
}));

/** A building the player can add. The farmhouse and the greenhouse come with the farm. */
export const addableBuildings: Building[] = allBuildingTypes.filter(
  (building) => building.builder === "Robin" || building.builder === "Wizard",
);

export type BuilderFilter = "all" | "Robin" | "Wizard";

export interface BuildingFilters {
  query: string;
  builder: BuilderFilter;
}

export const emptyBuildingFilters: BuildingFilters = {
  query: "",
  builder: "all",
};

export const isFilteringBuildings = (filters: BuildingFilters): boolean =>
  filters.query !== "" || filters.builder !== "all";

/** The search matches the building and the fish of a pond. The farmhouse is listed under All only. */
export const filterBuildings = (
  data: GameData,
  filters: BuildingFilters,
): BuildingProgress[] => {
  const needle = filters.query.trim().toLowerCase();
  return data.buildings.filter((building) => {
    const view = viewOf(data, building);
    const fish = fishName(pondOf(data, building.id)?.fishType ?? -1) ?? "";
    const farmhouseUnderRobin =
      building.type === FARMHOUSE && filters.builder !== "all";
    return (
      (view.name.toLowerCase().includes(needle) ||
        fish.toLowerCase().includes(needle)) &&
      (filters.builder === "all" || view.builder === filters.builder) &&
      !farmhouseUnderRobin
    );
  });
};

export interface BuildingsSummary {
  total: number;
  robin: number;
  wizard: number;
  animalsHoused: number;
  ponds: number;
  fishInPonds: number;
}

export const buildingsSummary = (data: GameData): BuildingsSummary => ({
  total: data.buildings.length,
  robin: data.buildings.filter(
    (building) =>
      building.type !== FARMHOUSE && info(building.type)?.builder === "Robin",
  ).length,
  wizard: data.buildings.filter(
    (building) => info(building.type)?.builder === "Wizard",
  ).length,
  animalsHoused: data.buildings
    .filter((building) => !isPond(building))
    .reduce((sum, building) => sum + building.animalCount, 0),
  ponds: data.fishPonds.length,
  fishInPonds: data.fishPonds.reduce(
    (sum, pond) => sum + pond.currentOccupants,
    0,
  ),
});

/** A new coop or barn starts empty. A new pond has no fish and room for ten. */
export const addBuilding = (
  data: GameData,
  type: string,
  id: string,
): GameData => {
  const next = {
    ...data,
    buildings: [...data.buildings, { id, type, animalCount: 0 }],
  };
  return type === FISH_POND
    ? {
        ...next,
        fishPonds: [
          ...data.fishPonds,
          {
            buildingId: id,
            fishType: 0,
            currentOccupants: 0,
            maxOccupants: POND_MAX_OCCUPANTS,
          },
        ],
      }
    : next;
};

/** Removing a building unhouses its animals and drops its pond. */
export const removeBuilding = (data: GameData, id: string): GameData => {
  const without = {
    ...data,
    buildings: data.buildings.filter((building) => building.id !== id),
    fishPonds: data.fishPonds.filter((pond) => pond.buildingId !== id),
  };
  return unhouseAnimalsIn(without, id);
};

export const setCount = (
  data: GameData,
  buildingId: string,
  count: number,
): GameData => {
  const building = data.buildings.find((item) => item.id === buildingId);
  if (!building || !hasCountField(building)) return data;
  const next = Math.min(
    capacityOf(building.type),
    Math.max(0, Math.floor(count)),
  );
  return {
    ...data,
    buildings: data.buildings.map((item) =>
      item.id === buildingId ? { ...item, animalCount: next } : item,
    ),
  };
};

export const setPondFish = (
  data: GameData,
  buildingId: string,
  fishType: number,
): GameData => ({
  ...data,
  fishPonds: data.fishPonds.map((pond) =>
    pond.buildingId === buildingId ? { ...pond, fishType } : pond,
  ),
});

/** The saved building keeps the same number, because a pond counts its fish in `animalCount`. */
export const setPondOccupants = (
  data: GameData,
  buildingId: string,
  count: number,
): GameData => {
  const pond = pondOf(data, buildingId);
  if (!pond) return data;
  const next = Math.min(pond.maxOccupants, Math.max(0, Math.floor(count)));
  return {
    ...data,
    fishPonds: data.fishPonds.map((item) =>
      item.buildingId === buildingId
        ? { ...item, currentOccupants: next }
        : item,
    ),
    buildings: data.buildings.map((item) =>
      item.id === buildingId ? { ...item, animalCount: next } : item,
    ),
  };
};

export const roomLeft = (data: GameData, building: BuildingProgress): number =>
  capacityOf(building.type) - occupantsOf(data, building.id);

/** Two buildings of one type are told apart by a number: Coop 1 and Coop 2. */
export const buildingLabels = (data: GameData): Map<string, string> => {
  const totals = new Map<string, number>();
  for (const building of data.buildings) {
    totals.set(building.type, (totals.get(building.type) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  return new Map(
    data.buildings.map((building) => {
      const position = (seen.get(building.type) ?? 0) + 1;
      seen.set(building.type, position);
      const many = (totals.get(building.type) ?? 0) > 1;
      return [
        building.id,
        many ? `${building.type} ${position}` : building.type,
      ];
    }),
  );
};
