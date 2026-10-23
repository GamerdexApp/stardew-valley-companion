import type { AppData, Playthrough, Settings, TrackedGift } from "@/types/app";
import type { NewPlaythrough } from "@/service/appData";
import type { ImportMode } from "@/service/backup";

export interface PlaythroughContextType {
  appData: AppData;
  playthroughs: Playthrough[];
  activePlaythrough: Playthrough | null;
  isManualPlaythrough: boolean;
  settings: Settings;
  isLoaded: boolean;
  lastSavedAt: Date | null;
  saveFailed: boolean;
  /**
   * Saves the result of `update`. Returns the data from before the change, so the caller can offer
   * Undo with `updateData(() => previous)`. Returns null when the browser refused the write.
   */
  updateData: (update: (current: AppData) => AppData) => AppData | null;
  setActivePlaythrough: (id: string | null) => void;
  addPlaythrough: (playthrough: NewPlaythrough) => void;
  updatePlaythrough: (id: string, updates: Partial<Playthrough>) => void;
  deletePlaythrough: (id: string) => AppData | null;
  updateSettings: (updates: Settings) => void;
  importData: (
    jsonString: string,
    mode?: ImportMode,
  ) => { success: boolean; error?: string };
  exportData: () => string;
  clearAllData: () => void;
  addTrackedGift: (gift: TrackedGift) => void;
  removeTrackedGift: (itemName: string, villagerName: string) => void;
}

export interface UIContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}
