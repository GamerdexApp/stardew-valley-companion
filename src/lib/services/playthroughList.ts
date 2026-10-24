import type { Platform, Playthrough } from "@/types/app";
import {
  calculatePerfection,
  calculatePerfectionScore,
} from "@/service/perfection";
import { FARM_TYPE_LABELS } from "@/data/constants/farms";

export type PlaythroughSort = "lastModified" | "name" | "createdAt";
export type PlatformFilter = Platform | "all";

export interface PlaythroughListQuery {
  search: string;
  sort: PlaythroughSort;
  platform: PlatformFilter;
}

const timestamp = (iso: string) => Date.parse(iso) || 0;

const SORTERS: Record<
  PlaythroughSort,
  (a: Playthrough, b: Playthrough) => number
> = {
  lastModified: (a, b) => timestamp(b.lastModified) - timestamp(a.lastModified),
  name: (a, b) => a.name.localeCompare(b.name),
  createdAt: (a, b) => timestamp(b.createdAt) - timestamp(a.createdAt),
};

export const isFiltered = ({ search, platform }: PlaythroughListQuery) =>
  search.trim() !== "" || platform !== "all";

export const filterAndSort = (
  playthroughs: Playthrough[],
  { search, sort, platform }: PlaythroughListQuery,
): Playthrough[] => {
  const needle = search.trim().toLowerCase();
  return playthroughs
    .filter((playthrough) => playthrough.name.toLowerCase().includes(needle))
    .filter(
      (playthrough) => platform === "all" || playthrough.platform === platform,
    )
    .sort(SORTERS[sort]);
};

/**
 * The playthrough that becomes active when `deletingId` is deleted while active: the most
 * recently updated of the others, matching `deletePlaythrough`.
 */
export const nextActiveAfterDelete = (
  playthroughs: Playthrough[],
  deletingId: string,
): Playthrough | null =>
  playthroughs
    .filter((playthrough) => playthrough.id !== deletingId)
    .sort(SORTERS.lastModified)[0] ?? null;

export const perfectionPercent = (playthrough: Playthrough): number =>
  calculatePerfectionScore(
    calculatePerfection(playthrough.data),
    playthrough.data.perfectionWaiverCount,
  );

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

/** "Spring 13, Year 2" */
export const formatGameDate = (playthrough: Playthrough): string => {
  const { season, day, year } = playthrough.data.character.currentDate;
  return `${capitalize(season)} ${day}, Year ${year}`;
};

/** "Riverland farm · Sam", leaving out whichever part is empty. */
export const describeFarm = (playthrough: Playthrough): string => {
  const { farmType, name } = playthrough.data.character;
  const farm = FARM_TYPE_LABELS[farmType];
  return [farm, name].filter(Boolean).join(" · ");
};
