import {
  artisanCalculator,
  crops,
  fish,
  forageables,
  artisanGoods as queryArtisanGoods,
  trees,
} from "stardew-valley-data";
import type { ArtisanGood } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { shippingCollectionIds } from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import {
  ARTISAN_CALC_METHOD,
  ARTISAN_USE_KEY,
  FRUIT_TREE_KEYS,
} from "@/data/constants/artisanGoods";
import { isShipped } from "./shipped";

export const allGoods: ArtisanGood[] = queryArtisanGoods().get();

export const equipmentTypes: string[] = [
  ...new Set(allGoods.map((good) => good.equipment)),
];

/** The game does not count Coffee, Vinegar and Oil as shipped. */
export const isShippableGood = (good: ArtisanGood): boolean =>
  shippingCollectionIds.has(good.id);

/** A good with no fixed price has a formula and a calculator. */
export const hasFixedPrice = (good: ArtisanGood): boolean =>
  good.sellPrice !== null;

export type GoodShippedFilter =
  "all" | "shipped" | "not-shipped" | "not-shippable";

export interface GoodFilters {
  query: string;
  shipped: GoodShippedFilter;
}

export const emptyGoodFilters: GoodFilters = { query: "", shipped: "all" };

export const isFilteringGoods = (filters: GoodFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyGoodFilters);

/** The search matches the name, the equipment and the ingredients. */
export const filterGoods = (
  data: GameData,
  filters: GoodFilters,
): ArtisanGood[] => {
  const needle = filters.query.trim().toLowerCase();
  return allGoods.filter((good) => {
    const shippable = isShippableGood(good);
    const shipped = shippable && isShipped(data, good.id);
    return (
      (good.name.toLowerCase().includes(needle) ||
        good.equipment.toLowerCase().includes(needle) ||
        good.ingredients.some((ingredient) =>
          ingredient.name.toLowerCase().includes(needle),
        )) &&
      (filters.shipped === "all" ||
        (filters.shipped === "shipped" && shipped) ||
        (filters.shipped === "not-shipped" && shippable && !shipped) ||
        (filters.shipped === "not-shippable" && !shippable))
    );
  });
};

export const countArtisanGoodsShipped = (data: GameData): ProgressCount => {
  const shippable = allGoods.filter(isShippableGood);
  return {
    current: shippable.filter((good) => isShipped(data, good.id)).length,
    total: shippable.length,
  };
};

export interface ArtisanGoodsSummary {
  equipment: number;
  goods: number;
  shipped: ProgressCount;
}

export const artisanGoodsSummary = (data: GameData): ArtisanGoodsSummary => ({
  equipment: equipmentTypes.length,
  goods: allGoods.length,
  shipped: countArtisanGoodsShipped(data),
});

export interface IngredientOption {
  name: string;
  basePrice: number;
  image: string;
  energy?: number;
  health?: number;
  /** A line under the name instead of the base price, such as the roe price. */
  sublabel?: string;
}

const calculator = artisanCalculator();

const byName = (a: IngredientOption, b: IngredientOption): number =>
  a.name.localeCompare(b.name);

/**
 * What can be made into a good. Smoked Fish takes any fish and Aged Roe takes a fish with roe.
 * The others take the crops, forageables and, for wine, jelly and dried fruit, the fruit tree
 * produce that carry the matching artisan use, each name once.
 */
export function ingredientOptions(good: ArtisanGood): IngredientOption[] {
  if (good.name === "Smoked Fish") {
    return fish()
      .get()
      .map((item) => ({
        name: item.name,
        basePrice: item.sellPrice,
        image: item.image,
        energy: item.energyHealth?.energy,
        health: item.energyHealth?.health,
      }))
      .sort(byName);
  }

  if (good.name === "Aged Roe") {
    return fish()
      .byRoe("roe")
      .get()
      .map((item) => ({
        name: item.name,
        basePrice: item.sellPrice,
        image: item.image,
        sublabel: `Roe: ${calculator.roe(item.sellPrice).sellPrice}g`,
      }))
      .sort(byName);
  }

  const useKey = ARTISAN_USE_KEY[good.name];
  if (!useKey) return [];

  const options: IngredientOption[] = [
    ...crops()
      .byArtisanUse(useKey)
      .get()
      .map((item) => ({
        name: item.name,
        basePrice: item.cropSellPrice,
        image: item.image,
        energy: item.energyHealth?.energy,
        health: item.energyHealth?.health,
      })),
    ...forageables()
      .byArtisanUse(useKey)
      .get()
      .map((item) => ({
        name: item.name,
        basePrice: item.sellPrice,
        image: item.image,
        energy: item.energyHealth?.energy,
        health: item.energyHealth?.health,
      })),
  ];

  if (FRUIT_TREE_KEYS.has(useKey)) {
    options.push(
      ...trees()
        .fruitTrees()
        .byArtisanUse(useKey)
        .get()
        .flatMap((tree) =>
          tree.type === "fruit-tree"
            ? [
                {
                  name: tree.produce.name,
                  basePrice: tree.produce.sellPrice,
                  image: tree.produce.image,
                  energy: tree.produce.energyHealth?.energy,
                  health: tree.produce.energyHealth?.health,
                },
              ]
            : [],
        ),
    );
  }

  const seen = new Set<string>();
  return options
    .filter((option) => {
      if (seen.has(option.name)) return false;
      seen.add(option.name);
      return true;
    })
    .sort(byName);
}

export interface GoodResult {
  sellPrice: number;
  energy?: number;
  health?: number;
}

/** The price, and the energy and health, of a good made from one ingredient. */
export function calculateGood(
  good: ArtisanGood,
  option: IngredientOption,
): GoodResult | null {
  const method = ARTISAN_CALC_METHOD[good.name];
  if (!method) return null;
  const calculate = calculator[method as keyof typeof calculator] as unknown;
  if (good.name === "Honey" || good.name === "Aged Roe") {
    return (calculate as (price: number) => GoodResult)(option.basePrice);
  }
  return (
    calculate as (price: number, energy: number, health: number) => GoodResult
  )(option.basePrice, option.energy ?? 0, option.health ?? 0);
}
