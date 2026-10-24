import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  allBooks,
  allQuests,
  isBookFound,
  isNoteFound,
  isOrderDone,
  isQuestDone,
  isScrapFound,
  journalScrapList,
  qiOrders,
  questKey,
  questsSummary,
  searchItems,
  secretNoteList,
  setBookFound,
  setBooksFound,
  setHelpWanted,
  setNoteFound,
  setOrderDone,
  setQuestDone,
  setScrapFound,
  townOrders,
} from "@/service/quests";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const base = (): GameData => clone(DEFAULT_GAME_DATA);
const quest = (name: string) => allQuests.find((item) => item.name === name)!;

describe("the lists", () => {
  it("knows 58 quests, 18 town orders, 10 Qi orders, 27 notes, 11 scraps and 21 books", () => {
    expect(allQuests).toHaveLength(58);
    expect(townOrders).toHaveLength(18);
    expect(qiOrders).toHaveLength(10);
    expect(secretNoteList).toHaveLength(27);
    expect(journalScrapList).toHaveLength(11);
    expect(allBooks).toHaveLength(21);
  });

  it("saves journal scraps under the ids 1001 to 1011", () => {
    expect(journalScrapList.map((scrap) => scrap.id)).toEqual(
      Array.from({ length: 11 }, (_, index) => String(1001 + index)),
    );
  });
});

describe("quest keys", () => {
  it("gives every quest its own key", () => {
    const keys = allQuests.map(questKey);

    expect(new Set(keys).size).toBe(58);
  });

  it("keeps the plain id for the first quest of a shared id and adds a word to the next", () => {
    expect(questKey(quest("Getting Started"))).toBe("132");
    expect(questKey(quest("Getting Started (Animals)"))).toBe("132-animals");
    expect(questKey(quest("Introductions"))).toBe("9");
  });

  it("marks only one of the two quests with the shared id", () => {
    const done = setQuestDone(base(), quest("Getting Started (Animals)"), true);

    expect(isQuestDone(done, quest("Getting Started (Animals)"))).toBe(true);
    expect(isQuestDone(done, quest("Getting Started"))).toBe(false);
    expect(done.questsCompleted).toEqual({ "132-animals": true });
  });

  it("reads the plain id of a save as the first quest only", () => {
    const data = { ...base(), questsCompleted: { "132": true } };

    expect(isQuestDone(data, quest("Getting Started"))).toBe(true);
    expect(isQuestDone(data, quest("Getting Started (Animals)"))).toBe(false);
  });

  it("clears a quest again", () => {
    const data = setQuestDone(
      setQuestDone(base(), quest("Introductions"), true),
      quest("Introductions"),
      false,
    );

    expect(isQuestDone(data, quest("Introductions"))).toBe(false);
  });
});

describe("special orders", () => {
  it("marks a town order and a Qi order done, each under its own id", () => {
    let data = setOrderDone(base(), townOrders[0], true);
    data = setOrderDone(data, qiOrders[0], true);

    expect(isOrderDone(data, townOrders[0])).toBe(true);
    expect(isOrderDone(data, qiOrders[0])).toBe(true);
    expect(isOrderDone(data, townOrders[1])).toBe(false);
    expect(Object.keys(data.specialOrdersCompleted)).toEqual([
      townOrders[0].id,
      qiOrders[0].id,
    ]);
  });
});

describe("secret notes and journal scraps", () => {
  it("saves notes and scraps in their own maps", () => {
    let data = setNoteFound(base(), secretNoteList[2], true);
    data = setScrapFound(data, journalScrapList[0], true);

    expect(data.secretNotes).toEqual({ [secretNoteList[2].id]: true });
    expect(data.journalScraps).toEqual({ "1001": true });
    expect(isNoteFound(data, secretNoteList[2])).toBe(true);
    expect(isScrapFound(data, journalScrapList[0])).toBe(true);
    expect(isScrapFound(data, journalScrapList[1])).toBe(false);
  });

  it("does not mix a note with a scrap", () => {
    const data = setScrapFound(base(), journalScrapList[0], true);

    expect(Object.keys(data.secretNotes)).toEqual([]);
  });
});

describe("lost books", () => {
  it("names one of the counted books when it is ticked, and does not raise the count", () => {
    const counted = { ...base(), lostBooksFound: 15 };
    const ticked = setBookFound(counted, allBooks[0], true);

    expect(ticked.lostBooksFound).toBe(15);
    expect(isBookFound(ticked, allBooks[0])).toBe(true);
    const cleared = setBookFound(ticked, allBooks[0], false);
    expect(cleared.lostBooksFound).toBe(15);
    expect(isBookFound(cleared, allBooks[0])).toBe(false);
  });

  it("raises the count when more books are ticked than counted, and lowers it again", () => {
    const first = setBookFound(base(), allBooks[0], true);
    const second = setBookFound(first, allBooks[1], true);
    const back = setBookFound(second, allBooks[1], false);

    expect(first.lostBooksFound).toBe(1);
    expect(second.lostBooksFound).toBe(2);
    expect(back.lostBooksFound).toBe(1);
    expect(setBookFound(back, allBooks[0], false).lostBooksFound).toBe(0);
  });

  it("gives the same count back after a tick and a clear, even when all 21 are counted", () => {
    const full = { ...base(), lostBooksFound: 21 };
    const round = setBookFound(
      setBookFound(full, allBooks[4], true),
      allBooks[4],
      false,
    );

    expect(round.lostBooksFound).toBe(21);
  });

  it("does nothing when the book is already in that state", () => {
    const data = base();

    expect(setBookFound(data, allBooks[0], false)).toBe(data);
    const ticked = setBookFound(data, allBooks[0], true);
    expect(setBookFound(ticked, allBooks[0], true)).toBe(ticked);
  });

  it("keeps the count between 0 and 21", () => {
    const full = setBookFound(
      { ...base(), lostBooksFound: 21 },
      allBooks[0],
      true,
    );
    const empty = setBookFound(
      { ...base(), lostBooks: { [allBooks[0].id]: true } },
      allBooks[0],
      false,
    );

    expect(full.lostBooksFound).toBe(21);
    expect(empty.lostBooksFound).toBe(0);
    expect(setBooksFound(base(), 99).lostBooksFound).toBe(21);
    expect(setBooksFound(base(), -4).lostBooksFound).toBe(0);
    expect(setBooksFound(base(), 7.8).lostBooksFound).toBe(7);
  });

  it("leaves the ticked books alone when the count is typed", () => {
    const data = setBookFound(base(), allBooks[3], true);

    expect(setBooksFound(data, 10).lostBooks).toEqual(data.lostBooks);
  });
});

describe("help wanted", () => {
  it("is a whole number, never below zero", () => {
    expect(setHelpWanted(base(), 41).helpWantedCompleted).toBe(41);
    expect(setHelpWanted(base(), -2).helpWantedCompleted).toBe(0);
    expect(setHelpWanted(base(), 5.9).helpWantedCompleted).toBe(5);
  });
});

describe("quests summary", () => {
  it("counts every list", () => {
    let data = setQuestDone(base(), quest("Introductions"), true);
    data = setQuestDone(data, quest("Getting Started (Animals)"), true);
    data = setOrderDone(data, townOrders[0], true);
    data = setOrderDone(data, qiOrders[0], true);
    data = setOrderDone(data, qiOrders[1], true);
    data = setNoteFound(data, secretNoteList[0], true);
    data = setScrapFound(data, journalScrapList[0], true);
    data = setScrapFound(data, journalScrapList[1], true);
    data = setHelpWanted(setBooksFound(data, 15), 41);

    expect(questsSummary(data)).toEqual({
      quests: 2,
      questsTotal: 58,
      town: 1,
      townTotal: 18,
      qi: 2,
      qiTotal: 10,
      helpWanted: 41,
      notes: 1,
      notesTotal: 27,
      scraps: 2,
      scrapsTotal: 11,
      books: 15,
      booksTotal: 21,
    });
  });
});

describe("search", () => {
  it("matches the name and the extra texts without caring about case", () => {
    expect(searchItems(allQuests, "INTRO").map((item) => item.name)).toContain(
      "Introductions",
    );
    expect(
      searchItems(allQuests, "greet 28", (item) => [item.requirements]).map(
        (item) => item.name,
      ),
    ).toEqual(["Introductions"]);
    expect(searchItems(allQuests, "")).toHaveLength(58);
    expect(searchItems(allQuests, "zzzzzz")).toEqual([]);
  });
});
