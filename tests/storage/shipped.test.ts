import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  isShipped,
  setShipped,
  setShippedCount,
  shippedCount,
} from "@/service/shipped";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const fresh = (): GameData => clone(DEFAULT_GAME_DATA);

describe("shipping an item", () => {
  it("adds the entry the old edit step wrote, with a count of one", () => {
    const result = setShipped(fresh(), "378", true);

    expect(result.shipped["378"]).toEqual({ shipped: true, count: 1 });
    expect(isShipped(result, "378")).toBe(true);
  });

  it("deletes the entry, with its count, when switched off", () => {
    const data = fresh();
    data.shipped["378"] = { shipped: true, count: 120 };
    const result = setShipped(data, "378", false);

    expect("378" in result.shipped).toBe(false);
  });

  it("returns the same object when nothing changes", () => {
    const data = fresh();
    data.shipped["378"] = { shipped: true, count: 5 };

    expect(setShipped(data, "378", true)).toBe(data);
    expect(setShipped(data, "380", false)).toBe(data);
  });

  it("keeps the other entries and does not change its input", () => {
    const data = fresh();
    data.shipped["380"] = { shipped: true, count: 9 };
    const before = JSON.stringify(data);
    const result = setShipped(data, "378", true);

    expect(result.shipped["380"]).toEqual({ shipped: true, count: 9 });
    expect(JSON.stringify(data)).toBe(before);
  });
});

describe("the shipped count", () => {
  it("reads zero for an item that is not shipped", () => {
    expect(shippedCount(fresh(), "378")).toBe(0);
  });

  it("reads the saved count of a shipped item", () => {
    const data = fresh();
    data.shipped["378"] = { shipped: true, count: 120 };

    expect(shippedCount(data, "378")).toBe(120);
  });

  it("reads a shipped item with a saved count of zero as one", () => {
    const data = fresh();
    data.shipped["378"] = { shipped: true, count: 0 };

    expect(shippedCount(data, "378")).toBe(1);
  });

  it("changes the count of a shipped item and keeps it shipped", () => {
    const data = setShipped(fresh(), "378", true);
    const result = setShippedCount(data, "378", 40);

    expect(result.shipped["378"]).toEqual({ shipped: true, count: 40 });
  });

  it("never goes below one", () => {
    const data = setShipped(fresh(), "378", true);

    expect(setShippedCount(data, "378", 0).shipped["378"].count).toBe(1);
    expect(setShippedCount(data, "378", -5).shipped["378"].count).toBe(1);
  });

  it("does not ship an item by setting its count", () => {
    const data = fresh();

    expect(setShippedCount(data, "378", 10)).toBe(data);
  });
});
