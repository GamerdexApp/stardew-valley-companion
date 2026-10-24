import { parseSaveFile, bundles as queryBundles } from "stardew-valley-data";
import type { GoldBundle, ItemBundle, SaveData } from "stardew-valley-data";
import type { Platform } from "@/types/app";
import { isItemOrGoldBundle } from "@/lib/utils/bundleHelpers";
import { mapSaveDataToGameData } from "@/lib/utils/saveFileMapper";
import { DEFAULT_GAME_DATA } from "@/data/constants";
import { CC_ROOMS } from "@/data/constants/bundles";
import { FARM_TYPE_LABELS } from "@/data/constants/farms";
import type { NewPlaythrough } from "./appData";

export type WizardPath = "upload" | "build";
export type BundlePath = "cc" | "joja";
type CatalogBundle = ItemBundle | GoldBundle;

export const UPLOAD_STEPS = ["Choose path", "Upload file", "Review"] as const;
export const BUILD_STEPS = [
  "Choose path",
  "Character",
  "Bundles",
  "Review",
] as const;

export const PARSE_FAILED_MESSAGE =
  "Failed to parse save file. Please make sure you selected the full save file (not SaveGameInfo).";

export interface BuildForm {
  name: string;
  farmName: string;
  characterName: string;
  farmType: number;
  platform: Platform | "";
}

export type CompleteBuildForm = BuildForm & { platform: Platform };

export interface BundleConfig {
  path: BundlePath | null;
  isRemix: boolean;
  activeBundles: string[];
  /** Item indexes the player marked as handed in, per bundle id. */
  selectedItems: Record<string, string[]>;
}

export interface ReviewSection {
  title: string;
  rows: { label: string; value: string | number }[];
}

export const emptyBuildForm = (): BuildForm => ({
  name: "",
  farmName: "",
  characterName: "",
  farmType: 0,
  platform: "",
});

export const emptyBundleConfig = (): BundleConfig => ({
  path: null,
  isRemix: false,
  activeBundles: [],
  selectedItems: {},
});

const standardBundles: CatalogBundle[] = queryBundles()
  .standard()
  .sortByRoomAndBundleGroup()
  .get()
  .filter(isItemOrGoldBundle);

const remixBundles: CatalogBundle[] = queryBundles()
  .sortByRoomAndBundleGroup()
  .get()
  .filter(isItemOrGoldBundle)
  .filter((bundle) => bundle.room !== "abandoned-joja-mart");

const standardIds = standardBundles.map((bundle) => bundle.id);

const standardCountByRoom = standardBundles.reduce<Record<string, number>>(
  (counts, bundle) => ({
    ...counts,
    [bundle.room]: (counts[bundle.room] ?? 0) + 1,
  }),
  {},
);

export interface RoomBundles {
  room: string;
  bundles: CatalogBundle[];
  /** How many bundles the room holds in the standard game. A remix room holds the same number. */
  slots: number;
}

export const roomsFor = (isRemix: boolean): RoomBundles[] => {
  const source = isRemix ? remixBundles : standardBundles;
  return CC_ROOMS.map((room) => ({
    room,
    bundles: source.filter((bundle) => bundle.room === room),
    slots: standardCountByRoom[room] ?? 0,
  })).filter(({ bundles }) => bundles.length > 0);
};

export const isRoomFull = (config: BundleConfig, room: RoomBundles): boolean =>
  activeCountInRoom(config, room) >= room.slots;

export const activeCountInRoom = (
  config: BundleConfig,
  room: RoomBundles,
): number => {
  const ids = new Set(room.bundles.map((bundle) => bundle.id));
  return config.activeBundles.filter((id) => ids.has(id)).length;
};

/** Switching the path keeps the picks, so the player can compare both before saving. */
export const chooseBundlePath = (
  config: BundleConfig,
  path: BundlePath,
): BundleConfig => ({
  ...config,
  path,
  activeBundles:
    path === "cc" && config.activeBundles.length === 0 && !config.isRemix
      ? standardIds
      : config.activeBundles,
});

export const setRemix = (
  config: BundleConfig,
  isRemix: boolean,
): BundleConfig => ({
  ...config,
  isRemix,
  activeBundles: isRemix ? [] : standardIds,
  selectedItems: {},
});

export const toggleBundle = (
  config: BundleConfig,
  bundleId: string,
): BundleConfig => {
  if (config.activeBundles.includes(bundleId)) {
    const { [bundleId]: _removed, ...selectedItems } = config.selectedItems;
    return {
      ...config,
      activeBundles: config.activeBundles.filter((id) => id !== bundleId),
      selectedItems,
    };
  }
  return { ...config, activeBundles: [...config.activeBundles, bundleId] };
};

export const toggleItem = (
  config: BundleConfig,
  bundleId: string,
  itemIndex: string,
  itemsRequired: number,
): BundleConfig => {
  const current = config.selectedItems[bundleId] ?? [];
  if (!current.includes(itemIndex) && current.length >= itemsRequired) {
    return config;
  }
  const next = current.includes(itemIndex)
    ? current.filter((index) => index !== itemIndex)
    : [...current, itemIndex];
  return {
    ...config,
    selectedItems: { ...config.selectedItems, [bundleId]: next },
  };
};

export const canContinueFromBundles = (config: BundleConfig): boolean =>
  config.path === "joja" ||
  (config.path === "cc" && config.activeBundles.length > 0);

export const isBuildFormComplete = (
  form: BuildForm,
): form is CompleteBuildForm =>
  form.name.trim() !== "" &&
  form.farmName.trim() !== "" &&
  form.platform !== "";

/**
 * The bundles field in the shape the save file mapper writes: every item index of an active
 * bundle, true for an item handed in. A gold bundle has one entry.
 */
export const bundlesData = (
  config: BundleConfig,
): Record<string, Record<string, boolean>> => {
  if (config.path !== "cc") return {};
  const catalog = new Map(
    [...standardBundles, ...remixBundles].map((bundle) => [bundle.id, bundle]),
  );
  return Object.fromEntries(
    config.activeBundles.flatMap((id) => {
      const bundle = catalog.get(id);
      if (!bundle) return [];
      const count = bundle.type === "items" ? bundle.items.length : 1;
      const picked = new Set(config.selectedItems[id] ?? []);
      return [
        [
          id,
          Object.fromEntries(
            Array.from({ length: count }, (_, index) => [
              String(index),
              picked.has(String(index)),
            ]),
          ),
        ],
      ];
    }),
  );
};

export const buildPlaythrough = (
  form: CompleteBuildForm,
  config: BundleConfig,
): NewPlaythrough => {
  const usesCommunityCenter = config.path === "cc";
  return {
    name: form.name.trim(),
    platform: form.platform,
    data: {
      ...DEFAULT_GAME_DATA,
      character: {
        ...DEFAULT_GAME_DATA.character,
        name: form.characterName.trim(),
        farmName: form.farmName.trim(),
        farmType: form.farmType,
      },
      bundles: bundlesData(config),
      joja: { ...DEFAULT_GAME_DATA.joja, isMember: config.path === "joja" },
      communityCenter: {
        ...DEFAULT_GAME_DATA.communityCenter,
        unlocked: usesCommunityCenter,
        bundlesActive: usesCommunityCenter,
      },
    },
  };
};

export const defaultUploadName = (save: SaveData): string =>
  `${save.player.farmName} Farm`;

export const playthroughFromSave = (
  save: SaveData,
  name: string,
  description: string,
): NewPlaythrough => ({
  name: name.trim(),
  description: description.trim() || undefined,
  platform: "PC",
  data: mapSaveDataToGameData(save),
});

export type ParsedSave =
  { ok: true; save: SaveData } | { ok: false; error: string };

export const parseSave = (xml: string): ParsedSave => {
  try {
    return { ok: true, save: parseSaveFile(xml) };
  } catch {
    return { ok: false, error: PARSE_FAILED_MESSAGE };
  }
};

const grouped = (amount: number) => `${amount.toLocaleString("en-US")}g`;

export const summarizeSave = (save: SaveData): ReviewSection[] => {
  const { player, farm, date, bundles } = save;
  const sections: ReviewSection[] = [
    {
      title: "Character",
      rows: [
        { label: "Name", value: player.name },
        { label: "Farm", value: `${player.farmName} Farm` },
        {
          label: "Farm type",
          value: FARM_TYPE_LABELS[farm.type] ?? `Type ${farm.type}`,
        },
        { label: "Gender", value: player.gender },
      ],
    },
    {
      title: "Progress",
      rows: [
        {
          label: "Date",
          value: `${date.season} ${date.day}, Year ${date.year}`,
        },
        { label: "Money", value: grouped(player.money) },
        { label: "Total earned", value: grouped(player.totalMoneyEarned) },
      ],
    },
    {
      title: "Skills",
      rows: [
        { label: "Farming", value: `Level ${player.skills.farming.level}` },
        { label: "Fishing", value: `Level ${player.skills.fishing.level}` },
        { label: "Foraging", value: `Level ${player.skills.foraging.level}` },
        { label: "Mining", value: `Level ${player.skills.mining.level}` },
        { label: "Combat", value: `Level ${player.skills.combat.level}` },
      ],
    },
    {
      title: "Collections",
      rows: [
        { label: "Fish caught", value: save.fishCaught.length },
        { label: "Items shipped", value: save.itemsShipped.length },
        { label: "Cooking recipes", value: save.cookingRecipes.length },
        { label: "Crafting recipes", value: save.craftingRecipes.length },
        { label: "Museum donations", value: save.museum.donations.length },
      ],
    },
    {
      title: "Bundles",
      rows: [
        {
          label: "Path",
          value: bundles.isJojaRoute ? "Joja Warehouse" : "Community Center",
        },
        ...(bundles.isJojaRoute
          ? []
          : [
              {
                label: "Rooms complete",
                value: `${bundles.rooms.filter((room) => room.complete).length} / ${bundles.rooms.length}`,
              },
              {
                label: "CC complete",
                value: bundles.isCCComplete ? "Yes" : "No",
              },
            ]),
      ],
    },
  ];
  return sections;
};

export const summarizeBuild = (
  form: CompleteBuildForm,
  config: BundleConfig,
): ReviewSection[] => [
  {
    title: "Character",
    rows: [
      { label: "Playthrough name", value: form.name.trim() },
      { label: "Farm name", value: form.farmName.trim() },
      ...(form.characterName.trim()
        ? [{ label: "Character name", value: form.characterName.trim() }]
        : []),
      {
        label: "Farm type",
        value: FARM_TYPE_LABELS[form.farmType] ?? "Standard",
      },
    ],
  },
  {
    title: "Bundles",
    rows: [
      {
        label: "Path",
        value: config.path === "joja" ? "Joja Warehouse" : "Community Center",
      },
      ...(config.path === "cc"
        ? [
            {
              label: "Bundle type",
              value: config.isRemix ? "Remix" : "Standard",
            },
            { label: "Active bundles", value: config.activeBundles.length },
          ]
        : []),
    ],
  },
];
