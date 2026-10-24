import { maps } from "stardew-valley-data";

const allMaps = maps().get();

export const FARM_TYPES = allMaps.map((map, index) => ({
  value: Number.isFinite(Number(map.id)) ? Number(map.id) : index,
  label: map.name,
}));

export const FARM_TYPE_LABELS: Record<number, string> = Object.fromEntries(
  FARM_TYPES.map((ft) => [ft.value, ft.label]),
);

/**
 * The map of a farm type. The data gives most maps a number for an id and Meadowlands a name, so a
 * map without a number takes its place in the list, which is where the game puts it (type 7).
 * An unknown type reads as the Standard farm.
 */
export const mapOfFarmType = (farmType: number) =>
  allMaps.find((_map, index) => FARM_TYPES[index].value === farmType) ??
  allMaps[0];
