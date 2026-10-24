import type { GameData } from "@/types/app";

export type RecipeKind = "cooking" | "crafting";
export type RecipeStatus = "not-learned" | "learned" | "done";

/** The saved field that says a recipe was made: `cooked` for cooking, `crafted` for crafting. */
const DONE_FIELD = { cooking: "cooked", crafting: "crafted" } as const;
const RECORD = {
  cooking: "cookingRecipes",
  crafting: "craftingRecipes",
} as const;

type SavedRecipe = { learned: boolean } & Record<
  "cooked" | "crafted",
  boolean | undefined
>;

const recordOf = (
  data: GameData,
  kind: RecipeKind,
): Record<string, SavedRecipe> =>
  data[RECORD[kind]] as unknown as Record<string, SavedRecipe>;

/**
 * A recipe that was made reads Done, as the collection totals count it. A recipe that is only
 * learned reads Learned. A recipe with no entry reads Not learned.
 */
export const recipeStatus = (
  data: GameData,
  kind: RecipeKind,
  name: string,
): RecipeStatus => {
  const entry = recordOf(data, kind)[name];
  if (entry?.[DONE_FIELD[kind]] === true) return "done";
  return entry?.learned === true ? "learned" : "not-learned";
};

/**
 * Not learned deletes the entry, as the old edit step did. Done sets Learned as well, so a made
 * recipe that is not learned cannot be saved.
 */
export const setRecipeStatus = (
  data: GameData,
  kind: RecipeKind,
  name: string,
  status: RecipeStatus,
): GameData => {
  if (recipeStatus(data, kind, name) === status) return data;
  const { [name]: _removed, ...rest } = recordOf(data, kind);
  const entry =
    status === "not-learned"
      ? null
      : { learned: true, [DONE_FIELD[kind]]: status === "done" };
  return { ...data, [RECORD[kind]]: entry ? { ...rest, [name]: entry } : rest };
};

export type RecipeSideEffect = "also-learned" | "cleared-both";

/** The change a tap makes beyond the status the person chose. */
export const recipeSideEffect = (
  from: RecipeStatus,
  to: RecipeStatus,
): RecipeSideEffect | null => {
  if (from === "not-learned" && to === "done") return "also-learned";
  if (from === "done" && to === "not-learned") return "cleared-both";
  return null;
};

export const isLearned = (status: RecipeStatus): boolean =>
  status !== "not-learned";
