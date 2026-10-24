import { tools as queryTools } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import type { ToolKey } from "./character";

/** The tools in the order of the board. The pan is level 0 for copper, and -1 for no pan. */
export type ToolEntryId =
  | "axe"
  | "pickaxe"
  | "hoe"
  | "watering-can"
  | "pan"
  | "trash-can"
  | "fishing-rod"
  | "backpack";

export interface ToolOption {
  value: number;
  label: string;
}

/** What a level of a rod or a backpack offers, shown as chips in the panel. */
export interface ToolFacts {
  bait?: boolean;
  tackleSlots?: number;
  fishingLevel?: number;
  enchantable?: boolean;
  slots?: number;
}

export type RowState = "current" | "owned" | "locked";

export interface ToolRow {
  name: string;
  image: string | null;
  description: string;
  state: RowState;
  /** The gold price, or null when the level has none. */
  cost: number | null;
  material: { quantity: number; name: string } | null;
  /** A level with no price says how to get it, or that it is the starter. */
  obtain: string | null;
  facts: ToolFacts;
}

export interface ToolEntry {
  id: ToolEntryId;
  name: string;
  options: ToolOption[];
  /** What the picture shows for each level. */
  imageOf: (value: number) => string | null;
  value: (data: GameData) => number;
  set: (data: GameData, value: number) => GameData;
  rows: (current: number) => ToolRow[];
  canEnchant: boolean;
  /** The saved key the Upgrading tag compares with. */
  upgradeKey: ToolKey | null;
}

const UPGRADE_LEVEL_NAMES = ["Basic", "Copper", "Steel", "Gold", "Iridium"];
const PAN_LEVEL_NAMES = ["Copper", "Steel", "Gold", "Iridium"];
export const BACKPACK_SLOTS = [12, 24, 36];
const BACKPACK_NAMES = ["Basic Backpack", "Large Pack", "Deluxe Pack"];

const stateOf = (index: number, current: number): RowState =>
  index === current ? "current" : index < current ? "owned" : "locked";

const query = queryTools();

const upgradeable = (
  id: Exclude<ToolEntryId, "fishing-rod" | "backpack">,
  key: ToolKey,
): ToolEntry => {
  const tool = query.find(id);
  if (!tool || tool.type !== "upgradeable")
    throw new Error(`Missing tool ${id}`);
  const names = id === "pan" ? PAN_LEVEL_NAMES : UPGRADE_LEVEL_NAMES;
  const options = names.map((label, value) => ({ value, label }));
  return {
    id,
    name: tool.name,
    options:
      id === "pan" ? [{ value: -1, label: "None" }, ...options] : options,
    imageOf: (value) => tool.levels[Math.max(0, value)]?.image ?? null,
    value: (data) => data.toolLevels[key],
    set: (data, value) => ({
      ...data,
      toolLevels: { ...data.toolLevels, [key]: value },
    }),
    rows: (current) =>
      tool.levels.map((level, index) => ({
        name: names[index],
        image: level.image ?? null,
        description: level.description,
        state: stateOf(index, current),
        cost: level.upgradeCost,
        material: level.materialName
          ? { quantity: level.materialQuantity ?? 1, name: level.materialName }
          : null,
        obtain: null,
        facts: {},
      })),
    canEnchant: tool.canEnchant,
    upgradeKey: key,
  };
};

const rod = query
  .fishingRods()
  .get()
  .flatMap((tool) => (tool.type === "fishing-rod" ? [tool] : []))[0];

const fishingRod: ToolEntry = {
  id: "fishing-rod",
  name: "Fishing Rod",
  options: [
    { value: -1, label: "None" },
    ...rod.levels.map((level, value) => ({ value, label: level.name })),
  ],
  imageOf: (value) => rod.levels[Math.max(0, value)]?.image ?? null,
  value: (data) => data.toolLevels.fishingRod,
  set: (data, value) => ({
    ...data,
    toolLevels: { ...data.toolLevels, fishingRod: value },
  }),
  rows: (current) =>
    rod.levels.map((level, index) => ({
      name: level.name,
      image: level.image,
      description: level.description,
      state: stateOf(index, current),
      cost: level.cost,
      material: null,
      obtain: level.cost === null ? level.obtain : null,
      facts: {
        bait: level.bait,
        tackleSlots: level.tackleSlots,
        fishingLevel: level.fishingLevelRequired ?? undefined,
        enchantable: level.canEnchant,
      },
    })),
  canEnchant: false,
  upgradeKey: "fishingRod",
};

const backpacks = query
  .backpacks()
  .get()
  .flatMap((tool) => (tool.type === "backpack" ? [tool] : []));

const backpack: ToolEntry = {
  id: "backpack",
  name: "Backpack",
  options: BACKPACK_SLOTS.map((value, index) => ({
    value,
    label: BACKPACK_NAMES[index],
  })),
  imageOf: (value) =>
    backpacks.find((pack) => pack.slots === value)?.image ?? backpacks[0].image,
  value: (data) => data.character.maxItems,
  set: (data, value) => ({
    ...data,
    character: { ...data.character, maxItems: value },
  }),
  rows: (current) =>
    BACKPACK_SLOTS.map((slots, index) => {
      const pack = backpacks.find((item) => item.slots === slots);
      return {
        name: BACKPACK_NAMES[index],
        image: pack?.image ?? null,
        description:
          pack?.description ?? "Your starting inventory of 12 slots.",
        state: stateOf(slots, current),
        cost: pack?.cost ?? null,
        material: null,
        obtain: pack ? null : "starter",
        facts: { slots },
      };
    }),
  canEnchant: false,
  upgradeKey: null,
};

export const toolEntries: ToolEntry[] = [
  upgradeable("axe", "axe"),
  upgradeable("pickaxe", "pickaxe"),
  upgradeable("hoe", "hoe"),
  upgradeable("watering-can", "wateringCan"),
  upgradeable("pan", "pan"),
  upgradeable("trash-can", "trashCan"),
  fishingRod,
  backpack,
];

/** The level name for the value, or None when the value is below the first level. */
export const levelLabel = (entry: ToolEntry, value: number): string =>
  entry.options.find((option) => option.value === value)?.label ??
  entry.options[0].label;

/** How many dots a level shows out of the total, for the five dot row. */
export const levelDots = (
  entry: ToolEntry,
  value: number,
): { filled: number; total: number } => {
  const levels = entry.options.filter((option) => option.value >= 0);
  const index = entry.id === "backpack" ? BACKPACK_SLOTS.indexOf(value) : value;
  return { filled: Math.max(0, index + 1), total: levels.length };
};

export const isUpgrading = (data: GameData, entry: ToolEntry): boolean =>
  entry.upgradeKey !== null &&
  data.toolLevels.currentlyUpgrading === entry.upgradeKey;
