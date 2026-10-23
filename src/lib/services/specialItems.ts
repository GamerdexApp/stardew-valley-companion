import { specialItems as querySpecialItems } from "stardew-valley-data";
import type { SpecialItem, SpecialItemType } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import type { ProgressCount } from "@/lib/utils/collectionCounts";

export const allSpecialItems: SpecialItem[] = querySpecialItems().get();

/**
 * Special items and books are saved here. A mastery comes from the Character page, and a skill
 * book has no acquired state, so neither can be changed on this tab.
 */
export const isEditableItem = (item: SpecialItem): boolean =>
  item.type === "special-item" || item.type === "book";

export type SpecialItemState = "acquired" | "missing" | "info";

const masterySkill = (item: SpecialItem): string =>
  item.id.replace(/^Mastery_/, "").toLowerCase();

export const specialItemState = (
  data: GameData,
  item: SpecialItem,
): SpecialItemState => {
  switch (item.type) {
    case "special-item":
      return data.specialItems.includes(item.id) ? "acquired" : "missing";
    case "book":
      return data.books.includes(item.id) ? "acquired" : "missing";
    case "mastery":
      return data.mastery.unlocked.includes(masterySkill(item))
        ? "acquired"
        : "missing";
    case "skill-book":
      return "info";
  }
};

export const setSpecialItemAcquired = (
  data: GameData,
  item: SpecialItem,
  acquired: boolean,
): GameData => {
  if (!isEditableItem(item)) return data;
  if ((specialItemState(data, item) === "acquired") === acquired) return data;
  const field = item.type === "book" ? "books" : "specialItems";
  return {
    ...data,
    [field]: acquired
      ? [...data[field], item.id]
      : data[field].filter((other) => other !== item.id),
  };
};

export type SpecialTypeFilter = "all" | SpecialItemType;
export type SpecialStatusFilter = "all" | "acquired" | "not-acquired";

export interface SpecialItemFilters {
  query: string;
  type: SpecialTypeFilter;
  status: SpecialStatusFilter;
}

export const emptySpecialItemFilters: SpecialItemFilters = {
  query: "",
  type: "all",
  status: "all",
};

export const isFilteringSpecialItems = (filters: SpecialItemFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptySpecialItemFilters);

/** A skill book has no acquired state, so a status filter always keeps it. */
export const filterSpecialItems = (
  data: GameData,
  filters: SpecialItemFilters,
): SpecialItem[] => {
  const needle = filters.query.trim().toLowerCase();
  return allSpecialItems.filter((item) => {
    const state = specialItemState(data, item);
    return (
      item.name.toLowerCase().includes(needle) &&
      (filters.type === "all" || item.type === filters.type) &&
      (filters.status === "all" ||
        state === "info" ||
        (filters.status === "acquired") === (state === "acquired"))
    );
  });
};

/** The items that can be acquired. A skill book is only information and is not counted. */
const counted = (type: SpecialItemType): SpecialItem[] =>
  allSpecialItems.filter((item) => item.type === type);

const acquiredCount = (
  data: GameData,
  items: SpecialItem[],
): ProgressCount => ({
  current: items.filter((item) => specialItemState(data, item) === "acquired")
    .length,
  total: items.length,
});

export interface SpecialItemsSummary {
  specialItems: ProgressCount;
  books: ProgressCount;
  mastery: ProgressCount;
  total: ProgressCount;
}

export const specialItemsSummary = (data: GameData): SpecialItemsSummary => {
  const specialItems = acquiredCount(data, counted("special-item"));
  const books = acquiredCount(data, counted("book"));
  const mastery = acquiredCount(data, counted("mastery"));
  return {
    specialItems,
    books,
    mastery,
    total: {
      current: specialItems.current + books.current + mastery.current,
      total: specialItems.total + books.total + mastery.total,
    },
  };
};

export const countSpecialItemsAcquired = (data: GameData): ProgressCount =>
  specialItemsSummary(data).total;
