import {
  achievements,
  artifacts,
  collections,
  cooking,
  lostBooks,
  minerals,
  monsterSlayerGoals,
  secretNotes,
  specialItems,
  specialOrders,
  starDrops,
  tools,
  villagers,
} from "stardew-valley-data";
import type { RodData } from "@/types";
import type { CommunityCenterRooms, GameData } from "@/types/app";
import { getGoalKillCount } from "@/lib/pages/mines";
import {
  calculatePerfection,
  calculatePerfectionScore,
} from "@/lib/pages/perfection";
import type { CategoryProgress } from "@/lib/pages/perfection";
import { assetPath } from "@/lib/utils/assetPath";
import {
  countCraftingMade,
  countFishCaught,
  countWalnutsFound,
} from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { getFarmIcon } from "@/lib/utils/farmIcon";
import { formatTimePlayed } from "@/lib/utils/formatting";
import { effectiveMaxHearts } from "@/lib/utils/villagerHearts";
import {
  CC_ROOMS,
  ROOM_LABELS,
  ROOM_TO_CC_KEY,
} from "@/data/constants/bundles";
import {
  LEVEL_NAMES,
  PAN_LEVEL_OFFSET,
  TOOL_ENTRIES,
} from "@/data/constants/tools";

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

const shippable = collections().itemsShipped().get();
const allCooking = cooking().get();
const allMinerals = minerals().mineralItems().get();
const allArtifacts = artifacts().get();
const allVillagers = villagers().get();
const allGoals = monsterSlayerGoals().get();
const allStardrops = starDrops().get();
const allNotes = secretNotes().get();
const allSpecialItems = specialItems().get();
const allSpecialOrders = specialOrders().get();
const rod = tools().fishingRods().first() as RodData | undefined;

const secretNoteList = allNotes.filter((note) => note.type === "secret-note");
const journalScrapList = allNotes.filter(
  (note) => note.type === "journal-scrap",
);

export const MAX_MINE_LEVEL = 120;
export const SKULL_CAVERN_BAR_LEVEL = 100;

export const percentOf = ({ current, total }: ProgressCount): number =>
  total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;

export interface Figure {
  label: string;
  value: string;
  tone?: "primary";
}

const HOUSE_LEVELS: Record<number, string> = {
  0: "Basic",
  1: "Level 1",
  2: "Level 2",
  3: "Full Upgrade",
};

export interface Hero {
  farmIcon: string;
  title: string;
  seasonPill: string;
  spouse: string | null;
  figures: Figure[];
}

/** "Riverland Farm · Sam", leaving out the name when it is blank. */
export const heroTitle = (data: GameData): string => {
  const { farmName, name } = data.character;
  return [farmName ? `${farmName} Farm` : null, name || null]
    .filter(Boolean)
    .join(" · ");
};

export const hero = (data: GameData): Hero => {
  const { character } = data;
  const { season, day, year } = character.currentDate;
  const house = character.houseUpgradeLevel;
  return {
    farmIcon: getFarmIcon(character.farmType),
    title: heroTitle(data),
    seasonPill: `${capitalize(season)} Day ${day}, Year ${year}`,
    spouse: character.spouse || null,
    figures: [
      {
        label: "Time played",
        value: formatTimePlayed(character.millisecondsPlayed),
      },
      {
        label: "Total days",
        value: character.totalDaysPlayed.toLocaleString(),
      },
      { label: "Current money", value: `${character.money.toLocaleString()}g` },
      {
        label: "Total earned",
        value: `${character.totalMoneyEarned.toLocaleString()}g`,
      },
      {
        label: "House upgrade",
        value: HOUSE_LEVELS[house] ?? `Level ${house}`,
        tone: house === 3 ? "primary" : undefined,
      },
      { label: "Max energy", value: String(character.maxEnergy) },
      { label: "Max health", value: String(character.maxHealth) },
    ],
  };
};

const SKILLS = [
  { key: "farming", label: "Farming", image: "/images/skills/Farming.png" },
  { key: "fishing", label: "Fishing", image: "/images/skills/Fishing.png" },
  { key: "foraging", label: "Foraging", image: "/images/skills/Foraging.png" },
  { key: "mining", label: "Mining", image: "/images/skills/Mining.png" },
  { key: "combat", label: "Combat", image: "/images/skills/Combat.png" },
] as const;

export const MAX_SKILL_LEVEL = 10;

export interface SkillRow {
  key: string;
  label: string;
  image: string;
  level: number;
  mastered: boolean;
}

export const skillRows = (data: GameData): SkillRow[] =>
  SKILLS.map(({ key, label, image }) => ({
    key,
    label,
    image,
    level: Math.min(data.skills[key]?.level ?? 0, MAX_SKILL_LEVEL),
    mastered: data.mastery.unlocked.includes(key),
  }));

export const skillTotal = (data: GameData): number =>
  skillRows(data).reduce((sum, row) => sum + row.level, 0);

export type ToolTone = "basic" | "copper" | "steel" | "gold" | "iridium";

export interface ToolChip {
  label: string;
  level: string;
  tone: ToolTone;
}

const TOOL_LABELS: Record<string, string> = {
  wateringCan: "Watering Can",
  trashCan: "Trash Can",
};

export const toolChips = (data: GameData): ToolChip[] => {
  const chips = TOOL_ENTRIES.map(({ key }) => {
    const level = data.toolLevels[key];
    const name =
      LEVEL_NAMES[key === "pan" ? level + PAN_LEVEL_OFFSET : level] ?? "Basic";
    return {
      label: TOOL_LABELS[key] ?? capitalize(key),
      level: name,
      tone: name.toLowerCase() as ToolTone,
    };
  });
  const rodLevel = rod?.levels[data.toolLevels.fishingRod];
  const rodName = rodLevel?.name ?? "None";
  return [
    ...chips,
    {
      label: "Fishing Rod",
      level: rodName,
      tone: data.toolLevels.fishingRod >= 2 ? "gold" : "basic",
    },
  ];
};

export interface CollectionRow extends ProgressCount {
  label: string;
  percent: number;
}

export const collectionRows = (data: GameData): CollectionRow[] => {
  const rows: (ProgressCount & { label: string })[] = [
    {
      label: "Items shipped",
      current: shippable.filter((item) => data.shipped[item.id]?.shipped)
        .length,
      total: shippable.length,
    },
    { label: "Fish caught", ...countFishCaught(data) },
    {
      label: "Recipes cooked",
      current: Object.values(data.cookingRecipes).filter(
        (recipe) => recipe.cooked,
      ).length,
      total: allCooking.length,
    },
    { label: "Recipes crafted", ...countCraftingMade(data) },
    {
      label: "Minerals donated",
      current: allMinerals.filter(
        (mineral) => data.minerals[mineral.id]?.donated,
      ).length,
      total: allMinerals.length,
    },
    {
      label: "Artifacts donated",
      current: Object.values(data.artifacts).filter(
        (artifact) => artifact.donated,
      ).length,
      total: allArtifacts.length,
    },
  ];
  return rows.map((row) => ({ ...row, percent: percentOf(row) }));
};

export interface VillagerRow {
  name: string;
  image: string;
  hearts: number;
  maxHearts: number;
  maxed: boolean;
  married: boolean;
}

export const villagerRows = (data: GameData): VillagerRow[] =>
  allVillagers.map((villager) => {
    const progress = data.villagers[villager.name];
    const married = data.character.spouse === villager.name;
    const maxHearts = effectiveMaxHearts(
      villager,
      married,
      progress?.status ?? "",
    );
    const hearts = progress?.hearts ?? 0;
    return {
      name: villager.name,
      image: assetPath(
        married ? (villager.spouseImage ?? villager.image) : villager.image,
      ),
      hearts,
      maxHearts,
      maxed: hearts >= maxHearts,
      married,
    };
  });

export const maxedVillagers = (rows: VillagerRow[]): ProgressCount => ({
  current: rows.filter((row) => row.maxed).length,
  total: rows.length,
});

export interface PerfectionFigures {
  score: number;
  waivers: number;
  categories: CategoryProgress[];
}

export const perfectionFigures = (data: GameData): PerfectionFigures => {
  const categories = calculatePerfection(data);
  return {
    score: calculatePerfectionScore(categories, data.perfectionWaiverCount),
    waivers: data.perfectionWaiverCount,
    categories,
  };
};

export const isCategoryDone = (category: CategoryProgress): boolean =>
  category.current >= category.total;

const titleCase = (id: string) =>
  id.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export interface CommunityCenterFigures {
  path: "community-center" | "joja";
  badge: string;
  completed: boolean;
  flags: { label: string; on: boolean }[];
  rows: { label: string; done: boolean }[];
}

export const communityCenterFigures = (
  data: GameData,
): CommunityCenterFigures => {
  const { communityCenter, joja } = data;
  if (joja.isMember) {
    const entries = Object.entries(joja.developments);
    const purchased = entries.filter(([, done]) => done).length;
    return {
      path: "joja",
      badge: `${purchased} / ${entries.length} purchased`,
      completed: joja.completed,
      flags: [],
      rows: entries.map(([id, done]) => ({ label: titleCase(id), done })),
    };
  }
  const rooms = communityCenter.rooms as unknown as Record<string, boolean>;
  const done = CC_ROOMS.filter((room) => rooms[ROOM_TO_CC_KEY[room]]).length;
  return {
    path: "community-center",
    badge: `${done} / ${CC_ROOMS.length} rooms`,
    completed: communityCenter.completed,
    flags: [
      { label: "Completed", on: communityCenter.completed },
      { label: "Ceremony attended", on: communityCenter.ceremonyAttended },
      { label: "Abandoned Joja", on: communityCenter.jojaAbandoned },
    ],
    rows: CC_ROOMS.map((room) => ({
      label: ROOM_LABELS[room],
      done: Boolean(
        communityCenter.rooms[
          ROOM_TO_CC_KEY[room] as keyof CommunityCenterRooms
        ],
      ),
    })),
  };
};

export interface MinesFigures {
  mineDepth: ProgressCount;
  skullCavernLevel: number;
  skullCavernBar: number;
  keys: { label: string; owned: boolean }[];
  goals: { name: string; done: boolean }[];
  goalsDone: number;
}

export const minesFigures = (data: GameData): MinesFigures => {
  const { mineProgress, monsters } = data;
  const goals = allGoals.map((goal) => ({
    name: goal.name,
    done: getGoalKillCount(goal, monsters) >= goal.killTarget,
  }));
  return {
    mineDepth: {
      current: mineProgress.deepestMineLevel,
      total: MAX_MINE_LEVEL,
    },
    skullCavernLevel: mineProgress.deepestSkullCavernLevel,
    skullCavernBar: Math.min(
      mineProgress.deepestSkullCavernLevel / SKULL_CAVERN_BAR_LEVEL,
      1,
    ),
    keys: [
      { label: "Rusty Key", owned: mineProgress.hasRustyKey },
      { label: "Skull Key", owned: mineProgress.hasSkullKey },
    ],
    goals,
    goalsDone: goals.filter((goal) => goal.done).length,
  };
};

export interface MilestoneTile {
  label: string;
  current: number;
  total?: number;
}

export const milestoneTiles = (data: GameData): MilestoneTile[] => {
  const townOrders = allSpecialOrders.filter((order) => order.type === "town");
  const qiOrders = allSpecialOrders.filter((order) => order.type === "qi");
  const done = (orders: typeof townOrders) =>
    orders.filter((order) => data.specialOrdersCompleted[order.id]).length;
  return [
    {
      label: "Stardrops",
      current: allStardrops.filter((drop) => data.stardrops[drop.id]).length,
      total: allStardrops.length,
    },
    { label: "Golden Walnuts", ...countWalnutsFound(data) },
    {
      label: "Achievements",
      current: data.achievements.length,
      total: achievements().get().length,
    },
    {
      label: "Secret Notes",
      current: secretNoteList.filter((note) => data.secretNotes[note.id])
        .length,
      total: secretNoteList.length,
    },
    {
      label: "Journal Scraps",
      current: journalScrapList.filter((note) => data.journalScraps[note.id])
        .length,
      total: journalScrapList.length,
    },
    {
      label: "Lost Books",
      current: data.lostBooksFound,
      total: lostBooks().get().length,
    },
    {
      label: "Power Books",
      current: data.books.length,
      total: allSpecialItems.filter((item) => item.type === "book").length,
    },
    {
      label: "Special Items",
      current: data.specialItems.length,
      total: allSpecialItems.filter((item) => item.type === "special-item")
        .length,
    },
    { label: "Help Wanted", current: data.helpWantedCompleted },
    {
      label: "Special Orders",
      current: done(townOrders),
      total: townOrders.length,
    },
    { label: "Qi Orders", current: done(qiOrders), total: qiOrders.length },
  ];
};
