import {
  type FirstSyncChoice,
  MemoryProvider,
  sync,
  type SyncResult,
  type SyncState,
} from "@gamerdexapp/gamerdex-sync";
import { beforeEach, describe, expect, it } from "vitest";
import type { AppData, Playthrough, Settings } from "@/types/app";
import {
  applyDocument,
  isSyncDocument,
  readLocalDocument,
  type SyncDocument,
} from "@/lib/sync/document";
import { syncSchema } from "@/lib/sync/schema";
import { parseBackup } from "@/service/backup";
import { storageService } from "@/service/storage";
import {
  emptyPlaythrough,
  playthroughWithUnknownFields,
  progressedPlaythrough,
} from "./fixtures";

const APP_ID = "stardew-valley-companion";
const FIRST = "22222222-2222-4222-8222-222222222222";
const SECOND = "11111111-1111-4111-8111-111111111111";

class Device {
  state: SyncState | null = null;
  constructor(
    readonly id: string,
    public playthroughs: Playthrough[],
    public activePlaythroughId: string | null = playthroughs[0]?.id ?? null,
    public settings?: Settings,
  ) {}

  document(): SyncDocument {
    return structuredClone({
      playthroughs: this.playthroughs,
      activePlaythroughId: this.activePlaythroughId,
      ...(this.settings && { settings: this.settings }),
    });
  }

  async sync(
    cloud: MemoryProvider,
    firstSync?: FirstSyncChoice,
  ): Promise<SyncResult> {
    const result = await sync({
      appId: APP_ID,
      deviceId: this.id,
      deviceName: this.id,
      provider: cloud,
      schema: syncSchema,
      local: this.document(),
      state: this.state,
      firstSync,
      validate: isSyncDocument,
      now: () => "2026-01-02T00:00:00.000Z",
    });
    if (result.status === "synced") {
      // The app applies the playthroughs only, so the device keeps its own active one and settings.
      this.playthroughs = structuredClone(
        (result.data as SyncDocument).playthroughs,
      );
      this.state = structuredClone(result.state);
    }
    return result;
  }

  edit(id: string, change: (playthrough: Playthrough) => void) {
    change(this.get(id)!);
  }

  get(id: string) {
    return this.playthroughs.find((playthrough) => playthrough.id === id);
  }
}

const synced = async (result: Promise<SyncResult>) => {
  const outcome = await result;
  if (outcome.status !== "synced") throw new Error("expected a finished sync");
  return outcome;
};

const twoDevices = async () => {
  const cloud = new MemoryProvider();
  const a = new Device("a", [progressedPlaythrough(), emptyPlaythrough()]);
  await a.sync(cloud);
  const b = new Device("b", []);
  await synced(b.sync(cloud, "keep-cloud"));
  return { cloud, a, b };
};

/** Device a edits, syncs, then device b edits and syncs and takes the result of both. */
const bothEdit = async (
  editA: (p: Playthrough) => void,
  editB: (p: Playthrough) => void,
  id = FIRST,
) => {
  const { cloud, a, b } = await twoDevices();
  a.edit(id, editA);
  b.edit(id, editB);
  await a.sync(cloud);
  const result = await synced(b.sync(cloud));
  await a.sync(cloud);
  return { cloud, a, b, result, merged: b.get(id)! };
};

describe("the data file", () => {
  it("is the backup file of the app, with the playthroughs only", async () => {
    const cloud = new MemoryProvider();
    const a = new Device("a", [progressedPlaythrough()], FIRST, {
      theme: "dark",
    });
    await a.sync(cloud);

    const file = await cloud.read(`Gamerdex/${APP_ID}/data.json`);
    const data = JSON.parse(file!.content);

    expect(Object.keys(data)).toEqual(["playthroughs"]);
    expect(parseBackup(file!.content).ok).toBe(true);
    expect(data.playthroughs[0]).toEqual(progressedPlaythrough());
  });

  it("matches the saved data of the app", () => {
    localStorage.clear();
    const data: AppData = {
      playthroughs: [progressedPlaythrough()],
      activePlaythroughId: FIRST,
    };
    storageService.save(data);

    expect(readLocalDocument()).toEqual(data);
  });

  it("is refused when it is not a backup file", () => {
    expect(isSyncDocument({ playthroughs: [{ id: 1 }] })).toBe(false);
    expect(isSyncDocument({ playthroughs: "none" })).toBe(false);
    expect(isSyncDocument(null)).toBe(false);
    expect(
      isSyncDocument({
        playthroughs: [],
        activePlaythroughId: null,
        settings: { theme: "purple" },
      }),
    ).toBe(false);
    expect(isSyncDocument({ playthroughs: [progressedPlaythrough()] })).toBe(
      true,
    );
  });
});

describe("syncing two devices", () => {
  it("copies the data to a new device that has none", async () => {
    const { a, b } = await twoDevices();

    expect(b.playthroughs).toHaveLength(2);
    expect(b.playthroughs[0]).toEqual(a.playthroughs[0]);
  });

  it("asks before it replaces anything when both sides have data", async () => {
    const cloud = new MemoryProvider();
    await new Device("a", [progressedPlaythrough()]).sync(cloud);

    const result = await new Device("b", [emptyPlaythrough()]).sync(cloud);

    expect(result.status).toBe("needs-choice");
  });

  it("does not upload again when nothing changed", async () => {
    const { cloud, a } = await twoDevices();

    expect((await synced(a.sync(cloud))).uploaded).toBe(false);
  });

  it("uploads a change once and the other device sees it", async () => {
    const { cloud, a, b } = await twoDevices();
    a.edit(SECOND, (p) => (p.data.stardrops.CF_Fair = true));

    expect((await synced(a.sync(cloud))).uploaded).toBe(true);
    await b.sync(cloud);

    expect(b.get(SECOND)!.data.stardrops.CF_Fair).toBe(true);
  });

  it("keeps fields that this version does not know about", async () => {
    const cloud = new MemoryProvider();
    const a = new Device("a", [playthroughWithUnknownFields()]);
    await a.sync(cloud);
    const b = new Device("b", []);
    await synced(b.sync(cloud, "keep-cloud"));

    const copy = b.playthroughs[0] as unknown as Record<string, unknown>;
    expect(copy.futurePlaythroughField).toBe("kept");
    expect((copy.data as Record<string, unknown>).futureField).toEqual({
      nested: [1, 2, 3],
    });
  });
});

describe("marked items", () => {
  it("keeps what both devices marked", async () => {
    const { merged, result } = await bothEdit(
      (p) => {
        p.data.cookingRecipes["Pancakes"] = { learned: true, cooked: true };
        p.data.shipped["24"] = { shipped: true, count: 1 };
      },
      (p) => {
        p.data.craftingRecipes["Chest"] = { learned: true, crafted: true };
        p.data.stardrops.Krobus = true;
      },
    );

    expect(merged.data.cookingRecipes.Pancakes.cooked).toBe(true);
    expect(merged.data.craftingRecipes.Chest.crafted).toBe(true);
    expect(merged.data.shipped["24"].shipped).toBe(true);
    expect(merged.data.stardrops).toEqual({ CF_Fair: true, Krobus: true });
    expect(result.conflicts).toHaveLength(0);
  });

  it("keeps the stardrops that each device found", async () => {
    const { merged, result } = await bothEdit(
      (p) => (p.data.stardrops.CF_Mines = true),
      (p) => (p.data.stardrops.Krobus = true),
    );

    expect(merged.data.stardrops).toEqual({
      CF_Fair: true,
      CF_Mines: true,
      Krobus: true,
    });
    expect(result.conflicts).toHaveLength(0);
  });

  it("marks a recipe cooked on one device and learned on the other", async () => {
    const { merged } = await bothEdit(
      (p) => (p.data.cookingRecipes["Algae Soup"].cooked = false),
      (p) => (p.data.cookingRecipes["Algae Soup"].learned = false),
    );

    expect(merged.data.cookingRecipes["Algae Soup"]).toEqual({
      learned: false,
      cooked: false,
    });
  });

  it("carries an unmarked item to the other device", async () => {
    const { cloud, a, b } = await twoDevices();
    a.edit(FIRST, (p) => (p.data.stardrops.CF_Fair = false));

    await a.sync(cloud);
    await b.sync(cloud);

    expect(b.get(FIRST)!.data.stardrops.CF_Fair).toBe(false);
  });

  it("takes marked when both devices changed the same item", async () => {
    const { merged, result } = await bothEdit(
      (p) => (p.data.questsCompleted["2"] = false),
      (p) => (p.data.questsCompleted["2"] = true),
    );

    expect(merged.data.questsCompleted["2"]).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });
});

describe("levels and totals", () => {
  it("takes the higher value when both devices changed it", async () => {
    const { merged, result } = await bothEdit(
      (p) => {
        p.data.goldenWalnutsFound = 14;
        p.data.skills.Farming = { level: 8, xp: 5000 };
        p.data.villagers.Abigail.hearts = 8;
        p.data.character.totalMoneyEarned = 100;
        p.data.monsters.Slime = 50;
      },
      (p) => {
        p.data.goldenWalnutsFound = 20;
        p.data.skills.Farming = { level: 10, xp: 15000 };
        p.data.villagers.Abigail.hearts = 11;
        p.data.character.totalMoneyEarned = 900;
        p.data.monsters.Slime = 30;
      },
    );

    expect(merged.data.goldenWalnutsFound).toBe(20);
    expect(merged.data.skills.Farming).toEqual({ level: 10, xp: 15000 });
    expect(merged.data.villagers.Abigail.hearts).toBe(11);
    expect(merged.data.character.totalMoneyEarned).toBe(900);
    expect(merged.data.monsters.Slime).toBe(50);
    expect(result.conflicts).toHaveLength(0);
  });

  it("takes the higher tool level, and keeps the other side tool", async () => {
    const { merged } = await bothEdit(
      (p) => (p.data.toolLevels.pickaxe = 3),
      (p) => {
        p.data.toolLevels.pickaxe = 2;
        p.data.toolLevels.axe = 4;
      },
    );

    expect(merged.data.toolLevels).toMatchObject({ pickaxe: 3, axe: 4 });
  });

  it("takes the later game date", async () => {
    const { merged, result } = await bothEdit(
      (p) =>
        (p.data.character.currentDate = { season: "winter", day: 3, year: 2 }),
      (p) =>
        (p.data.character.currentDate = { season: "fall", day: 28, year: 2 }),
    );

    expect(merged.data.character.currentDate).toEqual({
      season: "winter",
      day: 3,
      year: 2,
    });
    expect(result.conflicts).toHaveLength(0);
  });

  it("adds the fish of both devices and takes the higher count of a shared fish", async () => {
    const { merged } = await bothEdit(
      (p) => {
        p.data.fishCaught[0].timesCaught = 9;
        p.data.fishCaught.push({ id: "136", timesCaught: 1, largestSize: 40 });
      },
      (p) => {
        p.data.fishCaught[0].timesCaught = 6;
        p.data.fishCaught.push({ id: "700", timesCaught: 2, largestSize: 20 });
      },
    );

    const byId = Object.fromEntries(
      merged.data.fishCaught.map((fish) => [fish.id, fish]),
    );
    expect(Object.keys(byId).sort()).toEqual(["128", "136", "700"]);
    expect(byId["128"].timesCaught).toBe(9);
  });
});

describe("lists", () => {
  it("keeps what either device added and carries a removal", async () => {
    const { cloud, a, b } = await twoDevices();
    a.edit(FIRST, (p) => (p.data.achievements = ["5", "26"]));
    await a.sync(cloud);
    await b.sync(cloud);

    a.edit(FIRST, (p) => (p.data.achievements = ["26"]));
    b.edit(FIRST, (p) => {
      p.data.achievements = ["5", "26", "34"];
      p.data.professions = ["Rancher"];
    });
    await a.sync(cloud);
    await b.sync(cloud);

    const merged = b.get(FIRST)!.data;
    expect([...merged.achievements].sort()).toEqual(["26", "34"]);
    expect(merged.professions).toEqual(["Rancher"]);
  });

  it("keeps a gift given on one device and a gift added on the other", async () => {
    const { merged } = await bothEdit(
      (p) => (p.data.trackedGifts[0].given = true),
      (p) =>
        p.data.trackedGifts.push({
          itemName: "Diamond",
          villagerName: "Sam",
          given: false,
        }),
    );

    expect(merged.data.trackedGifts).toHaveLength(2);
    expect(merged.data.trackedGifts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ itemName: "Pumpkin", given: true }),
        expect.objectContaining({ itemName: "Diamond", given: false }),
      ]),
    );
  });

  it("joins the events a villager has seen", async () => {
    const { merged } = await bothEdit(
      (p) => (p.data.villagers.Abigail.eventsSeen = ["1", "2", "3"]),
      (p) => (p.data.villagers.Abigail.eventsSeen = ["1", "2", "9"]),
    );

    expect([...merged.data.villagers.Abigail.eventsSeen].sort()).toEqual([
      "1",
      "2",
      "3",
      "9",
    ]);
  });
});

describe("animals, buildings and ponds", () => {
  const animal = (id: string, friendship: number) => ({
    name: `Animal ${id}`,
    id,
    type: "Chicken",
    buildingType: "Coop",
    buildingId: "coop1",
    friendship,
    happiness: 100,
    age: 10,
    hasAnimalCracker: false,
  });

  const withAnimals = async () => {
    const { cloud, a, b } = await twoDevices();
    a.edit(
      FIRST,
      (p) => (p.data.animals = [animal("1", 500), animal("2", 500)]),
    );
    await a.sync(cloud);
    await b.sync(cloud);
    return { cloud, a, b };
  };

  it("keeps an animal added on each device and the higher friendship", async () => {
    const { cloud, a, b } = await withAnimals();
    a.edit(FIRST, (p) => {
      p.data.animals[0].friendship = 900;
      p.data.animals.push(animal("3", 100));
    });
    b.edit(FIRST, (p) => {
      p.data.animals[0].friendship = 700;
      p.data.animals.push(animal("4", 100));
    });
    await a.sync(cloud);
    await b.sync(cloud);

    const merged = b.get(FIRST)!.data.animals;
    expect(merged.map((item) => item.id).sort()).toEqual(["1", "2", "3", "4"]);
    expect(merged.find((item) => item.id === "1")!.friendship).toBe(900);
  });

  it("matches an animal by id, so a rename on one device and a change on the other both stay", async () => {
    const { cloud, a, b } = await withAnimals();
    a.edit(FIRST, (p) => (p.data.animals[0].name = "Renamed"));
    b.edit(FIRST, (p) => (p.data.animals[0].friendship = 800));
    await a.sync(cloud);
    await b.sync(cloud);

    const merged = b.get(FIRST)!.data.animals;
    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({
      id: "1",
      name: "Renamed",
      friendship: 800,
    });
  });

  it("carries an animal that was removed", async () => {
    const { cloud, a, b } = await withAnimals();
    a.edit(FIRST, (p) => (p.data.animals = p.data.animals.slice(1)));
    await a.sync(cloud);
    await b.sync(cloud);

    expect(b.get(FIRST)!.data.animals.map((item) => item.id)).toEqual(["2"]);
  });

  it("keeps buildings and fish ponds that each device added", async () => {
    const { merged } = await bothEdit(
      (p) => {
        p.data.buildings.push({ id: "barn1", type: "Barn", animalCount: 2 });
        p.data.fishPonds.push({
          buildingId: "pond1",
          fishType: 128,
          currentOccupants: 1,
          maxOccupants: 10,
        });
      },
      (p) => {
        p.data.buildings.push({ id: "silo1", type: "Silo", animalCount: 0 });
        p.data.fishPonds.push({
          buildingId: "pond2",
          fishType: 136,
          currentOccupants: 2,
          maxOccupants: 10,
        });
      },
    );

    expect(merged.data.buildings.map((item) => item.id).sort()).toEqual([
      "barn1",
      "silo1",
    ]);
    expect(merged.data.fishPonds.map((item) => item.buildingId).sort()).toEqual(
      ["pond1", "pond2"],
    );
  });
});

describe("conflicts", () => {
  it("reports a conflict when both devices changed the money, and takes the cloud value", async () => {
    const { result, merged } = await bothEdit(
      (p) => (p.data.character.money = 1000),
      (p) => (p.data.character.money = 2000),
    );

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].path).toEqual([
      "playthroughs",
      FIRST,
      "data",
      "character",
      "money",
    ]);
    expect(merged.data.character.money).toBe(1000);
  });

  it("reports a conflict when both devices changed the same pet", async () => {
    const { cloud, a, b } = await twoDevices();
    a.edit(FIRST, (p) => {
      p.data.pets = [
        {
          name: "Rex",
          type: "Dog",
          breed: "1",
          friendship: 500,
          starter: true,
        },
      ];
    });
    await a.sync(cloud);
    await b.sync(cloud);
    a.edit(FIRST, (p) => (p.data.pets[0].friendship = 800));
    b.edit(FIRST, (p) => (p.data.pets[0].name = "Max"));
    await a.sync(cloud);
    const result = await synced(b.sync(cloud));

    expect(result.conflicts.map((conflict) => conflict.path.slice(-2))).toEqual(
      [["data", "pets"]],
    );
  });

  it("reports a conflict when both devices rename a playthrough", async () => {
    const { result, merged } = await bothEdit(
      (p) => (p.name = "From A"),
      (p) => (p.name = "From B"),
    );

    expect(result.conflicts.map((conflict) => conflict.path)).toEqual([
      ["playthroughs", FIRST, "name"],
    ]);
    expect(merged.name).toBe("From A");
  });

  it("reports a conflict when both devices changed the status of a villager", async () => {
    const { result } = await bothEdit(
      (p) => (p.data.villagers.Sebastian.status = "Engaged"),
      (p) => (p.data.villagers.Sebastian.status = "Friendly"),
    );

    expect(result.conflicts).toHaveLength(1);
  });

  it("deletes a playthrough everywhere when one device deletes it", async () => {
    const { cloud, a, b } = await twoDevices();
    a.playthroughs = a.playthroughs.filter((p) => p.id !== SECOND);

    await a.sync(cloud);
    await b.sync(cloud);

    expect(b.get(SECOND)).toBeUndefined();
    expect(b.playthroughs).toHaveLength(1);
  });

  it("keeps a playthrough that one device deleted and another changed, and reports it", async () => {
    const { cloud, a, b } = await twoDevices();
    a.playthroughs = a.playthroughs.filter((p) => p.id !== SECOND);
    b.edit(SECOND, (p) => (p.data.stardrops.CF_Fair = true));

    await a.sync(cloud);
    const result = await synced(b.sync(cloud));

    expect(b.get(SECOND)!.data.stardrops.CF_Fair).toBe(true);
    expect(result.conflicts[0]).toMatchObject({
      kind: "delete-edit",
      path: ["playthroughs", SECOND],
    });
  });
});

describe("the choice of each device", () => {
  it("never syncs the active playthrough or the settings", async () => {
    const cloud = new MemoryProvider();
    const a = new Device(
      "a",
      [progressedPlaythrough(), emptyPlaythrough()],
      FIRST,
      {
        theme: "dark",
      },
    );
    await a.sync(cloud);
    const b = new Device("b", [], null, { theme: "light" });
    await synced(b.sync(cloud, "keep-cloud"));

    a.activePlaythroughId = SECOND;
    a.settings = { theme: "system" };
    const again = await synced(a.sync(cloud));

    const stored = JSON.parse(
      (await cloud.read(`Gamerdex/${APP_ID}/data.json`))!.content,
    );
    expect(again.uploaded).toBe(false);
    expect(stored.activePlaythroughId).toBeUndefined();
    expect(stored.settings).toBeUndefined();
    expect(b.settings).toEqual({ theme: "light" });
    expect(b.activePlaythroughId).toBeNull();
  });
});

describe("applying the merged data", () => {
  beforeEach(() => localStorage.clear());

  const saved = (active: string | null, settings?: Settings) =>
    storageService.save({
      playthroughs: [progressedPlaythrough(), emptyPlaythrough()],
      activePlaythroughId: active,
      ...(settings && { settings }),
    });

  it("writes the merged playthroughs and leaves the active one and the settings alone", () => {
    saved(SECOND, { theme: "dark", ui: { view: "list" } });
    const merged = structuredClone(readLocalDocument());
    merged.playthroughs[0].name = "Renamed";
    merged.activePlaythroughId = FIRST;
    merged.settings = { theme: "light" };

    expect(applyDocument(merged)).toBe(true);

    const data = storageService.load();
    expect(data.playthroughs[0].name).toBe("Renamed");
    expect(data.activePlaythroughId).toBe(SECOND);
    expect(data.settings).toEqual({ theme: "dark", ui: { view: "list" } });
  });

  it("writes nothing when the merged playthroughs equal the saved ones", () => {
    saved(FIRST);
    const before = localStorage.getItem("stardew-valley-companion");

    expect(applyDocument(structuredClone(readLocalDocument()))).toBe(false);
    expect(localStorage.getItem("stardew-valley-companion")).toBe(before);
  });

  it("moves the active playthrough to the first one when a sync deleted it", () => {
    saved(FIRST);
    const merged = structuredClone(readLocalDocument());
    merged.playthroughs = merged.playthroughs.filter((p) => p.id !== FIRST);

    applyDocument(merged);

    expect(storageService.load().activePlaythroughId).toBe(SECOND);
  });

  it("leaves no active playthrough when a sync deleted every playthrough", () => {
    saved(FIRST);

    applyDocument({ playthroughs: [], activePlaythroughId: null });

    expect(storageService.load().activePlaythroughId).toBeNull();
  });
});
