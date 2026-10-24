import {
  cooking,
  crops,
  fish,
  forageables,
  seasons,
} from "stardew-valley-data";
import type { Season, Villager } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { BOOKSELLER_ICON } from "@/data/constants/seasons";
import { allVillagers } from "./villagers";

export type CalendarSeason = "spring" | "summer" | "fall" | "winter";

export const CALENDAR_SEASONS: CalendarSeason[] = [
  "spring",
  "summer",
  "fall",
  "winter",
];

export const DAYS_IN_SEASON = 28;

/** Day 1 of every season is a Monday. */
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type CalendarLayer = "birthdays" | "festivals" | "bookseller";

export const CALENDAR_LAYERS: CalendarLayer[] = [
  "birthdays",
  "festivals",
  "bookseller",
];

export interface BirthdayEvent {
  villager: Villager;
}

export interface FestivalEvent {
  name: string;
  image: string;
  icon: string;
  /** The day of the festival, from 1, and how many days it lasts. */
  dayOfFestival: number;
  totalDays: number;
}

export interface DayEvents {
  day: number;
  birthdays: BirthdayEvent[];
  festivals: FestivalEvent[];
  bookseller: boolean;
}

const seasonData = (season: CalendarSeason) =>
  seasons()
    .get()
    .find((item) => item.id === season)!;

export const weekdayOf = (day: number): string => WEEKDAYS[(day - 1) % 7];

export const isCalendarSeason = (season: Season): season is CalendarSeason =>
  CALENDAR_SEASONS.includes(season as CalendarSeason);

/** Every day of a season with what happens on it, before any layer is hidden. */
export const seasonDays = (season: CalendarSeason): DayEvents[] => {
  const data = seasonData(season);
  return Array.from({ length: DAYS_IN_SEASON }, (_, index) => {
    const day = index + 1;
    return {
      day,
      birthdays: allVillagers
        .filter(
          (villager) =>
            villager.birthday.season === season &&
            villager.birthday.day === day,
        )
        .map((villager) => ({ villager })),
      festivals: data.festivals
        .filter(
          (festival) => day >= festival.startDay && day <= festival.endDay,
        )
        .map((festival) => ({
          name: festival.name,
          image: festival.image,
          icon: festival.calendarIcon,
          dayOfFestival: day - festival.startDay + 1,
          totalDays: festival.endDay - festival.startDay + 1,
        })),
      bookseller: data.bookseller.includes(day),
    };
  });
};

export const BOOKSELLER_IMAGE = BOOKSELLER_ICON;

const FESTIVAL_FLAG = "images/seasons/calendar-icons/Festival Flag.gif";

/**
 * The picture of each layer, from the game data. The game has no birthday icon, so a birthday
 * uses a cake from the item pictures. A cell shows the portrait of the villager instead.
 */
export const LAYER_ICONS: Record<CalendarLayer, string> = {
  birthdays: cooking()
    .get()
    .find((dish) => dish.name === "Pink Cake")!.image,
  festivals: FESTIVAL_FLAG,
  bookseller: BOOKSELLER_ICON,
};

export type VisibleLayers = Record<CalendarLayer, boolean>;

export const allLayers: VisibleLayers = {
  birthdays: true,
  festivals: true,
  bookseller: true,
};

/** The events a day shows once the hidden layers are taken out. */
export const visibleEvents = (
  day: DayEvents,
  layers: VisibleLayers,
): DayEvents => ({
  day: day.day,
  birthdays: layers.birthdays ? day.birthdays : [],
  festivals: layers.festivals ? day.festivals : [],
  bookseller: layers.bookseller && day.bookseller,
});

export const hasEvents = (day: DayEvents): boolean =>
  day.birthdays.length > 0 || day.festivals.length > 0 || day.bookseller;

export const eventCount = (day: DayEvents): number =>
  day.birthdays.length + day.festivals.length + (day.bookseller ? 1 : 0);

export interface EventLine {
  kind: CalendarLayer;
  text: string;
  /** The picture beside the line: a portrait, the icon of the festival, or the Bookseller. */
  icon: string;
}

/** The lines a day cell shows. A festival that lasts several days says which day it is. */
export const eventLines = (day: DayEvents): EventLine[] => [
  ...day.birthdays.map((event) => ({
    kind: "birthdays" as const,
    text: event.villager.name,
    icon: event.villager.image,
  })),
  ...day.festivals.map((festival) => ({
    kind: "festivals" as const,
    text:
      festival.totalDays > 1
        ? `${festival.name} ${festival.dayOfFestival}/${festival.totalDays}`
        : festival.name,
    icon: festival.icon,
  })),
  ...(day.bookseller
    ? [
        {
          kind: "bookseller" as const,
          text: "Bookseller",
          icon: BOOKSELLER_ICON,
        },
      ]
    : []),
];

export interface Today {
  season: CalendarSeason;
  day: number;
}

export const todayOf = (data: GameData | null): Today | null => {
  if (!data) return null;
  const { season, day } = data.character.currentDate;
  return isCalendarSeason(season) ? { season, day } : null;
};

/** The days with events before and after a day, so the panel can step through a season. */
export const neighbourDays = (
  days: DayEvents[],
  day: number,
): { previous: number | null; next: number | null } => {
  const withEvents = days.filter(hasEvents).map((item) => item.day);
  return {
    previous: [...withEvents].reverse().find((item) => item < day) ?? null,
    next: withEvents.find((item) => item > day) ?? null,
  };
};

const isItem = (name: string): boolean => !name.startsWith("All ");

export interface GiftIdeas {
  loved: string[];
  liked: string[];
}

/** A few gifts the villager loves and likes, for a birthday. Categories such as "All Fruit" are left out. */
export const giftIdeas = (villager: Villager): GiftIdeas => ({
  loved: villager.loves.filter(isItem).slice(0, 4),
  liked: villager.likes.filter(isItem).slice(0, 2),
});

export interface InSeason {
  crops: string[];
  forageables: string[];
  fish: string[];
}

export const inSeason = (season: CalendarSeason): InSeason => {
  const names = (items: { name: string; seasons: Season[] }[]) =>
    items
      .filter((item) => item.seasons.includes(season))
      .map((item) => item.name);
  return {
    crops: names(crops().get()),
    forageables: names(forageables().get()),
    fish: names(fish().get()),
  };
};

export interface SeasonEvent {
  day: number;
  name: string;
  kind: CalendarLayer;
  icon: string;
}

/** Every event of the season in date order, for the list under the grid. A festival is listed once. */
export const seasonEvents = (days: DayEvents[]): SeasonEvent[] =>
  [
    ...days.flatMap((day) =>
      day.birthdays.map((event) => ({
        day: day.day,
        name: `${event.villager.name}'s Birthday`,
        kind: "birthdays" as const,
        icon: event.villager.image,
      })),
    ),
    ...days.flatMap((day) =>
      day.festivals
        .filter((festival) => festival.dayOfFestival === 1)
        .map((festival) => ({
          day: day.day,
          name: festival.name,
          kind: "festivals" as const,
          icon: festival.icon,
        })),
    ),
    ...days
      .filter((day) => day.bookseller)
      .map((day) => ({
        day: day.day,
        name: "Bookseller may visit",
        kind: "bookseller" as const,
        icon: BOOKSELLER_ICON,
      })),
  ].sort((a, b) => a.day - b.day);
