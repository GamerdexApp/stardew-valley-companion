export interface LegacyRoute {
  from: string;
  to: string;
}

const COLLECTION_TABS = [
  "fish",
  "artifacts",
  "minerals",
  "cooking",
  "crafting",
  "crops",
  "forageables",
  "animal-products",
  "artisan-goods",
  "monster-loot",
  "rarecrows",
  "special-items",
] as const;

const FARM_TABS = [
  "character",
  "animals",
  "buildings",
  "ginger-island",
] as const;

/**
 * Old addresses that moved. An address whose path stayed the same, such as `/villagers`, is not
 * listed. Query values such as `?q=` pass through a redirect unchanged.
 */
export const LEGACY_ROUTES: LegacyRoute[] = [
  { from: "/dashboard", to: "/overview" },
  { from: "/playthrough/list", to: "/playthroughs" },
  { from: "/playthrough/new", to: "/playthroughs/new" },
  ...FARM_TABS.map((tab) => ({
    from: `/farm/${tab}`,
    to: `/farm?tab=${tab}`,
  })),
  ...COLLECTION_TABS.map((tab) => ({
    from: `/collections/${tab}`,
    to: `/collections?tab=${tab}`,
  })),
  { from: "/joja", to: "/community-center?tab=joja" },
];

/**
 * The redirects to serve. An old page that is still in the legacy group keeps its address until it
 * is rebuilt, so a redirect never points at a page that does not exist yet.
 */
export const redirectsForRemovedPages = (
  pageExists: (route: string) => boolean,
) =>
  LEGACY_ROUTES.filter(({ from }) => !pageExists(from)).map(({ from, to }) => ({
    source: from,
    destination: to,
    permanent: true,
  }));
