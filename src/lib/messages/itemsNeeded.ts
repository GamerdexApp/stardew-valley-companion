export const itemsNeededText = {
  title: "Items needed",
  subline: (farm: string) =>
    `Everything still needed to complete your collection goals · ${farm}`,
  noPlaythrough: "Everything still needed from scratch",
  scratchBanner:
    "Create a playthrough to see your personal progress. Showing all items needed from scratch.",
  tags: {
    all: "Total",
    Donate: "Donate",
    Ship: "Ship",
    Cook: "Cook",
    Craft: "Craft",
    Build: "Build",
    Bundle: "Bundle",
    Gift: "Gift",
  },
  tagGoal: {
    Donate: "Museum donation",
    Ship: "Shipping collection",
  } as Record<string, string>,
  filter: {
    label: "Needed for",
    all: "All",
    giftNote:
      "Gift needs a playthrough. Without one, only Donate, Ship, Cook, Craft, Build and Bundle are listed.",
    keep: "Search text and the Needed for choice are kept in the page link, so a refresh keeps them.",
    sheetTitle: "Filter items",
    apply: (count: number) => `Show ${count} item${count === 1 ? "" : "s"}`,
  },
  search: "Search items",
  showing: (shown: number, total: number, tag: string) =>
    `Showing ${shown} of ${total} items · Needed for: ${tag}`,
  clear: "Clear filters",
  empty: {
    all: "Nothing left to collect!",
    tag: (tag: string) => `All ${tag} items complete!`,
    done: "Great work, this category is done.",
    noMatch: "No items match your search.",
  },
  card: {
    quantity: (quantity: number) => `×${quantity}`,
    forGoal: (goal: string, quantity?: number) =>
      quantity ? `${goal} ×${quantity}` : goal,
    preference: { loves: "loves", likes: "likes", neutral: "neutral" },
    markGifted: "Mark gifted",
    markLabel: (item: string, villager: string) =>
      `Mark ${item} gifted to ${villager}`,
    untrack: "Untrack",
    untrackLabel: (item: string, villager: string) =>
      `Stop tracking ${item} for ${villager}`,
    gifted: (item: string, villager: string) =>
      `${item} marked gifted to ${villager}.`,
    undo: "Undo",
    untracked: (item: string, villager: string) =>
      `Stopped tracking ${item} for ${villager}.`,
  },
  gifts: {
    note: "Gifts you plan to give. Marking one gifted removes it from this list.",
    track: "Track a gift",
    trackWithCount: (count: number) => `Track a gift, ${count} tracked`,
    dialog: {
      title: "Track a gift",
      description: "Gift changes save at once.",
      tracking: (count: number) => `Currently tracking (${count})`,
      noneTracked: "No gifts tracked yet.",
      forVillager: (item: string, villager: string) =>
        `${item} for ${villager}`,
      recentlyGifted: "Gifted:",
      undoLast: "Undo last",
      universal: "Universal gifts",
      universalTiers: { loves: "Loves", likes: "Likes", neutral: "Neutral" },
      byVillager: (count: number) => `By villager (${count})`,
      pick: (name: string) => `Pick an item for ${name}`,
      pickUniversal: (tier: string) => `Pick a universal gift (${tier})`,
      pickNote: "Loves, likes and neutral gifts. Duplicates are ignored.",
      back: "Back to all",
      add: "Add",
      added: "Tracked",
      addLabel: (item: string, villager: string) =>
        `Track ${item} for ${villager}`,
      removeLabel: (item: string, villager: string) =>
        `Stop tracking ${item} for ${villager}`,
      nothingPicked: "Pick a villager or a universal group to choose a gift.",
      done: "Done",
    },
  },
};
