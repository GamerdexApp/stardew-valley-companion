import { describe, expect, it } from "vitest";
import type { Playthrough } from "@/types/app";
import {
  describeFarm,
  filterAndSort,
  formatGameDate,
  isFiltered,
  nextActiveAfterDelete,
  perfectionPercent,
} from "@/service/playthroughList";
import { emptyPlaythrough, progressedPlaythrough } from "./fixtures";

const make = (
  id: string,
  name: string,
  createdAt: string,
  lastModified: string,
  platform?: Playthrough["platform"],
): Playthrough => ({
  ...emptyPlaythrough(),
  id,
  name,
  createdAt,
  lastModified,
  platform,
});

const alpha = make(
  "a",
  "alpha farm",
  "2026-03-01T00:00:00Z",
  "2026-05-01T00:00:00Z",
  "PC",
);
const beta = make(
  "b",
  "Beta Farm",
  "2026-01-01T00:00:00Z",
  "2026-07-01T00:00:00Z",
  "Switch",
);
const gamma = make(
  "c",
  "Gamma",
  "2026-02-01T00:00:00Z",
  "2026-06-01T00:00:00Z",
);
const all = [alpha, beta, gamma];
const query = {
  search: "",
  sort: "lastModified" as const,
  platform: "all" as const,
};

describe("filterAndSort", () => {
  it("sorts by last modified, newest first", () => {
    expect(filterAndSort(all, query).map((p) => p.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by date created, newest first", () => {
    expect(
      filterAndSort(all, { ...query, sort: "createdAt" }).map((p) => p.id),
    ).toEqual(["a", "c", "b"]);
  });

  it("sorts by name, A to Z, ignoring case", () => {
    expect(
      filterAndSort(all, { ...query, sort: "name" }).map((p) => p.name),
    ).toEqual(["alpha farm", "Beta Farm", "Gamma"]);
  });

  it("matches the name only, ignoring case and outer spaces", () => {
    expect(
      filterAndSort(all, { ...query, search: "  FARM " }).map((p) => p.id),
    ).toEqual(["b", "a"]);
  });

  it("does not match the description", () => {
    const described = { ...gamma, description: "farm notes" };

    expect(filterAndSort([described], { ...query, search: "notes" })).toEqual(
      [],
    );
  });

  it("filters by platform and leaves out playthroughs with no platform", () => {
    expect(
      filterAndSort(all, { ...query, platform: "PC" }).map((p) => p.id),
    ).toEqual(["a"]);
  });

  it("combines search and platform", () => {
    expect(
      filterAndSort(all, { ...query, search: "farm", platform: "Switch" }).map(
        (p) => p.id,
      ),
    ).toEqual(["b"]);
  });

  it("does not change the list it is given", () => {
    const before = all.map((p) => p.id);

    filterAndSort(all, { ...query, sort: "name" });

    expect(all.map((p) => p.id)).toEqual(before);
  });
});

describe("isFiltered", () => {
  it("is false for the default view", () => {
    expect(isFiltered(query)).toBe(false);
  });

  it("is true for a search or a platform, but a sort alone is not a filter", () => {
    expect(isFiltered({ ...query, search: "x" })).toBe(true);
    expect(isFiltered({ ...query, platform: "PC" })).toBe(true);
    expect(isFiltered({ ...query, search: "  ", sort: "name" })).toBe(false);
  });
});

describe("nextActiveAfterDelete", () => {
  it("is the most recently modified of the others", () => {
    expect(nextActiveAfterDelete(all, "b")?.id).toBe("c");
  });

  it("is null when nothing else is left", () => {
    expect(nextActiveAfterDelete([alpha], "a")).toBeNull();
  });
});

describe("card facts", () => {
  it("formats the in-game date", () => {
    expect(formatGameDate(progressedPlaythrough())).toBe("Fall 12, Year 2");
  });

  it("names the farm type and the character", () => {
    expect(describeFarm(progressedPlaythrough())).toMatch(/ · Sam$/);
  });

  it("leaves out an empty character name", () => {
    expect(describeFarm(emptyPlaythrough())).not.toContain("·");
  });

  it("gives 0 percent perfection for a new playthrough and more for one with progress", () => {
    expect(perfectionPercent(emptyPlaythrough())).toBe(0);
    expect(perfectionPercent(progressedPlaythrough())).toBeGreaterThan(0);
  });
});
