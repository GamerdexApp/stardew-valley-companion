import { universalGifts, villagers } from "stardew-valley-data";
import type { Villager } from "stardew-valley-data";
import type { HeartEvent } from "@/types";
import type { GameData, TrackedGift, VillagerProgress } from "@/types/app";
import { effectiveMaxHearts } from "@/lib/utils/villagerHearts";
import { SEASONS } from "@/data/constants/seasons";

export const allVillagers: Villager[] = villagers().sortByName().get();
export const universal = universalGifts();

export const POINTS_PER_HEART = 250;
export const KROBUS = "Krobus";

/** The strings the game writes. A friend who is not dating anyone reads Friendly. */
export const STATUS_NONE = "Friendly";
export const STATUS_DATING = "Dating";
export const STATUS_ROOMMATE = "Roommate";

export type RelationshipStatus = "none" | "dating" | "roommate" | "married";

const NO_PROGRESS: VillagerProgress = {
  hearts: 0,
  heartPoints: 0,
  eventsSeen: [],
  status: "",
};

export const progressOf = (data: GameData, name: string): VillagerProgress =>
  data.villagers[name] ?? NO_PROGRESS;

export const isMarried = (data: GameData, villager: Villager): boolean =>
  data.character.spouse === villager.name;

export const statusOf = (
  data: GameData,
  villager: Villager,
): RelationshipStatus => {
  if (isMarried(data, villager)) return "married";
  const saved = progressOf(data, villager.name).status.toLowerCase();
  if (saved === "dating") return "dating";
  if (saved === "roommate") return "roommate";
  return "none";
};

/** Krobus offers a roommate. The other candidates can be dated. Married is set in Character. */
export const statusChoices = (villager: Villager): RelationshipStatus[] => {
  if (!villager.marriageable) return ["none"];
  return villager.name === KROBUS ? ["none", "roommate"] : ["none", "dating"];
};

export const maxHeartsOf = (data: GameData, villager: Villager): number =>
  effectiveMaxHearts(
    villager,
    isMarried(data, villager),
    progressOf(data, villager.name).status,
  );

export const maxPointsOf = (data: GameData, villager: Villager): number =>
  maxHeartsOf(data, villager) * POINTS_PER_HEART;

export const pointsToNextHeart = (points: number): number =>
  POINTS_PER_HEART - (points % POINTS_PER_HEART);

export const isMaxed = (data: GameData, villager: Villager): boolean =>
  progressOf(data, villager.name).hearts >= maxHeartsOf(data, villager);

const withProgress = (
  data: GameData,
  name: string,
  change: (progress: VillagerProgress) => VillagerProgress,
): GameData => ({
  ...data,
  villagers: { ...data.villagers, [name]: change(progressOf(data, name)) },
});

/** Hearts and friendship points move together, so one heart is always 250 points. */
export const setHearts = (
  data: GameData,
  villagerName: string,
  hearts: number,
): GameData => {
  const villager = allVillagers.find((item) => item.name === villagerName);
  if (!villager) return data;
  const next = Math.min(
    maxHeartsOf(data, villager),
    Math.max(0, Math.floor(hearts)),
  );
  return withProgress(data, villagerName, (progress) => ({
    ...progress,
    hearts: next,
    heartPoints: next * POINTS_PER_HEART,
  }));
};

const STATUS_STRING: Record<RelationshipStatus, string> = {
  none: STATUS_NONE,
  dating: STATUS_DATING,
  roommate: STATUS_ROOMMATE,
  married: "Married",
};

/** A lower cap pulls the hearts down to it. A spouse keeps the Married status of the save. */
export const setStatus = (
  data: GameData,
  villagerName: string,
  status: RelationshipStatus,
): GameData => {
  const villager = allVillagers.find((item) => item.name === villagerName);
  if (!villager || isMarried(data, villager)) return data;
  if (!statusChoices(villager).includes(status)) return data;

  const changed = withProgress(data, villagerName, (progress) => ({
    ...progress,
    status: STATUS_STRING[status],
  }));
  const cap = maxHeartsOf(changed, villager);
  return progressOf(changed, villagerName).hearts > cap
    ? setHearts(changed, villagerName, cap)
    : changed;
};

export const heartEventsOf = (villager: Villager): HeartEvent[] =>
  villager.events;

const idsOf = (event: HeartEvent): string[] =>
  event.id === null ? [] : [event.id].flat().map(String);

/** An event with no id has no entry in the save. It counts as seen from its heart level. */
export const isEventSeen = (
  event: HeartEvent,
  eventsSeen: string[],
  hearts: number,
): boolean =>
  event.id === null
    ? hearts >= event.heart
    : idsOf(event).some((id) => eventsSeen.includes(id));

export const isTrackableEvent = (event: HeartEvent): boolean =>
  event.id !== null;

export interface EventCount {
  seen: number;
  total: number;
}

export const eventCountOf = (
  data: GameData,
  villager: Villager,
): EventCount => {
  const { hearts, eventsSeen } = progressOf(data, villager.name);
  const events = heartEventsOf(villager).filter(isTrackableEvent);
  return {
    seen: events.filter((event) => isEventSeen(event, eventsSeen, hearts))
      .length,
    total: events.length,
  };
};

/** An event with several ids is seen when any one id is saved. Clearing it clears all of them. */
export const setEventSeen = (
  data: GameData,
  villagerName: string,
  event: HeartEvent,
  seen: boolean,
): GameData => {
  const ids = idsOf(event);
  if (ids.length === 0) return data;
  return withProgress(data, villagerName, (progress) => ({
    ...progress,
    eventsSeen: seen
      ? progress.eventsSeen.some((id) => ids.includes(id))
        ? progress.eventsSeen
        : [...progress.eventsSeen, ids[0]]
      : progress.eventsSeen.filter((id) => !ids.includes(id)),
  }));
};

export type SeasonFilter = "all" | "spring" | "summer" | "fall" | "winter";
export type MarriageFilter = "all" | "marriageable" | "non-marriageable";

export interface VillagerFilters {
  query: string;
  season: SeasonFilter;
  marriage: MarriageFilter;
}

export const emptyVillagerFilters: VillagerFilters = {
  query: "",
  season: "all",
  marriage: "all",
};

export const isFilteringVillagers = (filters: VillagerFilters): boolean =>
  filters.query !== "" ||
  filters.season !== "all" ||
  filters.marriage !== "all";

export const filterVillagers = (filters: VillagerFilters): Villager[] => {
  const needle = filters.query.trim().toLowerCase();
  return allVillagers.filter(
    (villager) =>
      villager.name.toLowerCase().includes(needle) &&
      (filters.season === "all" ||
        villager.birthday.season === filters.season) &&
      (filters.marriage === "all" ||
        (filters.marriage === "marriageable") === villager.marriageable),
  );
};

export interface VillagersSummary {
  total: number;
  maxed: number;
  tenPlus: number;
  fivePlus: number;
  eventsSeen: number;
  eventsTotal: number;
  spouse: string;
}

export const villagersSummary = (data: GameData): VillagersSummary => {
  const counts = allVillagers.map((villager) => eventCountOf(data, villager));
  const hearts = (villager: Villager) => progressOf(data, villager.name).hearts;
  return {
    total: allVillagers.length,
    maxed: allVillagers.filter((villager) => isMaxed(data, villager)).length,
    tenPlus: allVillagers.filter((villager) => hearts(villager) >= 10).length,
    fivePlus: allVillagers.filter((villager) => hearts(villager) >= 5).length,
    eventsSeen: counts.reduce((sum, count) => sum + count.seen, 0),
    eventsTotal: counts.reduce((sum, count) => sum + count.total, 0),
    spouse: data.character.spouse,
  };
};

export interface BirthdayEntry {
  villager: Villager;
  today: boolean;
}

export interface BirthdaySeason {
  id: Exclude<SeasonFilter, "all">;
  label: string;
  entries: BirthdayEntry[];
}

const BIRTHDAY_SEASONS = ["spring", "summer", "fall", "winter"] as const;

export const birthdaysBySeason = (data: GameData): BirthdaySeason[] => {
  const { season, day } = data.character.currentDate;
  return BIRTHDAY_SEASONS.map((id) => ({
    id,
    label: SEASONS[id].label,
    entries: allVillagers
      .filter((villager) => villager.birthday.season === id)
      .sort((a, b) => a.birthday.day - b.birthday.day)
      .map((villager) => ({
        villager,
        today: season === id && villager.birthday.day === day,
      })),
  }));
};

export type GiftPreference =
  "loves" | "likes" | "neutrals" | "dislikes" | "hates";

export interface GiftChip {
  name: string;
  universal: boolean;
}

export const GIFT_GROUPS: GiftPreference[] = [
  "loves",
  "likes",
  "neutrals",
  "dislikes",
  "hates",
];

/** A villager's own gifts come first, then the gifts every villager has. */
export const giftsFor = (
  villager: Villager,
  preference: GiftPreference,
): GiftChip[] => [
  ...villager[preference].map((name) => ({ name, universal: false })),
  ...universal[preference]
    .filter((name) => !villager[preference].includes(name))
    .map((name) => ({ name, universal: true })),
];

/** Only a loved or liked gift can be tracked, and a category such as "All Fruit" is not an item. */
export const canTrackGift = (
  preference: GiftPreference,
  name: string,
): boolean =>
  (preference === "loves" || preference === "likes") &&
  !name.startsWith("All ");

/** A playthrough from before gift tracking existed has no list. */
const trackedGiftsOf = (data: GameData): TrackedGift[] =>
  data.trackedGifts ?? [];

const findGift = (data: GameData, villagerName: string, itemName: string) =>
  trackedGiftsOf(data).find(
    (gift) => gift.villagerName === villagerName && gift.itemName === itemName,
  );

export type GiftTracking = "untracked" | "tracked" | "given";

export const trackingOf = (
  data: GameData,
  villagerName: string,
  itemName: string,
): GiftTracking => {
  const gift = findGift(data, villagerName, itemName);
  if (!gift) return "untracked";
  return gift.given ? "given" : "tracked";
};

export const trackGift = (
  data: GameData,
  villagerName: string,
  itemName: string,
  preference: TrackedGift["preference"],
): GameData =>
  findGift(data, villagerName, itemName)
    ? data
    : {
        ...data,
        trackedGifts: [
          ...trackedGiftsOf(data),
          { itemName, villagerName, given: false, preference },
        ],
      };

export const untrackGift = (
  data: GameData,
  villagerName: string,
  itemName: string,
): GameData => ({
  ...data,
  trackedGifts: trackedGiftsOf(data).filter(
    (gift) =>
      !(gift.villagerName === villagerName && gift.itemName === itemName),
  ),
});

export const trackedCountFor = (data: GameData, villagerName: string): number =>
  trackedGiftsOf(data).filter(
    (gift) => gift.villagerName === villagerName && !gift.given,
  ).length;
