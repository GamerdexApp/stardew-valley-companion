import { assetPath } from "./assetPath";

/**
 * The map icon of each farm type, by type number. The table is written out here so the shell does
 * not need the game data package for a picture. A test keeps it equal to the package.
 */
export const FARM_ICONS = [
  "images/maps/icons/Standard Farm Map Icon.png",
  "images/maps/icons/Riverland Farm Map Icon.png",
  "images/maps/icons/Forest Farm Map Icon.png",
  "images/maps/icons/Hilltop Farm Map Icon.png",
  "images/maps/icons/Wilderness Farm Map Icon.png",
  "images/maps/icons/Four Corners Farm Map Icon.png",
  "images/maps/icons/Beach Farm Map Icon.png",
  "images/maps/icons/Meadowlands Farm Map Icon.png",
];

/** An unknown type reads as the Standard farm. */
export const getFarmIcon = (farmType: number): string =>
  assetPath(FARM_ICONS[farmType] ?? FARM_ICONS[0]);
