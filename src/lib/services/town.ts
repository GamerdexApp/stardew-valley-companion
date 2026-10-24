import {
  animals as animalsFn,
  blacksmith,
  booksellerShop,
  buildings as buildingsFn,
  carpenter,
  casino,
  desertTrader,
  dwarfShop,
  fieldOffice,
  guild,
  hats,
  houseRenovations as houseRenovationsFn,
  houseUpgrades as houseUpgradesFn,
  isFarmAnimal,
  islandTrader,
  isPet,
  joja,
  krobus,
  locations,
  marnie,
  medicalSupplies,
  oasis,
  pierre,
  qiStock,
  saloon,
  search,
  volcanoShop,
  willy,
  wizard,
} from "stardew-valley-data";
import type {
  Building,
  FarmAnimal,
  GameLocation,
  Pet,
} from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { capitalize } from "@/lib/utils/formatting";
import { ISLAND_UPGRADES } from "@/data/constants/gingerIsland";
import {
  allProjects,
  isProjectPurchased,
  rooms,
  routeOf,
} from "./communityCenter";
import { isUnlocked } from "./gingerIsland";

export const allLocations: GameLocation[] = locations().get();
export const shopCount: number = allLocations.filter(
  (location) => location.shop,
).length;
export const categories: string[] = [
  ...new Set(allLocations.map((location) => location.category)),
];

export interface ShopItem {
  name: string;
  price: string;
  image: string | null;
  /** The seasons the item is sold in, such as "Spring". Empty when it is sold all year. */
  season: string;
}

interface RawShopItem {
  name?: unknown;
  image?: unknown;
  seasons?: unknown;
  tradeItemName?: string;
  tradeAmount?: number;
  currency?: string;
  cost?: unknown;
  price?: unknown;
  priceYear1?: unknown;
  buildCost?: unknown;
}

const SHOP_SOURCES: Record<string, () => { get: () => unknown[] }> = {
  "pierre-shop": pierre,
  "saloon-shop": saloon,
  "blacksmith-shop": blacksmith,
  "carpenter-shop": carpenter,
  "marnie-shop": marnie,
  "willy-shop": willy,
  "krobus-shop": krobus,
  "oasis-shop": oasis,
  "desert-trader-shop": desertTrader,
  "wizard-shop": wizard,
  "guild-shop": guild,
  "dwarf-shop": dwarfShop,
  "volcano-shop": volcanoShop,
  "casino-shop": casino,
  "island-trader-shop": islandTrader,
  hats,
  "joja-shop": joja,
  "medical-supplies-shop": medicalSupplies,
  "bookseller-shop": booksellerShop,
  "qi-shop": qiStock,
};

const formatPrice = (item: RawShopItem): string => {
  if (item.tradeItemName && item.tradeAmount)
    return `${item.tradeAmount}x ${item.tradeItemName}`;
  if (typeof item.cost === "number" && item.currency === "qi-gem")
    return `${item.cost} Qi Gems`;
  for (const amount of [
    item.price,
    item.priceYear1,
    item.buildCost,
    item.cost,
  ]) {
    if (typeof amount === "number") return `${amount.toLocaleString()}g`;
  }
  return "-";
};

const shopCache = new Map<string, ShopItem[]>();

export const shopItems = (shopId: string): ShopItem[] => {
  const cached = shopCache.get(shopId);
  if (cached) return cached;
  const source = SHOP_SOURCES[shopId];
  const items = source
    ? (source().get() as RawShopItem[]).map((item) => ({
        name: String(item.name ?? ""),
        price: formatPrice(item),
        image: typeof item.image === "string" ? item.image : null,
        season: Array.isArray(item.seasons)
          ? item.seasons.map((s) => capitalize(String(s))).join(", ")
          : "",
      }))
    : [];
  shopCache.set(shopId, items);
  return items;
};

export const isFieldOffice = (shopId: string): boolean =>
  shopId === "field-office";

export const fieldOfficeCollections = () => fieldOffice().get();

const allBuildings = buildingsFn().get();

/** Robin sells the buildings that are not magical. The Wizard sells the magical ones. */
export const shopBuildings = (shopId: string): Building[] => {
  if (shopId === "carpenter-shop")
    return allBuildings.filter((b) => !b.magical && b.builder === "Robin");
  if (shopId === "wizard-shop") return allBuildings.filter((b) => b.magical);
  return [];
};

export const houseUpgrades = houseUpgradesFn().get();
export const houseRenovations = houseRenovationsFn().get();

export const purchasableAnimals: FarmAnimal[] = (
  animalsFn().farmAnimals().get().filter(isFarmAnimal) as FarmAnimal[]
).filter((animal) => animal.purchasePrice !== null);

export const purchasablePets: Pet[] = (
  animalsFn().pets().get().filter(isPet) as Pet[]
).filter(
  (pet) => pet.purchasePrice !== null && pet.purchasePrice !== undefined,
);

export const materialImage = (name: string): string | null =>
  search(name).find((result) => result.name === name)?.image ?? null;

export type ShowFilter = "all" | "shops" | "locations";

export interface TownFilters {
  query: string;
  show: ShowFilter;
  category: string;
}

export const ALL_CATEGORIES = "all";

export const emptyTownFilters: TownFilters = {
  query: "",
  show: "all",
  category: ALL_CATEGORIES,
};

export const isFilteringTown = (filters: TownFilters): boolean =>
  filters.query !== "" ||
  filters.show !== "all" ||
  filters.category !== ALL_CATEGORIES;

/** The search looks in the name, the occupants and the names of what a shop sells. */
export const filterLocations = (filters: TownFilters): GameLocation[] => {
  const needle = filters.query.trim().toLowerCase();
  return allLocations.filter((location) => {
    const matches =
      needle === "" ||
      location.name.toLowerCase().includes(needle) ||
      location.occupants.some((name) => name.toLowerCase().includes(needle)) ||
      (location.shop !== null &&
        shopItems(location.shop).some((item) =>
          item.name.toLowerCase().includes(needle),
        ));
    return (
      matches &&
      (filters.show === "all" ||
        (filters.show === "shops") === Boolean(location.shop)) &&
      (filters.category === ALL_CATEGORIES ||
        location.category === filters.category)
    );
  });
};

/** The data gives a clock time without am or pm, such as "9:00". */
const clock = (time: string, suffix: "am" | "pm"): string =>
  `${time.replace(":00", "")}${suffix}`;

/**
 * A place opens in the morning and closes in the afternoon or evening, except these three, which
 * the data cannot tell from the rest.
 */
const NIGHT_HOURS: Record<string, [string, string]> = {
  "Wizard's Tower": ["6pm", "11pm"],
  "The Stardrop Saloon": ["12pm", "12am"],
  "Adventurer's Guild": ["2pm", "2am"],
};

export const hoursOf = (location: GameLocation): string | null => {
  if (!location.openHours) return null;
  const [open, close] = NIGHT_HOURS[location.name] ?? [
    clock(location.openHours.open, "am"),
    clock(location.openHours.close, "pm"),
  ];
  return `${open} - ${close}`;
};

export interface Unlock {
  name: string;
  via: string;
  on: boolean;
}

const VALLEY_UNLOCKS = [
  { name: "Greenhouse", room: "pantry", project: "Greenhouse" },
  { name: "Quarry bridge", room: "crafts-room", project: "Bridge" },
  { name: "Panning", room: "fish-tank", project: "Panning" },
  { name: "Minecarts", room: "boiler-room", project: "Minecarts" },
  { name: "Bus to the Calico Desert", room: "vault", project: "Bus" },
];

/** Each unlock comes from a Community Center room, or from the Joja project that replaces it. */
export const valleyUnlocks = (data: GameData): Unlock[] =>
  VALLEY_UNLOCKS.map(({ name, room, project }) => {
    const source = rooms.find((item) => item.id === room)!;
    if (routeOf(data) === "joja") {
      const found = allProjects.find((item) => item.name === project)!;
      return {
        name,
        via: `Joja ${project}`,
        on: isProjectPurchased(data, found),
      };
    }
    return {
      name,
      via: source.label,
      on: data.communityCenter.rooms[source.key],
    };
  });

export const islandUnlocks = (data: GameData): Unlock[] =>
  ISLAND_UPGRADES.map((upgrade) => ({
    name: upgrade.name,
    via: upgrade.location,
    on: isUnlocked(data, upgrade.id),
  }));
