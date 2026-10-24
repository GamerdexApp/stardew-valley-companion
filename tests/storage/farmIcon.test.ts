import { describe, expect, it } from "vitest";
import { getFarmIcon } from "@/lib/utils/farmIcon";
import { mapOfFarmType } from "@/data/constants/farms";

describe("farm icon", () => {
  it("gives each farm type its own map icon", () => {
    const icons = [0, 1, 2, 3, 4, 5, 6, 7].map(getFarmIcon);

    expect(new Set(icons).size).toBe(8);
    expect(icons[0]).toBe("/images/maps/icons/Standard Farm Map Icon.png");
    expect(icons[1]).toBe("/images/maps/icons/Riverland Farm Map Icon.png");
    expect(icons[2]).toBe("/images/maps/icons/Forest Farm Map Icon.png");
    expect(icons[6]).toBe("/images/maps/icons/Beach Farm Map Icon.png");
  });

  it("finds Meadowlands as type 7 although its id in the data is a name", () => {
    expect(mapOfFarmType(7).name).toBe("Meadowlands");
    expect(getFarmIcon(7)).toBe(
      "/images/maps/icons/Meadowlands Farm Map Icon.png",
    );
  });

  it("matches the icon of every map in the game data", () => {
    for (let type = 0; type <= 7; type++) {
      expect(getFarmIcon(type)).toBe(`/${mapOfFarmType(type).icon}`);
    }
  });

  it("reads an unknown type as the Standard farm", () => {
    expect(mapOfFarmType(42).name).toBe("Standard");
    expect(getFarmIcon(-1)).toBe(getFarmIcon(0));
    expect(getFarmIcon(42)).toBe(getFarmIcon(0));
  });
});
