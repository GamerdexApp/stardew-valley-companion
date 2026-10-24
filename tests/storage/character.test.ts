import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  addChild,
  allAchievements,
  allProfessions,
  canPickProfession,
  emptyAchievementFilters,
  filterAchievements,
  isEarned,
  isMastered,
  levelOfXp,
  pickProfession,
  professionChange,
  removeChild,
  setAchievement,
  setBackpackSlots,
  setDate,
  setHouseLevel,
  setMastered,
  setMasteryXp,
  setNumberField,
  setSkillLevel,
  setSkillXp,
  setStardrop,
  setTextField,
  setToolLevel,
  skillLevel,
  skillsTotal,
  updateChild,
  xpOfLevel,
} from "@/service/character";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const fresh = (): GameData => clone(DEFAULT_GAME_DATA);
const profession = (name: string) =>
  allProfessions.find((p) => p.name === name)!;

describe("character fields", () => {
  it("sets a text field and keeps the rest", () => {
    const result = setTextField(fresh(), "name", "Sam");

    expect(result.character.name).toBe("Sam");
    expect(result.character.farmName).toBe("");
  });

  it("never sets a negative number", () => {
    expect(setNumberField(fresh(), "money", -50).character.money).toBe(0);
    expect(setNumberField(fresh(), "money", 1200).character.money).toBe(1200);
    expect(setNumberField(fresh(), "luckLevel", 0.35).character.luckLevel).toBe(
      0.35,
    );
  });

  it("keeps the day between 1 and 28 and the year at 1 or more", () => {
    expect(setDate(fresh(), { day: 40 }).character.currentDate.day).toBe(28);
    expect(setDate(fresh(), { day: 0 }).character.currentDate.day).toBe(1);
    expect(setDate(fresh(), { year: 0 }).character.currentDate.year).toBe(1);
    expect(
      setDate(fresh(), { season: "winter", day: 9, year: 3 }).character
        .currentDate,
    ).toEqual({
      season: "winter",
      day: 9,
      year: 3,
    });
  });

  it("keeps the house level between 0 and 3", () => {
    expect(setHouseLevel(fresh(), 5).character.houseUpgradeLevel).toBe(3);
    expect(setHouseLevel(fresh(), -1).character.houseUpgradeLevel).toBe(0);
  });
});

describe("children", () => {
  it("adds up to two and no more", () => {
    const one = addChild(fresh());
    const two = addChild(one);

    expect(two.children).toHaveLength(2);
    expect(addChild(two)).toBe(two);
  });

  it("removes the child at a position and edits one child", () => {
    let data = addChild(addChild(fresh()));
    data = updateChild(data, 0, { name: "Ana", age: 3 });
    data = updateChild(data, 1, { name: "Bo", gender: "Female" });

    expect(removeChild(data, 0).children.map((c) => c.name)).toEqual(["Bo"]);
    expect(data.children[0]).toEqual({ name: "Ana", age: 3, gender: "Male" });
  });

  it("never gives a child a negative age", () => {
    const data = updateChild(addChild(fresh()), 0, { age: -4 });

    expect(data.children[0].age).toBe(0);
  });
});

describe("tools", () => {
  it("sets a tool level and the backpack size in the character", () => {
    expect(setToolLevel(fresh(), "pickaxe", 3).toolLevels.pickaxe).toBe(3);
    expect(setToolLevel(fresh(), "pan", 0).toolLevels.pan).toBe(0);
    expect(setBackpackSlots(fresh(), 36).character.maxItems).toBe(36);
  });
});

describe("skills", () => {
  it("starts every skill at level 0", () => {
    expect(skillLevel(fresh(), "farming")).toBe(0);
    expect(skillsTotal(fresh())).toBe(0);
  });

  it("jumps to the first XP of a level when the level is set", () => {
    const data = setSkillLevel(fresh(), "farming", 3);

    expect(data.skills.farming).toEqual({
      level: 3,
      xp: xpOfLevel("farming", 3),
    });
    expect(xpOfLevel("farming", 3)).toBe(770);
  });

  it("derives the level from an exact XP value", () => {
    expect(setSkillXp(fresh(), "farming", 800).skills.farming).toEqual({
      level: 3,
      xp: 800,
    });
    expect(setSkillXp(fresh(), "farming", 769).skills.farming.level).toBe(2);
    expect(levelOfXp("farming", 15000)).toBe(10);
  });

  it("keeps real XP past level 10 and clamps only to zero and a very large cap", () => {
    expect(setSkillXp(fresh(), "mining", -20).skills.mining).toEqual({
      level: 0,
      xp: 0,
    });
    expect(setSkillXp(fresh(), "farming", 68150).skills.farming).toEqual({
      level: 10,
      xp: 68150,
    });
    expect(setSkillXp(fresh(), "mining", 99999999).skills.mining).toEqual({
      level: 10,
      xp: 9999999,
    });
  });

  it("keeps the exact XP when the stepper asks for the level it is already at", () => {
    const data = setSkillXp(fresh(), "farming", 68150);

    expect(setSkillLevel(data, "farming", 10)).toBe(data);
    expect(setSkillLevel(data, "farming", 9).skills.farming).toEqual({
      level: 9,
      xp: xpOfLevel("farming", 9),
    });
  });

  it("adds the five levels for the total", () => {
    let data = setSkillLevel(fresh(), "farming", 10);
    data = setSkillLevel(data, "mining", 4);

    expect(skillsTotal(data)).toBe(14);
  });

  it("drops professions that the lower level cannot hold", () => {
    let data = setSkillLevel(fresh(), "farming", 10);
    data = pickProfession(data, profession("Artisan").id);
    expect(data.professions.sort()).toEqual(["1", "4"]);

    const lowered = setSkillLevel(data, "farming", 7);
    expect(lowered.professions).toEqual(["1"]);
    expect(setSkillLevel(data, "farming", 4).professions).toEqual([]);
    expect(setSkillLevel(data, "farming", 10).professions.sort()).toEqual([
      "1",
      "4",
    ]);
  });

  it("leaves the professions of other skills alone", () => {
    let data = setSkillLevel(setSkillLevel(fresh(), "farming", 5), "mining", 5);
    data = pickProfession(
      pickProfession(data, profession("Tiller").id),
      profession("Miner").id,
    );

    expect(setSkillLevel(data, "farming", 0).professions).toEqual([
      profession("Miner").id,
    ]);
  });
});

describe("professions", () => {
  it("needs the level of the skill", () => {
    const data = setSkillLevel(fresh(), "farming", 5);

    expect(canPickProfession(data, profession("Tiller"))).toBe(true);
    expect(canPickProfession(data, profession("Artisan"))).toBe(false);
    expect(canPickProfession(fresh(), profession("Tiller"))).toBe(false);
  });

  it("reports what a pick added and what it removed", () => {
    let data = setSkillLevel(fresh(), "farming", 10);
    data = pickProfession(data, profession("Rancher").id);
    const after = pickProfession(data, profession("Artisan").id);
    const change = professionChange(data, after);

    expect(change.added.map((p) => p.name).sort()).toEqual([
      "Artisan",
      "Tiller",
    ]);
    expect(change.removed.map((p) => p.name)).toEqual(["Rancher"]);
  });

  it("clears a chosen profession and its children when picked again", () => {
    let data = setSkillLevel(fresh(), "farming", 10);
    data = pickProfession(
      pickProfession(data, profession("Tiller").id),
      profession("Artisan").id,
    );

    expect(pickProfession(data, profession("Tiller").id).professions).toEqual(
      [],
    );
  });
});

describe("mastery", () => {
  it("keeps the XP between 0 and 100,000", () => {
    expect(setMasteryXp(fresh(), 62000).mastery.masteryXp).toBe(62000);
    expect(setMasteryXp(fresh(), 250000).mastery.masteryXp).toBe(100000);
    expect(setMasteryXp(fresh(), -1).mastery.masteryXp).toBe(0);
  });

  it("marks a skill mastered once and removes it", () => {
    const added = setMastered(fresh(), "farming", true);

    expect(isMastered(added, "farming")).toBe(true);
    expect(setMastered(added, "farming", true)).toBe(added);
    expect(isMastered(setMastered(added, "farming", false), "farming")).toBe(
      false,
    );
  });
});

describe("stardrops and achievements", () => {
  it("sets and clears a stardrop", () => {
    const on = setStardrop(fresh(), "CF_Fair", true);

    expect(on.stardrops).toEqual({ CF_Fair: true });
    expect(setStardrop(on, "CF_Fair", false).stardrops).toEqual({});
    expect(setStardrop(fresh(), "CF_Fair", false)).toEqual(fresh());
  });

  it("sets and clears an achievement", () => {
    const on = setAchievement(fresh(), "0", true);

    expect(isEarned(on, "0")).toBe(true);
    expect(setAchievement(on, "0", true)).toBe(on);
    expect(setAchievement(on, "0", false).achievements).toEqual([]);
  });

  it("filters achievements by status and by search", () => {
    const data = setAchievement(fresh(), "0", true);
    const names = (filters: object) =>
      filterAchievements(data, { ...emptyAchievementFilters, ...filters }).map(
        (a) => a.name,
      );

    expect(allAchievements).toHaveLength(49);
    expect(names({})).toHaveLength(49);
    expect(names({ status: "earned" })).toEqual(["Greenhorn"]);
    expect(names({ status: "locked" })).toHaveLength(48);
    expect(names({ query: "15,000g" })).toEqual(["Greenhorn"]);
    expect(names({ query: "greenhorn", status: "locked" })).toEqual([]);
  });
});
