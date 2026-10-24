import type {
  AnimalProduce,
  Artifact,
  ArtisanGood,
  BarItem,
  CollectionItem,
  CookedDish,
  Crop,
  Fish,
  Forageable,
  FruitTree,
  GeodeContainer,
  MineralItem,
  Monster,
  MonsterLoot,
  MonsterSlayerGoal,
  NodeItem,
  OreItem,
  ProfessionBonus,
  Rarecrow,
  ResourceItem,
  CookingRecipe as SDVCookingRecipe,
  CraftingRecipe as SDVCraftingRecipe,
  Tree,
  WildTree,
} from "stardew-valley-data";
import type { BonusResult } from "@/lib/utils/professionPrices";
import type { applyBestProfessionBonus } from "@/lib/utils/professionPrices";
import type {
  CookingRecipe,
  CraftingRecipe,
  FishCaughtProgress,
  GameData,
  MuseumItem,
  ShippedItem,
} from "../app/game";

export interface DifficultyBarProps {
  difficulty: string;
  behavior: string;
}

export interface FishCardProps {
  fish: Fish;
  caught: boolean;
  professionBonus?: ReturnType<typeof applyBestProfessionBonus>;
  onClick: () => void;
}

export interface CategorySectionProps {
  title: string;
  items: CollectionItem[];
  isComplete: (item: CollectionItem) => boolean;
}

// ---- Edit drafts ----

// ---- Edit step props ----
