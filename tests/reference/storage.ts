// Frozen copy of the storage code of version 1.1.0: src/lib/services/storage.ts and the state logic of PlaythroughContext.tsx. The storage tests run the same contract against it.
import type { AppData, Playthrough } from "@/types/app";
import { DEFAULT_GAME_DATA } from "@/data/constants";

export const STORAGE_KEY = "stardew-valley-companion";

const defaultData: AppData = {
  playthroughs: [],
  activePlaythroughId: null,
};

export const storageService = {
  load(): AppData {
    if (typeof window === "undefined") return defaultData;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultData;

      return JSON.parse(stored) as AppData;
    } catch {
      return defaultData;
    }
  },

  save(data: AppData): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // The old code logged the error and went on.
    }
  },

  exportData(): string {
    const data = this.load();
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString) as AppData;

      if (!data.playthroughs || !Array.isArray(data.playthroughs)) {
        return {
          success: false,
          error: "Invalid data format: missing playthroughs array",
        };
      }

      this.save(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  },
};

export const loadAppData = (): AppData => {
  const loaded = storageService.load();
  return {
    ...loaded,
    playthroughs: loaded.playthroughs.map((p) => ({
      ...p,
      data: { ...DEFAULT_GAME_DATA, ...p.data },
    })),
  };
};

export type NewPlaythrough = Omit<
  Playthrough,
  "id" | "createdAt" | "lastModified" | "data"
> &
  Partial<Pick<Playthrough, "data">>;

export const addPlaythrough = (
  prev: AppData,
  playthrough: NewPlaythrough,
): AppData => {
  const now = new Date().toISOString();
  const created: Playthrough = {
    ...playthrough,
    id: crypto.randomUUID(),
    createdAt: now,
    lastModified: now,
    data: playthrough.data ?? { ...DEFAULT_GAME_DATA },
  };
  return {
    playthroughs: [...prev.playthroughs, created],
    activePlaythroughId:
      prev.playthroughs.length === 0 ? created.id : prev.activePlaythroughId,
  };
};

export const updatePlaythrough = (
  prev: AppData,
  id: string,
  updates: Partial<Playthrough>,
): AppData => ({
  ...prev,
  playthroughs: prev.playthroughs.map((p) =>
    p.id === id
      ? { ...p, ...updates, lastModified: new Date().toISOString() }
      : p,
  ),
});

export const deletePlaythrough = (prev: AppData, id: string): AppData => {
  const playthroughs = prev.playthroughs.filter((p) => p.id !== id);
  return {
    playthroughs,
    activePlaythroughId:
      prev.activePlaythroughId === id
        ? playthroughs[0]?.id || null
        : prev.activePlaythroughId,
  };
};

export const setActivePlaythrough = (
  prev: AppData,
  id: string | null,
): AppData => ({ ...prev, activePlaythroughId: id });
