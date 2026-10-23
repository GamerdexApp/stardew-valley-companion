import type { GameData } from "@/types/app";
import { DEFAULT_GAME_DATA } from "@/data/constants";

export type SaveUpdateMode = "fill" | "replace";

/** A save file cannot hold these, so an update never touches them. */
export const FIELDS_A_SAVE_CANNOT_HOLD = ["trackedGifts", "lostBooks"] as const;

type Plain = Record<string, unknown>;

const isPlain = (value: unknown): value is Plain =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === 0 ||
  value === false ||
  value === "" ||
  (Array.isArray(value) && value.length === 0) ||
  (isPlain(value) && Object.keys(value).length === 0);

const sameValue = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/** Where there is a default to compare with, a value that still equals it was never edited. */
const isGap = (mine: unknown, base: unknown): boolean =>
  base === undefined ? isEmpty(mine) : sameValue(mine, base);

const identityOf = (item: unknown): string | null => {
  if (!isPlain(item)) return null;
  const key = item.id ?? item.name;
  return typeof key === "string" || typeof key === "number"
    ? String(key)
    : null;
};

const mergeLists = (mine: unknown[], theirs: unknown[]): unknown[] => {
  const identified = [...mine, ...theirs].some(
    (item) => identityOf(item) !== null,
  );
  if (!identified) {
    const seen = new Set(mine.map((item) => JSON.stringify(item)));
    return [
      ...mine,
      ...theirs.filter((item) => !seen.has(JSON.stringify(item))),
    ];
  }
  const keys = new Set(mine.map(identityOf));
  const merged = mine.map((item) => {
    const match = theirs.find(
      (other) => identityOf(other) === identityOf(item),
    );
    return match === undefined
      ? item
      : mergeFillingGaps(item, match, undefined);
  });
  return [...merged, ...theirs.filter((item) => !keys.has(identityOf(item)))];
};

/**
 * Keeps every value the player changed and takes the save's value wherever the player's value is
 * still empty or still the default.
 */
const mergeFillingGaps = (
  mine: unknown,
  theirs: unknown,
  base: unknown,
): unknown => {
  if (theirs === undefined) return mine;
  if (mine === undefined) return theirs;
  if (isPlain(mine) && isPlain(theirs)) {
    const baseObject = isPlain(base) ? base : {};
    const keys = new Set([...Object.keys(mine), ...Object.keys(theirs)]);
    return Object.fromEntries(
      [...keys].map((key) => [
        key,
        mergeFillingGaps(mine[key], theirs[key], baseObject[key]),
      ]),
    );
  }
  if (Array.isArray(mine) && Array.isArray(theirs)) {
    return mergeLists(mine, theirs);
  }
  return isGap(mine, base) ? theirs : mine;
};

export const applySaveUpdate = (
  current: GameData,
  fromSave: GameData,
  mode: SaveUpdateMode,
): GameData => {
  const kept = Object.fromEntries(
    FIELDS_A_SAVE_CANNOT_HOLD.map((field) => [field, current[field]]),
  );
  if (mode === "replace") return { ...current, ...fromSave, ...kept };

  const merged = mergeFillingGaps(
    current,
    fromSave,
    DEFAULT_GAME_DATA,
  ) as GameData;
  return { ...merged, ...kept };
};

const changes = (before: unknown, after: unknown): number => {
  if (sameValue(before, after)) return 0;
  if (isPlain(before) && isPlain(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].reduce(
      (total, key) => total + changes(before[key], after[key]),
      0,
    );
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const identified = [...before, ...after].some(
      (item) => identityOf(item) !== null,
    );
    if (!identified) {
      const left = new Set(before.map((item) => JSON.stringify(item)));
      const right = new Set(after.map((item) => JSON.stringify(item)));
      return (
        [...right].filter((item) => !left.has(item)).length +
        [...left].filter((item) => !right.has(item)).length
      );
    }
    const keys = new Set([...before, ...after].map(identityOf));
    return [...keys].reduce<number>((total, key) => {
      const was = before.find((item) => identityOf(item) === key);
      const now = after.find((item) => identityOf(item) === key);
      return total + changes(was, now);
    }, 0);
  }
  return 1;
};

/**
 * How many values an update changes. A value is a changed field, or an entry that is added or
 * removed.
 */
export const countChanges = (before: GameData, after: GameData): number =>
  changes(before, after);

/** The same count per field of the saved data, for the fields that change. */
export const changesBySection = (
  before: GameData,
  after: GameData,
): { field: string; count: number }[] =>
  [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .map((field) => ({
      field,
      count: changes(
        (before as unknown as Plain)[field],
        (after as unknown as Plain)[field],
      ),
    }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);
