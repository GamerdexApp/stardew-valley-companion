import type { AppData } from "@/types/app";
import { EMPTY_APP_DATA, withDefaults } from "./appData";

export const STORAGE_KEY = "stardew-valley-companion";

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedData: AppData = EMPTY_APP_DATA;

const notifyListeners = () => listeners.forEach((listener) => listener());

const parseStored = (raw: string | null): AppData => {
  if (raw === null) return EMPTY_APP_DATA;
  const parsed = JSON.parse(raw) as AppData;
  return Array.isArray(parsed?.playthroughs)
    ? withDefaults(parsed)
    : EMPTY_APP_DATA;
};

export const storageService = {
  /**
   * Returns the same object until the stored text changes, as `useSyncExternalStore` requires.
   * Fields missing from an old save are filled with defaults in memory. Nothing is written back
   * until the player changes something.
   */
  load(): AppData {
    if (typeof window === "undefined") return EMPTY_APP_DATA;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === cachedRaw) return cachedData;

      cachedData = parseStored(raw);
      cachedRaw = raw;
      return cachedData;
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      return EMPTY_APP_DATA;
    }
  },

  loadOnServer(): AppData {
    return EMPTY_APP_DATA;
  },

  save(data: AppData): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      notifyListeners();
      return true;
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
      return false;
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    notifyListeners();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },
};
