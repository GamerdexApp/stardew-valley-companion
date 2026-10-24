import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allVillagers,
  birthdaysBySeason,
  canTrackGift,
  emptyVillagerFilters,
  eventCountOf,
  filterVillagers,
  giftsFor,
  isEventSeen,
  isFilteringVillagers,
  isMaxed,
  maxHeartsOf,
  pointsToNextHeart,
  progressOf,
  setEventSeen,
  setHearts,
  setStatus,
  STATUS_DATING,
  STATUS_NONE,
  STATUS_ROOMMATE,
  statusChoices,
  statusOf,
  trackedCountFor,
  trackGift,
  trackingOf,
  untrackGift,
  villagersSummary,
} from "@/service/villagers";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const base = (): GameData => clone(DEFAULT_GAME_DATA);
const villager = (name: string) =>
  allVillagers.find((item) => item.name === name)!;
const shane = villager("Shane");
const withProgress = (data: GameData, name: string, change: object) => {
  data.villagers[name] = {
    hearts: 0,
    heartPoints: 0,
    eventsSeen: [],
    status: "",
    ...change,
  };
  return data;
};

describe("hearts and points", () => {
  it("starts a villager with no record at zero", () => {
    expect(progressOf(base(), "Shane")).toMatchObject({
      hearts: 0,
      heartPoints: 0,
    });
  });

  it("sets hearts and friendship points together, 250 to a heart", () => {
    const data = setHearts(base(), "Shane", 7);

    expect(data.villagers.Shane).toMatchObject({
      hearts: 7,
      heartPoints: 1750,
    });
  });

  it("rounds saved points down to a whole heart when the stepper moves", () => {
    const data = withProgress(base(), "Shane", {
      hearts: 7,
      heartPoints: 1870,
    });

    expect(setHearts(data, "Shane", 6).villagers.Shane.heartPoints).toBe(1500);
  });

  it("keeps hearts between zero and the cap", () => {
    expect(setHearts(base(), "Shane", 99).villagers.Shane.hearts).toBe(8);
    expect(setHearts(base(), "Shane", -2).villagers.Shane.hearts).toBe(0);
  });

  it("leaves an unknown villager alone", () => {
    const data = base();

    expect(setHearts(data, "Nobody", 3)).toBe(data);
  });

  it("keeps the event list and status when the hearts change", () => {
    const data = withProgress(base(), "Shane", {
      status: "Dating",
      eventsSeen: ["611944"],
    });
    const next = setHearts(data, "Shane", 3).villagers.Shane;

    expect(next.eventsSeen).toEqual(["611944"]);
    expect(next.status).toBe("Dating");
  });

  it("tells how many points are left to the next heart", () => {
    expect(pointsToNextHeart(1870)).toBe(130);
    expect(pointsToNextHeart(1750)).toBe(250);
  });
});

describe("the heart cap", () => {
  it("is 8 for a candidate, 10 for the others, and 12 or 14 with a bouquet or a spouse", () => {
    expect(maxHeartsOf(base(), shane)).toBe(8);
    expect(maxHeartsOf(base(), villager("Pierre"))).toBe(10);
    expect(maxHeartsOf(setStatus(base(), "Shane", "dating"), shane)).toBe(10);
    const married = base();
    married.character.spouse = "Shane";
    expect(maxHeartsOf(married, shane)).toBe(14);
  });

  it("knows who is at the cap", () => {
    expect(isMaxed(setHearts(base(), "Shane", 8), shane)).toBe(true);
    expect(isMaxed(setHearts(base(), "Shane", 7), shane)).toBe(false);
  });
});

describe("relationship status", () => {
  it("reads none, dating, roommate and married", () => {
    const data = base();
    data.villagers.Shane = {
      hearts: 0,
      heartPoints: 0,
      eventsSeen: [],
      status: "Dating",
    };
    data.villagers.Krobus = {
      hearts: 0,
      heartPoints: 0,
      eventsSeen: [],
      status: "Roommate",
    };
    data.character.spouse = "Abigail";

    expect(statusOf(data, shane)).toBe("dating");
    expect(statusOf(data, villager("Krobus"))).toBe("roommate");
    expect(statusOf(data, villager("Abigail"))).toBe("married");
    expect(statusOf(data, villager("Pierre"))).toBe("none");
    expect(statusOf(base(), shane)).toBe("none");
  });

  it("reads the status of a save whatever its casing", () => {
    const data = withProgress(base(), "Shane", { status: "dating" });

    expect(statusOf(data, shane)).toBe("dating");
  });

  it("offers dating to a candidate, a roommate to Krobus and nothing to the others", () => {
    expect(statusChoices(shane)).toEqual(["none", "dating"]);
    expect(statusChoices(villager("Krobus"))).toEqual(["none", "roommate"]);
    expect(statusChoices(villager("Pierre"))).toEqual(["none"]);
  });

  it("writes the strings the game writes", () => {
    expect(setStatus(base(), "Shane", "dating").villagers.Shane.status).toBe(
      STATUS_DATING,
    );
    expect(
      setStatus(base(), "Krobus", "roommate").villagers.Krobus.status,
    ).toBe(STATUS_ROOMMATE);
    const cleared = setStatus(
      setStatus(base(), "Shane", "dating"),
      "Shane",
      "none",
    );
    expect(cleared.villagers.Shane.status).toBe(STATUS_NONE);
    expect(STATUS_NONE).toBe("Friendly");
  });

  it("does not allow a status the villager cannot have", () => {
    const data = base();

    expect(setStatus(data, "Pierre", "dating")).toBe(data);
    expect(setStatus(data, "Shane", "roommate")).toBe(data);
    expect(setStatus(data, "Krobus", "dating")).toBe(data);
  });

  it("does not change the status of the spouse", () => {
    const data = base();
    data.character.spouse = "Shane";

    expect(setStatus(data, "Shane", "none")).toBe(data);
  });

  it("pulls the hearts down to the new cap when dating ends", () => {
    const dating = setHearts(setStatus(base(), "Shane", "dating"), "Shane", 10);
    const ended = setStatus(dating, "Shane", "none");

    expect(ended.villagers.Shane).toMatchObject({
      hearts: 8,
      heartPoints: 2000,
    });
  });
});

describe("heart events", () => {
  const eventWithId = shane.events.find(
    (event) => event.id !== null && !Array.isArray(event.id),
  )!;
  const derived = shane.events.find((event) => event.id === null)!;
  const several = allVillagers
    .flatMap((v) => v.events)
    .find((event) => Array.isArray(event.id))!;
  const owner = allVillagers.find((v) => v.events.includes(several))!;

  it("counts only the events that have an id", () => {
    const total = shane.events.filter((event) => event.id !== null).length;

    expect(eventCountOf(base(), shane)).toEqual({ seen: 0, total });
  });

  it("marks an event seen and clears it again", () => {
    const seen = setEventSeen(base(), "Shane", eventWithId, true);

    expect(seen.villagers.Shane.eventsSeen).toEqual([String(eventWithId.id)]);
    expect(eventCountOf(seen, shane).seen).toBe(1);
    expect(
      setEventSeen(seen, "Shane", eventWithId, false).villagers.Shane
        .eventsSeen,
    ).toEqual([]);
  });

  it("does not add an event twice", () => {
    const once = setEventSeen(base(), "Shane", eventWithId, true);

    expect(
      setEventSeen(once, "Shane", eventWithId, true).villagers.Shane.eventsSeen,
    ).toHaveLength(1);
  });

  it("takes an event that has several ids as seen when one is saved, and clears all of them", () => {
    const ids = (several.id as number[]).map(String);
    const data = withProgress(base(), owner.name, { eventsSeen: [ids[1]] });

    expect(isEventSeen(several, [ids[1]], 0)).toBe(true);
    expect(eventCountOf(data, owner).seen).toBeGreaterThanOrEqual(1);
    const cleared = setEventSeen(data, owner.name, several, false);
    expect(
      cleared.villagers[owner.name].eventsSeen.filter((id) => ids.includes(id)),
    ).toEqual([]);
  });

  it("reads an event with no id from the hearts, and cannot be set", () => {
    const data = base();

    expect(isEventSeen(derived, [], derived.heart)).toBe(true);
    expect(isEventSeen(derived, [], derived.heart - 1)).toBe(false);
    expect(setEventSeen(data, "Shane", derived, true)).toBe(data);
  });
});

describe("villager filters", () => {
  it("lists 34 villagers in name order with no filter", () => {
    const shown = filterVillagers(emptyVillagerFilters);

    expect(shown).toHaveLength(34);
    expect(shown.map((v) => v.name)).toEqual(
      [...shown.map((v) => v.name)].sort(),
    );
    expect(isFilteringVillagers(emptyVillagerFilters)).toBe(false);
  });

  it("filters by birthday season and by who can marry", () => {
    expect(
      filterVillagers({ ...emptyVillagerFilters, season: "spring" }),
    ).toHaveLength(8);
    expect(
      filterVillagers({ ...emptyVillagerFilters, marriage: "marriageable" }),
    ).toHaveLength(13);
    expect(
      filterVillagers({
        ...emptyVillagerFilters,
        marriage: "non-marriageable",
      }),
    ).toHaveLength(21);
    expect(
      isFilteringVillagers({ ...emptyVillagerFilters, season: "fall" }),
    ).toBe(true);
  });

  it("searches the name without caring about case", () => {
    expect(
      filterVillagers({ ...emptyVillagerFilters, query: "SHAN" }).map(
        (v) => v.name,
      ),
    ).toEqual(["Shane"]);
  });
});

describe("villagers summary", () => {
  it("reads every villager, not only the first", () => {
    let data = setHearts(base(), "Shane", 8);
    data = setHearts(data, "Pierre", 10);
    data = setHearts(data, "Abigail", 5);
    data = setEventSeen(
      data,
      "Pierre",
      villager("Pierre").events.find((e) => e.id !== null)!,
      true,
    );
    data = setEventSeen(
      data,
      "Shane",
      shane.events.find((e) => e.id !== null && !Array.isArray(e.id))!,
      true,
    );
    data.character.spouse = "Leah";
    const summary = villagersSummary(data);

    expect(summary).toMatchObject({
      total: 34,
      maxed: 2,
      tenPlus: 1,
      fivePlus: 3,
      eventsSeen: 2,
      spouse: "Leah",
    });
    expect(summary.eventsTotal).toBe(121);
  });
});

describe("birthdays", () => {
  it("lists four seasons by day and marks today", () => {
    const data = base();
    data.character.currentDate = {
      season: "spring",
      day: 20,
      year: 1,
    } as GameData["character"]["currentDate"];
    const seasons = birthdaysBySeason(data);

    expect(seasons.map((s) => s.id)).toEqual([
      "spring",
      "summer",
      "fall",
      "winter",
    ]);
    expect(seasons.map((s) => s.entries.length)).toEqual([8, 9, 8, 9]);
    const days = seasons[0].entries.map((e) => e.villager.birthday.day);
    expect(days).toEqual([...days].sort((a, b) => a - b));
    expect(
      seasons
        .flatMap((s) => s.entries)
        .filter((e) => e.today)
        .map((e) => e.villager.name),
    ).toEqual(["Shane"]);
  });
});

describe("gifts", () => {
  it("puts the villager's own gifts first and then the universal ones", () => {
    const loves = giftsFor(shane, "loves");

    expect(loves.filter((g) => !g.universal).map((g) => g.name)).toEqual(
      shane.loves,
    );
    expect(loves.some((g) => g.universal && g.name === "Golden Pumpkin")).toBe(
      true,
    );
    expect(giftsFor(shane, "neutrals").some((g) => g.universal)).toBe(true);
  });

  it("does not list a gift twice when it is both personal and universal", () => {
    const names = giftsFor(shane, "loves").map((g) => g.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("tracks only loved and liked items, not categories", () => {
    expect(canTrackGift("loves", "Pizza")).toBe(true);
    expect(canTrackGift("likes", "Pizza")).toBe(true);
    expect(canTrackGift("neutrals", "Pizza")).toBe(false);
    expect(canTrackGift("hates", "Pizza")).toBe(false);
    expect(
      canTrackGift("likes", "All Fruit Tree Fruits (except Banana & Mango)"),
    ).toBe(false);
  });

  it("tracks and untracks a gift for a villager", () => {
    const tracked = trackGift(base(), "Shane", "Pizza", "loves");

    expect(tracked.trackedGifts).toEqual([
      {
        itemName: "Pizza",
        villagerName: "Shane",
        given: false,
        preference: "loves",
      },
    ]);
    expect(trackingOf(tracked, "Shane", "Pizza")).toBe("tracked");
    expect(trackingOf(tracked, "Abigail", "Pizza")).toBe("untracked");
    expect(trackedCountFor(tracked, "Shane")).toBe(1);
    expect(untrackGift(tracked, "Shane", "Pizza").trackedGifts).toEqual([]);
  });

  it("does not track a gift twice", () => {
    const once = trackGift(base(), "Shane", "Pizza", "loves");

    expect(trackGift(once, "Shane", "Pizza", "loves")).toBe(once);
  });

  it("shows a given gift as given and does not count it", () => {
    const data = base();
    data.trackedGifts = [
      {
        itemName: "Pizza",
        villagerName: "Shane",
        given: true,
        preference: "loves",
      },
    ];

    expect(trackingOf(data, "Shane", "Pizza")).toBe("given");
    expect(trackedCountFor(data, "Shane")).toBe(0);
  });

  it("works for a playthrough that has no tracked gift list", () => {
    const data = base() as Partial<GameData> as GameData;
    delete (data as Partial<GameData>).trackedGifts;

    expect(trackingOf(data, "Shane", "Pizza")).toBe("untracked");
    expect(
      trackGift(data, "Shane", "Pizza", "loves").trackedGifts,
    ).toHaveLength(1);
  });
});
