import type { Playthrough } from "@/types/app";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const base = (id: string, name: string): Playthrough => ({
  id,
  name,
  platform: "Switch",
  createdAt: "2026-01-05T10:00:00.000Z",
  lastModified: "2026-01-05T10:00:00.000Z",
  data: clone(DEFAULT_GAME_DATA),
});

export const emptyPlaythrough = (): Playthrough =>
  base("11111111-1111-4111-8111-111111111111", "Fresh farm");

export const progressedPlaythrough = (): Playthrough => {
  const playthrough = base("22222222-2222-4222-8222-222222222222", "Riverland");
  playthrough.description = "Second year, Riverland farm";
  playthrough.platform = "PC";
  playthrough.data = {
    ...playthrough.data,
    character: {
      ...playthrough.data.character,
      name: "Sam",
      farmName: "Riverland",
      spouse: "Abigail",
      money: 48210,
      totalDaysPlayed: 187,
      currentDate: { season: "fall", day: 12, year: 2 },
    },
    shipped: {
      "16": { shipped: true, count: 12 },
      "174": { shipped: true, count: 3 },
    },
    fishCaught: [{ id: "128", timesCaught: 4, largestSize: 31 }],
    cookingRecipes: { "Algae Soup": { learned: true, cooked: true } },
    craftingRecipes: { Anvil: { learned: true, crafted: false } },
    villagers: {
      Abigail: {
        hearts: 10,
        heartPoints: 2500,
        eventsSeen: ["1", "2"],
        status: "Married",
      },
      Sebastian: {
        hearts: 6,
        heartPoints: 1500,
        eventsSeen: [],
        status: "Dating",
      },
      Krobus: {
        hearts: 4,
        heartPoints: 1000,
        eventsSeen: [],
        status: "Friendly",
      },
    },
    stardrops: { CF_Fair: true },
    goldenWalnuts: { BananaShrine: 1 },
    goldenWalnutsFound: 12,
    secretNotes: { "1": true },
    journalScraps: { "1001": true },
    questsCompleted: { "1": true, "132-animals": true },
    trackedGifts: [
      {
        itemName: "Pumpkin",
        villagerName: "Abigail",
        given: false,
        preference: "loves",
      },
    ],
    perfectionWaiverCount: 2,
  };
  playthrough.lastModified = "2026-03-02T18:30:00.000Z";
  return playthrough;
};

export const playthroughWithUnknownFields = (): Playthrough => {
  const playthrough = progressedPlaythrough();
  playthrough.id = "33333333-3333-4333-8333-333333333333";
  playthrough.name = "Unknown fields";
  const data = playthrough.data as unknown as Record<string, unknown>;
  data.futureField = { nested: [1, 2, 3] };
  (playthrough as unknown as Record<string, unknown>).futurePlaythroughField =
    "kept";
  return playthrough;
};

export const playthroughMissingNewerFields = (): Playthrough => {
  const playthrough = progressedPlaythrough();
  playthrough.id = "44444444-4444-4444-8444-444444444444";
  playthrough.name = "Old shape";
  const data = playthrough.data as unknown as Record<string, unknown>;
  delete data.trackedGifts;
  delete data.mastery;
  delete data.helpWantedCompleted;
  return playthrough;
};

export const completeFixtures = (): Playthrough[] => [
  emptyPlaythrough(),
  progressedPlaythrough(),
  playthroughWithUnknownFields(),
];
