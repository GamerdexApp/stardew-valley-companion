import { describe, expect, it } from "vitest";
import type { GameData } from "@/types/app";
import {
  isLearned,
  recipeSideEffect,
  recipeStatus,
  setRecipeStatus,
} from "@/service/recipes";
import { DEFAULT_GAME_DATA } from "@/data/constants";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const fresh = (): GameData => clone(DEFAULT_GAME_DATA);

describe("recipe status", () => {
  it("reads Not learned with no entry", () => {
    expect(recipeStatus(fresh(), "cooking", "Fried Egg")).toBe("not-learned");
  });

  it("reads Learned for a learned recipe that was not made", () => {
    const data = fresh();
    data.cookingRecipes["Fried Egg"] = { learned: true, cooked: false };
    data.craftingRecipes["Bomb"] = { learned: true, crafted: false };

    expect(recipeStatus(data, "cooking", "Fried Egg")).toBe("learned");
    expect(recipeStatus(data, "crafting", "Bomb")).toBe("learned");
  });

  it("reads Done for a made recipe, with the cooked field for cooking and the crafted field for crafting", () => {
    const data = fresh();
    data.cookingRecipes["Fried Egg"] = { learned: true, cooked: true };
    data.craftingRecipes["Bomb"] = { learned: true, crafted: true };

    expect(recipeStatus(data, "cooking", "Fried Egg")).toBe("done");
    expect(recipeStatus(data, "crafting", "Bomb")).toBe("done");
    expect(recipeStatus(data, "cooking", "Bomb")).toBe("not-learned");
  });

  it("reads a made recipe that is not learned as Done, as the totals count it", () => {
    const data = fresh();
    data.cookingRecipes["Fried Egg"] = { learned: false, cooked: true };

    expect(recipeStatus(data, "cooking", "Fried Egg")).toBe("done");
  });

  it("knows which statuses are learned", () => {
    expect(isLearned("not-learned")).toBe(false);
    expect(isLearned("learned")).toBe(true);
    expect(isLearned("done")).toBe(true);
  });
});

describe("setting a recipe status", () => {
  it("writes the entries the old edit step wrote", () => {
    const learned = setRecipeStatus(fresh(), "cooking", "Fried Egg", "learned");
    const cooked = setRecipeStatus(fresh(), "cooking", "Fried Egg", "done");
    const crafted = setRecipeStatus(fresh(), "crafting", "Bomb", "done");

    expect(learned.cookingRecipes["Fried Egg"]).toEqual({
      learned: true,
      cooked: false,
    });
    expect(cooked.cookingRecipes["Fried Egg"]).toEqual({
      learned: true,
      cooked: true,
    });
    expect(crafted.craftingRecipes["Bomb"]).toEqual({
      learned: true,
      crafted: true,
    });
  });

  it("keeps Learned when Done goes back to Learned", () => {
    const data = setRecipeStatus(fresh(), "cooking", "Fried Egg", "done");
    const result = setRecipeStatus(data, "cooking", "Fried Egg", "learned");

    expect(result.cookingRecipes["Fried Egg"]).toEqual({
      learned: true,
      cooked: false,
    });
  });

  it("deletes the entry for Not learned, clearing both", () => {
    const data = setRecipeStatus(fresh(), "cooking", "Fried Egg", "done");
    const result = setRecipeStatus(data, "cooking", "Fried Egg", "not-learned");

    expect("Fried Egg" in result.cookingRecipes).toBe(false);
  });

  it("never saves a made recipe that is not learned", () => {
    let data = fresh();
    for (const status of [
      "done",
      "learned",
      "not-learned",
      "done",
      "not-learned",
    ] as const) {
      data = setRecipeStatus(data, "crafting", "Bomb", status);
      const entry = data.craftingRecipes["Bomb"];
      expect(entry === undefined || entry.learned).toBe(true);
    }
  });

  it("does not touch the other kind, other entries or the input", () => {
    const data = fresh();
    data.cookingRecipes["Omelet"] = { learned: true, cooked: true };
    const before = JSON.stringify(data);
    const result = setRecipeStatus(data, "cooking", "Fried Egg", "learned");

    expect(result.cookingRecipes["Omelet"]).toEqual({
      learned: true,
      cooked: true,
    });
    expect(result.craftingRecipes).toEqual(data.craftingRecipes);
    expect(JSON.stringify(data)).toBe(before);
  });

  it("returns the same object when nothing changes", () => {
    const data = fresh();

    expect(setRecipeStatus(data, "cooking", "Fried Egg", "not-learned")).toBe(
      data,
    );
  });

  it("rewrites a made recipe that is not learned cleanly", () => {
    const data = fresh();
    data.cookingRecipes["Fried Egg"] = { learned: false, cooked: true };

    expect(
      setRecipeStatus(data, "cooking", "Fried Egg", "learned").cookingRecipes[
        "Fried Egg"
      ],
    ).toEqual({ learned: true, cooked: false });
  });
});

describe("the change a tap makes beyond the chosen status", () => {
  it("reports the two changes that touch two fields", () => {
    expect(recipeSideEffect("not-learned", "done")).toBe("also-learned");
    expect(recipeSideEffect("done", "not-learned")).toBe("cleared-both");
  });

  it("reports nothing for a one field change", () => {
    expect(recipeSideEffect("not-learned", "learned")).toBeNull();
    expect(recipeSideEffect("learned", "done")).toBeNull();
    expect(recipeSideEffect("done", "learned")).toBeNull();
    expect(recipeSideEffect("learned", "not-learned")).toBeNull();
  });
});
