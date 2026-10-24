import { describe, expect, it } from "vitest";
import { searchItems } from "@/lib/utils/searchItems";
import {
  allWeapons,
  emptyWeaponFilters,
  filterWeapons,
  gearCounts,
  gearTotal,
  isFilteringWeapons,
  weaponCount,
  weaponTypes,
} from "@/service/gear";

describe("gear counts", () => {
  it("lists 62 weapons, 18 footwear, 30 rings, 122 hats, 8 trinkets, 7 bait and 10 tackle", () => {
    expect(gearCounts).toEqual({
      weapons: 62,
      footwear: 18,
      rings: 30,
      hats: 122,
      trinkets: 8,
      bait: 7,
      tackle: 10,
    });
    expect(gearTotal).toBe(257);
  });

  it("counts the weapon types as 28 swords, 16 daggers, 16 clubs and 2 slingshots", () => {
    expect(weaponTypes.map((type) => weaponCount(type))).toEqual([
      28, 16, 16, 2,
    ]);
  });
});

describe("weapon filters", () => {
  it("lists every weapon with no filter", () => {
    expect(filterWeapons(emptyWeaponFilters)).toHaveLength(62);
    expect(isFilteringWeapons(emptyWeaponFilters)).toBe(false);
  });

  it("filters by type", () => {
    const daggers = filterWeapons({ ...emptyWeaponFilters, type: "dagger" });

    expect(daggers).toHaveLength(16);
    expect(daggers.every((weapon) => weapon.type === "dagger")).toBe(true);
    expect(isFilteringWeapons({ ...emptyWeaponFilters, type: "dagger" })).toBe(
      true,
    );
  });

  it("searches the name without caring about case, and with the type", () => {
    expect(
      filterWeapons({ query: "RUSTY", type: "all" }).map(
        (weapon) => weapon.name,
      ),
    ).toEqual(["Rusty Sword"]);
    expect(filterWeapons({ query: "rusty", type: "dagger" })).toEqual([]);
    expect(isFilteringWeapons({ query: "x", type: "all" })).toBe(true);
  });

  it("gives a slingshot no melee stats", () => {
    const slingshots = allWeapons.filter(
      (weapon) => weapon.type === "slingshot",
    );

    expect(slingshots).toHaveLength(2);
    expect(slingshots.every((weapon) => !("damageMin" in weapon))).toBe(true);
  });
});

describe("search", () => {
  it("matches the name and any extra text", () => {
    const items = [
      { name: "Alpha", note: "fast" },
      { name: "Beta", note: "slow" },
    ];

    expect(searchItems(items, "alp").map((item) => item.name)).toEqual([
      "Alpha",
    ]);
    expect(
      searchItems(items, "SLOW", (item) => [item.note]).map(
        (item) => item.name,
      ),
    ).toEqual(["Beta"]);
    expect(searchItems(items, "")).toHaveLength(2);
    expect(searchItems(items, "zzz")).toEqual([]);
  });
});
