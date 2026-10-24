export const communityCenterText = {
  title: "Community Center",
  titles: { "community-center": "Community Center", joja: "Joja Development" },
  subline: (route: string, progress: string) => `${route} · ${progress}`,
  routeNames: {
    "community-center": "Community Center route",
    joja: "Joja route",
  },
  decision: {
    title: "Your route",
    body: {
      "community-center":
        "This farm is on the Community Center route. You restore it with 30 bundles in 6 rooms.",
      joja: "This farm is on the Joja route. You buy 5 community development projects, 135,000g in total.",
    },
    change: "Change decision",
  },
  tiles: {
    unlocked: "Unlocked",
    active: "Bundles active",
    rooms: "Rooms complete",
    bundles: "Bundles complete",
    completed: "Completed",
    ceremony: "Ceremony",
    abandoned: "Joja abandoned",
    yes: "Yes",
    no: "No",
    attended: "Attended",
    notYet: "Not yet",
  },
  set: {
    title: "Bundle set",
    note: "Remix keeps the slot count of each room: Crafts 6, Pantry 6, Fish Tank 6, Boiler 3, Bulletin 5, Vault 4.",
    standard: "Standard",
    remix: "Remix",
    switched: (set: string) =>
      set === "remix"
        ? "Switched to Remix. Pick the bundle for each slot. Room progress was cleared."
        : "Switched to Standard. Room progress was cleared.",
    undo: "Undo",
    emptyRemix: "Remix set only",
  },
  flags: {
    ceremony: "Ceremony attended",
    ceremonyHint: "Set after the completion cutscene.",
    abandoned: "Abandoned JojaMart unlocked",
    abandonedHint: "The Missing Bundle appears after the ceremony.",
  },
  completedNote:
    "Shown once the Community Center is completed. The save file stops tracking which items sit in each bundle slot, so all bundles read as complete and the item ticks no longer come from the save.",
  room: {
    badge: (done: number, total: number) => `${done} / ${total} complete`,
    complete: "Room complete",
    switch: (room: string) => `${room} complete`,
    marked: (room: string, on: boolean) =>
      `${room} marked ${on ? "complete" : "not complete"}.`,
    undo: "Undo",
    locked: "This room is marked complete, so its items are locked.",
  },
  bundle: {
    items: (done: number, needed: number) => `${done} / ${needed} items`,
    gold: (done: number) => `${done} / 1 paid`,
    complete: "Complete",
    incomplete: "Incomplete",
    reward: "Reward",
    all: "All",
    clear: "Clear",
    allLabel: (name: string) => `Mark every item of ${name}`,
    clearLabel: (name: string) => `Clear every item of ${name}`,
    goldRequired: (cost: string) => `${cost}g required`,
    paid: "Paid",
    notPaid: "Not paid",
    itemLabel: (item: string, bundle: string) => `${item} for ${bundle}`,
    selectOf: (needed: number, total: number) =>
      `Select ${needed} of ${total} items.`,
    quantity: (quantity: number) => `×${quantity}`,
    bundleName: "Bundle",
    chooseBundle: "Choose a bundle",
    slot: (slot: number) => `Slot ${slot}`,
    pickFor: (room: string, slot: number) => `${room} slot ${slot} bundle`,
    clearSlot: (name: string) => `Remove ${name} from its slot`,
  },
  abandoned: {
    title: "Abandoned JojaMart",
    note: "Turn on Abandoned JojaMart unlocked to track The Missing Bundle.",
  },
  joja: {
    membership: "Joja Membership",
    active: "Active member. Community development projects are available.",
    activeTag: "Active",
    inactiveTag: "Inactive",
    tiles: {
      projects: "Projects complete",
      invested: "Total invested",
      remaining: "Remaining cost",
    },
    title: "Development projects",
    badge: (done: number, total: number) => `${done} / ${total} purchased`,
    allDeveloped: "All developed",
    allDevelopedHint: "Mark all purchased",
    allSwitch: "All developed",
    purchased: "Purchased",
    notPurchased: "Not purchased",
    unlocks: (unlock: string) => `Unlocks: ${unlock}`,
    switch: (name: string) => `${name} purchased`,
    note: "The five projects cost 135,000g in total. Switch All developed on and it ticks the other four. The setting turns itself on when the fifth project is purchased.",
    marked: (name: string, on: boolean) =>
      `${name} marked ${on ? "purchased" : "not purchased"}.`,
    allMarked: (on: boolean) =>
      on ? "All projects marked purchased." : "All projects cleared.",
    undo: "Undo",
  },
  gold: (amount: number) => `${amount.toLocaleString()}g`,
};
