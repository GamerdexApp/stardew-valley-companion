import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allLayers,
  CALENDAR_SEASONS,
  DAYS_IN_SEASON,
  eventCount,
  eventLines,
  giftIdeas,
  hasEvents,
  inSeason,
  LAYER_ICONS,
  neighbourDays,
  seasonDays,
  seasonEvents,
  todayOf,
  visibleEvents,
  weekdayOf,
} from "@/service/calendar";
import { allVillagers } from "@/service/villagers";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const day = (season: (typeof CALENDAR_SEASONS)[number], number: number) =>
  seasonDays(season)[number - 1];

describe("seasons and weekdays", () => {
  it("has four seasons of 28 days, and a Monday on the first day", () => {
    expect(CALENDAR_SEASONS).toEqual(["spring", "summer", "fall", "winter"]);
    expect(seasonDays("fall")).toHaveLength(DAYS_IN_SEASON);
    expect(weekdayOf(1)).toBe("Mon");
    expect(weekdayOf(7)).toBe("Sun");
    expect(weekdayOf(8)).toBe("Mon");
    expect(weekdayOf(28)).toBe("Sun");
  });
});

describe("what happens on a day", () => {
  it("lists a birthday on its day", () => {
    const spring13 = day("spring", 13);

    expect(
      day("spring", 14).birthdays.map((event) => event.villager.name),
    ).toEqual(["Haley"]);
    expect(spring13.birthdays).toEqual([]);
  });

  it("puts a one day festival on its day and a long one on each of its days with a count", () => {
    const egg = day("spring", 13).festivals[0];
    const desert = [15, 16, 17].map(
      (number) => day("spring", number).festivals[0],
    );

    expect(egg).toMatchObject({
      name: "Egg Festival",
      dayOfFestival: 1,
      totalDays: 1,
    });
    expect(
      desert.map(
        (festival) => `${festival.dayOfFestival}/${festival.totalDays}`,
      ),
    ).toEqual(["1/3", "2/3", "3/3"]);
    expect(day("spring", 18).festivals).toEqual([]);
  });

  it("marks the days the Bookseller may visit", () => {
    const spring = seasonDays("spring");

    expect(
      spring.filter((item) => item.bookseller).map((item) => item.day),
    ).toEqual([11, 12, 21, 22, 25]);
  });

  it("counts 34 birthdays over the four seasons, 8, 9, 8 and 9", () => {
    const counts = CALENDAR_SEASONS.map((season) =>
      seasonDays(season).reduce((sum, item) => sum + item.birthdays.length, 0),
    );

    expect(counts).toEqual([8, 9, 8, 9]);
    expect(allVillagers).toHaveLength(34);
  });

  it("counts the events of a day and knows when it has none", () => {
    const busy = day("spring", 25);

    expect(hasEvents(day("spring", 1))).toBe(false);
    expect(eventCount(day("spring", 1))).toBe(0);
    expect(hasEvents(busy)).toBe(true);
    expect(eventCount(busy)).toBeGreaterThanOrEqual(1);
  });
});

describe("layers", () => {
  it("hide the events of a layer that is turned off", () => {
    const spring11 = day("spring", 11);

    expect(visibleEvents(spring11, allLayers).bookseller).toBe(true);
    expect(
      visibleEvents(spring11, { ...allLayers, bookseller: false }).bookseller,
    ).toBe(false);
    expect(
      hasEvents(visibleEvents(spring11, { ...allLayers, bookseller: false })),
    ).toBe(spring11.birthdays.length + spring11.festivals.length > 0);
    expect(
      visibleEvents(day("spring", 14), { ...allLayers, birthdays: false })
        .birthdays,
    ).toEqual([]);
    expect(
      visibleEvents(day("spring", 13), { ...allLayers, festivals: false })
        .festivals,
    ).toEqual([]);
  });
});

describe("cell lines", () => {
  it("name a birthday, count the days of a festival and name the Bookseller, each with its picture", () => {
    const haley = allVillagers.find((villager) => villager.name === "Haley")!;

    expect(eventLines(day("spring", 14))).toEqual([
      { kind: "birthdays", text: "Haley", icon: haley.image },
    ]);
    expect(eventLines(day("spring", 16))).toEqual([
      {
        kind: "festivals",
        text: "Desert Festival 2/3",
        icon: "images/seasons/calendar-icons/Special Event.png",
      },
    ]);
    expect(eventLines(day("spring", 13))).toEqual([
      {
        kind: "festivals",
        text: "Egg Festival",
        icon: "images/seasons/calendar-icons/Festival Flag.gif",
      },
    ]);
    expect(eventLines(day("spring", 11)).at(-1)).toEqual({
      kind: "bookseller",
      text: "Bookseller",
      icon: "images/seasons/calendar-icons/Bookseller.png",
    });
  });

  it("have a picture for each layer from the game data", () => {
    expect(LAYER_ICONS).toEqual({
      birthdays: "images/cooking/Pink Cake.png",
      festivals: "images/seasons/calendar-icons/Festival Flag.gif",
      bookseller: "images/seasons/calendar-icons/Bookseller.png",
    });
  });
});

describe("stepping through a season", () => {
  it("finds the days with events before and after a day", () => {
    const days = seasonDays("spring");

    expect(neighbourDays(days, 14)).toEqual({ previous: 13, next: 15 });
    expect(neighbourDays(days, 1)).toEqual({
      previous: null,
      next: expect.any(Number),
    });
    expect(neighbourDays(days, 28).next).toBeNull();
  });

  it("skips a hidden layer", () => {
    const days = seasonDays("spring").map((item) =>
      visibleEvents(item, { ...allLayers, bookseller: false }),
    );

    expect(neighbourDays(days, 10).next).not.toBe(11);
  });
});

describe("the season list", () => {
  it("lists every event in date order and each festival once", () => {
    const events = seasonEvents(seasonDays("spring"));

    expect(events.map((event) => event.day)).toEqual(
      [...events.map((event) => event.day)].sort((a, b) => a - b),
    );
    expect(
      events.filter((event) => event.name === "Desert Festival"),
    ).toHaveLength(1);
    expect(events.filter((event) => event.kind === "birthdays")).toHaveLength(
      8,
    );
    expect(events.filter((event) => event.kind === "bookseller")).toHaveLength(
      5,
    );
    expect(events.find((event) => event.name === "Haley's Birthday")?.day).toBe(
      14,
    );
  });
});

describe("gift ideas", () => {
  it("give a few loved and liked gifts, without categories", () => {
    const abigail = allVillagers.find(
      (villager) => villager.name === "Abigail",
    )!;
    const ideas = giftIdeas(abigail);

    expect(ideas.loved.length).toBeGreaterThan(0);
    expect(ideas.loved.length).toBeLessThanOrEqual(4);
    expect(ideas.liked.length).toBeLessThanOrEqual(2);
    expect(
      [...ideas.loved, ...ideas.liked].some((name) => name.startsWith("All ")),
    ).toBe(false);
    expect(abigail.loves).toEqual(expect.arrayContaining(ideas.loved));
  });
});

describe("in season", () => {
  it("lists the crops, forageables and fish of spring: 18, 30 and 53", () => {
    const spring = inSeason("spring");

    expect([
      spring.crops.length,
      spring.forageables.length,
      spring.fish.length,
    ]).toEqual([18, 30, 53]);
    expect(spring.crops).toContain("Parsnip");
    expect(inSeason("winter").crops.length).toBe(4);
  });
});

describe("today", () => {
  it("reads the date of the playthrough", () => {
    const data: GameData = clone(DEFAULT_GAME_DATA);
    data.character.currentDate = {
      ...data.character.currentDate,
      season: "summer",
      day: 9,
    };

    expect(todayOf(data)).toEqual({ season: "summer", day: 9 });
    expect(todayOf(null)).toBeNull();
  });

  it("has no today on Ginger Island", () => {
    const data: GameData = clone(DEFAULT_GAME_DATA);
    data.character.currentDate = {
      ...data.character.currentDate,
      season: "ginger island" as never,
      day: 1,
    };

    expect(todayOf(data)).toBeNull();
  });
});
