import { grandpaEvaluator } from "stardew-valley-data";
import type {
  GrandpaCategory,
  GrandpaInput,
  GrandpaScoreEntry,
} from "stardew-valley-data";
import type { GameData } from "@/types/app";
import {
  collectionArtifacts,
  collectionMinerals,
  countFishCaught,
  shippingCollectionIds,
} from "@/lib/utils/collectionCounts";
import { CC_ROOMS } from "@/data/constants/bundles";
import { GRANDPA_CATEGORY_ORDER } from "@/data/constants/grandpa";
import { allVillagers, progressOf } from "./villagers";

export const MAX_SCORE = 21;
export const CANDLE_STEPS = [0, 4, 8, 12];
export const PET_MAX_FRIENDSHIP = 1000;

/** The earnings tiers of the game. There is no 750,000g tier. Points jump from 5 to 7 at one million. */
export const EARNINGS_TIERS = [
  { threshold: 50_000, points: 1 },
  { threshold: 100_000, points: 2 },
  { threshold: 200_000, points: 3 },
  { threshold: 300_000, points: 4 },
  { threshold: 500_000, points: 5 },
  { threshold: 1_000_000, points: 7 },
];

const ACHIEVEMENT_MUSEUM = "5";
const ACHIEVEMENT_ANGLER = "26";
const ACHIEVEMENT_SHIPMENT = "34";

export const totalSkillLevels = (data: GameData): number =>
  Object.values(data.skills).reduce((sum, skill) => sum + skill.level, 0);

/** Villagers at 8 hearts or more. A spouse has more hearts of their own and is left out. */
export const villagersAtEightHearts = (data: GameData): number =>
  allVillagers.filter(
    (villager) =>
      villager.name !== data.character.spouse &&
      progressOf(data, villager.name).hearts >= 8,
  ).length;

/** The best friendship among the cats, dogs and turtles. A horse does not count. */
export const bestPetFriendship = (data: GameData): number =>
  Math.max(
    0,
    ...data.pets
      .filter((pet) => pet.type.toLowerCase() !== "horse")
      .map((pet) => pet.friendship ?? 0),
  );

const roomsComplete = (data: GameData): number =>
  Object.values(data.communityCenter.rooms).filter(Boolean).length;

const museumProgress = (data: GameData) => ({
  current:
    collectionMinerals.filter((mineral) => data.minerals[mineral.id]?.donated)
      .length +
    collectionArtifacts.filter(
      (artifact) => data.artifacts[artifact.id]?.donated,
    ).length,
  total: collectionMinerals.length + collectionArtifacts.length,
});

const shipmentProgress = (data: GameData) => ({
  current: [...shippingCollectionIds].filter((id) => data.shipped[id]?.shipped)
    .length,
  total: shippingCollectionIds.size,
});

export const buildGrandpaInput = (data: GameData): GrandpaInput => ({
  totalEarnings: data.character.totalMoneyEarned,
  totalSkillLevels: totalSkillLevels(data),
  museumCompleted: data.achievements.includes(ACHIEVEMENT_MUSEUM),
  masterAngler: data.achievements.includes(ACHIEVEMENT_ANGLER),
  fullShipment: data.achievements.includes(ACHIEVEMENT_SHIPMENT),
  married:
    data.character.spouse !== "" && data.character.houseUpgradeLevel >= 2,
  villagersAt8Hearts: villagersAtEightHearts(data),
  petFriendship: bestPetFriendship(data) >= PET_MAX_FRIENDSHIP,
  communityCenterCompleted: data.communityCenter.completed,
  communityCenterCeremonyAttended: data.communityCenter.ceremonyAttended,
  skullKeyObtained: data.mineProgress.hasSkullKey,
  rustyKeyObtained: data.mineProgress.hasRustyKey,
});

export interface Progress {
  current: number;
  total: number;
  /** The word after the numbers, such as "donated". */
  unit: string;
}

export interface CriterionRow {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
  earned: boolean;
  progress: Progress | null;
}

export interface CategoryView {
  id: GrandpaCategory;
  earned: number;
  max: number;
  complete: boolean;
  rows: CriterionRow[];
}

export interface Evaluation {
  score: number;
  candles: number;
  nextCandle: { points: number; needed: number } | null;
  categories: CategoryView[];
  categoriesComplete: number;
}

const criterionProgress = (
  data: GameData,
  criterion: string,
): Progress | null => {
  switch (criterion) {
    case "Total Skill Levels ≥30":
      return { current: totalSkillLevels(data), total: 30, unit: "" };
    case "Total Skill Levels ≥50":
      return { current: totalSkillLevels(data), total: 50, unit: "" };
    case "A Complete Collection":
      return { ...museumProgress(data), unit: "donated" };
    case "Master Angler":
      return { ...countFishCaught(data), unit: "caught" };
    case "Full Shipment":
      return { ...shipmentProgress(data), unit: "shipped" };
    case "5+ Villagers at 8 Hearts":
      return { current: villagersAtEightHearts(data), total: 5, unit: "" };
    case "10+ Villagers at 8 Hearts":
      return { current: villagersAtEightHearts(data), total: 10, unit: "" };
    case "Pet at Max Friendship":
      return {
        current: bestPetFriendship(data),
        total: PET_MAX_FRIENDSHIP,
        unit: "",
      };
    default:
      return null;
  }
};

const rowFor = (data: GameData, entry: GrandpaScoreEntry): CriterionRow => {
  const earned = entry.points === entry.maxPoints && entry.maxPoints > 0;
  return {
    id: entry.criterion,
    label: entry.criterion,
    points: entry.points,
    maxPoints: entry.maxPoints,
    earned,
    progress: earned ? null : criterionProgress(data, entry.criterion),
  };
};

/** One row for each earnings tier. The score is the highest tier reached, not the sum of the rows. */
const earningsRows = (data: GameData, maxPoints: number): CriterionRow[] =>
  EARNINGS_TIERS.map((tier) => {
    const earned = data.character.totalMoneyEarned >= tier.threshold;
    return {
      id: `earnings-${tier.threshold}`,
      label: String(tier.threshold),
      points: tier.points,
      maxPoints,
      earned,
      progress: earned
        ? null
        : {
            current: data.character.totalMoneyEarned,
            total: tier.threshold,
            unit: "g",
          },
    };
  });

export const evaluate = (data: GameData): Evaluation => {
  const result = grandpaEvaluator().evaluate(buildGrandpaInput(data));
  const categories = GRANDPA_CATEGORY_ORDER.map((id): CategoryView => {
    const entries = result.breakdown.filter((entry) => entry.category === id);
    const earned = entries.reduce((sum, entry) => sum + entry.points, 0);
    const max = entries.reduce((sum, entry) => sum + entry.maxPoints, 0);
    return {
      id,
      earned,
      max,
      complete: max > 0 && earned === max,
      rows:
        id === "earnings"
          ? earningsRows(data, max)
          : entries.map((entry) => rowFor(data, entry)),
    };
  });
  const next = CANDLE_STEPS.find((points) => points > result.score);
  return {
    score: result.score,
    candles: result.candles,
    nextCandle:
      next === undefined ? null : { points: next, needed: next - result.score },
    categories,
    categoriesComplete: categories.filter((category) => category.complete)
      .length,
  };
};

export const roomsDone = (data: GameData) => ({
  current: roomsComplete(data),
  total: CC_ROOMS.length,
});
