import type { Skill } from "stardew-valley-data";
import type {
  CharacterInfo,
  ChildProgress,
  GameData,
  MasteryProgress,
  SkillProgress,
  ToolLevels,
} from "@/types/app/game";

export interface CharacterProps {
  gameData: GameData;
}

export interface SkillsSectionProps extends CharacterProps {
  onToggleProfession?: (profId: string) => void;
}

export type RodLevel = {
  name: string;
  image: string;
  cost: number | null;
  fishingLevelRequired: number | null;
  bait: boolean;
  tackleSlots: number;
  canEnchant: boolean;
  obtain: string;
  description: string;
};

export type RodData = {
  id: string;
  type: string;
  name: string;
  description: string;
  canEnchant: boolean;
  levels: RodLevel[];
};
