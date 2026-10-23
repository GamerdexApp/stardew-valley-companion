import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allRarecrows,
  countRarecrowsObtained,
  emptyRarecrowFilters,
  filterRarecrows,
  isFilteringRarecrows,
  isObtained,
  setObtained,
} from "@/service/rarecrows";
import type { RarecrowFilters } from "@/service/rarecrows";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const withStates = (): GameData => {
  const data = clone(DEFAULT_GAME_DATA);
  data.rarecrows = ["110", "113"];
  return data;
};
const names = (filters: Partial<RarecrowFilters>) =>
  filterRarecrows(withStates(), { ...emptyRarecrowFilters, ...filters }).map(
    (r) => r.name,
  );

describe("rarecrows", () => {
  it("lists 8", () => {
    expect(allRarecrows).toHaveLength(8);
  });

  it("reads the saved list of ids", () => {
    expect(isObtained(withStates(), "110")).toBe(true);
    expect(isObtained(withStates(), "126")).toBe(false);
  });

  it("adds an id once and takes it out", () => {
    const added = setObtained(clone(DEFAULT_GAME_DATA), "110", true);
    const again = setObtained(added, "110", true);
    const removed = setObtained(added, "110", false);

    expect(added.rarecrows).toEqual(["110"]);
    expect(again).toBe(added);
    expect(removed.rarecrows).toEqual([]);
  });

  it("does not change its input or the other ids", () => {
    const data = withStates();
    const before = JSON.stringify(data);
    const result = setObtained(data, "126", true);

    expect(result.rarecrows).toEqual(["110", "113", "126"]);
    expect(JSON.stringify(data)).toBe(before);
  });
});

describe("rarecrow filters", () => {
  it("splits obtained and missing", () => {
    expect(names({ status: "obtained" })).toEqual(["Rarecrow 1", "Rarecrow 2"]);
    expect(names({ status: "missing" })).toHaveLength(6);
  });

  it("searches the name and how to obtain it", () => {
    expect(names({ query: "rarecrow 3" })).toEqual(["Rarecrow 3"]);
    expect(names({ query: "festival" }).length).toBeGreaterThan(0);
    expect(names({ query: "zzz" })).toEqual([]);
  });

  it("knows when a filter is on", () => {
    expect(isFilteringRarecrows(emptyRarecrowFilters)).toBe(false);
    expect(
      isFilteringRarecrows({ ...emptyRarecrowFilters, status: "missing" }),
    ).toBe(true);
  });

  it("counts obtained over 8", () => {
    expect(countRarecrowsObtained(withStates())).toEqual({
      current: 2,
      total: 8,
    });
  });
});
