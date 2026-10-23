export const newPlaythroughText = {
  title: "New playthrough",
  subline: "Start from a save file or build a starter by hand",
  cancel: "Cancel",
  back: "Back",
  next: "Next",
  save: "Save playthrough",
  saving: "Saving",
  saveFailed:
    "The browser could not save this playthrough. Export a backup from Settings, then try again.",
  saved: (name: string) => `${name} saved`,
  savedActive: (name: string) => `${name} saved and set active`,
  openOverview: "Open overview",
  stepsLabel: "Steps",
  stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
  stepDone: "Done",
  choose: {
    heading: "How do you want to start?",
    upload: {
      title: "Upload save file",
      body: "Import progress from an existing Stardew Valley save",
    },
    build: {
      title: "Build starter",
      body: "Manually set up a new playthrough from scratch",
    },
  },
  upload: {
    infoLead:
      "Please use the full save file (for example Chief_132427894). Do not use the SaveGameInfo file, as it does not contain all the information.",
    locations: "Default save file locations:",
    windows: "Windows:",
    windowsPath: "%AppData%\\StardewValley\\Saves\\",
    unix: "Mac and Linux:",
    unixPath: "~/.config/StardewValley/Saves/",
    chooseFile: "Select save file",
    fileHint: "Only XML files are supported.",
    selected: (name: string) => `Selected: ${name}`,
    parsing: "Parsing save file...",
    parsed: (player: string, farm: string) =>
      `Save file parsed successfully - ${player} from ${farm} Farm`,
    nameLabel: "Playthrough name",
    nameHint: "Filled in from the farm name. You can change it.",
    nameError: "Enter a name to continue.",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Add a description for this playthrough...",
  },
  character: {
    platformLabel: "Platform",
    platformPlaceholder: "Choose a platform",
    platformError: "Choose a platform to continue.",
    platformHelp:
      "Platform is only a label for where you play. It never changes what you can edit.",
    nameLabel: "Playthrough name",
    namePlaceholder: "e.g., My First Run",
    nameError: "Enter a playthrough name to continue.",
    farmLabel: "Farm name",
    farmPlaceholder: "e.g., Sunrise Farm",
    farmError: "Enter a farm name to continue.",
    characterLabel: "Character name",
    characterHint: "Optional. Shown next to the farm name.",
    farmTypeLabel: "Farm type",
  },
  bundles: {
    choosePath: "Choose your Community Center path:",
    pathLabel: "Community Center path",
    cc: {
      title: "Community Center",
      body: "Complete bundles to restore the Community Center",
    },
    joja: {
      title: "Joja Warehouse",
      body: "Purchase community upgrades through Joja",
    },
    jojaChosen:
      "Joja Warehouse selected. No bundle configuration needed. You can switch back to the Community Center and keep your picks.",
    typeLabel: "Bundle type",
    standard: "Standard",
    remix: "Remix",
    remixHint:
      "Select the bundles that match your game. Each room has a limited number of bundle slots.",
    roomBundles: (count: number) => `(${count} bundles)`,
    roomSelected: (active: number, slots: number) =>
      `(${active}/${slots} selected)`,
    remixTag: "Remix",
    goldCost: (gold: string) => `(${gold}g)`,
    useBundle: (name: string) => `Use ${name}`,
    selectItems: (required: number, total: number) =>
      `Select ${required} of ${total} items:`,
    itemLabel: (name: string, quantity: number, quality?: string) =>
      `${name}${quantity > 1 ? ` (x${quantity})` : ""}${quality ? ` [${quality}]` : ""}`,
  },
  review: {
    heading: "Review your playthrough",
    willBeSavedAs: "Will be saved as",
    name: "Name",
    platform: "Platform",
    description: "Description",
    noDescription: "None",
    platformCard: "Platform",
  },
} as const;
