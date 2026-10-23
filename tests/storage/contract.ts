import { beforeEach, describe, expect, it } from "vitest";
import type { AppData, Playthrough } from "@/types/app";
import { DEFAULT_GAME_DATA } from "@/data/constants";
import {
  completeFixtures,
  emptyPlaythrough,
  playthroughMissingNewerFields,
  playthroughWithUnknownFields,
  progressedPlaythrough,
} from "./fixtures";

export const STORAGE_KEY = "stardew-valley-companion";

export interface StorageAdapter {
  load(): AppData;
  add(input: Pick<Playthrough, "name" | "platform" | "description">): void;
  update(id: string, updates: Partial<Playthrough>): void;
  remove(id: string): void;
  setActive(id: string | null): void;
  exportJson(): string;
  importText(text: string): { success: boolean; error?: string };
  clear(): void;
}

const seed = (data: AppData) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const stored = (): AppData =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AppData;

const asAppData = (
  playthroughs: Playthrough[],
  active: string | null,
): AppData => ({
  playthroughs,
  activePlaythroughId: active,
});

export function describeStorageContract(
  label: string,
  createAdapter: () => StorageAdapter,
) {
  describe(`storage contract: ${label}`, () => {
    let adapter: StorageAdapter;

    beforeEach(() => {
      localStorage.clear();
      adapter = createAdapter();
    });

    it("starts empty when nothing is stored", () => {
      expect(adapter.load()).toEqual({
        playthroughs: [],
        activePlaythroughId: null,
      });
    });

    it("loads a complete save unchanged", () => {
      const saved = asAppData(completeFixtures(), progressedPlaythrough().id);
      seed(saved);

      expect(adapter.load()).toEqual(saved);
    });

    it("keeps unknown fields on the playthrough and in its data", () => {
      const fixture = playthroughWithUnknownFields();
      seed(asAppData([fixture], fixture.id));

      expect(adapter.load().playthroughs[0]).toEqual(fixture);
    });

    it("keeps unknown top level fields", () => {
      const saved = {
        ...asAppData([emptyPlaythrough()], null),
        settings: { theme: "dark" },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      expect(adapter.load()).toMatchObject({ settings: { theme: "dark" } });
    });

    it("fills missing fields with defaults and removes nothing", () => {
      const fixture = playthroughMissingNewerFields();
      seed(asAppData([fixture], fixture.id));

      const { data } = adapter.load().playthroughs[0];

      expect(data.trackedGifts).toEqual(DEFAULT_GAME_DATA.trackedGifts);
      expect(data.mastery).toEqual(DEFAULT_GAME_DATA.mastery);
      expect(data.villagers).toEqual(fixture.data.villagers);
      expect(data.shipped).toEqual(fixture.data.shipped);
    });

    it("adds a playthrough and makes the first one active", () => {
      adapter.add({ name: "First", platform: "PC" });
      adapter.add({ name: "Second", platform: "Switch" });

      const { playthroughs, activePlaythroughId } = stored();

      expect(playthroughs.map((p) => p.name)).toEqual(["First", "Second"]);
      expect(activePlaythroughId).toBe(playthroughs[0].id);
      expect(playthroughs[0].data).toEqual(DEFAULT_GAME_DATA);
      expect(playthroughs[0].createdAt).toBe(playthroughs[0].lastModified);
    });

    it("updates a playthrough and touches only lastModified besides the changes", () => {
      const fixture = progressedPlaythrough();
      seed(asAppData([fixture], fixture.id));

      adapter.update(fixture.id, { name: "Renamed" });

      const updated = stored().playthroughs[0];
      const { lastModified: before, ...rest } = fixture;
      const { lastModified: after, ...updatedRest } = updated;

      expect(updatedRest).toEqual({ ...rest, name: "Renamed" });
      expect(after).not.toBe(before);
    });

    it("deletes a playthrough and keeps the active one when another is deleted", () => {
      const first = emptyPlaythrough();
      const second = progressedPlaythrough();
      seed(asAppData([first, second], second.id));

      adapter.remove(first.id);

      expect(stored()).toEqual(asAppData([second], second.id));
    });

    it("sets and clears the active playthrough", () => {
      const first = emptyPlaythrough();
      const second = progressedPlaythrough();
      seed(asAppData([first, second], first.id));

      adapter.setActive(second.id);
      expect(stored().activePlaythroughId).toBe(second.id);

      adapter.setActive(null);
      expect(stored().activePlaythroughId).toBeNull();
    });

    it("exports the stored object as formatted JSON", () => {
      const saved = asAppData(completeFixtures(), null);
      seed(saved);

      expect(JSON.parse(adapter.exportJson())).toEqual(saved);
      expect(adapter.exportJson()).toBe(JSON.stringify(saved, null, 2));
    });

    it("imports an export file and gives the same data back", () => {
      const saved = asAppData(completeFixtures(), progressedPlaythrough().id);
      seed(saved);
      const file = adapter.exportJson();
      adapter.clear();

      expect(adapter.importText(file)).toEqual({ success: true });
      expect(adapter.load()).toEqual(saved);
    });

    it("replaces existing data on import", () => {
      seed(asAppData([emptyPlaythrough()], null));
      const incoming = asAppData([progressedPlaythrough()], null);

      adapter.importText(JSON.stringify(incoming));

      expect(adapter.load().playthroughs.map((p) => p.name)).toEqual([
        "Riverland",
      ]);
    });

    it("rejects a file without a playthroughs array and keeps the stored data", () => {
      const saved = asAppData([emptyPlaythrough()], null);
      seed(saved);

      const result = adapter.importText(JSON.stringify({ hello: "world" }));

      expect(result.success).toBe(false);
      expect(stored()).toEqual(saved);
    });

    it("rejects text that is not JSON and keeps the stored data", () => {
      const saved = asAppData([emptyPlaythrough()], null);
      seed(saved);

      const result = adapter.importText("not json");

      expect(result.success).toBe(false);
      expect(stored()).toEqual(saved);
    });

    it("removes the key on clear", () => {
      seed(asAppData([emptyPlaythrough()], null));

      adapter.clear();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
}
