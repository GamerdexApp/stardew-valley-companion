import {
  achievements as queryAchievements,
  skills as querySkills,
} from "stardew-valley-data";
import type { Achievement, ProfessionData, Skill } from "stardew-valley-data";
import { professions as queryProfessions } from "stardew-valley-data";
import type { ChildProgress, GameData, ToolLevels } from "@/types/app";
import { toggleProfession } from "@/lib/pages/character";

export const allSkills: Skill[] = querySkills().get();
export const allProfessions: ProfessionData[] = queryProfessions().get();
export const allAchievements: Achievement[] = queryAchievements().get();

export const SEASONS = ["spring", "summer", "fall", "winter"] as const;
export const MAX_CHILDREN = 2;
export const MAX_SKILL_LEVEL = 10;
export const MAX_MASTERY_XP = 100000;
export const MAX_DAY = 28;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

type TextField = "name" | "farmName" | "favoriteThing" | "gender" | "spouse";
type NumberField =
  "money" | "totalMoneyEarned" | "maxHealth" | "maxEnergy" | "luckLevel";

export const setTextField = (
  data: GameData,
  field: TextField,
  value: string,
): GameData => ({
  ...data,
  character: { ...data.character, [field]: value },
});

/** A number the player typed. A negative number is not a valid amount or stat. */
export const setNumberField = (
  data: GameData,
  field: NumberField,
  value: number,
): GameData => ({
  ...data,
  character: { ...data.character, [field]: Math.max(0, value) },
});

export const setDate = (
  data: GameData,
  date: Partial<GameData["character"]["currentDate"]>,
): GameData => {
  const current = data.character.currentDate;
  return {
    ...data,
    character: {
      ...data.character,
      currentDate: {
        season: date.season ?? current.season,
        day: clamp(Math.floor(date.day ?? current.day), 1, MAX_DAY),
        year: Math.max(1, Math.floor(date.year ?? current.year)),
      },
    },
  };
};

export const setHouseLevel = (data: GameData, level: number): GameData => ({
  ...data,
  character: { ...data.character, houseUpgradeLevel: clamp(level, 0, 3) },
});

export const addChild = (data: GameData): GameData =>
  data.children.length >= MAX_CHILDREN
    ? data
    : {
        ...data,
        children: [...data.children, { name: "", age: 0, gender: "Male" }],
      };

export const removeChild = (data: GameData, index: number): GameData => ({
  ...data,
  children: data.children.filter((_, position) => position !== index),
});

export const updateChild = (
  data: GameData,
  index: number,
  patch: Partial<ChildProgress>,
): GameData => ({
  ...data,
  children: data.children.map((child, position) =>
    position === index
      ? {
          ...child,
          ...patch,
          age: Math.max(0, Math.floor(patch.age ?? child.age)),
        }
      : child,
  ),
});

export type ToolKey = Exclude<keyof ToolLevels, "currentlyUpgrading">;

/** The pan has no basic level, and a player may not own one yet: -1 is none, 0 is copper. */
export const setToolLevel = (
  data: GameData,
  key: ToolKey,
  level: number,
): GameData => ({
  ...data,
  toolLevels: { ...data.toolLevels, [key]: level },
});

/** The backpack size is saved in the character, as before. */
export const setBackpackSlots = (data: GameData, slots: number): GameData => ({
  ...data,
  character: { ...data.character, maxItems: slots },
});

const skillOf = (id: string): Skill =>
  allSkills.find((skill) => skill.id === id)!;

export const skillLevel = (data: GameData, id: string): number =>
  data.skills[id]?.level ?? 0;
export const skillXp = (data: GameData, id: string): number =>
  data.skills[id]?.xp ?? 0;

/** The first XP of a level. Level 0 starts at 0. */
export const xpOfLevel = (id: string, level: number): number =>
  level <= 0
    ? 0
    : skillOf(id).levels[Math.min(level, MAX_SKILL_LEVEL) - 1].totalXp;

export const levelOfXp = (id: string, xp: number): number => {
  const reached = skillOf(id).levels.filter((level) => xp >= level.totalXp);
  return reached.length;
};

/** Level 10 is reached at 15,000 XP, and a save keeps counting past it, so the cap is far above. */
export const MAX_SKILL_XP = 9_999_999;

const professionLevel = (id: string): number | undefined =>
  allProfessions.find((profession) => profession.id === id)?.level;

/**
 * A profession needs its level: level 5 for the first choice and level 10 for the second. When a
 * skill drops below that level, its professions of the higher level go too.
 */
const keepReachable = (data: GameData, id: string, level: number): string[] => {
  const skillName = skillOf(id).name;
  return data.professions.filter((profId) => {
    const profession = allProfessions.find((item) => item.id === profId);
    if (!profession || profession.skill !== skillName) return true;
    return level >= profession.level;
  });
};

export const setSkillXp = (
  data: GameData,
  id: string,
  xp: number,
): GameData => {
  const next = clamp(Math.floor(xp), 0, MAX_SKILL_XP);
  const level = levelOfXp(id, next);
  return {
    ...data,
    skills: { ...data.skills, [id]: { level, xp: next } },
    professions: keepReachable(data, id, level),
  };
};

/** The stepper jumps to the first XP of the level. */
export const setSkillLevel = (
  data: GameData,
  id: string,
  level: number,
): GameData => {
  const target = clamp(level, 0, MAX_SKILL_LEVEL);
  return target === skillLevel(data, id)
    ? data
    : setSkillXp(data, id, xpOfLevel(id, target));
};

export const professionsLostBy = (
  before: GameData,
  after: GameData,
): ProfessionData[] =>
  allProfessions.filter(
    (profession) =>
      before.professions.includes(profession.id) &&
      !after.professions.includes(profession.id),
  );

export const pickProfession = (
  data: GameData,
  professionId: string,
): GameData => ({
  ...data,
  professions: toggleProfession(professionId, data.professions, allProfessions),
});

/** Picking a profession can add its level 5 parent and drop a sibling branch. */
export const professionChange = (
  before: GameData,
  after: GameData,
): { added: ProfessionData[]; removed: ProfessionData[] } => ({
  added: allProfessions.filter(
    (profession) =>
      after.professions.includes(profession.id) &&
      !before.professions.includes(profession.id),
  ),
  removed: professionsLostBy(before, after),
});

export const canPickProfession = (
  data: GameData,
  profession: ProfessionData,
): boolean =>
  skillLevel(data, skillOf(profession.skill.toLowerCase()).id) >=
  profession.level;

export const professionLevelOf = professionLevel;

export const setMasteryXp = (data: GameData, xp: number): GameData => ({
  ...data,
  mastery: {
    ...data.mastery,
    masteryXp: clamp(Math.floor(xp), 0, MAX_MASTERY_XP),
  },
});

export const isMastered = (data: GameData, skillId: string): boolean =>
  data.mastery.unlocked.includes(skillId);

export const setMastered = (
  data: GameData,
  skillId: string,
  mastered: boolean,
): GameData => {
  if (isMastered(data, skillId) === mastered) return data;
  return {
    ...data,
    mastery: {
      ...data.mastery,
      unlocked: mastered
        ? [...data.mastery.unlocked, skillId]
        : data.mastery.unlocked.filter((id) => id !== skillId),
    },
  };
};

export const setStardrop = (
  data: GameData,
  id: string,
  collected: boolean,
): GameData => {
  if ((data.stardrops[id] === true) === collected) return data;
  const { [id]: _removed, ...rest } = data.stardrops;
  return { ...data, stardrops: collected ? { ...rest, [id]: true } : rest };
};

export const isEarned = (data: GameData, id: string): boolean =>
  data.achievements.includes(id);

export const setAchievement = (
  data: GameData,
  id: string,
  earned: boolean,
): GameData => {
  if (isEarned(data, id) === earned) return data;
  return {
    ...data,
    achievements: earned
      ? [...data.achievements, id]
      : data.achievements.filter((other) => other !== id),
  };
};

export type AchievementStatusFilter = "all" | "earned" | "locked";

export interface AchievementFilters {
  query: string;
  status: AchievementStatusFilter;
}

export const emptyAchievementFilters: AchievementFilters = {
  query: "",
  status: "all",
};

/** The search matches the name and the description. */
export const filterAchievements = (
  data: GameData,
  filters: AchievementFilters,
): Achievement[] => {
  const needle = filters.query.trim().toLowerCase();
  return allAchievements.filter(
    (achievement) =>
      (achievement.name.toLowerCase().includes(needle) ||
        achievement.description.toLowerCase().includes(needle)) &&
      (filters.status === "all" ||
        (filters.status === "earned") === isEarned(data, achievement.id)),
  );
};

export const skillsTotal = (data: GameData): number =>
  allSkills.reduce((sum, skill) => sum + skillLevel(data, skill.id), 0);

/** "58h 26m", or a dash when the save has no time yet. */
export const formatTimePlayed = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / 60000);
  if (minutes <= 0) return "-";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
