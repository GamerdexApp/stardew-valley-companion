import type { AppData, Playthrough, Settings, Theme } from "@/types/app";

type ParseResult = { ok: true; data: AppData } | { ok: false; error: string };

const themes: Theme[] = ["light", "dark", "system"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const parsePlaythrough = (
  value: unknown,
  position: number,
): Playthrough | string => {
  if (!isRecord(value)) return `Playthrough ${position} is not an object.`;
  if (!isNonEmptyString(value.id)) return `Playthrough ${position} has no id.`;
  if (typeof value.name !== "string") {
    return `Playthrough ${position} has no name.`;
  }
  if (
    !isNonEmptyString(value.createdAt) ||
    !isNonEmptyString(value.lastModified)
  ) {
    return `Playthrough ${position} has no dates.`;
  }
  if (value.data !== undefined && !isRecord(value.data)) {
    return `Playthrough ${position} has no game data.`;
  }
  return value as unknown as Playthrough;
};

const parseSettings = (value: unknown): Settings | string => {
  if (!isRecord(value)) return "The settings are not an object.";
  if (value.theme !== undefined && !themes.includes(value.theme as Theme)) {
    return "The theme must be light, dark or system.";
  }
  if (value.ui !== undefined && !isRecord(value.ui)) {
    return "The interface settings are not an object.";
  }
  return value as Settings;
};

const rejected = (reason: string): ParseResult => ({
  ok: false,
  error: `${reason} Nothing was changed.`,
});

/**
 * Checks the content of a backup file. Nothing is saved by this function. Unknown fields are kept
 * so a file from a later version of the app loads unchanged. A file that the old app wrote always
 * passes.
 */
export const parseBackupData = (raw: unknown): ParseResult => {
  if (!isRecord(raw) || !Array.isArray(raw.playthroughs)) {
    return rejected("The file has no list of playthroughs.");
  }

  const playthroughs: Playthrough[] = [];
  for (const [index, value] of raw.playthroughs.entries()) {
    const playthrough = parsePlaythrough(value, index + 1);
    if (typeof playthrough === "string") return rejected(playthrough);
    playthroughs.push(playthrough);
  }

  const ids = new Set(playthroughs.map((playthrough) => playthrough.id));
  if (ids.size !== playthroughs.length) {
    return rejected("Two playthroughs share the same id.");
  }

  let settings: Settings | undefined;
  if (raw.settings !== undefined) {
    const parsed = parseSettings(raw.settings);
    if (typeof parsed === "string") return rejected(parsed);
    settings = parsed;
  }

  const requestedActive =
    typeof raw.activePlaythroughId === "string"
      ? raw.activePlaythroughId
      : null;
  const activePlaythroughId = ids.has(requestedActive ?? "")
    ? requestedActive
    : (playthroughs[0]?.id ?? null);

  return {
    ok: true,
    data: {
      ...raw,
      playthroughs,
      activePlaythroughId,
      ...(settings && { settings }),
    },
  };
};

/** Checks the text of a backup file. */
export const parseBackup = (text: string): ParseResult => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return rejected("The file is not valid JSON.");
  }
  return parseBackupData(raw);
};

export type ImportMode = "merge" | "replace";

export type ImportRowResult =
  "added" | "updated" | "kept" | "replaced" | "removed";

export interface ImportRow {
  name: string;
  fileModified?: string;
  deviceModified?: string;
  result: ImportRowResult;
}

export const planImport = (
  current: AppData,
  incoming: AppData,
  mode: ImportMode,
): ImportRow[] => {
  const onDevice = new Map(current.playthroughs.map((p) => [p.id, p]));

  const rows: ImportRow[] = incoming.playthroughs.map((playthrough) => {
    const existing = onDevice.get(playthrough.id);
    const base = {
      name: playthrough.name,
      fileModified: playthrough.lastModified,
    };
    if (mode === "replace") {
      return {
        ...base,
        deviceModified: existing?.lastModified,
        result: "replaced",
      };
    }
    if (!existing) return { ...base, result: "added" };
    const fileIsNewer = playthrough.lastModified > existing.lastModified;
    return {
      ...base,
      deviceModified: existing.lastModified,
      result: fileIsNewer ? "updated" : "kept",
    };
  });

  const incomingIds = new Set(incoming.playthroughs.map((p) => p.id));
  current.playthroughs
    .filter((playthrough) => !incomingIds.has(playthrough.id))
    .forEach((playthrough) =>
      rows.push({
        name: playthrough.name,
        deviceModified: playthrough.lastModified,
        result: mode === "replace" ? "removed" : "kept",
      }),
    );
  return rows;
};

export const applyImport = (
  current: AppData,
  incoming: AppData,
  mode: ImportMode,
): AppData => {
  if (mode === "replace") return incoming;

  const incomingById = new Map(incoming.playthroughs.map((p) => [p.id, p]));
  const merged = current.playthroughs.map((playthrough) => {
    const fromFile = incomingById.get(playthrough.id);
    return fromFile && fromFile.lastModified > playthrough.lastModified
      ? fromFile
      : playthrough;
  });
  const knownIds = new Set(current.playthroughs.map((p) => p.id));
  const added = incoming.playthroughs.filter((p) => !knownIds.has(p.id));
  const playthroughs = [...merged, ...added];

  const settings = current.settings ?? incoming.settings;
  const activeStillExists = playthroughs.some(
    (p) => p.id === current.activePlaythroughId,
  );

  return {
    ...incoming,
    ...current,
    playthroughs,
    activePlaythroughId: activeStillExists
      ? current.activePlaythroughId
      : (playthroughs[0]?.id ?? null),
    ...(settings && { settings }),
  };
};

export const summarizeImport = (rows: ImportRow[]): string => {
  const labels: Record<ImportRowResult, string> = {
    added: "added",
    updated: "updated",
    kept: "kept",
    replaced: "replaced",
    removed: "removed",
  };
  return (Object.keys(labels) as ImportRowResult[])
    .map((result) => ({
      result,
      amount: rows.filter((row) => row.result === result).length,
    }))
    .filter(({ amount }) => amount > 0)
    .map(({ result, amount }) => `${amount} ${labels[result]}`)
    .join(", ");
};

export const backupFileName = (date = new Date()) =>
  `stardew-companion-backup-${date.toISOString().split("T")[0]}.json`;

export const downloadBackup = (data: AppData): string => {
  const fileName = backupFileName();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return fileName;
};
