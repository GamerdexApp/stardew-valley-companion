import { animals, isFarmAnimal } from "stardew-valley-data";
import type { FarmAnimal, ProfessionBonus } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { shippingCollectionIds } from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { isShipped } from "./shipped";

export const allFarmAnimals: FarmAnimal[] = animals()
  .farmAnimals()
  .get()
  .filter(isFarmAnimal);

export interface Produce {
  id: string;
  name: string;
  image: string;
  sellPrice: number;
  profession: ProfessionBonus[];
  maxQuality: "iridium" | "gold" | "silver" | "base";
  /** A large egg or large milk, which a deluxe animal gives. */
  isDeluxe: boolean;
  /** The animals that give it, each with the building it lives in. */
  sources: { animal: string; building: string }[];
}

const gatherProduce = (): Produce[] => {
  const byId = new Map<string, Produce>();
  for (const animal of allFarmAnimals) {
    const gives = [
      { item: animal.produce, isDeluxe: false },
      { item: animal.deluxeProduce, isDeluxe: true },
    ];
    for (const { item, isDeluxe } of gives) {
      if (!item) continue;
      const source = { animal: animal.name, building: animal.building };
      const known = byId.get(item.id);
      if (known) {
        known.sources.push(source);
        continue;
      }
      byId.set(item.id, {
        id: item.id,
        name: item.name,
        image: item.image,
        sellPrice: item.sellPrice,
        profession: item.profession,
        maxQuality: item.maxQuality,
        isDeluxe,
        sources: [source],
      });
    }
  }
  return [...byId.values()];
};

/** Each produce item once. Milk, given by two cows, is one item. */
export const allProduce: Produce[] = gatherProduce();

/**
 * The game does not count the Golden Egg and the Dinosaur Egg as shipped, so the shipping
 * collection does not list them.
 */
export const isTrackedProduce = (produce: Produce): boolean =>
  shippingCollectionIds.has(produce.id);

export type ProduceShippedFilter =
  "all" | "shipped" | "not-shipped" | "not-tracked";

export interface ProduceFilters {
  query: string;
  shipped: ProduceShippedFilter;
}

export const emptyProduceFilters: ProduceFilters = {
  query: "",
  shipped: "all",
};

export const isFilteringProduce = (filters: ProduceFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyProduceFilters);

export const filterProduce = (
  data: GameData,
  filters: ProduceFilters,
): Produce[] => {
  const needle = filters.query.trim().toLowerCase();
  return allProduce.filter((produce) => {
    const tracked = isTrackedProduce(produce);
    const shipped = tracked && isShipped(data, produce.id);
    return (
      (produce.name.toLowerCase().includes(needle) ||
        produce.sources.some((source) =>
          source.animal.toLowerCase().includes(needle),
        )) &&
      (filters.shipped === "all" ||
        (filters.shipped === "shipped" && shipped) ||
        (filters.shipped === "not-shipped" && tracked && !shipped) ||
        (filters.shipped === "not-tracked" && !tracked))
    );
  });
};

export const countAnimalProductsShipped = (data: GameData): ProgressCount => {
  const tracked = allProduce.filter(isTrackedProduce);
  return {
    current: tracked.filter((produce) => isShipped(data, produce.id)).length,
    total: tracked.length,
  };
};

export interface AnimalProductsSummary {
  animals: number;
  items: number;
  shipped: ProgressCount;
}

export const animalProductsSummary = (
  data: GameData,
): AnimalProductsSummary => ({
  animals: allFarmAnimals.length,
  items: allProduce.length,
  shipped: countAnimalProductsShipped(data),
});
