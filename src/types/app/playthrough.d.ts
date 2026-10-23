import type { Platform } from "@/data/constants/platforms";
import type { GameData } from "./game";

export type { Platform };

export interface Playthrough {
  id: string;
  name: string;
  description?: string;
  platform?: Platform;
  createdAt: string; // ISO 8601
  lastModified: string; // ISO 8601
  data: GameData;
}

export type Theme = "light" | "dark" | "system";

export type UiSettings = Record<string, unknown>;

export interface Settings {
  theme?: Theme;
  ui?: UiSettings;
}

export interface AppData {
  playthroughs: Playthrough[];
  activePlaythroughId: string | null;
  settings?: Settings;
}
