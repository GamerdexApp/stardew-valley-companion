import type { GameData } from "@/types/app";
import { countFishCaught } from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import type { CollectionTabId } from "@/data/collections";

/** The done and total on a tab pill. A tab that is not rebuilt yet has none. */
export const tabCount = (
  tab: CollectionTabId,
  data: GameData,
): ProgressCount | null => (tab === "fish" ? countFishCaught(data) : null);
