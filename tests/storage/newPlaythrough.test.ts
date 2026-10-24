import { bundles } from "stardew-valley-data";
import type { SaveData } from "stardew-valley-data";
import { describe, expect, it, vi } from "vitest";
import {
  activeCountInRoom,
  buildPlaythrough,
  bundlesData,
  canContinueFromBundles,
  chooseBundlePath,
  defaultUploadName,
  emptyBuildForm,
  emptyBundleConfig,
  isBuildFormComplete,
  isRoomFull,
  parseSave,
  playthroughFromSave,
  roomsFor,
  setRemix,
  summarizeBuild,
  summarizeSave,
  toggleBundle,
  toggleItem,
} from "@/service/newPlaythrough";
import type { CompleteBuildForm } from "@/service/newPlaythrough";
import { DEFAULT_GAME_DATA } from "@/data/constants";

vi.mock("@/lib/utils/saveFileMapper", () => ({
  mapSaveDataToGameData: () => ({ mapped: true }),
}));

const standardCount = bundles().standard().get().length;
const itemBundle = bundles()
  .standard()
  .get()
  .find(
    (bundle) =>
      bundle.type === "items" && bundle.items.length > bundle.itemsRequired,
  );
const goldBundle = bundles()
  .standard()
  .get()
  .find((bundle) => bundle.type === "gold");
if (itemBundle?.type !== "items" || goldBundle?.type !== "gold") {
  throw new Error("The data package changed the bundle types this test needs.");
}

const form: CompleteBuildForm = {
  name: "  Sunrise Run ",
  farmName: " Sunrise Farm ",
  characterName: " Sam ",
  farmType: 1,
  platform: "Switch",
};

const communityCenter = () => chooseBundlePath(emptyBundleConfig(), "cc");

describe("bundle selection", () => {
  it("preselects every standard bundle for the Community Center", () => {
    const config = communityCenter();

    expect(config.path).toBe("cc");
    expect(config.activeBundles.length).toBeGreaterThan(0);
    expect(config.activeBundles.length).toBeLessThanOrEqual(standardCount);
    expect(config.selectedItems).toEqual({});
  });

  it("keeps the picks when the path is switched to Joja and back", () => {
    const picked = toggleItem(
      communityCenter(),
      itemBundle.id,
      "0",
      itemBundle.itemsRequired,
    );

    const back = chooseBundlePath(chooseBundlePath(picked, "joja"), "cc");

    expect(back.selectedItems).toEqual({ [itemBundle.id]: ["0"] });
    expect(back.activeBundles).toEqual(picked.activeBundles);
  });

  it("starts remix with no active bundles and standard with all of them", () => {
    const remix = setRemix(communityCenter(), true);
    const standard = setRemix(remix, false);

    expect(remix.activeBundles).toEqual([]);
    expect(remix.isRemix).toBe(true);
    expect(standard.activeBundles).toEqual(communityCenter().activeBundles);
  });

  it("forgets the picks when the bundle type changes", () => {
    const picked = toggleItem(
      communityCenter(),
      itemBundle.id,
      "0",
      itemBundle.itemsRequired,
    );

    expect(setRemix(picked, true).selectedItems).toEqual({});
  });

  it("drops the picks of a bundle that is turned off", () => {
    const picked = toggleItem(
      communityCenter(),
      itemBundle.id,
      "0",
      itemBundle.itemsRequired,
    );

    const off = toggleBundle(picked, itemBundle.id);

    expect(off.activeBundles).not.toContain(itemBundle.id);
    expect(off.selectedItems).toEqual({});
  });

  it("turns a remix bundle on and off", () => {
    const remix = setRemix(communityCenter(), true);

    const on = toggleBundle(remix, itemBundle.id);

    expect(on.activeBundles).toEqual([itemBundle.id]);
    expect(toggleBundle(on, itemBundle.id).activeBundles).toEqual([]);
  });

  it("caps item picks at the number required and lets a pick be removed", () => {
    let config = communityCenter();
    for (let index = 0; index < itemBundle.itemsRequired; index++) {
      config = toggleItem(
        config,
        itemBundle.id,
        String(index),
        itemBundle.itemsRequired,
      );
    }
    const extraIndex = String(itemBundle.itemsRequired);

    const capped = toggleItem(
      config,
      itemBundle.id,
      extraIndex,
      itemBundle.itemsRequired,
    );
    const removed = toggleItem(
      capped,
      itemBundle.id,
      "0",
      itemBundle.itemsRequired,
    );

    expect(capped).toBe(config);
    expect(removed.selectedItems[itemBundle.id]).not.toContain("0");
  });

  it("allows Next for Joja, or for the Community Center with at least one bundle", () => {
    expect(canContinueFromBundles(emptyBundleConfig())).toBe(false);
    expect(
      canContinueFromBundles(chooseBundlePath(emptyBundleConfig(), "joja")),
    ).toBe(true);
    expect(canContinueFromBundles(communityCenter())).toBe(true);
    expect(canContinueFromBundles(setRemix(communityCenter(), true))).toBe(
      false,
    );
  });
});

describe("rooms", () => {
  it("lists only rooms that have bundles and never the abandoned Joja Mart", () => {
    const rooms = roomsFor(true).map((entry) => entry.room);

    expect(rooms).not.toContain("abandoned-joja-mart");
    expect(rooms.length).toBeGreaterThan(0);
  });

  it("offers a remix room more bundles than it has slots", () => {
    const some = roomsFor(true).find(
      (entry) => entry.bundles.length > entry.slots,
    );

    expect(some).toBeDefined();
  });

  it("is full when the active bundles reach the slots", () => {
    const room = roomsFor(true)[0];
    let config = setRemix(communityCenter(), true);
    expect(isRoomFull(config, room)).toBe(false);

    for (const bundle of room.bundles.slice(0, room.slots)) {
      config = toggleBundle(config, bundle.id);
    }

    expect(activeCountInRoom(config, room)).toBe(room.slots);
    expect(isRoomFull(config, room)).toBe(true);
  });
});

describe("build form", () => {
  it("needs a name, a farm name and a platform, and the platform has no default", () => {
    expect(emptyBuildForm().platform).toBe("");
    expect(isBuildFormComplete(emptyBuildForm())).toBe(false);
    expect(isBuildFormComplete({ ...form, name: "   " })).toBe(false);
    expect(isBuildFormComplete({ ...form, farmName: "" })).toBe(false);
    expect(isBuildFormComplete({ ...form, platform: "" })).toBe(false);
    expect(isBuildFormComplete(form)).toBe(true);
  });

  it("does not need the character name", () => {
    expect(isBuildFormComplete({ ...form, characterName: "" })).toBe(true);
  });
});

describe("bundlesData", () => {
  it("writes every item index with the picked ones true and a gold bundle as one entry", () => {
    let config = communityCenter();
    config = toggleItem(config, itemBundle.id, "1", itemBundle.itemsRequired);

    const data = bundlesData(config);

    expect(Object.keys(data[itemBundle.id])).toEqual(
      itemBundle.items.map((_, index) => String(index)),
    );
    expect(data[itemBundle.id]["1"]).toBe(true);
    expect(data[itemBundle.id]["0"]).toBe(false);
    expect(data[goldBundle.id]).toEqual({ "0": false });
  });

  it("writes nothing for a bundle that is not active", () => {
    const remix = toggleBundle(
      setRemix(communityCenter(), true),
      itemBundle.id,
    );

    expect(Object.keys(bundlesData(remix))).toEqual([itemBundle.id]);
  });

  it("writes nothing for Joja", () => {
    expect(bundlesData(chooseBundlePath(emptyBundleConfig(), "joja"))).toEqual(
      {},
    );
  });
});

describe("buildPlaythrough", () => {
  it("saves the trimmed names, platform, farm type and character name", () => {
    const result = buildPlaythrough(form, communityCenter());

    expect(result.name).toBe("Sunrise Run");
    expect(result.platform).toBe("Switch");
    expect(result.data!.character).toMatchObject({
      name: "Sam",
      farmName: "Sunrise Farm",
      farmType: 1,
    });
  });

  it("marks the Community Center unlocked and its bundles active", () => {
    const { data } = buildPlaythrough(form, communityCenter());

    expect(data!.communityCenter.unlocked).toBe(true);
    expect(data!.communityCenter.bundlesActive).toBe(true);
    expect(data!.joja.isMember).toBe(false);
    expect(Object.keys(data!.bundles).length).toBe(
      communityCenter().activeBundles.length,
    );
  });

  it("marks a Joja membership and leaves the Community Center locked", () => {
    const { data } = buildPlaythrough(
      form,
      chooseBundlePath(emptyBundleConfig(), "joja"),
    );

    expect(data!.joja.isMember).toBe(true);
    expect(data!.communityCenter.unlocked).toBe(false);
    expect(data!.bundles).toEqual({});
  });

  it("leaves every other field at its default and does not change the defaults", () => {
    const before = JSON.stringify(DEFAULT_GAME_DATA);

    const { data } = buildPlaythrough(form, communityCenter());

    expect(data!.shipped).toEqual(DEFAULT_GAME_DATA.shipped);
    expect(data!.trackedGifts).toEqual([]);
    expect(JSON.stringify(DEFAULT_GAME_DATA)).toBe(before);
  });
});

const save = {
  player: {
    name: "Sam",
    farmName: "Riverland",
    gender: "male",
    money: 48210,
    totalMoneyEarned: 1234567,
    skills: {
      farming: { level: 10 },
      fishing: { level: 8 },
      foraging: { level: 7 },
      mining: { level: 9 },
      combat: { level: 6 },
    },
  },
  farm: { type: 1 },
  date: { season: "fall", day: 12, year: 2 },
  fishCaught: [1, 2, 3],
  itemsShipped: [1, 2],
  cookingRecipes: [1],
  craftingRecipes: [1, 2, 3, 4],
  museum: { donations: [1, 2] },
  bundles: {
    isJojaRoute: false,
    isCCComplete: false,
    rooms: [{ complete: true }, { complete: false }, { complete: true }],
  },
} as unknown as SaveData;

describe("upload path", () => {
  it("names the playthrough after the farm by default", () => {
    expect(defaultUploadName(save)).toBe("Riverland Farm");
  });

  it("saves the trimmed name, an optional description and PC as the platform", () => {
    const result = playthroughFromSave(save, "  Co-op run ", "  ");

    expect(result).toMatchObject({
      name: "Co-op run",
      description: undefined,
      platform: "PC",
      data: { mapped: true },
    });
    expect(playthroughFromSave(save, "x", " note ").description).toBe("note");
  });

  it("summarizes the save in the five review sections", () => {
    const sections = summarizeSave(save);
    const rows = Object.fromEntries(
      sections.flatMap((section) =>
        section.rows.map((row) => [`${section.title}/${row.label}`, row.value]),
      ),
    );

    expect(sections.map((section) => section.title)).toEqual([
      "Character",
      "Progress",
      "Skills",
      "Collections",
      "Bundles",
    ]);
    expect(rows["Character/Farm"]).toBe("Riverland Farm");
    expect(rows["Character/Farm type"]).toBe("Riverland");
    expect(rows["Progress/Date"]).toBe("fall 12, Year 2");
    expect(rows["Progress/Money"]).toBe("48,210g");
    expect(rows["Progress/Total earned"]).toBe("1,234,567g");
    expect(rows["Skills/Mining"]).toBe("Level 9");
    expect(rows["Collections/Fish caught"]).toBe(3);
    expect(rows["Bundles/Rooms complete"]).toBe("2 / 3");
    expect(rows["Bundles/CC complete"]).toBe("No");
  });

  it("leaves out the room rows for a Joja save", () => {
    const joja = {
      ...save,
      bundles: { ...save.bundles, isJojaRoute: true },
    } as unknown as SaveData;

    const bundleRows = summarizeSave(joja)
      .at(-1)!
      .rows.map((row) => row.label);

    expect(bundleRows).toEqual(["Path"]);
  });

  it("refuses text that is not a save file with the old wording", () => {
    const result = parseSave("<nothing/>");

    expect(result).toEqual({
      ok: false,
      error:
        "Failed to parse save file. Please make sure you selected the full save file (not SaveGameInfo).",
    });
  });
});

describe("build review", () => {
  it("lists the character, farm type and bundle path", () => {
    const rows = summarizeBuild(form, communityCenter()).flatMap((section) =>
      section.rows.map((row) => row.label),
    );

    expect(rows).toEqual([
      "Playthrough name",
      "Farm name",
      "Character name",
      "Farm type",
      "Path",
      "Bundle type",
      "Active bundles",
    ]);
  });

  it("leaves out an empty character name and the bundle rows for Joja", () => {
    const rows = summarizeBuild(
      { ...form, characterName: " " },
      chooseBundlePath(emptyBundleConfig(), "joja"),
    ).flatMap((section) => section.rows.map((row) => row.label));

    expect(rows).toEqual([
      "Playthrough name",
      "Farm name",
      "Farm type",
      "Path",
    ]);
  });
});
