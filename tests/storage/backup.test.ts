import { describe, expect, it } from "vitest";
import type { AppData } from "@/types/app";
import {
  applyImport,
  backupFileName,
  parseBackup,
  planImport,
  summarizeImport,
} from "@/service/backup";
import {
  completeFixtures,
  emptyPlaythrough,
  playthroughWithUnknownFields,
  progressedPlaythrough,
} from "./fixtures";

const file = (data: unknown) => JSON.stringify(data);

const asAppData = (
  playthroughs: AppData["playthroughs"],
  active: string | null = null,
): AppData => ({ playthroughs, activePlaythroughId: active });

describe("parseBackup", () => {
  it("accepts a file the old app wrote", () => {
    const saved = asAppData(completeFixtures(), progressedPlaythrough().id);

    const result = parseBackup(JSON.stringify(saved, null, 2));

    expect(result).toEqual({ ok: true, data: saved });
  });

  it("keeps unknown fields at every level", () => {
    const fixture = playthroughWithUnknownFields();
    const saved = { ...asAppData([fixture], fixture.id), futureTop: 1 };

    const result = parseBackup(file(saved));

    expect(result.ok && result.data).toEqual(saved);
  });

  it("accepts an unknown platform label", () => {
    const odd = { ...emptyPlaythrough(), platform: "Steam Deck" };

    expect(parseBackup(file(asAppData([odd as never]))).ok).toBe(true);
  });

  it("accepts a playthrough without game data", () => {
    const { data: _data, ...withoutData } = emptyPlaythrough();

    expect(parseBackup(file(asAppData([withoutData as never]))).ok).toBe(true);
  });

  it("falls back to the first playthrough when the active id is unknown", () => {
    const saved = asAppData(
      [emptyPlaythrough(), progressedPlaythrough()],
      "gone",
    );

    const result = parseBackup(file(saved));

    expect(result.ok && result.data.activePlaythroughId).toBe(
      emptyPlaythrough().id,
    );
  });

  it.each([
    ["text that is not JSON", "not json"],
    ["a file without a playthroughs list", file({ hello: "world" })],
    ["a list that is not an array", file({ playthroughs: {} })],
    ["a playthrough that is not an object", file({ playthroughs: [1] })],
    [
      "a playthrough without an id",
      file({
        playthroughs: [{ name: "x", createdAt: "a", lastModified: "a" }],
      }),
    ],
    [
      "a playthrough without dates",
      file({ playthroughs: [{ id: "a", name: "x" }] }),
    ],
    [
      "a playthrough whose data is not an object",
      file({ playthroughs: [{ ...emptyPlaythrough(), data: [] }] }),
    ],
    [
      "a repeated id",
      file(asAppData([emptyPlaythrough(), emptyPlaythrough()])),
    ],
    [
      "an unknown theme",
      file({ ...asAppData([]), settings: { theme: "blue" } }),
    ],
    [
      "settings that are not an object",
      file({ ...asAppData([]), settings: [] }),
    ],
  ])("rejects %s and says nothing was changed", (_label, text) => {
    const result = parseBackup(text);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/Nothing was changed\.$/);
  });
});

describe("planImport and applyImport", () => {
  const older = {
    ...progressedPlaythrough(),
    lastModified: "2026-01-01T00:00:00.000Z",
  };
  const newer = {
    ...older,
    name: "Newer",
    lastModified: "2026-02-01T00:00:00.000Z",
  };
  const extra = emptyPlaythrough();

  it("merge adds new playthroughs, takes newer ones and keeps the rest", () => {
    const current = asAppData([older, extra], older.id);
    const incoming = asAppData([newer, { ...extra, id: "other" }]);

    const rows = planImport(current, incoming, "merge");
    const result = applyImport(current, incoming, "merge");

    expect(rows.map((r) => r.result)).toEqual(["updated", "added", "kept"]);
    expect(result.playthroughs.map((p) => p.name)).toEqual([
      "Newer",
      "Fresh farm",
      "Fresh farm",
    ]);
    expect(result.activePlaythroughId).toBe(older.id);
  });

  it("merge keeps the device copy when the file copy is older", () => {
    const current = asAppData([newer], newer.id);
    const incoming = asAppData([older]);

    expect(planImport(current, incoming, "merge")[0].result).toBe("kept");
    expect(applyImport(current, incoming, "merge").playthroughs[0].name).toBe(
      "Newer",
    );
  });

  it("replace uses the file and lists what it removes", () => {
    const current = asAppData([older, extra], older.id);
    const incoming = asAppData([newer], newer.id);

    expect(
      planImport(current, incoming, "replace").map((r) => r.result),
    ).toEqual(["replaced", "removed"]);
    expect(applyImport(current, incoming, "replace")).toEqual(incoming);
  });

  it("merge keeps the device settings and uses the file settings when the device has none", () => {
    const withTheme = {
      ...asAppData([older]),
      settings: { theme: "dark" as const },
    };
    const fromFile = {
      ...asAppData([newer]),
      settings: { theme: "light" as const },
    };

    expect(applyImport(withTheme, fromFile, "merge").settings).toEqual({
      theme: "dark",
    });
    expect(applyImport(asAppData([older]), fromFile, "merge").settings).toEqual(
      { theme: "light" },
    );
  });

  it("merge picks a new active playthrough when the active one is gone", () => {
    const current = asAppData([older], "missing");

    expect(
      applyImport(current, asAppData([]), "merge").activePlaythroughId,
    ).toBe(older.id);
  });

  it("summarizes the rows", () => {
    const rows = planImport(
      asAppData([older, extra]),
      asAppData([newer, { ...extra, id: "other" }]),
      "merge",
    );

    expect(summarizeImport(rows)).toBe("1 added, 1 updated, 1 kept");
  });
});

describe("backupFileName", () => {
  it("keeps the file name of the old app", () => {
    expect(backupFileName(new Date("2026-10-23T12:00:00Z"))).toBe(
      "stardew-companion-backup-2026-10-23.json",
    );
  });
});
