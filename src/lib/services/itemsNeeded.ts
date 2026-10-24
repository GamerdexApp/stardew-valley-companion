import { universalGifts } from "stardew-valley-data";
import type { GameData, TrackedGift } from "@/types/app";
import { assetPath } from "@/lib/utils/assetPath";
import { DEFAULT_GAME_DATA } from "@/data/constants";
import {
  ITEM_IMAGE_MAP,
  ITEMS_NEEDED_DATA,
} from "@/data/constants/itemsNeeded";
import { chooseRoute, neededBundleItems } from "./communityCenter";
import { allVillagers, trackGift, untrackGift } from "./villagers";

export type NeededTag =
  "Donate" | "Ship" | "Cook" | "Craft" | "Build" | "Bundle" | "Gift";

export const NEEDED_TAGS: NeededTag[] = [
  "Donate",
  "Ship",
  "Cook",
  "Craft",
  "Build",
  "Bundle",
  "Gift",
];

export type TagFilter = "all" | NeededTag;
export type GiftPreference = NonNullable<TrackedGift["preference"]>;

export interface NeededItemUsage {
  goalName: string;
  tag: NeededTag;
  quantity?: number;
  preference?: GiftPreference;
  /** The villager of a tracked gift, as saved. */
  villager?: string;
}

export interface NeededItem {
  id: string;
  name: string;
  image: string | null;
  usages: NeededItemUsage[];
}

/** Without a playthrough the page lists everything from scratch, on the Community Center route. */
export const SCRATCH_DATA: GameData = chooseRoute(
  DEFAULT_GAME_DATA,
  "community-center",
);

/** A gift tracked for no one in particular is saved under this name. */
export const ANY_VILLAGER = "Universal";

const resolveImage = (name: string): string | null => {
  const raw = ITEM_IMAGE_MAP.get(name);
  return raw ? assetPath(raw) : null;
};

export const buildNeededItems = (data: GameData): NeededItem[] => {
  const items = new Map<string, NeededItem>();
  const upsert = (
    key: string,
    name: string,
    image: string | null,
    usage: NeededItemUsage,
  ) => {
    const existing = items.get(key);
    if (existing) existing.usages.push(usage);
    else items.set(key, { id: key, name, image, usages: [usage] });
  };

  for (const mineral of ITEMS_NEEDED_DATA.mineralItems) {
    if (data.minerals[mineral.id]?.donated) continue;
    upsert(`mineral-${mineral.id}`, mineral.name, assetPath(mineral.image), {
      goalName: "Museum Donation",
      tag: "Donate",
    });
  }
  for (const artifact of ITEMS_NEEDED_DATA.artifacts) {
    if (data.artifacts[artifact.id]?.donated) continue;
    upsert(
      `artifact-${artifact.id}`,
      artifact.name,
      assetPath(artifact.image),
      {
        goalName: "Museum Donation",
        tag: "Donate",
      },
    );
  }
  for (const item of ITEMS_NEEDED_DATA.shippableItems) {
    if (data.shipped[item.id]?.shipped) continue;
    upsert(`ship-${item.id}`, item.name, assetPath(item.image), {
      goalName: "Shipping Collection",
      tag: "Ship",
    });
  }
  for (const dish of ITEMS_NEEDED_DATA.cookingDishes) {
    if (data.cookingRecipes[dish.name]?.cooked) continue;
    for (const ingredient of dish.ingredients) {
      upsert(
        `ing-${ingredient.name}`,
        ingredient.name,
        resolveImage(ingredient.name),
        {
          goalName: dish.name,
          tag: "Cook",
          quantity: ingredient.quantity,
        },
      );
    }
  }
  for (const recipe of ITEMS_NEEDED_DATA.craftingRecipes) {
    if (data.craftingRecipes[recipe.name]?.crafted) continue;
    for (const ingredient of recipe.ingredients) {
      upsert(
        `ing-${ingredient.name}`,
        ingredient.name,
        resolveImage(ingredient.name),
        {
          goalName: recipe.name,
          tag: "Craft",
          quantity: ingredient.quantity,
        },
      );
    }
  }
  for (const building of ITEMS_NEEDED_DATA.obelisks) {
    if (data.buildings.some((built) => built.type === building.name)) continue;
    for (const material of building.materials) {
      upsert(
        `ing-${material.item}`,
        material.item,
        resolveImage(material.item),
        {
          goalName: building.name,
          tag: "Build",
          quantity: material.quantity,
        },
      );
    }
  }
  for (const needed of neededBundleItems(data)) {
    upsert(`ing-${needed.name}`, needed.name, resolveImage(needed.name), {
      goalName: needed.bundle.name,
      tag: "Bundle",
      quantity: needed.quantity,
    });
  }

  return [...items.values()];
};

const preferenceOf = (gift: TrackedGift): GiftPreference => {
  if (gift.preference) return gift.preference;
  const villager = allVillagers.find((item) => item.name === gift.villagerName);
  return villager?.loves.includes(gift.itemName) ? "loves" : "likes";
};

/** A tracked gift that was not given yet. Marking it gifted takes it off the list. */
export const buildGiftItems = (data: GameData): NeededItem[] =>
  (data.trackedGifts ?? [])
    .filter((gift) => !gift.given)
    .map((gift) => {
      const image = resolveImage(gift.itemName);
      return {
        id: `gift-${gift.villagerName}-${gift.itemName}`,
        name: gift.itemName,
        image,
        usages: [
          {
            goalName: gift.villagerName,
            tag: "Gift",
            preference: preferenceOf(gift),
            villager: gift.villagerName,
          },
        ],
      };
    });

export const neededItems = (data: GameData): NeededItem[] => [
  ...buildNeededItems(data),
  ...buildGiftItems(data),
];

/** The quantity an item needs. Donating, shipping and gifting need one each and add nothing. */
export const totalQuantity = (item: NeededItem): number =>
  item.usages.reduce((sum, usage) => sum + (usage.quantity ?? 0), 0);

export const tagCounts = (items: NeededItem[]): Record<TagFilter, number> => {
  const counts = Object.fromEntries(
    NEEDED_TAGS.map((tag) => [tag, 0]),
  ) as Record<TagFilter, number>;
  counts.all = items.length;
  for (const item of items) {
    for (const tag of new Set(item.usages.map((usage) => usage.tag)))
      counts[tag]++;
  }
  return counts;
};

export interface NeededFilters {
  tag: TagFilter;
  query: string;
}

export const emptyNeededFilters: NeededFilters = { tag: "all", query: "" };

export const isFilteringNeeded = (filters: NeededFilters): boolean =>
  filters.tag !== "all" || filters.query !== "";

export const isTagFilter = (value: string | null): value is TagFilter =>
  value === "all" || NEEDED_TAGS.includes(value as NeededTag);

export const filterNeeded = (
  items: NeededItem[],
  filters: NeededFilters,
): NeededItem[] => {
  const needle = filters.query.trim().toLowerCase();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(needle) &&
      (filters.tag === "all" ||
        item.usages.some((usage) => usage.tag === filters.tag)),
  );
};

export const trackedCount = (data: GameData): number =>
  (data.trackedGifts ?? []).filter((gift) => !gift.given).length;

export const trackedGiftsOf = (data: GameData): TrackedGift[] =>
  (data.trackedGifts ?? []).filter((gift) => !gift.given);

export const villagerLabel = (villagerName: string): string =>
  villagerName === ANY_VILLAGER ? "Any villager" : villagerName;

const withGiven = (
  data: GameData,
  villagerName: string,
  itemName: string,
  given: boolean,
): GameData => ({
  ...data,
  trackedGifts: (data.trackedGifts ?? []).map((gift) =>
    gift.villagerName === villagerName && gift.itemName === itemName
      ? { ...gift, given }
      : gift,
  ),
});

export const markGifted = (
  data: GameData,
  villagerName: string,
  itemName: string,
): GameData => withGiven(data, villagerName, itemName, true);

export const unmarkGifted = (
  data: GameData,
  villagerName: string,
  itemName: string,
): GameData => withGiven(data, villagerName, itemName, false);

export { trackGift, untrackGift };

export const isTracked = (
  data: GameData,
  villagerName: string,
  itemName: string,
): boolean =>
  (data.trackedGifts ?? []).some(
    (gift) =>
      gift.villagerName === villagerName &&
      gift.itemName === itemName &&
      !gift.given,
  );

const universal = universalGifts();

export type UniversalTier = "loves" | "likes" | "neutral";

export const UNIVERSAL_TIERS: UniversalTier[] = ["loves", "likes", "neutral"];

const isItem = (name: string): boolean => !name.startsWith("All ");

/** The gifts every villager has for a tier. A category such as "All Fruit" is not an item. */
export const universalItems = (tier: UniversalTier): string[] =>
  (tier === "neutral" ? universal.neutrals : universal[tier]).filter(isItem);

export interface PickableGift {
  name: string;
  preference: GiftPreference;
}

/** The loved, liked and neutral gifts of a villager, in that order. */
export const villagerGifts = (villagerName: string): PickableGift[] => {
  const villager = allVillagers.find((item) => item.name === villagerName);
  if (!villager) return [];
  return [
    ...villager.loves
      .filter(isItem)
      .map((name) => ({ name, preference: "loves" as const })),
    ...villager.likes
      .filter(isItem)
      .map((name) => ({ name, preference: "likes" as const })),
    ...villager.neutrals
      .filter(isItem)
      .map((name) => ({ name, preference: "neutral" as const })),
  ];
};
