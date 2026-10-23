import {
  forageables as queryForageables,
  trees as queryTrees,
} from "stardew-valley-data";
import type {
  ArtisanUses,
  FruitTree,
  KnowledgeBonus,
  ProfessionBonus,
  Tree,
  WildTree,
} from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { shippingCollectionIds } from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { isShipped } from "./shipped";

export type ForageKind = "forageable" | "fruit-tree" | "tapper";
export type ForageQuality = "iridium" | "gold" | "silver" | "base";

export interface ForageItem {
  id: string;
  name: string;
  kind: ForageKind;
  image: string;
  /** A tapper good has no season. */
  seasons: string[];
  /** Where a forageable is found, or the tree that gives the item. */
  place: string;
  sellPrice: number;
  profession: ProfessionBonus[];
  knowledge: KnowledgeBonus[];
  maxQuality: ForageQuality;
  energyHealth: { energy?: number; health?: number; poison?: boolean } | null;
  artisanUses: ArtisanUses | null;
}

export const allTrees: Tree[] = queryTrees().get();
export const fruitTrees = allTrees.filter(
  (tree): tree is FruitTree => tree.type === "fruit-tree",
);
export const wildTrees = allTrees.filter(
  (tree): tree is WildTree => tree.type === "wild-tree",
);

const forageables: ForageItem[] = queryForageables()
  .sortByName()
  .get()
  .map((item) => ({
    id: item.id,
    name: item.name,
    kind: "forageable",
    image: item.image,
    seasons: item.seasons,
    place: item.locations,
    sellPrice: item.sellPrice,
    profession: item.profession,
    knowledge: item.knowledge,
    maxQuality: item.maxQuality,
    energyHealth: item.energyHealth ?? null,
    artisanUses: item.artisanUses,
  }));

const forageableIds = new Set(forageables.map((item) => item.id));

const fruitProduce: ForageItem[] = fruitTrees.map((tree) => ({
  id: tree.produce.id,
  name: tree.produce.name,
  kind: "fruit-tree",
  image: tree.produce.image,
  seasons: tree.seasons,
  place: tree.name,
  sellPrice: tree.produce.sellPrice,
  profession: tree.produce.profession,
  knowledge: [],
  maxQuality: "iridium",
  energyHealth: tree.produce.energyHealth ?? null,
  artisanUses: tree.produce.artisanUses ?? null,
}));

const tapperGoods: ForageItem[] = wildTrees.flatMap((tree) =>
  tree.tapper
    ? [
        {
          id: tree.tapper.id,
          name: tree.tapper.name,
          kind: "tapper" as const,
          image: tree.tapper.image,
          seasons: [],
          place: tree.name,
          sellPrice: tree.tapper.sellPrice,
          profession: tree.tapper.profession,
          knowledge: [],
          maxQuality: "base" as const,
          energyHealth: null,
          artisanUses: null,
        },
      ]
    : [],
);

/**
 * Every item the tab lists once: the forageables, then the fruit tree produce and the tapper
 * goods that are not already a forageable.
 */
export const allForageItems: ForageItem[] = [
  ...forageables,
  ...fruitProduce.filter((item) => !forageableIds.has(item.id)),
  ...tapperGoods.filter((item) => !forageableIds.has(item.id)),
];

export const isShippableItem = (id: string): boolean =>
  shippingCollectionIds.has(id);

export type ForageSeason = "all" | "spring" | "summer" | "fall" | "winter";
export type ForageShippedFilter = "all" | "shipped" | "not-shipped" | "other";

export interface ForageFilters {
  query: string;
  season: ForageSeason;
  shipped: ForageShippedFilter;
}

export const emptyForageFilters: ForageFilters = {
  query: "",
  season: "all",
  shipped: "all",
};

export const isFilteringForage = (filters: ForageFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyForageFilters);

/**
 * Season filters forageables and fruit tree produce. A tapper good has no season, so the season
 * filter keeps it. Other means an item that cannot be shipped, such as Wood. The search matches
 * the name and the place.
 */
export const filterForageItems = (
  data: GameData,
  filters: ForageFilters,
): ForageItem[] => {
  const needle = filters.query.trim().toLowerCase();
  return allForageItems.filter((item) => {
    const shippable = isShippableItem(item.id);
    const shipped = shippable && isShipped(data, item.id);
    return (
      (item.name.toLowerCase().includes(needle) ||
        item.place.toLowerCase().includes(needle)) &&
      (filters.season === "all" ||
        item.kind === "tapper" ||
        item.seasons.includes(filters.season)) &&
      (filters.shipped === "all" ||
        (filters.shipped === "shipped" && shipped) ||
        (filters.shipped === "not-shipped" && shippable && !shipped) ||
        (filters.shipped === "other" && !shippable))
    );
  });
};

export interface ForageSummary {
  items: number;
  shipped: ProgressCount;
  trees: number;
  fruitTrees: number;
  wildTrees: number;
  seasons: { season: Exclude<ForageSeason, "all">; count: number }[];
}

const SEASONS: Exclude<ForageSeason, "all">[] = [
  "spring",
  "summer",
  "fall",
  "winter",
];

export const countForageablesShipped = (data: GameData): ProgressCount => {
  const shippable = allForageItems.filter((item) => isShippableItem(item.id));
  return {
    current: shippable.filter((item) => isShipped(data, item.id)).length,
    total: shippable.length,
  };
};

export const forageSummary = (data: GameData): ForageSummary => ({
  items: allForageItems.length,
  shipped: countForageablesShipped(data),
  trees: allTrees.length,
  fruitTrees: fruitTrees.length,
  wildTrees: wildTrees.length,
  seasons: SEASONS.map((season) => ({
    season,
    count: allForageItems.filter((item) => item.seasons.includes(season))
      .length,
  })),
});

export type TreeTypeFilter = "all" | "fruit-tree" | "wild-tree";

export interface TreeFilters {
  query: string;
  type: TreeTypeFilter;
}

export const emptyTreeFilters: TreeFilters = { query: "", type: "all" };

export const isFilteringTrees = (filters: TreeFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyTreeFilters);

/** The search matches the name of the tree and the name of what it gives. */
export const filterTrees = (filters: TreeFilters): Tree[] => {
  const needle = filters.query.trim().toLowerCase();
  return allTrees.filter((tree) => {
    const gives =
      tree.type === "fruit-tree"
        ? tree.produce.name
        : (tree.tapper?.name ?? "");
    return (
      (filters.type === "all" || tree.type === filters.type) &&
      (tree.name.toLowerCase().includes(needle) ||
        gives.toLowerCase().includes(needle))
    );
  });
};

export interface TreeProduce {
  id: string;
  name: string;
  sellPrice: number;
  profession: ProfessionBonus[];
  maxQuality: ForageQuality;
  energyHealth: { energy?: number; health?: number; poison?: boolean } | null;
  artisanUses: ArtisanUses | null;
}

/** What a tree gives: the fruit of a fruit tree or the tapper good of a wild tree. */
export const treeProduce = (tree: Tree): TreeProduce | null => {
  if (tree.type === "fruit-tree") {
    return {
      id: tree.produce.id,
      name: tree.produce.name,
      sellPrice: tree.produce.sellPrice,
      profession: tree.produce.profession,
      maxQuality: "iridium",
      energyHealth: tree.produce.energyHealth ?? null,
      artisanUses: tree.produce.artisanUses ?? null,
    };
  }
  return tree.tapper
    ? {
        id: tree.tapper.id,
        name: tree.tapper.name,
        sellPrice: tree.tapper.sellPrice,
        profession: tree.tapper.profession,
        maxQuality: "base",
        energyHealth: null,
        artisanUses: null,
      }
    : null;
};
