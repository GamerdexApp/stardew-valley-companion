import type { AppData, Platform, Playthrough, Settings } from "@/types/app";
import { DEFAULT_GAME_DATA } from "@/data/constants";

export const EMPTY_APP_DATA: AppData = {
  playthroughs: [],
  activePlaythroughId: null,
};

export type NewPlaythrough = Omit<
  Playthrough,
  "id" | "createdAt" | "lastModified" | "data"
> &
  Partial<Pick<Playthrough, "data">>;

export const withDefaults = (data: AppData): AppData => ({
  ...data,
  playthroughs: data.playthroughs.map((playthrough) => ({
    ...playthrough,
    data: { ...DEFAULT_GAME_DATA, ...playthrough.data },
  })),
});

export const addPlaythrough = (
  current: AppData,
  input: NewPlaythrough,
  now = new Date(),
): AppData => {
  const timestamp = now.toISOString();
  const created: Playthrough = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: timestamp,
    lastModified: timestamp,
    data: input.data ?? { ...DEFAULT_GAME_DATA },
  };
  return {
    ...current,
    playthroughs: [...current.playthroughs, created],
    activePlaythroughId:
      current.playthroughs.length === 0
        ? created.id
        : current.activePlaythroughId,
  };
};

export const updatePlaythrough = (
  current: AppData,
  id: string,
  updates: Partial<Playthrough>,
  now = new Date(),
): AppData => ({
  ...current,
  playthroughs: current.playthroughs.map((playthrough) =>
    playthrough.id === id
      ? { ...playthrough, ...updates, lastModified: now.toISOString() }
      : playthrough,
  ),
});

/**
 * The platform is a label. Changing it keeps `lastModified`, so the Last modified order stays.
 */
export const setPlatform = (
  current: AppData,
  id: string,
  platform: Platform | undefined,
): AppData => ({
  ...current,
  playthroughs: current.playthroughs.map((playthrough) =>
    playthrough.id === id ? { ...playthrough, platform } : playthrough,
  ),
});

const mostRecentlyModified = (playthroughs: Playthrough[]) =>
  playthroughs.reduce<Playthrough | null>(
    (latest, playthrough) =>
      latest === null || playthrough.lastModified > latest.lastModified
        ? playthrough
        : latest,
    null,
  );

export const deletePlaythrough = (current: AppData, id: string): AppData => {
  const playthroughs = current.playthroughs.filter(
    (playthrough) => playthrough.id !== id,
  );
  return {
    ...current,
    playthroughs,
    activePlaythroughId:
      current.activePlaythroughId === id
        ? (mostRecentlyModified(playthroughs)?.id ?? null)
        : current.activePlaythroughId,
  };
};

export const setActivePlaythrough = (
  current: AppData,
  id: string | null,
): AppData => ({ ...current, activePlaythroughId: id });

export const updateSettings = (
  current: AppData,
  updates: Settings,
): AppData => ({ ...current, settings: { ...current.settings, ...updates } });
