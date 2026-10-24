import * as data from "stardew-valley-data";
import { describe, expect, it } from "vitest";
import manifest from "./ids.manifest.json";

const byId = (items: { id: string | number }[]) =>
  items.map((i) => String(i.id));
const byName = (items: { name: string }[]) => items.map((i) => i.name);

const current: Record<keyof typeof manifest, string[]> = {
  shipped: byId(data.collections().itemsShipped().get()),
  fish: byId(data.fish().get()),
  minerals: byId(data.minerals().mineralItems().get()),
  artifacts: byId(data.artifacts().get()),
  stardrops: byId(data.starDrops().get()),
  goldenWalnuts: byId(data.goldenWalnuts().get()),
  secretNotes: byId(data.secretNotes().get()),
  lostBooks: byId(data.lostBooks().get()),
  achievements: byId(data.achievements().get()),
  specialOrders: byId(data.specialOrders().get()),
  quests: byId(data.quests().get()),
  specialItems: byId(data.specialItems().get()),
  cookingRecipes: byName(data.cooking().get()),
  craftingRecipes: byName(data.crafting().get()),
  villagers: byName(data.villagers().get()),
};

describe("stardew-valley-data keys that saves refer to", () => {
  describe.each(Object.entries(manifest))("%s", (collection, expected) => {
    it("still has every key from the manifest", () => {
      const available = new Set(current[collection as keyof typeof manifest]);

      expect(expected.filter((key) => !available.has(key))).toEqual([]);
    });
  });
});
