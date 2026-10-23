import { monsterLoot as queryMonsterLoot } from "stardew-valley-data";
import type { MonsterLoot } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { shippingCollectionIds } from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { isShipped } from "./shipped";

export const allLoot: MonsterLoot[] = queryMonsterLoot().get();

/** The game does not count the Dragon Tooth as shipped. */
export const isShippableLoot = (loot: MonsterLoot): boolean =>
  shippingCollectionIds.has(loot.id);

export type LootShippedFilter =
  "all" | "shipped" | "not-shipped" | "not-shippable";

export interface LootFilters {
  query: string;
  shipped: LootShippedFilter;
}

export const emptyLootFilters: LootFilters = { query: "", shipped: "all" };

export const isFilteringLoot = (filters: LootFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyLootFilters);

/** Not shipped lists only the items that can still be shipped. Not shippable lists the rest. */
export const filterLoot = (
  data: GameData,
  filters: LootFilters,
): MonsterLoot[] => {
  const needle = filters.query.trim().toLowerCase();
  return allLoot.filter((loot) => {
    const shippable = isShippableLoot(loot);
    const shipped = shippable && isShipped(data, loot.id);
    return (
      (loot.name.toLowerCase().includes(needle) ||
        loot.droppedBy.some((monster) =>
          monster.toLowerCase().includes(needle),
        )) &&
      (filters.shipped === "all" ||
        (filters.shipped === "shipped" && shipped) ||
        (filters.shipped === "not-shipped" && shippable && !shipped) ||
        (filters.shipped === "not-shippable" && !shippable))
    );
  });
};

export const countMonsterLootShipped = (data: GameData): ProgressCount => {
  const shippable = allLoot.filter(isShippableLoot);
  return {
    current: shippable.filter((loot) => isShipped(data, loot.id)).length,
    total: shippable.length,
  };
};
