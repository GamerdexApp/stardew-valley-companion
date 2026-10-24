const plural = (count: number, one: string, other: string) =>
  `${count} ${count === 1 ? one : other}`;

export const playthroughsText = {
  title: "My playthroughs",
  subline: "Manage your playthroughs and track your progress",
  newPlaythrough: "New playthrough",
  filters: {
    search: "Search playthroughs",
    sortLabel: "Sort",
    sort: {
      lastModified: "Last modified",
      name: "Name",
      createdAt: "Date created",
    },
    platformLabel: "Platform",
    allPlatforms: "All platforms",
    showing: (shown: number, total: number) =>
      `Showing ${shown} of ${plural(total, "playthrough", "playthroughs")}`,
    clear: "Clear filters",
  },
  empty: {
    title: "No playthroughs yet",
    description:
      "Start one from a save file or build a starter by hand. Everything stays in this browser unless you turn on sync.",
    upload: {
      title: "Upload save file",
      body: "Import progress from an existing Stardew Valley save",
    },
    build: {
      title: "Build starter",
      body: "Manually set up a new playthrough from scratch",
    },
    saveLocation: {
      title: "Where is my save file?",
      body: "Each farm has a folder named after the farm and an id. The save is the file inside it with the same name and no extension.",
      windows: "Windows: %AppData%\\StardewValley\\Saves",
      unix: "Mac and Linux: ~/.config/StardewValley/Saves",
    },
    importBackup: "Import a backup instead",
  },
  noMatch: {
    title: (query: string) =>
      query.trim() === ""
        ? "No playthroughs match these filters"
        : `No playthroughs match “${query.trim()}”`,
    description: "Try a different name or platform.",
    clear: "Clear filters",
  },
  card: {
    active: "Active",
    setActive: "Set as active",
    openOverview: "Open overview",
    edit: "Edit",
    delete: "Delete",
    notSet: "Not set",
    perfection: "Perfection",
    created: (date: string) => `Created: ${date}`,
    lastModified: (date: string) => `Last modified: ${date}`,
  },
  edit: {
    title: "Edit playthrough",
    description: (name: string) => `Change the details of ${name}.`,
    nameLabel: "Playthrough name",
    nameRequired: "Required",
    nameError: "Enter a name for this playthrough.",
    descriptionLabel: "Description",
    platformLabel: "Platform",
    platformHelp:
      "Platform is only a label for where you play. It never changes what you can edit.",
    notSet: "Not set",
    cancel: "Cancel",
    save: "Save",
    saved: "Playthrough saved",
    savedMessage: (name: string) => `${name} was updated.`,
    update: {
      title: "Update from a newer save",
      intro:
        "Read a newer save file for this playthrough. The save wins for what it reports. Tracked gifts and lost books are never in a save, so they are always kept. Platform stays as it is.",
      parsed: (player: string, farm: string) =>
        `Ready to update - ${player} from ${farm} Farm`,
      farmMismatch: (saveFarm: string, ownFarm: string) =>
        `This save is from ${saveFarm} Farm, but this playthrough is ${ownFarm} Farm.`,
      howLabel: "How should the save be applied?",
      modes: {
        fill: "Fill gaps only (recommended)",
        replace: "Replace with the save",
      },
      modeNotes: {
        fill: "Keeps every value you changed. Adds what the save has and your playthrough is missing.",
        replace:
          "The save wins wherever it differs from your playthrough. Entries the save does not report are removed.",
      },
      willChange: (count: number) =>
        count === 0
          ? "Nothing would change"
          : `${count} ${count === 1 ? "value" : "values"} would change`,
      mostChanges: "Most changes:",
      button: "Update from save",
      done: "Playthrough updated",
      doneMessage: (name: string, count: number) =>
        `${name} was updated from a save. ${count} ${count === 1 ? "value" : "values"} changed.`,
      undo: "Undo",
    },
  },
  delete: {
    title: (name: string) => `Delete ${name}?`,
    description:
      "This removes all saved progress for this playthrough from this device. It also removes it from your other devices at the next sync when sync is on.",
    facts: (platform: string, percent: number) =>
      `${platform} · ${percent}% perfection`,
    activeNext: (next: string) =>
      `This is your active playthrough. ${next} becomes active instead.`,
    activeLast:
      "This is your active playthrough and the only one. You will have no active playthrough afterwards.",
    exportFirst: "Export a backup first",
    cancel: "Cancel",
    confirm: "Delete playthrough",
    done: (name: string) => `${name} deleted`,
    doneMessage: "Undo within 10 seconds to bring it back.",
    undo: "Undo",
  },
} as const;
