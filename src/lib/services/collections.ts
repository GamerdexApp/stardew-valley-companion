import type { GameData } from "@/types/app";
import {
  countArtifactsFound,
  countFishCaught,
  countMineralsFound,
} from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import type { CollectionTabId } from "@/data/collections";

/** The done and total on a tab pill. A tab that is not rebuilt yet has none. */
export const tabCount = (
  tab: CollectionTabId,
  data: GameData,
): ProgressCount | null => {
  if (tab === "fish") return countFishCaught(data);
  if (tab === "artifacts") return countArtifactsFound(data);
  if (tab === "minerals") return countMineralsFound(data);
  return null;
};
