import { monsterLoot, monsters, monsterSlayerGoals } from "stardew-valley-data";
import type {
  Monster,
  MonsterLoot,
  MonsterSlayerGoal,
} from "stardew-valley-data";
import type { GameData } from "@/types/app";

export const allMonsters: Monster[] = [...monsters().get()].sort((a, b) =>
  a.name.localeCompare(b.name),
);
export const slayerGoals: MonsterSlayerGoal[] = [
  ...monsterSlayerGoals().get(),
].sort((a, b) => a.killTarget - b.killTarget);
const allLoot = monsterLoot().get();

export const MINES_BOTTOM = 120;
export const ELEVATOR_STEP = 5;
export const MAX_KILLS = 999_999;

export const getGoalKillCount = (
  goal: MonsterSlayerGoal,
  monsterKills: Record<string, number>,
): number =>
  goal.monsters.reduce((sum, name) => sum + (monsterKills[name] ?? 0), 0);

/** A save keys kills by name. An older playthrough can key them by the item id as well. */
export const getMonsterKillCount = (
  monster: Monster,
  monsterKills: Record<string, number>,
): number =>
  (monsterKills[monster.name] ?? 0) +
  (monster.name !== monster.id ? (monsterKills[monster.id] ?? 0) : 0);

export const lootOf = (monster: Monster): MonsterLoot[] =>
  allLoot.filter((loot) => loot.droppedBy.includes(monster.id));

/** The elevator stops at every fifth floor of the Mines that the player has reached. */
export const elevatorLevel = (deepestMineLevel: number): number =>
  Math.floor(Math.min(deepestMineLevel, MINES_BOTTOM) / ELEVATOR_STEP) *
  ELEVATOR_STEP;

export interface GoalProgress {
  goal: MonsterSlayerGoal;
  kills: number;
  complete: boolean;
  share: number;
}

export const goalProgress = (data: GameData): GoalProgress[] =>
  slayerGoals.map((goal) => {
    const kills = getGoalKillCount(goal, data.monsters);
    return {
      goal,
      kills,
      complete: kills >= goal.killTarget,
      share: Math.min(1, kills / goal.killTarget),
    };
  });

export interface MinesSummary {
  mineLevel: number;
  skullLevel: number;
  rustyKey: boolean;
  skullKey: boolean;
  goalsDone: number;
  goalsTotal: number;
  totalSlain: number;
  elevator: number;
}

export const minesSummary = (data: GameData): MinesSummary => {
  const {
    deepestMineLevel,
    deepestSkullCavernLevel,
    hasRustyKey,
    hasSkullKey,
  } = data.mineProgress;
  return {
    mineLevel: deepestMineLevel,
    skullLevel: deepestSkullCavernLevel,
    rustyKey: hasRustyKey,
    skullKey: hasSkullKey,
    goalsDone: goalProgress(data).filter((progress) => progress.complete)
      .length,
    goalsTotal: slayerGoals.length,
    totalSlain: Object.values(data.monsters).reduce(
      (sum, count) => sum + count,
      0,
    ),
    elevator: elevatorLevel(deepestMineLevel),
  };
};

const withMineProgress = (
  data: GameData,
  change: Partial<GameData["mineProgress"]>,
): GameData => ({
  ...data,
  mineProgress: { ...data.mineProgress, ...change },
});

export const setMineLevel = (data: GameData, level: number): GameData =>
  withMineProgress(data, {
    deepestMineLevel: Math.min(MINES_BOTTOM, Math.max(0, Math.floor(level))),
  });

/** The Skull Cavern has no bottom floor. */
export const setSkullLevel = (data: GameData, level: number): GameData =>
  withMineProgress(data, {
    deepestSkullCavernLevel: Math.max(0, Math.floor(level)),
  });

export const setRustyKey = (data: GameData, has: boolean): GameData =>
  withMineProgress(data, { hasRustyKey: has });

export const setSkullKey = (data: GameData, has: boolean): GameData =>
  withMineProgress(data, { hasSkullKey: has });

/** Kills are saved under the name of the monster. A count of zero removes the entry. */
export const setMonsterKills = (
  data: GameData,
  monster: Monster,
  count: number,
): GameData => {
  const { [monster.name]: _name, [monster.id]: _id, ...others } = data.monsters;
  const next = Math.min(MAX_KILLS, Math.max(0, Math.floor(count)));
  return {
    ...data,
    monsters: next === 0 ? others : { ...others, [monster.name]: next },
  };
};

export type MonsterTypeFilter = "all" | "standard" | "dangerous";

export interface MonsterFilters {
  query: string;
  location: string;
  type: MonsterTypeFilter;
}

export const ALL_LOCATIONS = "all";

export const emptyMonsterFilters: MonsterFilters = {
  query: "",
  location: ALL_LOCATIONS,
  type: "all",
};

export const isFilteringMonsters = (filters: MonsterFilters): boolean =>
  filters.query !== "" ||
  filters.location !== ALL_LOCATIONS ||
  filters.type !== "all";

export const monsterLocations: string[] = [
  ...new Set(allMonsters.flatMap((monster) => monster.locations)),
].sort();

export const filterMonsters = (filters: MonsterFilters): Monster[] => {
  const needle = filters.query.trim().toLowerCase();
  return allMonsters.filter(
    (monster) =>
      monster.name.toLowerCase().includes(needle) &&
      (filters.location === ALL_LOCATIONS ||
        monster.locations.includes(filters.location)) &&
      (filters.type === "all" ||
        (filters.type === "dangerous") === monster.dangerous),
  );
};

export const dangerousCount = (list: Monster[]): number =>
  list.filter((monster) => monster.dangerous).length;
