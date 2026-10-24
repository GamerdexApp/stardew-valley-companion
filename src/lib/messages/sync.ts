const plural = (count: number, one: string, other: string) =>
  `${count} ${count === 1 ? one : other}`;

export const syncText = {
  tab: { title: "Cloud sync" },
  unavailable: "Sync is not available in this build.",
  provider: {
    github: {
      name: "GitHub",
      tile: (repository: string) =>
        `A private repository that you own, named ${repository}.`,
      badge: "For developers",
    },
    google: {
      name: "Google Drive",
      tile: () =>
        "A visible Gamerdex folder in your Drive. Gamerdex sees only the files that it creates.",
      badge: "Recommended",
    },
    dropbox: {
      name: "Dropbox",
      tile: () =>
        "A Gamerdex folder inside the Apps folder of your Dropbox. Gamerdex sees only that folder.",
      badge: "App folder only",
    },
    microsoft: {
      name: "OneDrive",
      tile: () =>
        "A Gamerdex folder inside the Apps folder of your OneDrive. Gamerdex sees only that folder.",
      badge: "Personal accounts",
    },
  },
  connect: {
    title: "Sync across devices",
    pill: "Not connected",
    intro:
      "Keep your playthroughs the same on your computer and your phone. Sync is optional and free. Pick where the copy lives.",
    pickerLabel: "Where to keep the copy",
    panelTitle: (provider: string) => `Connect ${provider}`,
    another: "You can pick another provider before you sign in.",
    firstSync:
      "Choose what to keep on the first sync if both sides already have data. Nothing is replaced before you decide.",
    google: {
      step1: () => "Sign in with Google in this window.",
      step2: () =>
        "Allow access to the files that Gamerdex creates. The app cannot see your other files.",
      button: "Connect Google Drive",
    },
    github: {
      step1: (repository: string) =>
        `Create an empty private repository named ${repository}. Tick Add a README file.`,
      step2: () =>
        "Sign in with GitHub, then give Gamerdex Sync access to that repository only.",
      button: "Connect GitHub",
    },
    dropbox: {
      step1: () => "Sign in with Dropbox in this window.",
      step2: () =>
        "Allow access to the Gamerdex app folder. The app cannot see your other files.",
      button: "Connect Dropbox",
    },
    microsoft: {
      step1: () =>
        "Sign in with your personal Microsoft account in this window.",
      step2: () =>
        "Allow access to the Gamerdex app folder. The app cannot see your other files.",
      button: "Connect OneDrive",
    },
  },
  how: {
    title: "How sync works",
    points: [
      "Your playthroughs are saved as one file in your own storage, in the same format as the backup file, plus a small file for the list of devices.",
      "Gamerdex has no server that stores your data. Your browser talks to your storage directly.",
      "Marked items, levels and totals keep what either device changed, and the higher value wins. If both devices change a name, a pet or the money, you choose which one to keep.",
      "Each device keeps its own active playthrough and its own settings. Sync never changes them.",
      "Disconnect at any time. Your playthroughs stay on every device.",
    ],
  },
  repository: {
    title: "Set up your data repository",
    body: (name: string) =>
      `Your data is kept in a private repository named ${name} in your GitHub account. Gamerdex Sync can only reach that one repository.`,
    checking: (name: string) => `Looking for ${name}`,
    checkFailed:
      "Your repositories could not be loaded. Check your connection and check again.",
    public: (fullName: string) =>
      `The repository ${fullName} is public. Make it private in its GitHub settings, then check again. A public repository cannot be used, because anyone could read your data.`,
    missing: (name: string) => `The repository ${name} was not found`,
    steps: {
      create: (name: string) =>
        `Create a private repository named ${name}. Tick Add a README file.`,
      install: (name: string) =>
        `Give Gamerdex Sync access to that repository only. Choose Only select repositories, then pick ${name}.`,
      recheck: "Come back here and check again.",
    },
    createButton: "Create repository",
    installButton: "Choose repositories on GitHub",
    recheckButton: "Check again",
  },
  connected: {
    repository: "Repository",
    lastSync: "Last sync",
    never: "Not synced yet",
    syncNow: "Sync now",
    signOut: "Sign out",
    folder: (name: string) => `Folder ${name}`,
    signInWith: (provider: string) => `Sign in with ${provider}`,
  },
  status: {
    idle: "Synced",
    syncing: "Syncing",
    offline: "Offline",
    reauth: "Sign in again",
    needsChoice: "Needs your choice",
    error: "Sync failed",
    signedOut: "Not signed in",
    needsRepository: "Choose a repository",
    conflicts: "Review changes",
  },
  error: {
    rateLimit:
      "GitHub is limiting requests. Sync will work again in a few minutes.",
    notFound: "The repository was not found. Choose it again.",
    server: "GitHub did not answer correctly. Try again later.",
    data: "The synced data is not valid, so nothing was changed.",
    busy: "Another device keeps changing the data. Try again in a moment.",
    other: "Something went wrong. Nothing was changed.",
    reauth: "Your sign in ended. Sign in again to keep syncing.",
    forbidden:
      "GitHub refused access to the repository. Check that Gamerdex Sync has Read and write access to Contents, then sync again.",
    httpStatus: (status: string) => `GitHub answered ${status}.`,
    notFoundFolder: (provider: string) =>
      `A file or folder in ${provider} was not found. Sync again.`,
    forbiddenFolder: (provider: string) =>
      `${provider} refused access. Sign in again and allow access to the files that Gamerdex creates.`,
    httpStatusFolder: (provider: string, status: string) =>
      `${provider} answered ${status}.`,
  },
  choice: {
    title: "This device and the cloud both have data",
    body: "This is the first sync from this device. Pick what to do. Nothing is deleted from the cloud until you choose.",
    merge: "Merge both",
    mergeHint: "Keep everything from both. The higher value wins.",
    keepLocal: "Keep this device",
    keepLocalHint: "Replace the cloud data with the data on this device.",
    keepCloud: "Keep the cloud",
    keepCloudHint: "Replace the data on this device with the cloud data.",
  },
  first: {
    thisDevice: "This device",
    cloud: "Cloud",
    recommended: "Recommended",
    later: "Decide later",
    apply: "Apply choice",
    optionsLabel: "What to keep",
  },
  playthroughCount: (count: number) =>
    plural(count, "playthrough", "playthroughs"),
  conflicts: {
    title: "Changes that could not be merged",
    body: "Two devices changed the same value. The cloud value was kept. Pick this device's value to use it instead.",
    cloudValue: "Cloud",
    deviceValue: "This device",
    keepDevice: "Use this device's value",
    dismiss: "Dismiss",
    empty: "Nothing",
    deletedEdited:
      "One device removed this and another changed it. The changed version was kept.",
  },
  banner: {
    title: (count: number) =>
      plural(count, "change needs a decision", "changes need a decision"),
    body: "Two devices changed the same value. The cloud value is kept until you decide.",
    review: "Review",
    waiting: "The first sync is waiting for your choice.",
    choose: "Choose",
  },
  playthroughs: {
    title: "Playthroughs",
    thisDevice: "This device",
    cloud: "Cloud, last sync",
    notInCloud: "Not in the cloud yet",
    review: "Review",
    note: "Deleting a playthrough removes it from the sync file on the next sync.",
    status: {
      synced: "Synced",
      changedHere: "Changed here",
      conflict: "Conflict",
      newHere: "New here",
    },
    describe: (date: string, percent: number) => `${date} · ${percent}%`,
  },
  activity: {
    title: "Recent sync activity",
    empty: "Nothing has synced yet.",
    connected: (provider: string) => `Connected ${provider} on this browser.`,
    uploaded: "Uploaded changes from this device.",
    downloaded: "Downloaded changes from the cloud.",
    merged: "Merged the changes of both sides.",
    conflicts: (count: number) =>
      `${plural(count, "change needs a decision.", "changes need a decision.")}`,
    failed: "The sync failed.",
  },
  settings: {
    title: "Sync settings",
    auto: "Sync automatically",
    autoHint:
      "Syncs when the tracker opens and a few seconds after each change.",
    focus: "Check for changes when I return to the tab",
    focusHint: "Pulls newer cloud data when you switch back to the tracker.",
    metered: "Wait for me on a metered connection",
    meteredHint:
      "Skips automatic syncs while the browser reports a data saver connection. Sync now still works.",
  },
  lives: {
    title: "Where your data lives",
    storage: "Storage",
    folder: "Folder",
    dataFile: "Data file",
    metaFile: "Meta file",
    size: "Size",
    kb: (amount: string) => `${amount} KB`,
    note: "The data file uses the same format as the backup file. The meta file holds the list of devices and no game data. Your sign in is never in either file.",
    googleNote:
      "The Gamerdex folder is visible in your Drive. Gamerdex can open only the files that it created.",
    githubNote:
      "Keep the repository private. Anyone who can open it can read your data.",
    dropboxNote:
      "The Gamerdex folder is inside the Apps folder of your Dropbox. Gamerdex can open only that folder.",
    microsoftNote:
      "The Gamerdex folder is inside the Apps folder of your OneDrive. Gamerdex can open only that folder.",
  },
  device: {
    title: "This device",
    name: "Device name",
    nameHint:
      "The sync files show this name for this device. Renaming it updates the meta file on the next sync.",
    activePlaythrough: "Active playthrough",
    noPlaythrough: "None",
    login: "Sync login",
    loginValue: "On this device only",
    loginHint:
      "The active playthrough and the settings are a choice on each device, and sync never changes them. Your sign in stays on this device. It is never in the saved data, the backup file or the sync files.",
  },
  disconnect: {
    title: "Disconnect",
    body: "Stops syncing on this browser. Your playthroughs stay on this device and in the cloud. Other devices keep syncing.",
    button: (provider: string) => `Disconnect ${provider}`,
    googleHint:
      "To delete the cloud copy yourself, disconnect, then delete the Gamerdex folder in your Google Drive.",
    githubHint:
      "To delete the cloud copy yourself, disconnect, then delete the Gamerdex folder in your repository.",
    dropboxHint:
      "To delete the cloud copy yourself, disconnect, then delete the app folder under Apps in your Dropbox.",
    microsoftHint:
      "To delete the cloud copy yourself, disconnect, then delete the app folder under Apps in your OneDrive.",
  },
  callback: {
    title: "Signing in",
    working: "Finishing the sign in",
    back: "Back to Settings",
    denied: "The sign in was cancelled.",
    state: "The sign in could not be checked. Start again from Settings.",
    missing: "The sign in sent no code. Start again from Settings.",
    failed: "The sign in could not be finished. Try again later.",
  },
} as const;
