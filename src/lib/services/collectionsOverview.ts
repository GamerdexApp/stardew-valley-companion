import { collections } from "stardew-valley-data";
import type { CollectionItem } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import type { CollectionTabId } from "@/data/collections";

export type OverviewSectionId =
  "shipped" | "fish" | "artifacts" | "minerals" | "cooking" | "crafting";

export interface OverviewTile {
  id: string;
  name: string;
  image: string;
  complete: boolean;
}

export interface OverviewSection {
  id: OverviewSectionId;
  /** The tab that lists and edits these items. */
  tab: CollectionTabId;
  tiles: OverviewTile[];
  done: number;
  total: number;
  isComplete: boolean;
}

interface SectionDefinition {
  id: OverviewSectionId;
  tab: CollectionTabId;
  items: CollectionItem[];
  isDone: (item: CollectionItem, data: GameData) => boolean;
}

const collection = collections();

const definitions: SectionDefinition[] = [
  {
    id: "shipped",
    tab: "crops",
    items: collection.itemsShipped().get(),
    isDone: (item, data) => data.shipped[item.id]?.shipped === true,
  },
  {
    id: "fish",
    tab: "fish",
    items: collection.fish().get(),
    isDone: (item, data) => data.fishCaught.some((fish) => fish.id === item.id),
  },
  {
    id: "artifacts",
    tab: "artifacts",
    items: collection.artifacts().get(),
    isDone: (item, data) => data.artifacts[item.id]?.found === true,
  },
  {
    id: "minerals",
    tab: "minerals",
    items: collection.minerals().get(),
    isDone: (item, data) => data.minerals[item.id]?.found === true,
  },
  {
    id: "cooking",
    tab: "cooking",
    items: collection.cooking().get(),
    isDone: (item, data) => data.cookingRecipes[item.name]?.cooked === true,
  },
  {
    id: "crafting",
    tab: "crafting",
    items: collection.crafting().get(),
    isDone: (item, data) => data.craftingRecipes[item.name]?.crafted === true,
  },
];

export function overviewSections(data: GameData): OverviewSection[] {
  return definitions.map(({ id, tab, items, isDone }) => {
    const tiles = items.map((item) => ({
      id: item.id,
      name: item.name,
      image: item.image,
      complete: isDone(item, data),
    }));
    const done = tiles.filter((tile) => tile.complete).length;
    return {
      id,
      tab,
      tiles,
      done,
      total: tiles.length,
      isComplete: done === tiles.length,
    };
  });
}

export const countCompleteSections = (sections: OverviewSection[]): number =>
  sections.filter((section) => section.isComplete).length;
