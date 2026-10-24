import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppData } from "@/types/app";
import * as appData from "@/service/appData";
import { applyImport, parseBackup } from "@/service/backup";
import { STORAGE_KEY, storageService } from "@/service/storage";
import { describeStorageContract } from "./contract";
import {
  emptyPlaythrough,
  playthroughMissingNewerFields,
  progressedPlaythrough,
} from "./fixtures";

const apply = (change: (current: AppData) => AppData) =>
  storageService.save(change(storageService.load()));

describeStorageContract("new store", () => ({
  load: storageService.load,
  add: (input) => apply((current) => appData.addPlaythrough(current, input)),
  update: (id, updates) =>
    apply((current) => appData.updatePlaythrough(current, id, updates)),
  remove: (id) => apply((current) => appData.deletePlaythrough(current, id)),
  setActive: (id) =>
    apply((current) => appData.setActivePlaythrough(current, id)),
  exportJson: () => JSON.stringify(storageService.load(), null, 2),
  importText: (text) => {
    const parsed = parseBackup(text);
    if (!parsed.ok) return { success: false, error: parsed.error };
    storageService.save(
      applyImport(storageService.load(), parsed.data, "replace"),
    );
    return { success: true };
  },
  clear: () => storageService.clear(),
}));

describe("new store rules", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("activates the most recently updated playthrough when the active one is deleted", () => {
    const oldest = {
      ...emptyPlaythrough(),
      id: "a",
      lastModified: "2026-01-01T00:00:00.000Z",
    };
    const newest = {
      ...emptyPlaythrough(),
      id: "b",
      lastModified: "2026-03-01T00:00:00.000Z",
    };
    const active = {
      ...emptyPlaythrough(),
      id: "c",
      lastModified: "2026-02-01T00:00:00.000Z",
    };

    const result = appData.deletePlaythrough(
      { playthroughs: [oldest, newest, active], activePlaythroughId: "c" },
      "c",
    );

    expect(result.activePlaythroughId).toBe("b");
  });

  it("has no active playthrough after the last one is deleted", () => {
    const only = emptyPlaythrough();

    const result = appData.deletePlaythrough(
      { playthroughs: [only], activePlaythroughId: only.id },
      only.id,
    );

    expect(result).toEqual({ playthroughs: [], activePlaythroughId: null });
  });

  it("does not write anything when an old save is loaded", () => {
    const old = playthroughMissingNewerFields();
    const raw = JSON.stringify({
      playthroughs: [old],
      activePlaythroughId: old.id,
    });
    localStorage.setItem(STORAGE_KEY, raw);

    storageService.load();

    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });

  it("returns the same object until the stored text changes", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        playthroughs: [emptyPlaythrough()],
        activePlaythroughId: null,
      }),
    );

    expect(storageService.load()).toBe(storageService.load());
  });

  it("starts empty when the stored text is not a save", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ hello: "world" }));

    expect(storageService.load().playthroughs).toEqual([]);
  });

  it("starts empty when the stored text is not JSON", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, "{broken");

    expect(storageService.load().playthroughs).toEqual([]);
  });

  it("reports a refused write", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    });

    expect(
      storageService.save({ playthroughs: [], activePlaythroughId: null }),
    ).toBe(false);
  });

  it("notifies subscribers after a save", () => {
    const listener = vi.fn();
    const unsubscribe = storageService.subscribe(listener);

    storageService.save({ playthroughs: [], activePlaythroughId: null });
    unsubscribe();
    storageService.save({ playthroughs: [], activePlaythroughId: null });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps the settings through save, export and import", () => {
    const settings = { theme: "dark" as const, ui: { lastTab: "fish" } };
    const saved: AppData = {
      playthroughs: [progressedPlaythrough()],
      activePlaythroughId: null,
      settings,
    };
    storageService.save(saved);

    const file = JSON.stringify(storageService.load(), null, 2);
    storageService.clear();
    const parsed = parseBackup(file);

    expect(parsed.ok && parsed.data.settings).toEqual(settings);
  });

  it("merges settings updates without dropping other settings", () => {
    const first = appData.updateSettings(
      { playthroughs: [], activePlaythroughId: null },
      { theme: "dark" },
    );
    const second = appData.updateSettings(first, { ui: { lastTab: "fish" } });

    expect(second.settings).toEqual({ theme: "dark", ui: { lastTab: "fish" } });
  });

  it("changes the platform without touching lastModified", () => {
    const fixture = { ...progressedPlaythrough(), platform: "PC" as const };
    const current: AppData = {
      playthroughs: [fixture],
      activePlaythroughId: null,
    };

    const result = appData.setPlatform(current, fixture.id, "Switch");

    expect(result.playthroughs[0]).toEqual({
      ...fixture,
      platform: "Switch",
    });
    expect(result.playthroughs[0].lastModified).toBe(fixture.lastModified);
  });

  it("clears the platform when set to undefined", () => {
    const fixture = { ...progressedPlaythrough(), platform: "PC" as const };
    const current: AppData = {
      playthroughs: [fixture],
      activePlaythroughId: null,
    };

    const result = appData.setPlatform(current, fixture.id, undefined);

    expect(result.playthroughs[0].platform).toBeUndefined();
  });
});
