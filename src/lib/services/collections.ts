import type { GameData } from "@/types/app";
import {
  countArtifactsFound,
  countCookingMade,
  countCraftingMade,
  countCropsShipped,
  countFishCaught,
  countMineralsFound,
} from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import type { CollectionTabId } from "@/data/collections";
import { countForageablesShipped } from "./forageables";

/** The done and total on a tab pill. A tab that is not rebuilt yet has none. */
export const tabCount = (
  tab: CollectionTabId,
  data: GameData,
): ProgressCount | null => {
  if (tab === "fish") return countFishCaught(data);
  if (tab === "artifacts") return countArtifactsFound(data);
  if (tab === "minerals") return countMineralsFound(data);
  if (tab === "cooking") return countCookingMade(data);
  if (tab === "crafting") return countCraftingMade(data);
  if (tab === "crops") return countCropsShipped(data);
  if (tab === "forageables") return countForageablesShipped(data);
  return null;
};
