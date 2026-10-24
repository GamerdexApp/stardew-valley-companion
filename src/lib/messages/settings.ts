const plural = (count: number, one: string, other: string) =>
  `${count} ${count === 1 ? one : other}`;

export const settingsText = {
  page: {
    title: "Settings",
    subline: "Manage your data, playthrough settings and appearance",
    tabsLabel: "Settings",
    tabs: {
      sync: "Cloud sync",
      preferences: "Preferences",
      data: "Backup and data",
      about: "About",
    },
  },
  playthroughCount: (count: number) =>
    plural(count, "playthrough", "playthroughs"),
  preferences: {
    playthroughSettings: {
      title: "Playthrough settings",
      description:
        "Platform is a label for where you play this playthrough. It changes nothing else. A change saves at once and does not change the Last modified order.",
      none: "No playthroughs yet.",
      create: "Create a playthrough",
      lastModified: (date: string) => `Last modified ${date}`,
      selectLabel: (name: string) => `Platform for ${name}`,
      notSet: "Not set",
      changed: "Platform changed",
      changedMessage: (name: string, platform: string) =>
        `${name} is now ${platform}.`,
      cleared: "Platform cleared",
      undo: "Undo",
    },
    route: {
      title: "Community Center or Joja",
      description: (name: string) =>
        `The route ${name} is on. The sidebar, the Overview and the Community Center page follow this choice. It is saved with the playthrough.`,
      label: "Route",
      options: {
        "community-center": {
          label: "Community Center",
          detail: "Restore it with 30 bundles in 6 rooms.",
        },
        joja: {
          label: "Joja membership",
          detail: "Buy 5 community development projects, 135,000g in total.",
        },
      },
      keeps:
        "Switching to Joja keeps your bundles, so you can switch back. Switching to the Community Center fills in the standard 30 bundles when none are saved.",
      changed: (label: string) => `Route set to ${label}.`,
      undo: "Undo",
    },
    appearance: {
      title: "Appearance",
      description:
        "Choose how the app looks. The choice is saved with your data.",
      themeLabel: "Theme",
      themes: { light: "Light", dark: "Dark", system: "System" },
      themeNote: (current: string) =>
        `System follows your device. Your device is set to ${current} right now.`,
    },
  },
  data: {
    localStorageNote: {
      title: "Local storage.",
      body: "Your data is stored locally in the browser. Data is lost when the browser cache is cleared, unless Cloud sync keeps a copy. Use the functions below to export and backup your data regularly.",
    },
    management: {
      title: "Data management",
      description: "One backup file holds every playthrough and your settings.",
    },
    backupDownloaded: "Backup downloaded",
    merged: "Backup merged",
    replaced: "Backup replaced",
    undo: "Undo",
    resetDone: "All data reset",
    syncDisconnected: " Sync is disconnected on this browser.",
    resetDoneMessage: (count: number) =>
      `${plural(count, "playthrough", "playthroughs")} removed and settings cleared.`,
    export: {
      title: "Export data",
      description: "Download a backup file of all your saved playthroughs.",
      fileName: "File name:",
      button: "Export all playthroughs",
    },
    import: {
      title: "Import data",
      description:
        "Upload a previously exported file (.json). It is checked first, then you choose Merge or Replace and see what changes. Nothing changes until you confirm.",
      fileLabel: "Backup file",
      chooseFile: "Choose file",
      noFile: "No file chosen",
      review: "Review import",
    },
    reset: {
      title: "Reset all data",
      warningTitle: "Warning:",
      warning:
        "This will delete all playthroughs and reset your settings and theme. You can undo for 10 seconds, so export a backup first if you want to keep a copy.",
      button: "Reset all data",
    },
    playthroughs: {
      title: "Playthroughs",
      description:
        "Create, rename, edit and delete playthroughs on their own page. Export, import and reset apply to all of them.",
      manage: "Manage playthroughs",
    },
  },
  resetDialog: {
    title: "Reset all data",
    cancel: "Cancel",
    confirm: "Yes, reset all data",
    question: (count: number) =>
      `Delete all ${plural(count, "playthrough", "playthroughs")} from this browser?`,
    removedTitle: "What is removed",
    settingsNote:
      "Your Light, Dark or System choice returns to System. The active playthrough is cleared.",
    undoNote:
      "Undo stays available for 10 seconds after the reset. Export a backup first if you want a file copy that stays.",
    exportFirst: "Export backup first",
    syncedCopy: (provider: string) =>
      `Also delete the synced copy in ${provider}`,
    syncedOn:
      "Sync stays on. Your other devices lose these playthroughs at their next sync. Export a backup first if you are not sure.",
    syncedOff:
      "The synced copy stays where it is. Sync disconnects on this browser so the empty list does not reach the cloud.",
  },
  importDialog: {
    title: "Import backup",
    cancel: "Cancel",
    close: "Close",
    merge: "Merge",
    replace: "Replace",
    failedTitle: "Import failed.",
    checksTitle: "Checks on the file.",
    checks: (count: number) =>
      `The playthroughs list was found and ${plural(count, "entry was", "entries were")} read. Nothing has been saved yet, so your current playthroughs are untouched.`,
    howToApply: "How should the file be applied?",
    modeLabel: "Import mode",
    modes: {
      merge: "Merge (recommended)",
      replace: "Replace everything on this device",
    },
    modeNotes: {
      merge:
        "Adds playthroughs that are new and keeps the newer copy of a playthrough that is in both. Playthroughs only on this device stay. This device keeps its own active playthrough. Your settings stay.",
      replace:
        "Removes every playthrough on this device and loads the file as it is, including its active playthrough and settings. Use this to restore an exact copy.",
    },
    whatChanges: "What changes",
    columns: {
      playthrough: "Playthrough",
      inFile: "In the file",
      onDevice: "On this device",
      result: "Result",
    },
    results: {
      added: "Added",
      updated: "Updated from the file",
      kept: "Kept the copy on this device",
      replaced: "Loaded from the file",
      removed: "Removed",
    },
    notThere: "Not there",
    noPlaythroughs: "No playthroughs in the file.",
    undoNote: "Undo stays available for 10 seconds after the import.",
    fileInfo: (name: string, size: string) => `${name} · ${size}`,
    bytes: (amount: number) => `${amount} B`,
    kilobytes: (amount: number) => `${amount} KB`,
  },
  about: {
    version: (version: string) => `Version ${version}`,
    summary:
      "Track your Stardew Valley progress: bundles, friendships, fish, artifacts, recipes, skills, the farm and more. Everything is stored in this browser, or in your own cloud storage if you turn on sync.",
    wiki: "Stardew Valley Wiki",
    disclaimer:
      "Not affiliated with or endorsed by ConcernedApe. Stardew Valley is a trademark of ConcernedApe.",
  },
} as const;
