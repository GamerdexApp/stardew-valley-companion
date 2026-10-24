import type { Playthrough } from "@/types/app";

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

/** "Spring 13, Year 2". It lives apart from the playthrough list so the shell needs no game data. */
export const formatGameDate = (playthrough: Playthrough): string => {
  const { season, day, year } = playthrough.data.character.currentDate;
  return `${capitalize(season)} ${day}, Year ${year}`;
};
