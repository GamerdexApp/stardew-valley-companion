import type { Playthrough } from "@/types/app";

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

/**
 * The muted line under a playthrough name: the in-game date, then the platform when one is set.
 */
export const describePlaythrough = (playthrough: Playthrough): string => {
  const { season, day, year } = playthrough.data.character.currentDate;
  const date = `Year ${year}, ${capitalize(season)} ${day}`;
  return playthrough.platform ? `${date} · ${playthrough.platform}` : date;
};
