import * as data from "stardew-valley-data";
import { writeFileSync } from "node:fs";

const byId = (items) => items.map((item) => item.id);
const byName = (items) => items.map((item) => item.name);

const COLLECTIONS = {
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

const manifest = Object.fromEntries(
  Object.entries(COLLECTIONS).map(([name, keys]) => [
    name,
    keys.map(String).sort(),
  ]),
);

writeFileSync(
  new URL("../tests/data/ids.manifest.json", import.meta.url),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
