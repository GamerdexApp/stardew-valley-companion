import { describe, expect, it } from "vitest";
import { tabIndexAfterKey } from "@/lib/utils/tabKeys";

describe("tabIndexAfterKey", () => {
  it("steps with the arrow keys and wraps at both ends", () => {
    expect(tabIndexAfterKey("ArrowRight", 1, 4)).toBe(2);
    expect(tabIndexAfterKey("ArrowRight", 3, 4)).toBe(0);
    expect(tabIndexAfterKey("ArrowLeft", 2, 4)).toBe(1);
    expect(tabIndexAfterKey("ArrowLeft", 0, 4)).toBe(3);
  });

  it("goes to the first and the last tab with Home and End", () => {
    expect(tabIndexAfterKey("Home", 2, 5)).toBe(0);
    expect(tabIndexAfterKey("End", 2, 5)).toBe(4);
  });

  it("ignores every other key", () => {
    expect(tabIndexAfterKey("Enter", 1, 4)).toBeNull();
    expect(tabIndexAfterKey("ArrowDown", 1, 4)).toBeNull();
    expect(tabIndexAfterKey("a", 1, 4)).toBeNull();
  });
});
