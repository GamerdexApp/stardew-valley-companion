import type { Schema } from "@gamerdexapp/gamerdex-sync";

const dateOrder = (value: unknown) =>
  typeof value === "string" ? Date.parse(value) || 0 : 0;

const SEASONS = ["spring", "summer", "fall", "winter"];

/** A date in the game, as a number of days, so a later date has a higher number. */
const gameDayOrder = (value: unknown) => {
  const { season, day, year } = value as {
    season: string;
    day: number;
    year: number;
  };
  return (year * 4 + Math.max(SEASONS.indexOf(season), 0)) * 28 + day;
};

/** A level, a count or a total. When two devices changed it, the higher value wins. */
const level: Schema = { type: "max", order: (value) => Number(value) };

/** A marked item. When two devices changed it, marked wins. */
const flag: Schema = { type: "max", order: (value) => (value ? 1 : 0) };

const flags: Schema = { type: "object", each: flag };

/** A list of plain values. Additions and removals since the last sync carry over. */
const list: Schema = { type: "join" };

const levels: Schema = { type: "object", each: level };

const objectOf = (fields: Record<string, Schema>): Schema => ({
  type: "object",
  fields,
});

const entriesOf = (item: Schema): Schema => ({ type: "object", each: item });

const character = objectOf({
  currentDate: { type: "max", order: gameDayOrder },
  totalMoneyEarned: level,
  totalDaysPlayed: level,
  millisecondsPlayed: level,
  houseUpgradeLevel: level,
  maxHealth: level,
  maxEnergy: level,
  maxItems: level,
  willyBackRoomInvitation: flag,
});

const data = objectOf({
  character,
  toolLevels: {
    type: "object",
    fields: { currentlyUpgrading: { type: "record" } },
    each: level,
  },
  shipped: entriesOf(objectOf({ shipped: flag, count: level })),
  fishCaught: {
    type: "keyed",
    key: "id",
    item: objectOf({ timesCaught: level, largestSize: level }),
  },
  cookingRecipes: entriesOf(objectOf({ learned: flag, cooked: flag })),
  craftingRecipes: entriesOf(objectOf({ learned: flag, crafted: flag })),
  minerals: entriesOf(objectOf({ found: flag, donated: flag })),
  artifacts: entriesOf(objectOf({ found: flag, donated: flag })),
  villagers: entriesOf(
    objectOf({ hearts: level, heartPoints: level, eventsSeen: list }),
  ),
  bundles: entriesOf(flags),
  achievements: list,
  stardrops: flags,
  goldenWalnuts: levels,
  goldenWalnutsFound: level,
  secretNotes: flags,
  journalScraps: flags,
  lostBooks: flags,
  monsters: levels,
  skills: entriesOf(objectOf({ level, xp: level })),
  professions: list,
  mastery: objectOf({ masteryXp: level, unlocked: list }),
  books: list,
  specialItems: list,
  rarecrows: list,
  questsCompleted: flags,
  specialOrdersCompleted: flags,
  trackedGifts: list,
  animals: {
    type: "keyed",
    key: "id",
    item: objectOf({
      friendship: level,
      happiness: level,
      age: level,
      hasAnimalCracker: flag,
    }),
  },
  buildings: {
    type: "keyed",
    key: "id",
    item: objectOf({ animalCount: level }),
  },
  fishPonds: {
    type: "keyed",
    key: "buildingId",
    item: objectOf({ currentOccupants: level, maxOccupants: level }),
  },
  mineProgress: objectOf({
    deepestMineLevel: level,
    deepestSkullCavernLevel: level,
    hasRustyKey: flag,
    hasSkullKey: flag,
  }),
  islandUpgrades: flags,
  perfectionWaiverCount: level,
  helpWantedCompleted: level,
  lostBooksFound: level,
  communityCenter: objectOf({
    unlocked: flag,
    bundlesActive: flag,
    completed: flag,
    ceremonyAttended: flag,
    jojaAbandoned: flag,
    rooms: flags,
  }),
  joja: objectOf({ completed: flag, developments: flags }),
});

const playthrough: Schema = objectOf({
  lastModified: { type: "max", order: dateOrder },
  data,
});

/**
 * The data file is the backup file, so its shape never changes. Marked items, levels and totals take
 * the higher side. Lists keep what either device added and drop what either device removed. A
 * value that cannot merge, such as a name, a pet or the money, reports a conflict when both devices
 * changed it. A playthrough that one device deleted is deleted on the others, unless one of them
 * changed it since the last sync. Then the changed copy stays and the merge reports a conflict.
 * The active playthrough and the settings belong to each device and never sync.
 */
export const syncSchema: Schema = {
  type: "object",
  fields: {
    playthroughs: { type: "keyed", key: "id", item: playthrough },
    activePlaythroughId: { type: "local" },
    settings: { type: "local" },
  },
};
