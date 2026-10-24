export const townText = {
  title: "Town",
  subline: (locations: number, shops: number) =>
    `Locations, shops, and hours throughout the valley · ${locations} locations, ${shops} shops`,
  unlocks: {
    valley: "Valley unlocks",
    valleyNote:
      "Worked out from your Community Center rooms or Joja developments. Read only because it is derived, so nothing here is edited.",
    island: "Ginger Island upgrades",
    islandNote:
      "Built island upgrades from your playthrough. Leo's parrots, walnut counts and shop stock stay on their own pages.",
    count: (done: number, total: number) => `${done} / ${total}`,
    bar: (title: string) => `${title} progress`,
    unlocked: "Unlocked",
    locked: "Locked",
    built: "Built",
    notBuilt: "Not built",
  },
  search: "Search locations, occupants and shop items",
  filter: {
    show: "Show",
    category: "Category",
    shows: { all: "All", shops: "Shops", locations: "Locations" },
    allCategories: "All categories",
    sheetTitle: "Filter locations",
    apply: (count: number) => `Show ${count} location${count === 1 ? "" : "s"}`,
  },
  showing: (shown: number, total: number, shops: number) =>
    `Showing ${shown} of ${total} locations · ${shops} shops`,
  clear: "Clear filters",
  empty: "No locations match your filters.",
  category: {
    badge: (count: number) => `${count} location${count === 1 ? "" : "s"}`,
  },
  card: {
    shop: "Shop",
    location: "Location",
    alwaysOpen: "Always open",
    closed: (days: string) => `Closed ${days}`,
    occupants: (names: string[]) =>
      names.length > 3
        ? `${names.slice(0, 3).join(", ")} +${names.length - 3}`
        : names.join(", "),
    noOccupants: "Nobody",
    showDetails: "Show details",
    hideDetails: "Hide details",
  },
  facts: {
    hours: "Hours",
    closed: "Closed",
    never: "Never",
    occupants: "Occupants",
    type: "Type",
    jojaMembership: "Joja Membership",
    jojaBody:
      "Purchase a Joja membership for 5,000g to unlock community development projects.",
  },
  shop: {
    label: "Shop",
    inventory: (count: number) => `Inventory (${count})`,
    buildings: (count: number) => `Buildings (${count})`,
    farmhouse: (count: number) => `Farmhouse (${count})`,
    animals: (count: number) => `Animals (${count})`,
    pets: (count: number) => `Pets (${count})`,
    collections: (count: number) => `Collections (${count})`,
    none: "No items available.",
    showing: (shown: number, total: number) =>
      `Showing ${shown} of ${total} items`,
    showAll: (total: number) => `Show all ${total}`,
    showFewer: "Show fewer",
    days: (days: number) => `${days} day${days === 1 ? "" : "s"}`,
    cost: (cost: string) => `${cost}g`,
    free: "Free",
    upgrades: (count: number) => `Upgrades (${count})`,
    renovations: (count: number) => `Renovations (${count})`,
    materials: "Materials",
    quantity: (quantity: number) => `×${quantity}`,
    walnuts: (count: number) => `${count} walnuts`,
    donations: "Donations",
    reward: "Reward",
  },
};
