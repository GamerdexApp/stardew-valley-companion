import type { AppData, Playthrough } from "@/types/app";
import { parseBackupData } from "@/service/backup";
import { storageService } from "@/service/storage";

/** The data file is the backup file of the app, unchanged. */
export type SyncDocument = AppData;

export const isSyncDocument = (data: unknown): data is SyncDocument =>
  parseBackupData(data).ok;

export const readLocalDocument = (): SyncDocument => storageService.load();

const sameJson = (a: Playthrough[], b: Playthrough[]) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * The active playthrough and the settings are a choice of each device, so only the playthroughs are
 * applied. A device whose active playthrough was deleted on another device moves to the first one.
 */
export const applyDocument = (document: SyncDocument): boolean => {
  const current = storageService.load();
  if (sameJson(current.playthroughs, document.playthroughs)) return false;

  const activeStillExists = document.playthroughs.some(
    (playthrough) => playthrough.id === current.activePlaythroughId,
  );
  return storageService.save({
    ...current,
    playthroughs: document.playthroughs,
    activePlaythroughId: activeStillExists
      ? current.activePlaythroughId
      : (document.playthroughs[0]?.id ?? null),
  });
};

export const hasPlaythroughs = (document: SyncDocument) =>
  document.playthroughs.length > 0;
