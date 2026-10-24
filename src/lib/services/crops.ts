import { crops as queryCrops } from "stardew-valley-data";
import type { Crop } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import {
  countCropsShipped,
  shippableCrops,
} from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { isShipped, shippedCount } from "./shipped";

export const allCrops: Crop[] = queryCrops().get();

const shippableIds = new Set(shippableCrops.map((crop) => crop.id));

/** The shipping collection does not list every crop. It leaves out Qi Fruit. */
export const isShippableCrop = (crop: Crop): boolean =>
  shippableIds.has(crop.id);

export type CropSeason = "all" | "spring" | "summer" | "fall" | "winter";
export type CropShippedFilter = "all" | "shipped" | "not-shipped";
export type CropRegrowthFilter = "all" | "regrowing" | "non-regrowing";
export type CropTrellisFilter = "all" | "trellis" | "no-trellis";
export type CropGiantFilter = "all" | "giant" | "no-giant";

export interface CropFilters {
  query: string;
  season: CropSeason;
  shipped: CropShippedFilter;
  regrowth: CropRegrowthFilter;
  trellis: CropTrellisFilter;
  giant: CropGiantFilter;
}

export const emptyCropFilters: CropFilters = {
  query: "",
  season: "all",
  shipped: "all",
  regrowth: "all",
  trellis: "all",
  giant: "all",
};

export const isFilteringCrops = (filters: CropFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyCropFilters);

export const filterCrops = (data: GameData, filters: CropFilters): Crop[] => {
  const needle = filters.query.trim().toLowerCase();
  return allCrops.filter(
    (crop) =>
      crop.name.toLowerCase().includes(needle) &&
      (filters.season === "all" ||
        (crop.seasons as string[]).includes(filters.season)) &&
      (filters.shipped === "all" ||
        (filters.shipped === "shipped") === isShipped(data, crop.id)) &&
      (filters.regrowth === "all" ||
        (filters.regrowth === "regrowing") === (crop.regrowDays !== null)) &&
      (filters.trellis === "all" ||
        (filters.trellis === "trellis") === crop.trellis) &&
      (filters.giant === "all" || (filters.giant === "giant") === crop.giant),
  );
};

/** The shipped counts that unlock the Polyculture and Monoculture achievements. */
export const POLYCULTURE_COUNT = 15;
export const MONOCULTURE_COUNT = 300;

export interface CropsSummary {
  total: number;
  regrowing: number;
  shipped: ProgressCount;
  shippedFifteen: number;
  shippedThreeHundred: number;
  seasons: { season: Exclude<CropSeason, "all">; count: number }[];
}

const SEASONS: Exclude<CropSeason, "all">[] = [
  "spring",
  "summer",
  "fall",
  "winter",
];

export const cropsSummary = (data: GameData): CropsSummary => ({
  total: allCrops.length,
  regrowing: allCrops.filter((crop) => crop.regrowDays !== null).length,
  shipped: countCropsShipped(data),
  shippedFifteen: allCrops.filter(
    (crop) => shippedCount(data, crop.id) >= POLYCULTURE_COUNT,
  ).length,
  shippedThreeHundred: allCrops.filter(
    (crop) => shippedCount(data, crop.id) >= MONOCULTURE_COUNT,
  ).length,
  seasons: SEASONS.map((season) => ({
    season,
    count: allCrops.filter((crop) =>
      (crop.seasons as string[]).includes(season),
    ).length,
  })),
});

/** A harvest of more than one item, such as "×1–4". A single item has no label. */
export const harvestLabel = (crop: Crop): string | null => {
  const { min, max } = crop.harvestQuantity;
  if (max <= 1) return null;
  return min === max ? `×${min}` : `×${min}–${max}`;
};
