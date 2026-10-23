import { fish as queryFish } from "stardew-valley-data";
import type { Fish, Season } from "stardew-valley-data";
import type { FishCaughtProgress, GameData } from "@/types/app";
import { countFishCaught } from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";

export const allFish: Fish[] = queryFish().get();

export type CaughtFilter = "all" | "caught" | "not-caught";
export type CatchTypeFilter = "all" | "rod" | "crab-pot";
export type SeasonFilter = "all" | Season | "ginger-island";
export type WeatherFilter = "all" | "sunny" | "rainy" | "both";
export type DifficultyFilter = "all" | "easy" | "medium" | "hard" | "none";

export interface FishFilters {
  query: string;
  caught: CaughtFilter;
  catchType: CatchTypeFilter;
  season: SeasonFilter;
  weather: WeatherFilter;
  location: string;
  difficulty: DifficultyFilter;
  /** Category ids joined with a comma. Empty means every category. */
  categories: string;
}

export const ALL = "all";

export const emptyFishFilters: FishFilters = {
  query: "",
  caught: ALL,
  catchType: ALL,
  season: ALL,
  weather: ALL,
  location: ALL,
  difficulty: ALL,
  categories: "",
};

export const EASY_MAX = 33;
export const MEDIUM_MAX = 66;

export type DifficultyLevel = "easy" | "medium" | "hard";

export const difficultyLevel = (difficulty: number): DifficultyLevel =>
  difficulty <= EASY_MAX
    ? "easy"
    : difficulty <= MEDIUM_MAX
      ? "medium"
      : "hard";

export const isCaught = (data: GameData, id: string): boolean =>
  data.fishCaught.some((entry) => entry.id === id);

/**
 * A new entry gets one catch and no size, the same entry the old Edit step wrote. A save file fills
 * the real numbers, which the app never shows.
 */
export const setCaught = (
  data: GameData,
  id: string,
  caught: boolean,
): GameData => {
  if (isCaught(data, id) === caught) return data;
  const fishCaught: FishCaughtProgress[] = caught
    ? [...data.fishCaught, { id, timesCaught: 1, largestSize: 0 }]
    : data.fishCaught.filter((entry) => entry.id !== id);
  return { ...data, fishCaught };
};

const matchesSeason = (fish: Fish, season: SeasonFilter): boolean => {
  if (season === ALL) return true;
  if (season === "ginger-island") {
    return (
      fish.location.includes("Ginger Island") ||
      fish.seasons.includes("ginger island")
    );
  }
  return fish.seasons.includes(season);
};

const matchesWeather = (fish: Fish, weather: WeatherFilter): boolean => {
  if (weather === ALL) return true;
  if (weather === "both") return fish.weather === "both";
  return fish.weather === weather || fish.weather === "both";
};

const matchesDifficulty = (
  fish: Fish,
  difficulty: DifficultyFilter,
): boolean => {
  if (difficulty === ALL) return true;
  if (difficulty === "none") return fish.difficulty == null;
  return (
    fish.difficulty != null && difficultyLevel(fish.difficulty) === difficulty
  );
};

export const categoryIds = (categories: string): string[] =>
  categories === "" ? [] : categories.split(",");

export const toggleCategory = (categories: string, id: string): string => {
  const ids = categoryIds(categories);
  return (
    ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]
  ).join(",");
};

export const isFilteringFish = (filters: FishFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyFishFilters);

export const filterFish = (data: GameData, filters: FishFilters): Fish[] => {
  const needle = filters.query.trim().toLowerCase();
  const categories = categoryIds(filters.categories);
  return allFish.filter((fish) => {
    const caught = isCaught(data, fish.id);
    return (
      fish.name.toLowerCase().includes(needle) &&
      (filters.caught === ALL || (filters.caught === "caught") === caught) &&
      (filters.catchType === ALL || fish.catchType === filters.catchType) &&
      matchesSeason(fish, filters.season) &&
      matchesWeather(fish, filters.weather) &&
      (filters.location === ALL || fish.location === filters.location) &&
      matchesDifficulty(fish, filters.difficulty) &&
      (categories.length === 0 || categories.includes(fish.category))
    );
  });
};

export const locationOptions: string[] = [
  ...new Set(allFish.map((fish) => fish.location)),
].sort();

export interface FishSummary {
  total: number;
  /** The fish the in-game collection counts, with how many of them are caught. */
  collection: ProgressCount;
  notInCollection: number;
  rod: number;
  crabPot: number;
  seasons: { season: ListedSeason; count: number }[];
}

type ListedSeason = Exclude<Season, "ginger island">;

const SEASON_ORDER: ListedSeason[] = ["spring", "summer", "fall", "winter"];

export const fishSummary = (data: GameData): FishSummary => {
  const collection = countFishCaught(data);
  return {
    total: allFish.length,
    collection,
    notInCollection: allFish.length - collection.total,
    rod: allFish.filter((fish) => fish.catchType === "rod").length,
    crabPot: allFish.filter((fish) => fish.catchType === "crab-pot").length,
    seasons: SEASON_ORDER.map((season) => ({
      season,
      count: allFish.filter((fish) => fish.seasons.includes(season)).length,
    })),
  };
};
