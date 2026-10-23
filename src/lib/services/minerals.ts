import { minerals as queryMinerals } from "stardew-valley-data";
import type {
  BarItem,
  GeodeContainer,
  MineralItem,
  NodeItem,
  OreItem,
  ResourceItem,
} from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { countMineralsFound } from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { museumStatus } from "./museum";
import { isShipped } from "./shipped";

export const allMinerals = queryMinerals()
  .mineralItems()
  .get() as MineralItem[];
export const allGeodes = queryMinerals().geodes().get() as GeodeContainer[];
export const allOres = queryMinerals().ores().get() as OreItem[];
export const allBars = queryMinerals().bars().get() as BarItem[];
export const allResources = queryMinerals().resources().get() as ResourceItem[];
export const allNodes = queryMinerals().nodes().get() as NodeItem[];

export type ShippableItem = OreItem | BarItem | ResourceItem;

export type DonationFilter = "all" | "donated" | "not-donated";
export type FoundFilter = "all" | "found" | "not-found";
export type ShippedFilter = "all" | "shipped" | "not-shipped";

export interface MineralFilters {
  query: string;
  donation: DonationFilter;
  found: FoundFilter;
}

export interface ShippedFilters {
  query: string;
  shipped: ShippedFilter;
}

export const emptyMineralFilters: MineralFilters = {
  query: "",
  donation: "all",
  found: "all",
};

export const emptyShippedFilters: ShippedFilters = {
  query: "",
  shipped: "all",
};

export const isFilteringMinerals = (filters: MineralFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyMineralFilters);

export const isFilteringShipped = (filters: ShippedFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyShippedFilters);

export const matchesName = (name: string, query: string): boolean =>
  name.toLowerCase().includes(query.trim().toLowerCase());

export const filterMinerals = (
  data: GameData,
  filters: MineralFilters,
): MineralItem[] =>
  allMinerals.filter((mineral) => {
    const status = museumStatus(data, "minerals", mineral.id);
    return (
      matchesName(mineral.name, filters.query) &&
      (filters.donation === "all" ||
        (filters.donation === "donated") === (status === "donated")) &&
      (filters.found === "all" ||
        (filters.found === "found") === (status !== "missing"))
    );
  });

export const filterShippable = <Item extends ShippableItem>(
  items: Item[],
  data: GameData,
  filters: ShippedFilters,
): Item[] =>
  items.filter(
    (item) =>
      matchesName(item.name, filters.query) &&
      (filters.shipped === "all" ||
        (filters.shipped === "shipped") === isShipped(data, item.id)),
  );

export const filterByName = <Item extends { name: string }>(
  items: Item[],
  query: string,
): Item[] => items.filter((item) => matchesName(item.name, query));

export const countShipped = (data: GameData, items: ShippableItem[]): number =>
  items.filter((item) => isShipped(data, item.id)).length;

export const countDonatedMinerals = (data: GameData): number =>
  allMinerals.filter(
    (mineral) => museumStatus(data, "minerals", mineral.id) === "donated",
  ).length;

export interface MineralsSummary {
  found: ProgressCount;
  donated: number;
  oresShipped: number;
  barsShipped: number;
  resourcesShipped: number;
}

export const mineralsSummary = (data: GameData): MineralsSummary => ({
  found: countMineralsFound(data),
  donated: countDonatedMinerals(data),
  oresShipped: countShipped(data, allOres),
  barsShipped: countShipped(data, allBars),
  resourcesShipped: countShipped(data, allResources),
});

// The package lookup `fromGeode` matches by text, so "Geode" also matches "Frozen Geode". The
// locations of a mineral list each geode by its exact name.
const mineralsIn = (geode: GeodeContainer): MineralItem[] =>
  allMinerals.filter((mineral) => mineral.locations.includes(geode.name));

/** The geodes a mineral can come out of. */
export const geodesHolding = (mineral: MineralItem): string[] =>
  allGeodes
    .filter((geode) => mineral.locations.includes(geode.name))
    .map((geode) => geode.name);

export interface GeodeLine {
  name: string;
  image?: string;
  quantity?: string;
  chance?: string;
}

/**
 * What a geode can hold. The four geodes a blacksmith opens list their minerals. The other
 * containers list their own contents, with a quantity and a chance.
 */
export const geodeContents = (geode: GeodeContainer): GeodeLine[] =>
  geode.contents ??
  mineralsIn(geode).map(({ name, image }) => ({ name, image }));

/** A container with its own contents list opens for random items. */
export const opensForRandomItems = (geode: GeodeContainer): boolean =>
  geode.contents !== undefined;

const itemNameById = new Map(
  (queryMinerals().get() as { id: string; name: string }[]).map(
    ({ id, name }) => [id, name],
  ),
);

export const mineralNameById = (id: string): string =>
  itemNameById.get(id) ?? id;
