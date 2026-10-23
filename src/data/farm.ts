export type FarmTabId = "character" | "animals" | "buildings" | "ginger-island";

export const FARM_TAB_IDS: FarmTabId[] = [
  "character",
  "animals",
  "buildings",
  "ginger-island",
];

export const DEFAULT_FARM_TAB: FarmTabId = "character";

/** Tabs that are rebuilt. The others show a note and a link to their old page. */
export const REBUILT_FARM_TABS: FarmTabId[] = ["character"];
