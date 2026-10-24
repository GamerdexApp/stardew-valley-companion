import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allArtifacts,
  artifactSummary,
  emptyArtifactFilters,
  filterArtifacts,
  isFilteringArtifacts,
} from "@/service/artifacts";
import type { ArtifactFilters } from "@/service/artifacts";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const fresh = (): GameData => clone(DEFAULT_GAME_DATA);
const withStates = (): GameData => {
  const data = fresh();
  data.artifacts["96"] = { found: true, donated: true };
  data.artifacts["97"] = { found: true, donated: false };
  return data;
};
const names = (filters: Partial<ArtifactFilters>, data = withStates()) =>
  filterArtifacts(data, { ...emptyArtifactFilters, ...filters }).map(
    (a) => a.name,
  );

describe("artifact filters", () => {
  it("lists all 42 with no filter", () => {
    expect(names({})).toHaveLength(42);
    expect(allArtifacts).toHaveLength(42);
  });

  it("searches by name without case", () => {
    expect(names({ query: "dwarf scroll" })).toEqual([
      "Dwarf Scroll I",
      "Dwarf Scroll II",
      "Dwarf Scroll III",
      "Dwarf Scroll IV",
    ]);
  });

  it("filters by donation", () => {
    expect(names({ donation: "donated" })).toEqual(["Dwarf Scroll I"]);
    expect(names({ donation: "not-donated" })).toHaveLength(41);
  });

  it("counts a donated artifact as found", () => {
    expect(names({ found: "found" })).toEqual([
      "Dwarf Scroll I",
      "Dwarf Scroll II",
    ]);
    expect(names({ found: "not-found" })).toHaveLength(40);
  });

  it("keeps only artifacts with a donation reward", () => {
    expect(names({ reward: "has-reward" })).toHaveLength(15);
  });

  it("combines filters", () => {
    expect(names({ found: "found", donation: "not-donated" })).toEqual([
      "Dwarf Scroll II",
    ]);
  });

  it("knows when a filter is on", () => {
    expect(isFilteringArtifacts(emptyArtifactFilters)).toBe(false);
    expect(isFilteringArtifacts({ ...emptyArtifactFilters, query: "a" })).toBe(
      true,
    );
  });
});

describe("artifact summary", () => {
  it("totals 42 with 15 rewards", () => {
    const summary = artifactSummary(fresh());

    expect(summary.total).toBe(42);
    expect(summary.withRewards).toBe(15);
    expect(summary.found).toEqual({ current: 0, total: 42 });
    expect(summary.donated).toBe(0);
  });

  it("counts found including donated, and donated alone", () => {
    const summary = artifactSummary(withStates());

    expect(summary.found.current).toBe(2);
    expect(summary.donated).toBe(1);
  });
});
