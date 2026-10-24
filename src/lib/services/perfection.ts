import {
  buildings,
  collections,
  cooking,
  monsters,
  monsterSlayerGoals,
  perfection,
  starDrops,
} from "stardew-valley-data";
import type { GameData } from "@/types";
import { assetPath } from "@/lib/utils/assetPath";
import {
  allGoldenWalnuts,
  collectionCrafting,
  collectionFish,
  countWalnutsFound,
} from "@/lib/utils/collectionCounts";
import { getGoalKillCount } from "./mines";
import { allVillagers, isMaxed } from "./villagers";

export interface MissingItem {
  id: string;
  name: string;
  image: string | null;
}

export interface CategoryProgress {
  id: string;
  name: string;
  requirement: string;
  current: number;
  total: number;
  weight: number;
  unit: string;
  missing: MissingItem[];
}

const allCategories = perfection().get();
const shippableItems = collections().itemsShipped().get();
const allCooking = cooking().get();
const allStardrops = starDrops().get();
const allGoals = monsterSlayerGoals().get();
const allBuildings = buildings().get();
const allMonsters = monsters().get();
const monstersByName = new Map(allMonsters.map((m) => [m.name, m]));
const buildingsByName = new Map(allBuildings.map((b) => [b.name, b]));

function getCategoryProgress(
  id: string,
  gameData: GameData,
): { current: number; missing: MissingItem[] } {
  switch (id) {
    case "produce-forage-shipped": {
      const missing: MissingItem[] = [];
      let current = 0;
      for (const item of shippableItems) {
        if (gameData.shipped[item.id]?.shipped) {
          current++;
        } else {
          missing.push({
            id: item.id,
            name: item.name,
            image: item.image ? assetPath(item.image) : null,
          });
        }
      }
      return { current, missing };
    }

    case "fish-caught": {
      const caughtIds = new Set(gameData.fishCaught.map((f) => f.id));
      const missing: MissingItem[] = [];
      let current = 0;
      for (const f of collectionFish) {
        if (caughtIds.has(f.id)) {
          current++;
        } else {
          missing.push({
            id: f.id,
            name: f.name,
            image: f.image ? assetPath(f.image) : null,
          });
        }
      }
      return { current, missing };
    }

    case "cooking-recipes-made": {
      const missing: MissingItem[] = [];
      let current = 0;
      for (const dish of allCooking) {
        if (gameData.cookingRecipes[dish.name]?.cooked) {
          current++;
        } else {
          missing.push({
            id: dish.id,
            name: dish.name,
            image: dish.image ? assetPath(dish.image) : null,
          });
        }
      }
      return { current, missing };
    }

    case "crafting-recipes-made": {
      const missing: MissingItem[] = [];
      let current = 0;
      for (const recipe of collectionCrafting) {
        if (gameData.craftingRecipes[recipe.name]?.crafted) {
          current++;
        } else {
          missing.push({
            id: recipe.id,
            name: recipe.name,
            image: recipe.image ? assetPath(recipe.image) : null,
          });
        }
      }
      return { current, missing };
    }

    case "found-all-stardrops": {
      const missing: MissingItem[] = [];
      let current = 0;
      for (const s of allStardrops) {
        if (gameData.stardrops[s.id]) {
          current++;
        } else {
          missing.push({
            id: s.id,
            name: s.name,
            image: s.image ? assetPath(s.image) : null,
          });
        }
      }
      return { current, missing };
    }

    case "great-friends": {
      const missing: MissingItem[] = [];
      let current = 0;
      for (const villager of allVillagers) {
        if (isMaxed(gameData, villager)) {
          current++;
        } else {
          missing.push({
            id: villager.id,
            name: villager.name,
            image: villager.image ? assetPath(villager.image) : null,
          });
        }
      }
      return { current, missing };
    }

    case "monster-slayer-hero": {
      const missing: MissingItem[] = [];
      let current = 0;
      for (const goal of allGoals) {
        const killCount = getGoalKillCount(goal, gameData.monsters);
        if (killCount >= goal.killTarget) {
          current++;
        } else {
          const monsterName = goal.monsters[0];
          const monsterImage = monsterName
            ? monstersByName.get(monsterName)?.image
            : null;
          missing.push({
            id: goal.id,
            name: goal.name,
            image: monsterImage ? assetPath(monsterImage) : null,
          });
        }
      }
      return { current, missing };
    }

    case "farmer-level": {
      const skills = ["farming", "fishing", "foraging", "mining", "combat"];
      const missing: MissingItem[] = [];
      let current = 0;
      for (const skill of skills) {
        const level = gameData.skills[skill]?.level ?? 0;
        current += Math.min(level, 10);
        if (level < 10) {
          missing.push({
            id: skill,
            name: `${skill.charAt(0).toUpperCase() + skill.slice(1)} ${level} of 10`,
            image: null,
          });
        }
      }
      return { current: Math.min(current, 50), missing };
    }

    case "obelisks-on-farm": {
      const obeliskTypes = [
        "Earth Obelisk",
        "Water Obelisk",
        "Desert Obelisk",
        "Island Obelisk",
      ];
      const built = new Set(gameData.buildings.map((b) => b.type));
      const missing: MissingItem[] = [];
      let current = 0;
      for (const ob of obeliskTypes) {
        if (built.has(ob)) {
          current++;
        } else {
          const img = buildingsByName.get(ob)?.image ?? null;
          missing.push({
            id: ob,
            name: ob,
            image: img ? assetPath(img) : null,
          });
        }
      }
      return { current, missing };
    }

    case "golden-clock-on-farm": {
      const has = gameData.buildings.some((b) => b.type === "Gold Clock");
      const clockImg = buildingsByName.get("Gold Clock")?.image ?? null;
      return {
        current: has ? 1 : 0,
        missing: has
          ? []
          : [
              {
                id: "gold-clock",
                name: "Gold Clock",
                image: clockImg ? assetPath(clockImg) : null,
              },
            ],
      };
    }

    case "golden-walnuts-found": {
      const { current: found } = countWalnutsFound(gameData);
      const missing: MissingItem[] = [];
      for (const w of allGoldenWalnuts) {
        if (!gameData.goldenWalnuts[w.id]) {
          missing.push({
            id: w.id,
            name: w.name,
            image: assetPath("images/misc/Golden Walnut.png"),
          });
        }
      }
      return { current: found, missing };
    }

    default:
      return { current: 0, missing: [] };
  }
}

export function calculatePerfection(gameData: GameData): CategoryProgress[] {
  return allCategories.map((cat) => {
    const { current, missing } = getCategoryProgress(cat.id, gameData);
    return {
      id: cat.id,
      name: cat.name,
      requirement: cat.requirement,
      current,
      total: cat.count,
      weight: cat.weight,
      unit: cat.unit,
      missing,
    };
  });
}

export function calculatePerfectionScore(
  categories: CategoryProgress[],
  waivers = 0,
): number {
  let totalWeight = 0;
  let earnedWeight = 0;
  for (const cat of categories) {
    totalWeight += cat.weight;
    const pct = cat.total > 0 ? Math.min(cat.current / cat.total, 1) : 0;
    earnedWeight += cat.weight * pct;
  }
  const baseScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;
  return Math.min(Math.round(baseScore + waivers), 100);
}

export const WAIVER_COST = 500_000;
export const MAX_WAIVERS = 100;

/** Each waiver adds one percent to the score. The player buys them with the Perfection Tracker statue. */
export const setWaivers = (gameData: GameData, count: number): GameData => ({
  ...gameData,
  perfectionWaiverCount: Math.min(MAX_WAIVERS, Math.max(0, Math.floor(count))),
});

export interface CategoryRow {
  category: CategoryProgress;
  /** The share done, from 0 to 1. A category never goes past its total. */
  share: number;
  points: number;
  complete: boolean;
}

export interface PerfectionView {
  score: number;
  /** The weighted sum before the waivers, from 0 to 100, with its decimals. */
  base: number;
  waivers: number;
  rows: CategoryRow[];
  complete: number;
}

const roundOneDecimal = (value: number): number => Math.round(value * 10) / 10;

export const perfectionView = (gameData: GameData): PerfectionView => {
  const categories = calculatePerfection(gameData);
  const rows = categories.map((category): CategoryRow => {
    const share =
      category.total > 0 ? Math.min(category.current / category.total, 1) : 0;
    return {
      category,
      share,
      points: category.weight * share,
      complete: category.total > 0 && category.current >= category.total,
    };
  });
  const totalWeight = categories.reduce(
    (sum, category) => sum + category.weight,
    0,
  );
  const earned = rows.reduce((sum, row) => sum + row.points, 0);
  return {
    score: calculatePerfectionScore(categories, gameData.perfectionWaiverCount),
    base: totalWeight > 0 ? roundOneDecimal((earned / totalWeight) * 100) : 0,
    waivers: gameData.perfectionWaiverCount,
    rows,
    complete: rows.filter((row) => row.complete).length,
  };
};
