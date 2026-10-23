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

export interface CollectionProps {
  gameData: GameData;
}

export interface IngredientOption {
  name: string;
  basePrice: number;
  image: string;
  energy?: number;
  health?: number;
  sublabel?: string;
}

export interface ArtisanResult {
  sellPrice: number;
  energy?: number;
  health?: number;
}

export interface ProduceEntry {
  produce: AnimalProduce;
  animalName: string;
  building: string;
  isDeluxe: boolean;
}

export interface ProduceCardProps {
  entry: ProduceEntry;
  shipped: boolean;
  shippable?: boolean;
  professionBonus?: BonusResult | null;
}

export interface ArtisanGoodCardProps {
  good: ArtisanGood;
  shipped: boolean;
  shippable: boolean;
  professionBonus?: BonusResult | null;
  onCalculate: () => void;
  ingredientImageMap: Record<string, string>;
}

export interface DifficultyBarProps {
  difficulty: string;
  behavior: string;
}

export interface ArtisanUsesRowProps {
  artisanUses: Record<string, boolean>;
}

export interface ForageableCardProps {
  item: Forageable;
  shippable: boolean;
  shipped: boolean;
  shippedCount: number;
  professionBonus?: BonusResult | null;
}

export interface FruitTreeProduceCardProps {
  tree: FruitTree;
  shipped: boolean;
  shippedCount: number;
  professionBonus?: BonusResult | null;
}

export interface WildTreeTapperCardProps {
  tree: WildTree;
  shipped: boolean;
  shippedCount: number;
  professionBonus?: BonusResult | null;
}

export interface FruitTreeCardProps {
  tree: FruitTree;
  onClick: () => void;
}

export interface WildTreeCardProps {
  tree: WildTree;
  onClick: () => void;
}

export interface ItemTileProps {
  item: CollectionItem;
  complete: boolean;
}

export interface FishCardProps {
  fish: Fish;
  caught: boolean;
  professionBonus?: ReturnType<typeof applyBestProfessionBonus>;
  onClick: () => void;
}

export interface CropCardProps {
  crop: Crop;
  shipped: boolean;
  shippedCount: number;
  professionBonus?: BonusResult | null;
  onClick: () => void;
}

export interface CategorySectionProps {
  title: string;
  items: CollectionItem[];
  isComplete: (item: CollectionItem) => boolean;
}

export interface FishDetailModalProps {
  fish: Fish | null;
  caught: boolean;
  onClose: () => void;
  activeProfessionBonuses?: Set<ProfessionBonus> | null;
}

export interface CropDetailModalProps extends CollectionProps {
  crop: Crop | null;
  onClose: () => void;
}

export interface ArtifactDetailModalProps {
  artifact: Artifact | null;
  donated: boolean;
  found: boolean;
  onClose: () => void;
}

export interface TreeDetailModalProps extends CollectionProps {
  tree: Tree | null;
  shippableIds: Set<string>;
  onClose: () => void;
}

export interface PriceFormulaModalProps {
  good: ArtisanGood | null;
  onClose: () => void;
  activeProfessionBonuses?: Set<ProfessionBonus> | null;
}

export interface MonsterLootCardProps {
  loot: MonsterLoot;
  shipped: boolean;
  shippable: boolean;
  onClick: () => void;
}

export interface MonsterLootDetailModalProps {
  loot: MonsterLoot | null;
  shipped: boolean;
  shippable: boolean;
  onClose: () => void;
}

export interface SlayerGoalCardProps {
  goal: MonsterSlayerGoal;
  killCount: number;
}

export interface MonsterCardProps {
  monster: Monster;
  killCount: number;
  onClick: () => void;
}

export interface MonsterDetailModalProps {
  monster: Monster | null;
  killCount: number;
  onClose: () => void;
}

export interface RarecrowCardProps {
  rarecrow: Rarecrow;
  obtained: boolean;
}

// ---- Edit drafts ----

export interface FishEditDraft {
  fishCaught: FishCaughtProgress[];
}

export interface SpecialItemsEditDraft {
  specialItems: string[];
  books: string[];
}

export interface RarecrowsEditDraft {
  rarecrows: string[];
}

export interface ShippedEditDraft {
  shipped: Record<string, ShippedItem>;
}

// ---- Edit step props ----

export interface FishEditStepProps {
  fishCaught: FishCaughtProgress[];
  onChange: (fishCaught: FishCaughtProgress[]) => void;
}

export interface SpecialItemsEditStepProps {
  specialItems: string[];
  books: string[];
  onSpecialItemsChange: (specialItems: string[]) => void;
  onBooksChange: (books: string[]) => void;
}

export interface RarecrowsEditStepProps {
  rarecrows: string[];
  onChange: (rarecrows: string[]) => void;
}

export interface ShipEditItem {
  id: string;
  name: string;
  image: string;
}

export interface ShippedItemsEditStepProps {
  items: ShipEditItem[];
  shipped: Record<string, ShippedItem>;
  onChange: (shipped: Record<string, ShippedItem>) => void;
}

export interface CropsShippedEditStepProps {
  shipped: Record<string, ShippedItem>;
  onChange: (shipped: Record<string, ShippedItem>) => void;
}

export interface ForageablesShippedEditStepProps {
  shipped: Record<string, ShippedItem>;
  onChange: (shipped: Record<string, ShippedItem>) => void;
}

export interface AnimalProductsShippedEditStepProps {
  shipped: Record<string, ShippedItem>;
  onChange: (shipped: Record<string, ShippedItem>) => void;
}

export interface MonsterLootShippedEditStepProps {
  shipped: Record<string, ShippedItem>;
  onChange: (shipped: Record<string, ShippedItem>) => void;
}

export interface ArtisanGoodsShippedEditStepProps {
  shipped: Record<string, ShippedItem>;
  onChange: (shipped: Record<string, ShippedItem>) => void;
}
