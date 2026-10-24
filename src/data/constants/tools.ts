import type { LevelMeta, ToolLevels } from "@/types";

export const TOOL_ENTRIES: Array<{
  key: Exclude<keyof ToolLevels, "currentlyUpgrading">;
  id: string;
}> = [
  { key: "axe", id: "axe" },
  { key: "pickaxe", id: "pickaxe" },
  { key: "hoe", id: "hoe" },
  { key: "wateringCan", id: "watering-can" },
  { key: "pan", id: "pan" },
  { key: "trashCan", id: "trash-can" },
];

export const PAN_LEVEL_OFFSET = 1;

export const LEVEL_NAMES = ["Basic", "Copper", "Steel", "Gold", "Iridium"];
