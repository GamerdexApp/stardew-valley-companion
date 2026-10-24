import { maps } from "stardew-valley-data";
import { assetPath } from "./assetPath";

const allMaps = maps().get();

/**
 * The map of a farm type. The data gives most maps a number for an id and Meadowlands a name, so a
 * map without a number takes its place in the list, which is where the game puts it (type 7).
 * An unknown type reads as the Standard farm.
 */
export const mapOfFarmType = (farmType: number) =>
  allMaps.find(
    (map, index) =>
      (Number.isFinite(Number(map.id)) ? Number(map.id) : index) === farmType,
  ) ?? allMaps[0];

export function getFarmIcon(farmType: number): string {
  return assetPath(mapOfFarmType(farmType).icon);
}
