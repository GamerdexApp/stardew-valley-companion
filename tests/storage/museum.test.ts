import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  museumSideEffect,
  museumStatus,
  setMuseumStatus,
} from "@/service/museum";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const fresh = (): GameData => clone(DEFAULT_GAME_DATA);

describe("museum status", () => {
  it("reads Missing when there is no entry", () => {
    expect(museumStatus(fresh(), "artifacts", "96")).toBe("missing");
  });

  it("reads Found for found without donated, and Donated for both", () => {
    const data = fresh();
    data.artifacts["96"] = { found: true, donated: false };
    data.artifacts["97"] = { found: true, donated: true };

    expect(museumStatus(data, "artifacts", "96")).toBe("found");
    expect(museumStatus(data, "artifacts", "97")).toBe("donated");
  });

  it("reads an entry that is donated but not found as Missing, as the totals count it", () => {
    const data = fresh();
    data.artifacts["96"] = { found: false, donated: true };

    expect(museumStatus(data, "artifacts", "96")).toBe("missing");
  });

  it("keeps artifacts and minerals apart", () => {
    const data = fresh();
    data.minerals["60"] = { found: true, donated: false };

    expect(museumStatus(data, "artifacts", "60")).toBe("missing");
    expect(museumStatus(data, "minerals", "60")).toBe("found");
  });
});

describe("setting a museum status", () => {
  it("writes the entry the old edit step wrote for Found", () => {
    const result = setMuseumStatus(fresh(), "artifacts", "96", "found");

    expect(result.artifacts["96"]).toEqual({ found: true, donated: false });
  });

  it("sets Found as well when the status is Donated", () => {
    const result = setMuseumStatus(fresh(), "artifacts", "96", "donated");

    expect(result.artifacts["96"]).toEqual({ found: true, donated: true });
  });

  it("keeps Found when Donated goes back to Found", () => {
    const data = setMuseumStatus(fresh(), "artifacts", "96", "donated");
    const result = setMuseumStatus(data, "artifacts", "96", "found");

    expect(result.artifacts["96"]).toEqual({ found: true, donated: false });
  });

  it("deletes the entry for Missing, clearing both", () => {
    const data = setMuseumStatus(fresh(), "artifacts", "96", "donated");
    const result = setMuseumStatus(data, "artifacts", "96", "missing");

    expect("96" in result.artifacts).toBe(false);
  });

  it("never leaves donated without found", () => {
    let data = fresh();
    for (const status of [
      "donated",
      "found",
      "missing",
      "donated",
      "missing",
    ] as const) {
      data = setMuseumStatus(data, "artifacts", "96", status);
      const entry = data.artifacts["96"];
      expect(entry === undefined || entry.found).toBe(true);
    }
  });

  it("does not touch other entries or the input", () => {
    const data = fresh();
    data.artifacts["97"] = { found: true, donated: true };
    const before = JSON.stringify(data);
    const result = setMuseumStatus(data, "artifacts", "96", "found");

    expect(result.artifacts["97"]).toEqual({ found: true, donated: true });
    expect(JSON.stringify(data)).toBe(before);
  });

  it("returns the same object when nothing changes", () => {
    const data = fresh();

    expect(setMuseumStatus(data, "artifacts", "96", "missing")).toBe(data);
  });

  it("rewrites a donated but not found entry cleanly", () => {
    const data = fresh();
    data.artifacts["96"] = { found: false, donated: true };

    expect(
      setMuseumStatus(data, "artifacts", "96", "found").artifacts["96"],
    ).toEqual({
      found: true,
      donated: false,
    });
  });
});

describe("the change a tap makes beyond the chosen status", () => {
  it("reports the two changes that touch two fields", () => {
    expect(museumSideEffect("missing", "donated")).toBe("also-found");
    expect(museumSideEffect("donated", "missing")).toBe("cleared-both");
  });

  it("reports nothing for a one field change", () => {
    expect(museumSideEffect("missing", "found")).toBeNull();
    expect(museumSideEffect("found", "donated")).toBeNull();
    expect(museumSideEffect("donated", "found")).toBeNull();
    expect(museumSideEffect("found", "missing")).toBeNull();
  });
});
