import type { GameData } from "@/types/app";

export const isShipped = (data: GameData, id: string): boolean =>
  data.shipped[id]?.shipped === true;

/** The shipped count, never below one for a shipped item. */
export const shippedCount = (data: GameData, id: string): number =>
  isShipped(data, id) ? Math.max(1, data.shipped[id].count) : 0;

/**
 * Shipping adds the entry the old edit step wrote, with a count of one. Unshipping deletes the
 * entry together with its count, so a caller that wants Undo keeps the previous data.
 */
export const setShipped = (
  data: GameData,
  id: string,
  shipped: boolean,
): GameData => {
  if (isShipped(data, id) === shipped) return data;
  const { [id]: _removed, ...rest } = data.shipped;
  return {
    ...data,
    shipped: shipped ? { ...rest, [id]: { shipped: true, count: 1 } } : rest,
  };
};

export const setShippedCount = (
  data: GameData,
  id: string,
  count: number,
): GameData => {
  if (!isShipped(data, id)) return data;
  return {
    ...data,
    shipped: {
      ...data.shipped,
      [id]: { shipped: true, count: Math.max(1, Math.floor(count)) },
    },
  };
};
