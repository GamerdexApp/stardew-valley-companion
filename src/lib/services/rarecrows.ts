import { rarecrows as queryRarecrows } from "stardew-valley-data";
import type { Rarecrow } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import type { ProgressCount } from "@/lib/utils/collectionCounts";

export const allRarecrows: Rarecrow[] = queryRarecrows().get();

export const isObtained = (data: GameData, id: string): boolean =>
  data.rarecrows.includes(id);

/** Adds the id to the saved list, or takes it out. A rarecrow from a save file counts when placed. */
export const setObtained = (
  data: GameData,
  id: string,
  obtained: boolean,
): GameData => {
  if (isObtained(data, id) === obtained) return data;
  return {
    ...data,
    rarecrows: obtained
      ? [...data.rarecrows, id]
      : data.rarecrows.filter((other) => other !== id),
  };
};

export type RarecrowStatusFilter = "all" | "obtained" | "missing";

export interface RarecrowFilters {
  query: string;
  status: RarecrowStatusFilter;
}

export const emptyRarecrowFilters: RarecrowFilters = {
  query: "",
  status: "all",
};

export const isFilteringRarecrows = (filters: RarecrowFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyRarecrowFilters);

export const filterRarecrows = (
  data: GameData,
  filters: RarecrowFilters,
): Rarecrow[] => {
  const needle = filters.query.trim().toLowerCase();
  return allRarecrows.filter(
    (rarecrow) =>
      (rarecrow.name.toLowerCase().includes(needle) ||
        rarecrow.obtain.toLowerCase().includes(needle)) &&
      (filters.status === "all" ||
        (filters.status === "obtained") === isObtained(data, rarecrow.id)),
  );
};

export const countRarecrowsObtained = (data: GameData): ProgressCount => ({
  current: allRarecrows.filter((rarecrow) => isObtained(data, rarecrow.id))
    .length,
  total: allRarecrows.length,
});
