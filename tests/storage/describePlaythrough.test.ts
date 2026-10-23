import { describe, expect, it } from "vitest";
import { describePlaythrough } from "@/service/playthroughs";
import { emptyPlaythrough, progressedPlaythrough } from "./fixtures";

describe("describePlaythrough", () => {
  it("shows the in-game date and the platform", () => {
    expect(describePlaythrough(progressedPlaythrough())).toBe(
      "Year 2, Fall 12 · PC",
    );
  });

  it("shows only the date when no platform is set", () => {
    const playthrough = { ...emptyPlaythrough(), platform: undefined };

    expect(describePlaythrough(playthrough)).toBe("Year 1, Spring 1");
  });
});
