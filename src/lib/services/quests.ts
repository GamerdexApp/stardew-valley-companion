import {
  lostBooks,
  quests,
  secretNotes,
  specialOrders,
} from "stardew-valley-data";
import type {
  LostBook,
  Quest,
  SecretNote,
  SpecialOrderData,
} from "stardew-valley-data";
import type { GameData } from "@/types/app";

export const allQuests: Quest[] = quests().get();
export const allBooks: LostBook[] = lostBooks().get();
const orders = specialOrders().get();
export const townOrders: SpecialOrderData[] = orders.filter(
  (order) => order.type === "town",
);
export const qiOrders: SpecialOrderData[] = orders.filter(
  (order) => order.type === "qi",
);
const notes = secretNotes().get();
export const secretNoteList: SecretNote[] = notes.filter(
  (note) => note.type === "secret-note",
);
export const journalScrapList: SecretNote[] = notes.filter(
  (note) => note.type === "journal-scrap",
);

/**
 * Two quests share the id 132. The first keeps the plain id. The next one adds the word in its
 * brackets, so the two can be saved apart.
 */
export const questKey = (quest: Quest): string => {
  const sameId = allQuests.filter((other) => other.id === quest.id);
  if (sameId[0] === quest) return quest.id;
  const word =
    quest.name.match(/\(([^)]+)\)/)?.[1] ?? String(sameId.indexOf(quest));
  return `${quest.id}-${word.toLowerCase()}`;
};

export const isQuestDone = (data: GameData, quest: Quest): boolean =>
  Boolean(data.questsCompleted[questKey(quest)]);

export const setQuestDone = (
  data: GameData,
  quest: Quest,
  done: boolean,
): GameData => ({
  ...data,
  questsCompleted: { ...data.questsCompleted, [questKey(quest)]: done },
});

export const isOrderDone = (data: GameData, order: SpecialOrderData): boolean =>
  Boolean(data.specialOrdersCompleted[order.id]);

export const setOrderDone = (
  data: GameData,
  order: SpecialOrderData,
  done: boolean,
): GameData => ({
  ...data,
  specialOrdersCompleted: { ...data.specialOrdersCompleted, [order.id]: done },
});

export const isNoteFound = (data: GameData, note: SecretNote): boolean =>
  Boolean(data.secretNotes[note.id]);

export const isScrapFound = (data: GameData, scrap: SecretNote): boolean =>
  Boolean(data.journalScraps[scrap.id]);

export const setNoteFound = (
  data: GameData,
  note: SecretNote,
  found: boolean,
): GameData => ({
  ...data,
  secretNotes: { ...data.secretNotes, [note.id]: found },
});

/** Journal scraps are saved in their own map, with the ids 1001 to 1011. */
export const setScrapFound = (
  data: GameData,
  scrap: SecretNote,
  found: boolean,
): GameData => ({
  ...data,
  journalScraps: { ...data.journalScraps, [scrap.id]: found },
});

export const isBookFound = (data: GameData, book: LostBook): boolean =>
  Boolean(data.lostBooks[book.id]);

const clampBooks = (count: number): number =>
  Math.min(allBooks.length, Math.max(0, Math.floor(count)));

/** The count is typed on its own. A save holds the count and never says which books were found. */
export const setBooksFound = (data: GameData, count: number): GameData => ({
  ...data,
  lostBooksFound: clampBooks(count),
});

const tickedBooks = (data: GameData): number =>
  allBooks.filter((book) => isBookFound(data, book)).length;

/**
 * A save counts the books and never says which ones. Ticking a book names one of the counted
 * books, so the count only grows when more books are ticked than counted. Clearing a book lowers
 * the count only when every counted book was ticked, because that book is then not found.
 */
export const setBookFound = (
  data: GameData,
  book: LostBook,
  found: boolean,
): GameData => {
  if (isBookFound(data, book) === found) return data;
  const ticked = tickedBooks(data);
  const lostBooksFound = found
    ? Math.max(data.lostBooksFound, ticked + 1)
    : data.lostBooksFound <= ticked
      ? clampBooks(data.lostBooksFound - 1)
      : data.lostBooksFound;
  return {
    ...data,
    lostBooks: { ...data.lostBooks, [book.id]: found },
    lostBooksFound,
  };
};

/** Town board requests are not part of the 58 story quests. */
export const setHelpWanted = (data: GameData, count: number): GameData => ({
  ...data,
  helpWantedCompleted: Math.max(0, Math.floor(count)),
});

export interface QuestsSummary {
  quests: number;
  questsTotal: number;
  town: number;
  townTotal: number;
  qi: number;
  qiTotal: number;
  helpWanted: number;
  notes: number;
  notesTotal: number;
  scraps: number;
  scrapsTotal: number;
  books: number;
  booksTotal: number;
}

export const questsSummary = (data: GameData): QuestsSummary => ({
  quests: allQuests.filter((quest) => isQuestDone(data, quest)).length,
  questsTotal: allQuests.length,
  town: townOrders.filter((order) => isOrderDone(data, order)).length,
  townTotal: townOrders.length,
  qi: qiOrders.filter((order) => isOrderDone(data, order)).length,
  qiTotal: qiOrders.length,
  helpWanted: data.helpWantedCompleted,
  notes: secretNoteList.filter((note) => isNoteFound(data, note)).length,
  notesTotal: secretNoteList.length,
  scraps: journalScrapList.filter((scrap) => isScrapFound(data, scrap)).length,
  scrapsTotal: journalScrapList.length,
  books: data.lostBooksFound,
  booksTotal: allBooks.length,
});
